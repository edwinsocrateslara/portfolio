"use client"

import Image from "next/image"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

interface LightboxImage {
  url: string
  alt?: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

const CONTROL_BUTTON_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  width: "var(--space-40)",
  height: "var(--space-40)",
  padding: 0,
  border: "1px solid var(--hairline)",
  background: "var(--layer-1)",
  borderRadius: "var(--bureau-radius-chip)",
  color: "rgb(var(--bureau-text-primary))",
  cursor: "pointer",
}

export function ImageLightbox({ images, initialIndex, onClose }: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [mounted, setMounted] = useState(false)
  const prefersReducedMotion = usePrefersReducedMotion()
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)

  const hasMultiple = images.length > 1

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length)
  }, [images.length])

  // createPortal needs a DOM; this only ever mounts on a click, but guard
  // anyway so the component is safe to render during SSR.
  useEffect(() => setMounted(true), [])

  // Lock body scroll while open.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  // Move focus into the dialog. Deliberately keyed to `mounted`, not []:
  // the first render returns null for the portal guard, so the close
  // button does not exist yet and an on-mount focus call would silently
  // no-op against a null ref.
  useEffect(() => {
    if (mounted) closeButtonRef.current?.focus()
  }, [mounted])

  // Esc to close, arrow keys to navigate, Tab trapped inside the dialog.
  // Bound to document, so portalling doesn't affect any of it.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
        return
      }
      if (hasMultiple && e.key === "ArrowLeft") {
        e.preventDefault()
        goPrev()
        return
      }
      if (hasMultiple && e.key === "ArrowRight") {
        e.preventDefault()
        goNext()
        return
      }
      if (e.key === "Tab") {
        const dialog = dialogRef.current
        if (!dialog) return
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        )
        if (focusable.length === 0) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [onClose, goPrev, goNext, hasMultiple])

  if (!mounted) return null

  const image = images[currentIndex]
  const transitionClass = prefersReducedMotion ? undefined : "animate-fade-in"

  // Portalled to <body>, and it stays that way.
  //
  // It was originally forced: `.animate-slide-up` on the AssistantBubble
  // wrapper filled a transform, and any non-none transform makes an element
  // the containing block for `position: fixed` descendants — so the overlay
  // sized itself to the message bubble and left the header, input and left of
  // the page uncovered. That class animates opacity only now, so the trap is
  // gone and the portal is no longer load-bearing for it.
  //
  // Keeping it anyway: an overlay that covers the viewport should not depend
  // on every ancestor between here and <body> staying transform-free. See the
  // note above @keyframes cursor-blink in globals.css.
  return createPortal(
    <div
      onClick={onClose}
      className={transitionClass}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        background: "rgb(var(--bureau-bg) / 0.97)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-group)",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
        onClick={(e) => e.stopPropagation()}
        style={{
          position: "relative",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "var(--space-between)",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "min(92vw, calc(92vh * 16 / 9))",
          }}
        >
          <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 9" }}>
            <Image
              src={image.url}
              alt={image.alt || ""}
              fill
              className="object-contain"
              sizes="92vw"
              priority
            />
          </div>

          {/* Anchored to the image's own top-right corner, inset by the same
              12px as the arrows, rather than floating above the frame. */}
          <button
            type="button"
            ref={closeButtonRef}
            onClick={onClose}
            aria-label="Close"
            className="lightbox-control"
            style={{
              ...CONTROL_BUTTON_STYLE,
              position: "absolute",
              top: "var(--space-12)",
              right: "var(--space-12)",
            }}
          >
            <X size={18} />
          </button>

          {hasMultiple && (
            <>
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous image"
                className="lightbox-control"
                style={{
                  ...CONTROL_BUTTON_STYLE,
                  position: "absolute",
                  left: "var(--space-12)",
                  // Centring math against the 40px control, not a spacing
                  // choice. Documented exception.
                  top: "calc(50% - 20px)",
                }}
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={goNext}
                aria-label="Next image"
                className="lightbox-control"
                style={{
                  ...CONTROL_BUTTON_STYLE,
                  position: "absolute",
                  right: "var(--space-12)",
                  top: "calc(50% - 20px)",
                }}
              >
                <ChevronRight size={20} />
              </button>
            </>
          )}
        </div>

        {hasMultiple && (
          <div className="type-label" style={{ color: "rgb(var(--bureau-text-secondary))" }}>
            {String(currentIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
