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
  // 700 is here for .type-wordmark and nothing else. Without it the brand mark
  // asked for a weight that was never fetched, so the browser synthesised one
  // — a smeared fake bold, on the most persistent text on the site, differing
  // by platform. Every other .type-* weight in both families is loaded;
  // this was the only gap.
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
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
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
