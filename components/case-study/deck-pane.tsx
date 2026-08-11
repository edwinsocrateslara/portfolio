"use client"

import { meridianDeck } from "@/lib/case-study-deck"
import { SlideGrid } from "@/components/case-study/slide-grid"
import { DeckDownload } from "@/components/case-study/deck-download"
import { CONTENT_WIDTH } from "@/lib/layout"

// The deck as pane content: heading, PDF card, 21-slide grid. Deliberately
// carries NO page chrome — no back link, no brand mark, no portfolio link.
// The rail is all three, and inside the shell those would be a second,
// competing set of navigation.
export function DeckPane() {
  return (
    <div>
      <div style={{ marginBottom: "var(--space-group)" }}>
        <div
          className="type-label"
          style={{
            color: "rgb(var(--bureau-text-secondary))",
            marginBottom: "var(--space-within)",
          }}
        >
          {meridianDeck.subtitle}
        </div>
        <h1 className="type-h2" style={{ margin: 0, color: "rgb(var(--bureau-text-primary))" }}>
          {meridianDeck.title}
        </h1>
        <p
          className="type-body"
          style={{
            color: "rgb(var(--bureau-text-secondary))",
            maxWidth: CONTENT_WIDTH,
            margin: "var(--space-within) 0 0",
          }}
        >
          {meridianDeck.intro}
        </p>
      </div>

      <div style={{ marginBottom: "var(--space-group)" }}>
        <DeckDownload deck={meridianDeck} />
      </div>

      {/* 3 columns, as on the old standalone page. The pane is narrower than
          the full page was, so the tiles are smaller — the lightbox is still
          how a slide gets read, and it still opens on the whole 21-slide set
          from whichever tile was clicked. */}
      <SlideGrid slides={meridianDeck.slides} columns={3} />
    </div>
  )
}
