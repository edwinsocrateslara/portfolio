"use client"

import Link from "next/link"
import { Layers, FileText, UserRound } from "lucide-react"
import { ICON_STROKE_RAIL } from "@/lib/icons"
import type { Pane } from "@/components/shell/sidebar"

// THE THREE DOCUMENTS, IN ONE PLACE. They render twice: as the thin header
// above the pane on desktop, and as the rail's document group inside the
// mobile sheet (the top bar has no room for them below 900px). CSS shows
// whichever applies (.site-header / .rail-docs in globals.css). One list, so
// the two cannot disagree about a label, an order or a URL.
//
// THE URL DRIVES THE ACTIVE STATE, in both places: `activePane` is derived from
// the path (PANE_FOR_PATH in app-shell.tsx), so a hard load of /resume renders
// Resume active on the server, before any script runs. aria-current="page"
// carries it; the CSS styles that attribute, so the state cannot be drawn
// without also being announced.
//
// data-pane stays on both: check:paint, check:geometry and the artboard setups
// select by it, taking whichever copy is visible.
const DOCUMENTS = [
  { href: "/case-study/meridian-deck", pane: "deck", label: "Case Study", Icon: Layers },
  { href: "/resume", pane: "resume", label: "Resume", Icon: FileText },
  { href: "/about", pane: "about", label: "About", Icon: UserRound },
] as const satisfies ReadonlyArray<{ href: string; pane: Pane; label: string; Icon: unknown }>

export function DocumentLinks({
  variant,
  activePane,
  onNavigate,
}: {
  /** "header": text only, in the bar above the pane (desktop).
   *  "rail": glyph and label, in the rail's document group (mobile sheet). */
  variant: "header" | "rail"
  activePane: Pane
  /** Closes the mobile sheet after a choice. */
  onNavigate?: () => void
}) {
  return (
    <>
      {DOCUMENTS.map(({ href, pane, label, Icon }) => {
        const active = activePane === pane
        return variant === "header" ? (
          <Link
            key={pane}
            href={href}
            className="type-action site-header-link"
            data-pane={pane}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            {label}
          </Link>
        ) : (
          <Link
            key={pane}
            href={href}
            className="rail-doc"
            data-pane={pane}
            data-active={active}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
          >
            {/* ICON_STROKE_RAIL, 1.5px of ink at 24 — the rule in
                lib/icons.ts. The glyph stays 24: reviewed and kept on 24
                November (DESIGN.md § "The document glyph stays 24"). */}
            <Icon className="rail-icon" aria-hidden="true" strokeWidth={ICON_STROKE_RAIL} />
            <span className="type-action rail-doc-label">{label}</span>
          </Link>
        )
      })}
    </>
  )
}
