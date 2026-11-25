// Every addressed page is what search and link previews need it to be — read
// off the BUILD'S OWN OUTPUT, after `next build`.
//
//   npm run build            (runs this last)
//   npm run check:routes     (against an existing .next)
//
// ── WHY AFTER THE BUILD, AND WHY THE OUTPUT ───────────────────────────────
//
// Every other gate reads source. This one cannot: what a crawler and a link
// preview receive is decided by Next's metadata merging, and that merging is
// where the routing work's worst mistake happened. The first build of
// lib/page-metadata.ts gave every page its own openGraph — and a page's
// openGraph REPLACES the root's whole, so the link-card image attached there
// by file convention vanished from every page, "/" included. Source looked
// right; the HTML had no og:image. Only the output shows that.
//
// ── WHAT IT ASSERTS, per addressed page ──────────────────────────────────
//
//   1. it is STATIC: a prerendered .html exists (PRODUCT.md: every page is
//      statically prerendered; a dynamic one is a regression)
//   2. exactly one <title>, unique across the site, and a non-empty
//      description
//   3. a canonical equal to its own production URL — never "/" for a page
//      that is not "/" (a canonical inherited from the root would declare
//      every page a duplicate of the front door)
//   4. og:url equal to that canonical, og:title equal to the title, an
//      og:image that is absolute on the production origin, a twitter:image
//   5. for /work/<slug>: the project's TAGLINE is in the rendered BODY, not
//      the head or a script — the thread was rendered finished on the server,
//      so the case study is indexable
//
// And site-wide:
//
//   6. the sitemap lists EXACTLY the addressed URLs — the four fixed pages
//      and one per project the rail lists — so an off-rail project, or a page
//      that stopped existing, cannot be in it, and a new page cannot be missed
//   7. robots.txt names that sitemap and keeps /api/ out
//
// The addressed set is DERIVED from lib/projects.ts and lib/vibe-projects.ts,
// the same lists the rail and app/(site)/work/[slug] read.
import { existsSync, readFileSync } from "fs"
import { join } from "path"

const ROOT = process.cwd()
const OUT = join(ROOT, ".next/server/app")
const problems = []

if (!existsSync(OUT)) {
  console.error("check:routes — no .next/server/app. Run `next build` first.")
  process.exit(1)
}

// The origin, read from the one place it is written rather than retyped.
const SITE_URL = /export const SITE_URL = "([^"]+)"/.exec(readFileSync(join(ROOT, "lib/page-metadata.ts"), "utf8"))?.[1]
if (!SITE_URL) {
  console.error("check:routes — cannot find SITE_URL in lib/page-metadata.ts")
  process.exit(1)
}

const { projects } = await import("../lib/projects.ts")
const { vibeProjects, offRailVibeProjects } = await import("../lib/vibe-projects.ts")
const listed = [...projects, ...vibeProjects]
const FIXED = ["/", "/resume", "/about", "/case-study/meridian-deck"]
const addressed = [...FIXED, ...listed.map((p) => `/work/${p.slug}`)]

const decode = (s) => s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
const all = (html, re) => [...html.matchAll(re)].map((m) => decode(m[1]))
const meta = (html, attr, key) => all(html, new RegExp(`<meta ${attr}="${key.replace(/[:]/g, "\\:")}" content="([^"]*)"`, "g"))
const fileFor = (path) => join(OUT, path === "/" ? "index.html" : `${path.slice(1)}.html`)
const canonicalFor = (path) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`)

const titles = new Map()
for (const path of addressed) {
  const file = fileFor(path)
  if (!existsSync(file)) {
    problems.push(`${path}: no prerendered HTML — the page is not static, or does not exist`)
    continue
  }
  const html = readFileSync(file, "utf8")
  const t = all(html, /<title>([^<]*)<\/title>/g)
  if (t.length !== 1) problems.push(`${path}: ${t.length} <title> elements`)
  const title = t[0] ?? ""
  if (titles.has(title)) problems.push(`${path}: title "${title}" is also ${titles.get(title)}'s`)
  titles.set(title, path)
  const desc = meta(html, "name", "description")
  if (!desc[0]?.trim()) problems.push(`${path}: no description`)

  const want = canonicalFor(path)
  const canon = all(html, /<link rel="canonical" href="([^"]*)"/g)
  if (canon.length !== 1 || canon[0] !== want) problems.push(`${path}: canonical is ${JSON.stringify(canon)}, expected "${want}"`)
  const ogUrl = meta(html, "property", "og:url")
  if (ogUrl[0] !== want) problems.push(`${path}: og:url is ${JSON.stringify(ogUrl[0])}, expected "${want}"`)
  const ogTitle = meta(html, "property", "og:title")
  if (ogTitle[0] !== title) problems.push(`${path}: og:title ${JSON.stringify(ogTitle[0])} is not the page title ${JSON.stringify(title)}`)
  const ogImage = meta(html, "property", "og:image")
  if (!ogImage[0]?.startsWith(SITE_URL + "/")) problems.push(`${path}: og:image is ${JSON.stringify(ogImage[0])}, not an absolute URL on ${SITE_URL}`)
  if (!meta(html, "name", "twitter:image")[0]) problems.push(`${path}: no twitter:image`)

  if (path.startsWith("/work/")) {
    // THE BODY'S MARKUP, scripts stripped — not the whole file. The first
    // version searched the whole HTML and passed with the threads deliberately
    // NOT server-rendered (proved by breaking, 24 November): the tagline is
    // also the page's meta description, so the <head> satisfied it, and the
    // serialised page data in <script> tags could too. Only rendered markup
    // proves the thread is in the HTML.
    const p = listed.find((x) => `/work/${x.slug}` === path)
    const body = html.slice(html.indexOf("<body")).replace(/<script[\s\S]*?<\/script>/g, "")
    if (!decode(body).includes(p.tagline)) problems.push(`${path}: the project's tagline is not in the rendered body — the thread was not rendered on the server`)
  }
}

const sitemapFile = join(OUT, "sitemap.xml.body")
if (!existsSync(sitemapFile)) problems.push("sitemap.xml: not in the build output")
else {
  const locs = all(readFileSync(sitemapFile, "utf8"), /<loc>([^<]*)<\/loc>/g)
  const want = new Set(addressed.map((p) => `${SITE_URL}${p}`))
  for (const l of locs) if (!want.has(l)) problems.push(`sitemap.xml: lists ${l}, which is not an addressed page`)
  for (const w of want) if (!locs.includes(w)) problems.push(`sitemap.xml: missing ${w}`)
  for (const p of offRailVibeProjects) if (locs.some((l) => l.endsWith(`/work/${p.slug}`))) problems.push(`sitemap.xml: lists the off-rail project ${p.slug}`)
}

const robotsFile = join(OUT, "robots.txt.body")
if (!existsSync(robotsFile)) problems.push("robots.txt: not in the build output")
else {
  const robots = readFileSync(robotsFile, "utf8")
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) problems.push("robots.txt: does not name the sitemap on the production origin")
  if (!/Disallow: \/api\//.test(robots)) problems.push("robots.txt: does not keep /api/ out")
}

if (problems.length) {
  console.error(`\ncheck:routes — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  process.exit(1)
}
console.log(`check:routes — PASS, ${addressed.length} pages: static, canonical, own title and preview, case study in each project's HTML; sitemap exact; robots names it`)
