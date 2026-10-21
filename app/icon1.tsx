import { ImageResponse } from "next/og"
import { MARK_PATH } from "@/components/ui/brand-mark"
import { tokenRgb } from "@/lib/image-tokens"

// THE 32px PNG FAVICON, beside app/icon.svg, for browsers that do not take an
// SVG favicon. A PNG cannot follow the colour scheme, so this one carries its
// own ground: primary ink on the site's #131313, which reads on a light tab
// bar and a dark one. The mark is full-bleed because 32 is the size where its
// finest gap is 1.23px at 1x; inset it and it drops under the 26px floor.
//
// No 16. DESIGN.md § Iconography records why.
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", background: tokenRgb("bureau-bg") }}>
        <svg viewBox="0 0 260 260" width={size.width} height={size.height} fill={tokenRgb("bureau-text-primary")}>
          <path d={MARK_PATH} />
        </svg>
      </div>
    ),
    size,
  )
}
