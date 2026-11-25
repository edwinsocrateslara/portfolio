import type { MetadataRoute } from "next"
import { projects } from "@/lib/projects"
import { vibeProjects } from "@/lib/vibe-projects"
import { SITE_URL } from "@/lib/page-metadata"

// DERIVED, so it cannot drift: the four fixed pages and one URL per project
// the rail lists — the same list app/(site)/work/[slug]/page.tsx generates.
// offRailVibeProjects is not here, deliberately: an unlisted project has no
// URL (PRODUCT.md), so it has no sitemap entry. check:routes asserts this file
// against the build's actual pages.
//
// NO lastModified. A build timestamp would tell a crawler every page changed
// on every deploy, which is false; a per-page date would need a source this
// repo does not have. Absent is honest.
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/resume",
    "/about",
    "/case-study/meridian-deck",
    ...[...projects, ...vibeProjects].map((p) => `/work/${p.slug}`),
  ]
  return paths.map((p) => ({ url: `${SITE_URL}${p}` }))
}
