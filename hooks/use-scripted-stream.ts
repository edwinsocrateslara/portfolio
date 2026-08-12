"use client"

import { useCallback, useEffect, useState } from "react"
import type { StructuredMessage } from "@/components/chat/message-bubbles"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

// Distributes Omit over a union so each variant keeps its own extra fields
// (plain Omit<Union, K> collapses to the intersection of member keys).
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

// A block "template" — everything a caller needs to describe one message,
// minus the id/role the stream assigns as it reveals it.
export type MessageBlock = DistributiveOmit<StructuredMessage, "id" | "role">

/** The front-door conversation. Project threads are keyed by project slug. */
export const HOME_THREAD = "home"

const TYPING_DELAY = { min: 400, max: 900 }

function getTypingDelay() {
  return Math.random() * (TYPING_DELAY.max - TYPING_DELAY.min) + TYPING_DELAY.min
}

let messageIdCounter = 0
export function generateMessageId() {
  return `msg-${++messageIdCounter}-${Date.now()}`
}

// Stable identity for "this thread has nothing in it", so a component reading
// an untouched thread doesn't get a fresh [] every render.
const EMPTY: StructuredMessage[] = []

// Reveals a queue of assistant blocks one at a time, each after a random
// 400-900ms "typing" pause.
//
// The app shell is the only consumer. It used to be shared with the
// /case-study/[slug] review route, but that route rendered the dormant
// vibe-coded variant; with the variant deleted it renders in one static pass
// and streams nothing. If a second consumer ever appears, note that the
// thread key is the caller's to choose — nothing here assumes the shell.
//
// Messages are keyed BY THREAD. Every project owns an independent transcript,
// the way a conversation list does; `HOME_THREAD` is the front door.
//
// The pending queue carries its own thread id rather than reading whichever
// thread happens to be open. That matters: a reveal takes several seconds, and
// the visitor can switch rails mid-stream. Tagging the queue means the blocks
// land in the thread that asked for them, never in the one now on screen.
//
// Under prefers-reduced-motion, delays and entrance animations (the latter
// handled by AssistantBubble/UserBubble themselves) are skipped entirely —
// the whole queue is revealed at once, with isTyping never becoming true, so
// input stays enabled immediately.
export function useScriptedStream() {
  const prefersReducedMotion = usePrefersReducedMotion()
  const [threads, setThreads] = useState<Record<string, StructuredMessage[]>>({})
  const [typingThread, setTypingThread] = useState<string | null>(null)
  const [pending, setPending] = useState<{ thread: string; blocks: MessageBlock[] } | null>(null)

  useEffect(() => {
    if (!pending || pending.blocks.length === 0 || typingThread) return
    const { thread, blocks } = pending

    const materialise = (block: MessageBlock): StructuredMessage =>
      ({ id: generateMessageId(), role: "assistant", ...block }) as StructuredMessage

    if (prefersReducedMotion) {
      setThreads((prev) => ({
        ...prev,
        [thread]: [...(prev[thread] ?? []), ...blocks.map(materialise)],
      }))
      setPending(null)
      return
    }

    const processNext = async () => {
      setTypingThread(thread)
      await new Promise((r) => setTimeout(r, getTypingDelay()))

      const [next, ...rest] = blocks
      setThreads((prev) => ({
        ...prev,
        [thread]: [...(prev[thread] ?? []), materialise(next)],
      }))
      setPending(rest.length ? { thread, blocks: rest } : null)
      setTypingThread(null)
    }

    processNext()
  }, [pending, typingThread, prefersReducedMotion])

  // Replace the pending queue — matches the traditional flow's existing
  // "replace, don't append" semantics (a new turn always sets a fresh queue).
  const enqueue = useCallback((blocks: MessageBlock[], thread: string = HOME_THREAD) => {
    setPending({ thread, blocks })
  }, [])

  // Append a message immediately, bypassing the queue — for user messages,
  // which appear the instant they're sent rather than after a typing delay.
  const appendImmediate = useCallback(
    (message: StructuredMessage, thread: string = HOME_THREAD) => {
      setThreads((prev) => ({ ...prev, [thread]: [...(prev[thread] ?? []), message] }))
    },
    []
  )

  /** Clear one thread, or every thread when called with no argument. */
  const reset = useCallback((thread?: string) => {
    if (thread === undefined) {
      setThreads({})
      setPending(null)
      setTypingThread(null)
      return
    }
    setThreads((prev) => ({ ...prev, [thread]: [] }))
    // Only cancel an in-flight reveal if it belongs to the thread being
    // cleared. Killing the queue outright would strand a project mid-stream
    // while still counting it as revealed.
    setPending((prev) => (prev && prev.thread === thread ? null : prev))
    setTypingThread((prev) => (prev === thread ? null : prev))
  }, [])

  const messagesOf = useCallback(
    (thread: string) => threads[thread] ?? EMPTY,
    [threads]
  )
  const isTypingIn = useCallback(
    (thread: string) => typingThread === thread,
    [typingThread]
  )

  // `messages` / `isTyping` / `hasMessages` used to sit here as a
  // single-thread convenience API for the review route, which read HOME_THREAD
  // implicitly. That route no longer streams, so all three had zero consumers.
  // Removed rather than kept "in case": an unused accessor that silently reads
  // one hard-coded thread is a trap for the next caller.
  return {
    enqueue,
    appendImmediate,
    reset,
    messagesOf,
    isTypingIn,
  }
}
