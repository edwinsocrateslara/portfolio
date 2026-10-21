import type { Metadata, Viewport } from "next"
import { Archivo, IBM_Plex_Mono } from "next/font/google"
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
  // brand left mono, so 700 had no reader left and went with it (10KB). If a
  // mono class ever sets 700 again, it comes back here in the same commit.
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
})

// POPPINS IS RETIRED. It was the display face for the name — "Edwin" at 900,
// latin, preloaded with swap — from 20 October (0228406) until the brand
// became a filled mark on 21 October. With no name set in type it had no
// reader, and a face loaded for nothing is 7.6KB on every first visit. The
// preload/display measurements that chose its loading strategy are kept in
// DESIGN.md § Typography, because they are the method for the next face.

const TITLE = "Edwin Socrates Lara — Product Design Portfolio"
const DESCRIPTION =
  "Ask me about Edwin Socrates Lara's product design work — case studies, process, and background."

// THE LINK PREVIEW. og:image comes from app/opengraph-image.tsx by file
// convention; title and description are stated here so a preview does not
// depend on a scraper falling back to <title>. No metadataBase: on Vercel, Next
// resolves the image URL against VERCEL_PROJECT_PRODUCTION_URL when none is
// set (next/dist/lib/metadata/resolvers/resolve-url.js), which is the
// production domain.
export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: { title: TITLE, description: DESCRIPTION, type: "website" },
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
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
