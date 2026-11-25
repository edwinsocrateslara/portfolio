import { ImageResponse } from "next/og"
import { MARK_PATH, MARK_VIEWBOX } from "@/components/ui/brand-mark"
import { tokenRgb } from "@/lib/image-tokens"

// THE 32px PNG FAVICON, beside app/icon.svg, for browsers that do not take an
// SVG favicon. A PNG cannot follow the colour scheme, so this one carries its
// own ground: primary ink on the site's #131313, which reads on a light tab
// bar and a dark one. The mark is full-bleed.
//
// HISTORY: full-bleed was REQUIRED for the previous mark — at 32 its finest
// gap was 1.23px at 1x, and an inset would have dropped it under its 26px
// floor. The current mark's floor is about 16, so full-bleed is now a choice
// (the largest mark the tile allows), not a necessity.
//
// No separate 16 file, and since 25 November none is needed: the drawing
// holds at 16, so "no 16" is superseded rather than an open question.
// DESIGN.md § Icons, "The favicon", records both.
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: tokenRgb("bureau-bg") }}>
        <svg viewBox={MARK_VIEWBOX} width={size.width} height={size.height} fill={tokenRgb("bureau-text-primary")}>
          <path d={MARK_PATH} />
        </svg>
      </div>
    ),
    size,
  )
}
