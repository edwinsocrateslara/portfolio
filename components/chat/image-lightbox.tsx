"use client"

import Image, { getImageProps } from "next/image"
import { createPortal } from "react-dom"
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { ICON_STROKE_CONTROL } from "@/lib/icons"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

// alt REQUIRED, matching ImageMessage. It was optional, and `alt={image.alt ||
// ""}` at the render site turned an omission into a declaration that the image
// carries nothing — which is exactly the claim lib/sources/README.md § "Alt
// text describes the frame" says an empty alt makes.
interface LightboxImage {
  url: string
  alt: string
}

interface ImageLightboxProps {
  images: LightboxImage[]
  initialIndex: number
  onClose: () => void
}

// ONE `sizes` for the visible image AND the neighbour preload. The browser
// picks a srcset candidate from `sizes`, so the preload only lands in the
// cache the <img> reads from if both say the same thing. Measured: 92vw is
// the 1920 file at 1x and the 3840 at 2x, never the 720px variant the reveal
// already loaded — which is why the reveal does not warm the lightbox.
const LIGHTBOX_SIZES = "92vw"

// How long an image may be missing before the counter says LOADING. Below
// this, the word would flash on a fast connection for an image that was about
// to arrive anyway; measured on 9 Mbps, the next image lands in 150-200ms.
const LOADING_DELAY_MS = 200

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
  // URLs whose lightbox-sized file has finished loading in THIS lightbox.
  const [loaded, setLoaded] = useState<ReadonlySet<string>>(() => new Set())
  const [loadingShown, setLoadingShown] = useState(false)
  // What the persistent live region says. Set only when the late state is
  // reached, and answered once the image lands, so a fast load says nothing.
  const [announcement, setAnnouncement] = useState("")
  // The URL that was announced as loading, so "loaded" is only ever said
  // about that image and not about one the visitor moved on to.
  const [lateUrl, setLateUrl] = useState<string | null>(null)
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

  const currentUrl = images[currentIndex].url
  const currentLoaded = loaded.has(currentUrl)

  // LOADING is for an image that is GENUINELY late, so it waits. Reset on
  // every move, so arriving at a missing image always starts a fresh 200ms.
  //
  // A WORD, NOT THE SPARKLE (ruled 24 November). The sparkle was built here
  // first. It means the right thing mechanically — something is on its way to
  // this spot — and the wrong thing on this site: a four-pointed sparkle is
  // the industry's sign for "AI is working on this", and over an empty image
  // frame, read by people at AI companies, it suggests the screenshot is being
  // generated. So the sparkle keeps meaning one thing — the typing indicator,
  // where a model really is writing — and DESIGN.md's "the sparkle is the
  // typing indicator only" stays true. LOADING is Data voice: the interface
  // reporting a state, in the counter line that already reports position.
  useEffect(() => {
    setLoadingShown(false)
    if (currentLoaded) return
    const t = setTimeout(() => {
      setLoadingShown(true)
      setLateUrl(currentUrl)
      setAnnouncement(`Loading image ${currentIndex + 1} of ${images.length}`)
    }, LOADING_DELAY_MS)
    return () => clearTimeout(t)
  }, [currentUrl, currentLoaded, currentIndex, images.length])

  // Close the loop for someone who heard "Loading": say when it has arrived.
  // Only after a LOADING announcement, so ordinary paging stays silent.
  useEffect(() => {
    if (lateUrl !== null && lateUrl === currentUrl && currentLoaded) {
      setAnnouncement(`Image ${currentIndex + 1} of ${images.length} loaded`)
      setLateUrl(null)
    }
  }, [lateUrl, currentUrl, currentLoaded, currentIndex, images.length])

  // NEXT, THEN PREVIOUS, AND ONLY ONCE THE CURRENT IMAGE HAS LANDED. Starting
  // on open would put up to 2.5x the bytes in front of the image the visitor
  // is waiting for, on exactly the connection this exists for; and someone who
  // opens and closes before the image appears should spend what they spent
  // before this existed.
  //
  // ONE AT A TIME, next first, for the same reason one level down. DO NOT
  // PARALLELISE THIS: it looks like an obvious speed-up and is a measured
  // regression. Both at once was built first and measured slower: at 1.6 Mbps a Next click made
  // straight after image 1 landed took 633ms against 483ms with no preload,
  // because image 5 (the previous one, by wrap-around) was splitting the
  // bandwidth with image 2. Forward is the common direction, so it goes first
  // and alone; previous starts when it lands.
  //
  // An off-DOM Image rather than react-dom's preload(), because preload() does
  // not say when it has finished and the chain needs to know. The srcset and
  // sizes come from getImageProps — the ones <Image> below produces — so the
  // browser picks the same file and the later <img> reads it from cache.
  useEffect(() => {
    if (!currentLoaded || images.length < 2) return
    const n = images.length
    const order = [(currentIndex + 1) % n, (currentIndex - 1 + n) % n].filter(
      (k, i, all) => k !== currentIndex && all.indexOf(k) === i
    )
    let cancelled = false
    const fetchNext = (j: number) => {
      if (cancelled || j >= order.length) return
      // The real alt, though nothing renders here: getImageProps requires one,
      // and check:alt is right that "" is a claim, not a placeholder.
      const { props } = getImageProps({ src: images[order[j]].url, alt: images[order[j]].alt, fill: true, sizes: LIGHTBOX_SIZES })
      const img = new window.Image()
      img.fetchPriority = "low"
      img.decoding = "async"
      img.onload = img.onerror = () => fetchNext(j + 1)
      // sizes before srcset before src: candidate selection reads all three.
      if (props.sizes) img.sizes = props.sizes
      if (props.srcSet) img.srcset = props.srcSet
      img.src = props.src
    }
    fetchNext(0)
    return () => {
      cancelled = true
    }
  }, [currentIndex, currentLoaded, images])

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
          {/* THE FRAME IS OPAQUE GROUND, because the overlay is not. It is
              0.97, so with no image in the frame the reveal behind it showed
              through as a faint ghost of its own screenshots — which read as an
              image fading in rather than as nothing yet. Found on the first
              screenshot of the blank state (24 November); the stale image had
              always covered it. Same token as the page, so a loaded image looks
              exactly as before: every project image is 16:9, as is the frame. */}
          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "16 / 9",
              background: "rgb(var(--bureau-bg))",
            }}
            aria-busy={!currentLoaded}
          >
            {/* KEYED BY URL, and that is the fix for the stale frame. Without a
                key React kept ONE <img> and swapped its src, and the browser
                went on painting the old picture until the new one decoded —
                so the counter said 02 / 05 over image 1, and three quick
                clicks left 05 / 05 over image 2 (measured at 1.6 Mbps and
                400 kbps, 24 November). A key mounts a fresh element per image:
                the old one is gone at once, the frame is empty until the new
                one arrives, and the counter's LOADING covers a wait long
                enough to notice. Empty is honest; the previous image looked
                like the control had not worked. */}
            <Image
              key={image.url}
              src={image.url}
              // No `|| ""`. The type requires alt, so a fallback here would be
              // dead code that also documented the wrong contract — it read as
              // though omission were expected and handled.
              alt={image.alt}
              fill
              className="object-contain"
              sizes={LIGHTBOX_SIZES}
              // `preload`, not `priority`: Next 16 deprecates the second, and
              // in 16.4.6 they are the same switch (`preload || priority`).
              preload
              onLoad={() => setLoaded((s) => (s.has(image.url) ? s : new Set(s).add(image.url)))}
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
            <X className="lightbox-icon" aria-hidden="true" strokeWidth={ICON_STROKE_CONTROL} />
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
                <ChevronLeft className="lightbox-icon" aria-hidden="true" strokeWidth={ICON_STROKE_CONTROL} />
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
                <ChevronRight className="lightbox-icon" aria-hidden="true" strokeWidth={ICON_STROKE_CONTROL} />
              </button>
            </>
          )}
        </div>

        {/* The counter line carries position and, when an image is late,
            LOADING. Shown for a single image too while it is late, so a lone
            slow image is not a silent empty frame. The visible line is not a
            live region; the status below is. */}
        {(hasMultiple || (loadingShown && !currentLoaded)) && (
          <div className="type-label" style={{ color: "rgb(var(--bureau-text-secondary))" }}>
            {hasMultiple && `${String(currentIndex + 1).padStart(2, "0")} / ${String(images.length).padStart(2, "0")}`}
            {hasMultiple && loadingShown && !currentLoaded && " · "}
            {loadingShown && !currentLoaded && "Loading"}
          </div>
        )}
        {/* PERSISTENT, and empty until needed: a live region that mounts with
            its text already in it is announced unreliably, one whose text
            changes is announced consistently — the same reason the shell's
            "Generating response" region is permanently mounted. */}
        <div role="status" aria-live="polite" className="sr-only">
          {announcement}
        </div>
      </div>
    </div>,
    document.body
  )
}
