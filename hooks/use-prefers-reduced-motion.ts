"use client"

import { useEffect, useState } from "react"

// Starts false (matches SSR) and updates after mount to avoid a hydration
// mismatch — the same tradeoff every prefers-reduced-motion hook makes.
export function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mql.matches)

    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mql.addEventListener("change", handleChange)
    return () => mql.removeEventListener("change", handleChange)
  }, [])

  return prefersReducedMotion
}
