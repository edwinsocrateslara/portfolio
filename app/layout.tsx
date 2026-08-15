import type { Metadata, Viewport } from "next"
import { Archivo, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"

const archivo = Archivo({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-archivo",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
    // "system voice" this design system is built around had never actually
    // appeared. Nothing errors when a custom property is empty; the declaration
    // is simply dropped.
    <html lang="en" className={`${archivo.variable} ${ibmPlexMono.variable}`}>
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
