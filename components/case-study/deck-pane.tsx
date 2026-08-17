"use client"

import { Download } from "lucide-react"
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
// thing.
export function DeckPane() {
  return (
    <div>
      {/* flex-end, so the button sits on the heading's baseline rather than
          centred against a 48px line box — centring left it visibly high. */}
      <div className="deck-head">
        <h1 className="type-h2 pane-title">Case study</h1>
        {/* .chip is the system's pill and already carries this exact shape:
            hairline border, --layer-1 fill, chip radius, secondary label that
            steps to primary on hover. A fourth inline pill would undo the
            consolidation that class exists for. `download` is what makes it
            save rather than navigate; the visible text is the accessible name,
            so there is no second string to drift. */}
        <a className="chip type-label deck-download" href={meridianDeck.pdf} download>
          <Download className="chip-icon" aria-hidden="true" strokeWidth={2} />
          Download PDF
        </a>
      </div>

      {/* Three peer facts, one separator. An earlier version used an em dash
          between client and subject to bind them as one name and a middle dot
          before the count — two weights for two kinds of join. Edwin's call is
          that they read as a flat list, so they are punctuated as one. */}
      <p className="type-label pane-meta">
        {meridianDeck.client} · {meridianDeck.subject} ·{" "}
        {meridianDeck.slides.length} slides
      </p>

      {/* 3 columns, as on the old standalone page. The pane is narrower than
          the full page was, so the tiles are smaller — the lightbox is still
          how a slide gets read, and it still opens on the whole 21-slide set
          from whichever tile was clicked. */}
      <SlideGrid slides={meridianDeck.slides} columns={3} />
    </div>
  )
}
