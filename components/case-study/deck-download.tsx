"use client"

import type { CaseStudyDeck } from "@/lib/case-study-deck"
import { CARD_WIDTH } from "@/lib/layout"

// PDF download, styled as the doc-link card in the chat is: square glyph,
// title, mono meta line, download arrow.
export function DeckDownload({ deck }: { deck: CaseStudyDeck }) {
  return (
    <a
      href={deck.pdf}
      download
      style={{
        display: "flex",
        alignItems: "center",
        gap: "var(--space-between)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--bureau-radius-card)",
        background: "var(--layer-1)",
        padding: "var(--space-between)",
        maxWidth: CARD_WIDTH,
        textDecoration: "none",
      }}
    >
      <span
        className="type-badge"
        style={{
          width: "var(--space-32)",
          height: "var(--space-32)",
          flexShrink: 0,
          border: "1px solid var(--hairline-strong)",
          borderRadius: "var(--bureau-radius-card)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "rgb(var(--bureau-text-secondary))",
        }}
      >
        PDF
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          className="type-card-h3"
          style={{ display: "block", color: "rgb(var(--bureau-text-primary))" }}
        >
          {deck.title} {deck.subtitle}
        </span>
        <span
          className="type-meta"
          style={{
            display: "block",
            color: "rgb(var(--bureau-text-muted))",
            marginTop: "var(--space-optical-meta)",
          }}
        >
          {deck.slides.length} slides
        </span>
      </span>
      <span className="type-label" style={{ color: "rgb(var(--bureau-text-primary))" }}>
        ↓
      </span>
    </a>
  )
}
