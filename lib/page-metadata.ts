import type { Metadata } from "next"
import { alt as OG_ALT, size as OG_SIZE } from "@/app/opengraph-image"

// THE CANONICAL ORIGIN. The apex permanently redirects to www, so www is the
// real one (ruled 24 November). Preview deployments emit these production URLs
// too, which is correct: a canonical names the page's real address, not the
// address it happens to be served from.
export const SITE_URL = "https://www.edwinsocrateslara.com"
export const SITE_NAME = "Edwin Socrates Lara"
// The site's own title and description — "/" uses them, and a page with no
// sourced description of its own (About) falls back to SITE_DESCRIPTION.
export const SITE_TITLE = "Edwin Socrates Lara — Product Design Portfolio"
export const SITE_DESCRIPTION =
  "Ask me about Edwin Socrates Lara's product design work — case studies, process, and background."

// The site's link card, as every page states it. The size and alt come from
// the route that draws it, so the two cannot disagree.
const OG_IMAGE = { url: "/opengraph-image", ...OG_SIZE, alt: OG_ALT }

/** Per-page metadata, in ONE shape for every route, so the canonical URL, the
 *  link preview's title and description, and the page title cannot drift apart.
 *
 *  ── TWO THINGS THIS EXISTS TO PREVENT ───────────────────────────────────
 *
 *  A canonical in the ROOT layout. Every page that did not override it would
 *  declare itself a duplicate of "/", and a search engine would drop it. So
 *  the canonical is set here, per page, from the page's own path.
 *
 *  Open Graph INHERITED from the root. The root's openGraph object carries the
 *  site's title, and a page that sets only `title` still emits the root's
 *  og:title — so a shared project link would preview as the home page. Every
 *  page states its own.
 *
 *  THE LINK-CARD IMAGE IS NAMED HERE, and that is a correction found the day
 *  this was written. app/opengraph-image.tsx attaches the image by file
 *  convention to the ROOT's openGraph — and a page that states its own
 *  openGraph replaces that object whole, image included. The first build of
 *  this helper emitted no og:image and no twitter:image on any page, "/"
 *  included, which had had a working LinkedIn card since 21 October. So the
 *  image is stated explicitly, with its size and alt imported from the route
 *  rather than copied, and check:routes fails a page without one.
 *
 *  `description` must be SOURCED (PRODUCT.md: every claim about Edwin traces
 *  to lib/sources/ or the project files that are their own source of truth).
 *  A description is what a search result shows, so it is a claim. Pass a
 *  field read from a source, never a sentence written for the page. */
export function pageMetadata({
  path,
  title,
  description,
}: {
  path: string
  title: string
  description: string
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title, description, url: path, siteName: SITE_NAME, type: "website", images: [OG_IMAGE] },
    twitter: { card: "summary_large_image", images: [OG_IMAGE.url] },
  }
}
