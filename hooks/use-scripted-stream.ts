"use client"

import { useCallback, useEffect, useState, useRef } from "react"
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
  // KEYED BY THREAD, all three. `pending` used to be a single slot carrying a
  // thread id, which routed blocks correctly and lost them: the drain loop
  // wrote the remainder back after every block, so a reveal starting in thread
  // B while A slept between blocks was overwritten when A woke. B was then
  // blank for the rest of the session, because openProjectThread marks a slug
  // revealed BEFORE enqueueing and never re-enqueues.
  //
  // A run token per thread is the other half, and per-thread keying alone does
  // NOT replace it: a closure that captured its blocks before reset() ran will
  // still write them back afterwards, resurrecting a thread the visitor
  // explicitly cleared. The token is re-read after every sleep, so a queue
  // that was replaced or reset while a closure slept is abandoned instead.
  const [typing, setTyping] = useState<Record<string, boolean>>({})
  const [pending, setPending] = useState<Record<string, MessageBlock[]>>({})
  const runRef = useRef<Record<string, number>>({})
  // Set synchronously, unlike `typing`, so two effect passes in one tick cannot
  // both start a drain for the same thread before the state lands.
  const drainingRef = useRef<Record<string, boolean>>({})

  useEffect(() => {
    const materialise = (block: MessageBlock): StructuredMessage =>
      ({ id: generateMessageId(), role: "assistant", ...block }) as StructuredMessage

    // Every thread with work drains independently. One shared "is anything
    // typing" gate would have made B wait out A's fifteen-block reveal, which
    // is not lost work but is still one thread interfering with another.
    for (const thread of Object.keys(pending)) {
      const blocks = pending[thread]
      if (!blocks || blocks.length === 0) continue
      if (drainingRef.current[thread]) continue

      if (prefersReducedMotion) {
        setThreads((prev) => ({
          ...prev,
          [thread]: [...(prev[thread] ?? []), ...blocks.map(materialise)],
        }))
        setPending((prev) => {
          const next = { ...prev }
          delete next[thread]
          return next
        })
        continue
      }

      drainingRef.current[thread] = true
      const run = runRef.current[thread] ?? 0

      void (async () => {
        setTyping((prev) => ({ ...prev, [thread]: true }))
        await new Promise((r) => setTimeout(r, getTypingDelay()))

        // Stale: the queue was replaced or reset while this closure slept.
        // Drop the block rather than append it, and do not write anything back.
        if ((runRef.current[thread] ?? 0) !== run) {
          drainingRef.current[thread] = false
          setTyping((prev) => ({ ...prev, [thread]: false }))
          // ── AND NUDGE THE EFFECT, WHICH IS THE WHOLE FIX ───────────────────
          // Clearing the flag is not enough on its own. The effect that would
          // drain the REPLACEMENT queue already ran, saw drainingRef set, and
          // skipped. Its dependency is `pending`, whose identity was last
          // changed by the enqueue that made this worker stale — and nothing
          // changes it again, so nothing re-runs. The new queue sat undrained
          // forever: a follow-up chip clicked during a reveal left the page
          // apparently frozen.
          //
          // A shallow copy with identical contents is the smallest thing that
          // re-runs the effect. It reads like a no-op and is not one: the
          // dependency is the OBJECT, and this is a new object.
          setPending((prev) => ({ ...prev }))
          return
        }

        const [next, ...rest] = blocks
        setThreads((prev) => ({
          ...prev,
          [thread]: [...(prev[thread] ?? []), materialise(next)],
        }))
        setPending((prev) => {
          // Checked again inside the updater: reset() can land between the
          // guard above and this write.
          if ((runRef.current[thread] ?? 0) !== run) return prev
          const out = { ...prev }
          if (rest.length) out[thread] = rest
          else delete out[thread]
          return out
        })
        drainingRef.current[thread] = false
        setTyping((prev) => ({ ...prev, [thread]: false }))
      })()
    }
  }, [pending, prefersReducedMotion])

  // Replace the pending queue — matches the traditional flow's existing
  // "replace, don't append" semantics (a new turn always sets a fresh queue).
  const enqueue = useCallback((blocks: MessageBlock[], thread: string = HOME_THREAD) => {
    // Bump first: a closure sleeping on this thread's previous queue must not
    // write its remainder back over the queue replacing it.
    runRef.current[thread] = (runRef.current[thread] ?? 0) + 1
    setPending((prev) => ({ ...prev, [thread]: blocks }))
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
      for (const t of Object.keys(runRef.current)) {
        runRef.current[t] = (runRef.current[t] ?? 0) + 1
      }
      setThreads({})
      setPending({})
      setTyping({})
      return
    }
    // Bumping the token is what actually cancels: clearing `pending` alone
    // leaves any closure already asleep on this thread free to write its
    // remainder back and resurrect a transcript the visitor just cleared.
    runRef.current[thread] = (runRef.current[thread] ?? 0) + 1
    setThreads((prev) => ({ ...prev, [thread]: [] }))
    // Only cancel an in-flight reveal if it belongs to the thread being
    // cleared. Killing the queue outright would strand a project mid-stream
    // while still counting it as revealed.
    setPending((prev) => {
      const next = { ...prev }
      delete next[thread]
      return next
    })
    setTyping((prev) => ({ ...prev, [thread]: false }))
  }, [])

  const messagesOf = useCallback(
    (thread: string) => threads[thread] ?? EMPTY,
    [threads]
  )
  const isTypingIn = useCallback((thread: string) => !!typing[thread], [typing])

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
