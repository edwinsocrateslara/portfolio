import Link from "next/link"
import { meridianDeck } from "@/lib/case-study-deck"
import { SlideGrid } from "@/components/case-study/slide-grid"
import { DeckDownload } from "@/components/case-study/deck-download"

// A static segment, so it takes precedence over the [slug] route alongside it.
// /case-study/meridian-deck lands here; /case-study/retail-banking still falls
// through to the project case study.
export const metadata = {
  title: "Meridian Mobile Banking — Case Study",
  description:
    "The full case study deck for the Meridian mobile banking redesign: research, the old app, the redesign, testing, and impact.",
}

export default function MeridianDeckPage() {
  return (
    <div className="min-h-dvh" style={{ background: "rgb(var(--bureau-bg))" }}>
      {/* Mirrors the chat and case-study header chrome */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-5"
        style={{ borderBottom: "1px solid rgb(var(--bureau-border))" }}
      >
        <Link
          href="/"
          className="type-label flex items-center gap-2"
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          ← Back
        </Link>
        <span className="type-badge" style={{ color: "rgb(var(--bureau-text-primary))" }}>
          EdwinOS
        </span>
        <a
          href="https://www.edwinsocrates.com"
          target="_blank"
          rel="noopener noreferrer"
          className="type-label"
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          Portfolio
        </a>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-16">
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
          <h1
            className="type-h2"
            style={{ margin: 0, color: "rgb(var(--bureau-text-primary))" }}
          >
            {meridianDeck.title}
          </h1>
          <p
            className="type-body"
            style={{
              color: "rgb(var(--bureau-text-secondary))",
              maxWidth: 520,
              margin: "var(--space-within) 0 0",
            }}
          >
            {meridianDeck.intro}
          </p>
        </div>

        <div style={{ marginBottom: "var(--space-group)" }}>
          <DeckDownload deck={meridianDeck} />
        </div>

        <SlideGrid slides={meridianDeck.slides} columns={3} />
      </main>
    </div>
  )
}
