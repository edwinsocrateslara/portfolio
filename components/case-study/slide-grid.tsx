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
            aria-label={`Open slide ${i + 1} of ${slides.length}: ${slide.alt}`}
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
