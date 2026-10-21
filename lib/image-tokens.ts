import { readFileSync } from "fs"
import { join } from "path"

// THE COLOUR TOKENS, FOR IMAGES THE STYLESHEET NEVER REACHES. The favicon PNG,
// the Apple touch icon and the Open Graph card are rendered by next/og at build
// time, with inline styles only — no stylesheet, so no var(--bureau-*). Rather
// than copy the values, this reads them out of app/globals.css as the build
// runs, so the images cannot drift from the site. A token that is renamed or
// reshaped throws, and the build fails, rather than painting a default.
//
// app/icon.svg is the one image that cannot do this: it is a static file the
// browser loads as its own document. Its two literals are checked against
// these tokens by check:design instead.
const css = () => readFileSync(join(process.cwd(), "app/globals.css"), "utf8")

/** `--bureau-bg: 19 19 19;` -> "rgb(19, 19, 19)". */
export function tokenRgb(name: string): string {
  const m = new RegExp(`--${name}:\\s*(\\d+)\\s+(\\d+)\\s+(\\d+)\\s*;`).exec(css())
  if (!m) throw new Error(`image-tokens: --${name} is not an "r g b" triplet in app/globals.css`)
  return `rgb(${m[1]}, ${m[2]}, ${m[3]})`
}

/** A token's raw value, e.g. `--track-display` -> "-0.03em". */
export function tokenValue(name: string): string {
  const m = new RegExp(`--${name}:\\s*([^;]+);`).exec(css())
  if (!m) throw new Error(`image-tokens: --${name} is not defined in app/globals.css`)
  return m[1].trim()
}
