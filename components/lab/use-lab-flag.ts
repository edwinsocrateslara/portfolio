"use client"

import { useEffect, useState } from "react"

/* Reads one data-lab-* attribute off <html> and re-renders when it changes,
 * so flipping a switch in the panel re-runs the effect that depends on it
 * rather than needing a reload. That is what lets the résumé sequence be
 * watched twice without navigating away. */
export function useLabFlag(key: string): string | null {
  const attr = `lab${key[0].toUpperCase()}${key.slice(1)}`
  const [value, setValue] = useState<string | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const read = () => setValue(root.dataset[attr] ?? null)
    read()
    const mo = new MutationObserver(read)
    mo.observe(root, { attributes: true, attributeFilter: [`data-lab-${key}`] })
    return () => mo.disconnect()
  }, [attr, key])

  return value
}
