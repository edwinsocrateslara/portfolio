import type { Metadata, Viewport } from "next"
import { Archivo, IBM_Plex_Mono, Poppins } from "next/font/google"
import "./globals.css"

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  // BOTH STYLES. next/font defaults to normal only, and a `font-style: italic`
  // with no italic face loaded does not fail — the browser synthesises one by
  // shearing the upright, which is a slanted roman rather than the redrawn
  // letterforms of a real italic. The reveal's opening line is the only italic
  // on the site (.lede-em), and it is worth one more face rather than shipping
  // the counterfeit.
  style: ["normal", "italic"],
  variable: "--font-archivo",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  // 400-600: every weight a mono .type-* class sets. 700 was here for
  // .type-wordmark and nothing else — without it the brand asked for a weight
  // that was never fetched and the browser synthesised a smeared fake bold. The
  // wordmark is Poppins now, so 700 had no reader left and went with it (10KB).
  // If a mono class ever sets 700 again, it comes back here in the same commit.
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
})

// THE DISPLAY FACE FOR THE NAME, AND ONLY THE NAME. "Edwin" in the rail and the
// mobile top bar is the one string on the site set in a third family; DESIGN.md
// § Typography records it as "two families, plus one display face for the name
// only", and check:design's display-face rules hold it there:
//
//   - ONE static weight, 900, latin. Not the variable axis. A second weight
//     fails the build, because the next one is how a display face becomes a
//     text face.
//   - --ff-poppins is readable inside .type-wordmark and nowhere else, in CSS
//     or inline — the same narrowing rule 6 applies to the accent token.
//
// PRELOAD + SWAP, STATED RATHER THAN DEFAULTED, because both were measured.
// Production build, cold cache, 5 runs each, the Poppins latin file is 7.6KB:
//
//                           3G (300ms RTT, 1.6Mbps)        unthrottled
//                           FCP    font done  at FCP       FCP   font
//   swap + preload          1056   874        loaded 5/5    40    18
//   optional + preload      1036   871        loaded 5/5    48    16
//   swap, no preload        1036   1382       loading 5/5   36    23
//
// Without preload the wordmark painted in the fallback sans and swapped ~350ms
// later, every run — the visible swap. Preloaded, the file lands ~180ms before
// first paint, so display does not matter in any measured case. `optional`
// would only change the case where the preload misses first paint, and there
// it keeps the fallback for the whole visit: the brand in the wrong face until
// a reload. A one-time swap is the better failure. FCP did not move outside
// run-to-run noise for the extra preload.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
  preload: true,
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Edwin Socrates Lara — Product Design Portfolio",
  description:
    "Ask me about Edwin Socrates Lara's product design work — case studies, process, and background.",
}

export const viewport: Viewport = {
  themeColor: "#131313",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    // The font variables go on <html>, NOT <body>. globals.css defines
    // --ff-archivo and --ff-plex-mono on :root in terms of these, and :root IS
    // <html> — so with the variables one level down, both resolved to nothing
    // and every font-family: var(--ff-plex-mono) fell through to inherit.
    //
    // The effect was silent and total: every .type-label, .type-badge,
    // .type-nav and .type-meta on the site rendered in Archivo, so the mono
    // DATA voice this design system is built around had never actually
    // appeared. Nothing errors when a custom property is empty; the declaration
    // is simply dropped.
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
