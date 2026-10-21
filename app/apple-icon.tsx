import { ImageResponse } from "next/og"
import { MARK_PATH } from "@/components/ui/brand-mark"
import { tokenRgb } from "@/lib/image-tokens"

// THE APPLE TOUCH ICON, 180px. Opaque, because iOS fills transparency with
// black and rounds the corners itself. The mark is 120 in 180 — a sixth of
// the tile clear on every side, so the rounding iOS applies never reaches it.
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: tokenRgb("bureau-bg"),
        }}
      >
        <svg viewBox="0 0 260 260" width={120} height={120} fill={tokenRgb("bureau-text-primary")}>
          <path d={MARK_PATH} />
        </svg>
      </div>
    ),
    size,
  )
}
