"use client"

import Image from "next/image"
import { useRef, useState } from "react"
import { ImageLightbox } from "@/components/chat/image-lightbox"
import type { DeckSlide } from "@/lib/case-study-deck"

// A compact grid of deck slides. Every tile is a real <button>, so it is
// keyboard reachable and Enter/Space activated, and opens the shared
// ImageLightbox at its own index with the WHOLE set passed in — so arrow
// navigation pages through all 21 regardless of which tile was clicked.
//
// Rendering slides the way chat images render (full width, stacked) would be
// roughly 8,800px of scroll for 21 of them. Hence the grid.
//
// ── THE BUTTON LABEL DOES NOT SAY "SLIDE", AND THAT IS THE FIX ────────────
// It used to: `Open slide ${n} of ${total}: ${alt}`. Six of the deck's alts
// legitimately open with their own role — "Team slide…", "Solution slide…",
// "Impact slide…" — because the SAME string is also the image alt in the
// lightbox, where naming the section is the useful thing it can do. Prefixed
// here, those announced as "Open slide 3 of 21: Team slide listing an Area
// VP…". Two "slide"s, one after the other.
//
// The rule in lib/sources/README.md puts this on the consumer rather than the
// copy: a component that prefixes alt must not repeat a word the alt already
// owns. Rewriting the 6 alts would have fixed the grid and made the lightbox
// worse, which is the wrong end to fix.
//
// The word is not lost — the list itself is labelled once, below, instead of
// 21 times.
export function SlideGrid({
  slides,
  columns = 4,
}: {
  slides: DeckSlide[]
  columns?: number
}) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const triggerRefs = useRef<(HTMLButtonElement | null)[]>([])

  return (
    <>
      <div
        className="slide-grid"
        // The context the button labels stopped carrying, said once. A group
        // label is announced on entry rather than on every one of 21 tiles.
        role="group"
        aria-label={`${slides.length} deck slides`}
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
          gap: "var(--space-within)",
        }}
      >
        {slides.map((slide, i) => (
          <button
            key={slide.url}
            type="button"
            ref={(el) => {
              triggerRefs.current[i] = el
            }}
            onClick={() => setLightboxIndex(i)}
            aria-label={`Open ${i + 1} of ${slides.length}: ${slide.alt}`}
            style={{
              display: "block",
              width: "100%",
              margin: 0,
              padding: 0,
              position: "relative",
              overflow: "hidden",
              aspectRatio: "16 / 9",
              border: "1px solid var(--hairline)",
              background: "var(--layer-2)",
              borderRadius: "var(--bureau-radius-media)",
              cursor: "pointer",
            }}
          >
            <Image
              src={slide.url}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 560px) 50vw, 240px"
            />
          </button>
        ))}
      </div>

      {lightboxIndex !== null && (
        <ImageLightbox
          images={slides}
          initialIndex={lightboxIndex}
          onClose={() => {
            const openedFrom = lightboxIndex
            setLightboxIndex(null)
            triggerRefs.current[openedFrom]?.focus()
          }}
        />
      )}

      <style>{`
        @media (max-width: 560px) {
          .slide-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        }
      `}</style>
    </>
  )
}
