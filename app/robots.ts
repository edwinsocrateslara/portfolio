import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/page-metadata"

// Everything a visitor can reach is crawlable. /api/ is not a page: /api/chat
// is the model endpoint, a POST that spends the owner's credits, and has
// nothing for an index.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
