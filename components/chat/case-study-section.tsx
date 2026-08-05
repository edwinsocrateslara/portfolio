"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { meridianDeck } from "@/lib/case-study-deck"

// One wide card, deliberately not a grid. Selected Work is a 3-up grid of
// projects and Side of Desk is a stacked list of prototypes; a single
// full-width card reads as "a document" rather than "another project", which
// is the distinction this section exists to make.
export function CaseStudySection() {
  const [hover, setHover] = useState(false)
  const cover = meridianDeck.slides[0]

  return (
    <section id="case-study" className="mx-auto max-w-7xl px-6 py-16">
      <div className="mb-12 flex items-baseline justify-between flex-wrap gap-2">
        <h2 className="type-h2" style={{ margin: 0, color: "rgb(var(--bureau-text-primary))" }}>
          Case Study
        </h2>
        <span className="type-nav" style={{ color: "rgb(var(--bureau-text-muted))" }}>
          {String(meridianDeck.slides.length).padStart(2, "0")} slides
        </span>
      </div>

      <Link
        href={`/case-study/${meridianDeck.slug}`}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)",
          gap: "var(--space-group)",
          alignItems: "center",
          textDecoration: "none",
          border: `1px solid rgb(var(--bureau-${hover ? "border-strong" : "border"}))`,
          borderRadius: "var(--bureau-radius-card)",
          background: "rgb(var(--bureau-surface))",
          padding: "var(--space-group)",
          transform: hover ? "translateY(-1px)" : "translateY(0)",
          transition:
            "border-color 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            aspectRatio: "16 / 9",
            overflow: "hidden",
            border: "1px solid rgb(var(--bureau-border))",
            borderRadius: "var(--bureau-radius-card)",
            background: "rgb(var(--bureau-elevated))",
          }}
        >
          <Image
            src={cover.url}
            alt=""
            fill
            className="object-cover"
            style={{
              filter: hover ? "grayscale(0)" : "grayscale(.15)",
              transition: "filter 0.2s",
            }}
            sizes="(max-width: 860px) 100vw, 480px"
          />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-within)" }}>
          <span className="type-label" style={{ color: "rgb(var(--bureau-text-secondary))" }}>
            Meridian
          </span>
          <span className="type-title" style={{ color: "rgb(var(--bureau-text-primary))" }}>
            {meridianDeck.title}
          </span>
          <span className="type-caption" style={{ color: "rgb(var(--bureau-text-secondary))" }}>
            {meridianDeck.intro}
          </span>
          <span
            className="type-label"
            style={{
              color: "rgb(var(--bureau-text-primary))",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-within)",
              marginTop: "var(--space-within)",
            }}
          >
            View deck
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                transform: hover ? "translate(2px, -2px)" : "translate(0, 0)",
                transition: "transform 0.2s",
              }}
            >
              <path
                d="M7 17L17 7M17 7H9M17 7V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </Link>

      <style>{`
        @media (max-width: 860px) {
          section#case-study a { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
