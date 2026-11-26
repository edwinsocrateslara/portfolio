"use client"

import { Sheen } from "@/components/chat/sheen"
import { ArrowDownToLine } from "lucide-react"
import { ICON_STROKE } from "@/lib/icons"
import { meridianDeck } from "@/lib/case-study-deck"
import { SlideGrid } from "@/components/case-study/slide-grid"

// The deck as pane content: heading row, one metadata row, the 21-slide grid.
// Deliberately carries NO page chrome — no back link, no brand mark, no
// portfolio link. The rail is all three, and inside the shell those would be a
// second, competing set of navigation.
//
// The mock put the project name in a mono eyebrow ABOVE the heading and the
// slide count on its own line below it. Merged here into one metadata row: two
// mono lines bracketing a heading made the heading look like a caption between
// them, and the count and the name are the same kind of fact about the same
// thing. (The count was removed from the row on 26 November.)
export function DeckPane() {
  return (
    <div>
      {/* flex-end, so the button sits on the heading's baseline rather than
          centred against a 48px line box — centring left it visibly high. */}
      <div className="deck-head">
        <h1 className="type-page pane-title">Case Study</h1>
        {/* .chip is the system's pill and already carries this exact shape:
            hairline border, --layer-1 fill, chip radius, secondary label that
            steps to primary on hover. A fourth inline pill would undo the
            consolidation that class exists for. `download` is what makes it
            save rather than navigate; the visible text is the accessible name,
            so there is no second string to drift. */}
        <a className="chip type-action deck-download" href={meridianDeck.pdf} download>
          <ArrowDownToLine className="chip-icon" aria-hidden="true" strokeWidth={ICON_STROKE} />
          Download PDF
          {/* The sheen on a download pill. */}
          <Sheen />
        </a>
      </div>

      {/* Two peer facts, one separator. THE SLIDE COUNT CAME OFF (26 November):
          this read "client · subject · 21 slides", the count derived from
          meridianDeck.slides.length, and its separator went with it so no dot
          is left trailing. (An earlier version used an em dash between client
          and subject to bind them as one name and a middle dot before the
          count — two weights for two kinds of join. Edwin's call was that they
          read as a flat list, punctuated as one.) */}
      <p className="type-label pane-meta">
        {meridianDeck.client} · {meridianDeck.subject}
      </p>

      {/* 3 columns, as on the old standalone page. The pane is narrower than
          the full page was, so the tiles are smaller — the lightbox is still
          how a slide gets read, and it still opens on the whole 21-slide set
          from whichever tile was clicked. */}
      <SlideGrid slides={meridianDeck.slides} columns={3} />
    </div>
  )
}
