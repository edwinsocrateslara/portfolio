"use client"

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

// The four-pointed sparkle, in ONE place.
//
// It was inline in TypingIndicator. The brand mark needs the same geometry, so
// it moved here rather than being copied — a traced path duplicated in two
// files is two things that can drift, and the provenance in
// docs/provenance/typing-indicator/ documents one shape, not two.
//
// Traced from a Lottie source; see that folder for the derivation. These are
// ARTWORK coordinates in the SVG's own normalised space, not layout values, so
// they are deliberately off the 4px grid and not in the token layer. The one
// real dimension — how big the mark is drawn — is a token at each call site.
//
// Eight vertices, every bezier handle zero in the source, so the path is a
// plain polygon and the trace is exact rather than approximate.
const SPARKLE_PATH =
  "M62.5 37.5 L85.37 50 L62.5 62.5 L50 85.37 L37.5 62.5 L14.64 50 L37.5 37.5 L50 14.64 Z"
const SPARKLE_STROKE = 8.33
// Percentages of the path, because pathLength normalises it to 100. Straight
// out of the source's trim keyframes: a 40% arc and a 3% dot.
const ARC_DASH = "40 60"
const DOT_DASH = "3 97"
const TRACK_OPACITY = 0.15

/**
 * Decorative throughout — every caller is aria-hidden, and the accessible name
 * belongs to the thing the mark sits beside ("Edwin", "Generating response").
 *
 * `size` is a CSS length, always passed as a token by the caller.
 * `currentColor` for the stroke, so the mark inherits whatever colour its
 * context sets rather than naming one.
 */
export function Sparkle({ size }: { size: string }) {
  const prefersReducedMotion = usePrefersReducedMotion()
  return (
    // ONE svg, three paths, exactly as the indicator shipped in 84631fb.
    //
    // A two-layer version existed briefly — static track below, rotating arc
    // above — to make the animation compositor-friendly. That is reverted: the
    // structure and the technique are the shipped ones.
    //
    // inline-flex, not a bare span: width and height do not apply to an inline
    // box, so in a non-flex parent the SVG fell back to width="100%" and drew
    // itself at the full 720px chat column instead of 24px. It only looked
    // right in the rail because .rail-brand is a flex container and blockified
    // it. That fix is NOT part of the revert — it predates the rotation work
    // and belongs to making the mark shareable at two sizes.
    <span
      aria-hidden="true"
      style={{
        display: "inline-flex",
        width: size,
        height: size,
        flex: "none",
      }}
    >
      <svg
        viewBox="0 0 100 100"
        width="100%"
        height="100%"
        fill="none"
        stroke="currentColor"
        strokeWidth={SPARKLE_STROKE}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d={SPARKLE_PATH} pathLength="100" opacity={TRACK_OPACITY} />
        <path
          d={SPARKLE_PATH}
          pathLength="100"
          strokeDasharray={ARC_DASH}
          strokeDashoffset="-9.72"
          className={prefersReducedMotion ? undefined : "indicator-arc"}
        />
        <path
          d={SPARKLE_PATH}
          pathLength="100"
          strokeDasharray={DOT_DASH}
          strokeDashoffset="0"
          className={prefersReducedMotion ? undefined : "indicator-dot"}
        />
      </svg>
    </span>
  )
}
