"use client"

import { MoveUpRight } from "lucide-react"
import { ICON_STROKE } from "@/lib/icons"

// The marks that say a link leaves the page — one glyph, two announcements.
//
// The glyph was a typed ↗ character. As text it inherited whatever font-size
// its context happened to set, so the same mark rendered at four sizes across
// four sites: 12×24 beside RESUME, 11×18 beside LINKEDIN, 15×17 in chat prose,
// 11×14 on the case-study route. It also sat at a different weight from the
// stroked Lucide icons now beside it in the rail. ArrowUpRight is the same
// family as those, at one token size everywhere — 16, from --icon-mark. The
// mark is a trailing one, so what it answers to is the 16px title it sits
// beside on a doc-link card, not the 12px span that wraps it.
//
// Every `target="_blank"` in this app had no signal at all before these — no
// visible mark, no announcement. A link that reassigns the window without
// warning is the failure WCAG G201 describes, and it is worse here than usual:
// the chat holds conversation state in memory, so a visitor who expects a new
// tab and gets navigation loses the thread.
function Glyph() {
  return <MoveUpRight className="link-ext" aria-hidden="true" strokeWidth={ICON_STROKE} />
}

/**
 * For `target="_blank"`. `glyph={false}` is for links that already carry their
 * own visual mark — the doc-link card has a download arrow, and two glyphs on
 * one control read as two actions — and for the rail's RESUME row, which now
 * leads with a FileText icon. The BEHAVIOUR is unchanged in both cases, so the
 * announcement stays: dropping a glyph is a visual decision and must not
 * quietly remove a screen reader's warning.
 */
export function NewTabMark({ glyph = true }: { glyph?: boolean }) {
  return (
    <>
      {glyph && <Glyph />}
      <span className="sr-only"> (opens in a new tab)</span>
    </>
  )
}

/**
 * For `mailto:`. Same glyph, different truth — a mailto does not open a tab,
 * it hands off to whatever handles mail. The new-tab wording would be false,
 * and a false announcement is worse than none.
 *
 * `glyph={false}` matches NewTabMark's, and for the same reason: the rail's
 * contact link IS a Mail icon, so a second mark beside it would read as two
 * actions. The ANNOUNCEMENT is never optional — dropping a glyph is a visual
 * decision and must not quietly remove a screen reader's warning.
 */
export function MailMark({ glyph = true }: { glyph?: boolean }) {
  return (
    <>
      {glyph && <Glyph />}
      <span className="sr-only"> (opens your email app)</span>
    </>
  )
}
