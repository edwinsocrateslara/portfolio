"use client"

import { useCallback, useEffect, useState } from "react"
import type { StructuredMessage } from "@/components/chat/message-bubbles"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

// Distributes Omit over a union so each variant keeps its own extra fields
// (plain Omit<Union, K> collapses to the intersection of member keys).
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

// A block "template" — everything a caller needs to describe one message,
// minus the id/role/firstOfStreak the stream assigns as it reveals it.
export type MessageBlock = DistributiveOmit<StructuredMessage, "id" | "role" | "firstOfStreak">

const TYPING_DELAY = { min: 400, max: 900 }

function getTypingDelay() {
  return Math.random() * (TYPING_DELAY.max - TYPING_DELAY.min) + TYPING_DELAY.min
}

let messageIdCounter = 0
export function generateMessageId() {
  return `msg-${++messageIdCounter}-${Date.now()}`
}

// Reveals a queue of assistant blocks one at a time, each after a random
// 400-900ms "typing" pause — the mechanism traditional case studies already
// use in the live chat. Shared by the chat page and the case-study review
// route so both stream identically.
//
// Under prefers-reduced-motion, delays and entrance animations (the latter
// handled by AssistantBubble/UserBubble themselves) are skipped entirely —
// the whole queue is revealed at once, with isTyping never becoming true, so
// input stays enabled immediately.
export function useScriptedStream() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [messages, setMessages] = useState<StructuredMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [pending, setPending] = useState<MessageBlock[]>([])

  useEffect(() => {
    if (pending.length === 0 || isTyping) return

    if (prefersReducedMotion) {
      setMessages((prev) => {
        const updated = [...prev]
        for (const next of pending) {
          const newMessage: StructuredMessage = {
            id: generateMessageId(),
            role: "assistant",
            firstOfStreak:
              updated.length === 0 || updated[updated.length - 1]?.role === "user",
            ...next,
          } as StructuredMessage
          if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
            newMessage.firstOfStreak = false
          }
          updated.push(newMessage)
        }
        return updated
      })
      setPending([])
      return
    }

    const processNext = async () => {
      setIsTyping(true)
      await new Promise((r) => setTimeout(r, getTypingDelay()))

      const [next, ...rest] = pending
      const newMessage: StructuredMessage = {
        id: generateMessageId(),
        role: "assistant",
        firstOfStreak:
          messages.length === 0 || messages[messages.length - 1]?.role === "user",
        ...next,
      } as StructuredMessage

      setMessages((prev) => {
        const updated = [...prev]
        if (updated.length > 0 && updated[updated.length - 1].role === "assistant") {
          // This is a continuation, don't show avatar
          newMessage.firstOfStreak = false
        }
        return [...updated, newMessage]
      })
      setPending(rest)
      setIsTyping(false)
    }

    processNext()
  }, [pending, isTyping, messages, prefersReducedMotion])

  // Replace the pending queue — matches the traditional flow's existing
  // "replace, don't append" semantics (a new turn always sets a fresh queue).
  const enqueue = useCallback((blocks: MessageBlock[]) => {
    setPending(blocks)
  }, [])

  // Append a message immediately, bypassing the queue — for user messages,
  // which appear the instant they're sent rather than after a typing delay.
  const appendImmediate = useCallback((message: StructuredMessage) => {
    setMessages((prev) => [...prev, message])
  }, [])

  const reset = useCallback(() => {
    setMessages([])
    setPending([])
    setIsTyping(false)
  }, [])

  return { messages, isTyping, enqueue, appendImmediate, reset }
}
