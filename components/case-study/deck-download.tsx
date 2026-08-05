"use client"

import type { CaseStudyDeck } from "@/lib/case-study-deck"

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
        border: "1px solid rgb(var(--bureau-border))",
        borderRadius: "var(--bureau-radius-card)",
        background: "rgb(var(--bureau-surface))",
        padding: "var(--space-between)",
        maxWidth: 480,
        textDecoration: "none",
      }}
    >
      <span
        className="type-badge"
        style={{
          width: "var(--space-32)",
          height: "var(--space-32)",
          flexShrink: 0,
          border: "1px solid rgb(var(--bureau-border-strong))",
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
            // Optical title-to-meta gap. Documented exception.
            marginTop: 5,
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
