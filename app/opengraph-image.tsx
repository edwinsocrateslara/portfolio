import { readFile } from "fs/promises"
import { join } from "path"
import { ImageResponse } from "next/og"
import { MARK_PATH } from "@/components/ui/brand-mark"
import { tokenRgb, tokenValue } from "@/lib/image-tokens"

// THE LINK PREVIEW. LinkedIn is where visitors arrive from (PRODUCT.md), and
// until this existed a link to the site showed nothing at all. The mark and the
// name, nothing else: the card has to say whose site this is, and the site
// itself makes the case.
//
// THE NAME IS SET AS THE HERO SETS IT: Archivo 400, --track-display, primary
// ink on the ground. Only the size is the card's own. The face is a 3.5KB
// subset holding exactly the letters of "Edwin Socrates Lara" (see
// assets/og/README.md); next/og cannot read the woff2 that next/font serves.
//
// Generated at build time and served static, like the page: nothing here reads
// a request.
export const alt = "Edwin Socrates Lara"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

const NAME = "Edwin Socrates Lara"

export default async function OpengraphImage() {
  const archivo = await readFile(join(process.cwd(), "assets/og/archivo-400-name-subset.ttf"))
  const ink = tokenRgb("bureau-text-primary")
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: tokenValue("space-40"),
          width: "100%",
          height: "100%",
          background: tokenRgb("bureau-bg"),
          color: ink,
        }}
      >
        <svg viewBox="0 0 260 260" width={128} height={128} fill={ink}>
          <path d={MARK_PATH} />
        </svg>
        <div style={{ display: "flex", fontFamily: "Archivo", fontWeight: 400, fontSize: 80, letterSpacing: tokenValue("track-display") }}>
          {NAME}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Archivo", data: archivo, weight: 400, style: "normal" }] },
  )
}
