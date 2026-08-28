"use client"

import { useEffect, useState } from "react"

/* The only JavaScript in the lab. Everything else is CSS keyed off data-lab-*
 * attributes on <html>, so with every switch off this branch paints nothing
 * and costs nothing.
 *
 * State lives in the URL as well as on the element, so a setting survives a
 * reload and can be linked: ?aurora=loop&dots=20&shimmer=on&terminal=on */
const KEYS = ["aurora", "dots", "shimmer", "seq"] as const
type Key = (typeof KEYS)[number]

const OPTIONS: Record<Key, { label: string; values: (string | null)[] }> = {
  aurora:   { label: "aurora",   values: [null, "loop", "once"] },
  dots:     { label: "dots",     values: [null, "12", "20", "32"] },
  shimmer:  { label: "shimmer",  values: [null, "on"] },
  seq:      { label: "sequence", values: [null, "full", "slow"] },
}

function apply(k: Key, v: string | null) {
  const root = document.documentElement
  const attr = `lab${k[0].toUpperCase()}${k.slice(1)}`
  if (v === null) delete root.dataset[attr]
  else root.dataset[attr] = v
  const url = new URL(window.location.href)
  if (v === null) url.searchParams.delete(k)
  else url.searchParams.set(k, v)
  window.history.replaceState(null, "", url)
}

export function LabPanel() {
  const [state, setState] = useState<Record<Key, string | null>>({
    aurora: null, dots: null, shimmer: null, seq: null,
  })

  // Read the URL once on mount and push it onto <html>.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search)
    const next = {} as Record<Key, string | null>
    for (const k of KEYS) {
      const v = p.get(k)
      const ok = v !== null && OPTIONS[k].values.includes(v)
      next[k] = ok ? v : null
      apply(k, next[k])
    }
    setState(next)
  }, [])

  return (
    <div className="lab-panel">
      <h6>lab · magic ui</h6>
      {KEYS.map((k) => (
        <div className="lab-row" key={k}>
          <span>{OPTIONS[k].label}</span>
          {OPTIONS[k].values.map((v) => (
            <button
              key={String(v)}
              data-on={state[k] === v ? "1" : "0"}
              onClick={() => { apply(k, v); setState((s) => ({ ...s, [k]: v })) }}
            >
              {v ?? "off"}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
