"use client"

import { useSyncExternalStore } from "react"

// ── ONE SUBSCRIPTION FOR THE WHOLE APP ────────────────────────────────────
//
// This was a useState + useEffect pair, which meant every caller opened its own
// MediaQueryList and attached its own `change` listener. Every message bubble
// calls it — AssistantBubble and UserBubble both do — so a conversation with
// the Ideas Dashboard reveal in it held 38 listeners on one media query, plus
// the lightbox's and the shell's, and a single preference change scheduled a
// state update in every one of them.
//
// useSyncExternalStore is the right instrument rather than a clever one: React
// subscribes each consumer to the store below, the store keeps ONE listener on
// the MediaQueryList, and a change notifies React once. The listener is
// attached lazily on the first subscriber and removed when the last one leaves,
// so a page with no consumers holds nothing.
//
// THE SERVER SNAPSHOT IS `false` AND THAT IS THE SAME TRADEOFF AS BEFORE. There
// is no media query during SSR, so the first paint assumes motion is allowed
// and corrects on hydration. Every prefers-reduced-motion hook makes this
// choice; the alternative is guessing, which is worse. The CSS rules in
// globals.css do not have this problem — `@media (prefers-reduced-motion:
// reduce)` applies on the very first paint — which is why anything that CAN be
// expressed as a media query should be, and this hook is for the cases that
// cannot.

const QUERY = "(prefers-reduced-motion: reduce)"

let mql: MediaQueryList | null = null
const listeners = new Set<() => void>()

/** The cached answer. Read by getSnapshot, which must be referentially stable
 *  between renders or React re-subscribes on every commit. */
let snapshot = false

function notify() {
  snapshot = mql?.matches ?? false
  for (const l of listeners) l()
}

function subscribe(onStoreChange: () => void): () => void {
  if (!mql) {
    mql = window.matchMedia(QUERY)
    snapshot = mql.matches
    mql.addEventListener("change", notify)
  }
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
    // Torn down when the last consumer unmounts, so this does not hold a
    // listener open for a page that has stopped asking.
    if (listeners.size === 0 && mql) {
      mql.removeEventListener("change", notify)
      mql = null
    }
  }
}

const getSnapshot = () => snapshot
const getServerSnapshot = () => false

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
