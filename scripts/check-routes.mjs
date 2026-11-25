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
//
// ── TWO OUTPUT LAYOUTS, AND THE DEPLOY THIS GATE BROKE ───────────────────
//
// This gate shipped in 51106e6 reading .next/server/app/<page>.html — where a
// plain `next build` puts prerendered pages, on this machine and in
// `vercel build` run here. EVERY VERCEL DEPLOY FROM THAT COMMIT ON FAILED
// with 13 problems (11 pages, the sitemap, robots), while the build output
// directly above the failure listed all of them prerendered. The gate was
// wrong, not the build.
//
// Why only there: Vercel's build machines set NEXT_ENABLE_ADAPTER=1, and
// @vercel/next then sets NEXT_ADAPTER_PATH to its Next adapter (the log line
// "Applying modifyConfig from Vercel"). Under the adapter, Next writes each
// prerendered file to
//     .next/server/route-cache/<APP_PAGE|APP_ROUTE>/<route key>/$/<page>
// and .next/server/app keeps its directories but no .html or .body files — so
// the old existence check found the folder and none of the files. Reproduced
// here exactly (13 problems) with NEXT_ENABLE_ADAPTER=1 and vercel@66.6.0
// build, the CLI version in the failing log.
//
// So files are resolved by their path RELATIVE to the output root, in either
// layout (outputFile below), and when NEITHER layout is present the gate says
// so in one line instead of reporting every page as not static. Proved on
// both: plain `npm run build`, and the adapter build.
import { existsSync, readFileSync, readdirSync } from "fs"
import { join } from "path"

const ROOT = process.cwd()
const SERVER = join(ROOT, ".next/server")
const APP = join(SERVER, "app")
const ROUTE_CACHE = join(SERVER, "route-cache")
const problems = []

// rel path ("index.html", "work/ecommerce.html", "sitemap.xml.body") → file.
// A plain `next build` writes .next/server/app only; the adapter build writes
// route-cache only. BUT `next start` WRITES route-cache AT RUNTIME, for the
// pages it serves (measured: 12 files after two requests) — so a local .next
// that has been served has both, and the route-cache half is partial and was
// not written by the build. (The first version of this fix read route-cache
// first and claimed a plain build writes both; it was reading a served .next.)
// So .next/server/app wins whenever the build put pages there; route-cache is
// read only when it did not — Vercel's adapter build. Inside route-cache, one
// page under two route keys is a problem: which is served is unknowable here.
const cache = new Map()
const plain = new Map()
const walk = (dir, base, fn) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name), rel = base ? `${base}/${e.name}` : e.name
    if (e.isDirectory()) walk(full, rel, fn)
    else fn(rel, full)
  }
}
if (existsSync(ROUTE_CACHE)) {
  // .next/server/route-cache/<kind>/<route key>/$/<rel>
  for (const kind of readdirSync(ROUTE_CACHE)) {
    for (const key of readdirSync(join(ROUTE_CACHE, kind))) {
      const root = join(ROUTE_CACHE, kind, key, "$")
      if (existsSync(root)) walk(root, "", (rel, full) => cache.set(rel, [...(cache.get(rel) ?? []), full]))
    }
  }
}
if (existsSync(APP)) walk(APP, "", (rel, full) => { if (/\.(html|body)$/.test(rel)) plain.set(rel, full) })

const inCache = cache.has("index.html"), inPlain = plain.has("index.html")
const layout = inPlain ? ".next/server/app (plain next build)"
  : inCache ? ".next/server/route-cache (Vercel's adapter build)"
  : null
if (!layout) {
  console.error(
    "check:routes — BUILD OUTPUT LAYOUT NOT RECOGNISED: no prerendered index.html in\n" +
    "  .next/server/route-cache/*/*/$/ or .next/server/app/. Either `next build` has not run,\n" +
    "  or Next has moved its output again: find where index.html went and teach outputFile()\n" +
    "  in this gate. This is NOT evidence that the pages are dynamic."
  )
  process.exit(1)
}
const outputFile = (rel) => {
  if (inPlain) return plain.get(rel) ?? null
  const hits = cache.get(rel) ?? []
  if (hits.length > 1) problems.push(`${rel}: under ${hits.length} route keys in .next/server/route-cache — which is served is ambiguous: ${hits.map((h) => h.slice(ROOT.length + 1)).join(", ")}`)
  return hits[0] ?? null
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
const fileFor = (path) => outputFile(path === "/" ? "index.html" : `${path.slice(1)}.html`)
const canonicalFor = (path) => (path === "/" ? SITE_URL : `${SITE_URL}${path}`)

const titles = new Map()
for (const path of addressed) {
  const file = fileFor(path)
  if (!file) {
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

const sitemapFile = outputFile("sitemap.xml.body")
if (!sitemapFile) problems.push("sitemap.xml: not in the build output")
else {
  const locs = all(readFileSync(sitemapFile, "utf8"), /<loc>([^<]*)<\/loc>/g)
  const want = new Set(addressed.map((p) => `${SITE_URL}${p}`))
  for (const l of locs) if (!want.has(l)) problems.push(`sitemap.xml: lists ${l}, which is not an addressed page`)
  for (const w of want) if (!locs.includes(w)) problems.push(`sitemap.xml: missing ${w}`)
  for (const p of offRailVibeProjects) if (locs.some((l) => l.endsWith(`/work/${p.slug}`))) problems.push(`sitemap.xml: lists the off-rail project ${p.slug}`)
}

const robotsFile = outputFile("robots.txt.body")
if (!robotsFile) problems.push("robots.txt: not in the build output")
else {
  const robots = readFileSync(robotsFile, "utf8")
  if (!robots.includes(`Sitemap: ${SITE_URL}/sitemap.xml`)) problems.push("robots.txt: does not name the sitemap on the production origin")
  if (!/Disallow: \/api\//.test(robots)) problems.push("robots.txt: does not keep /api/ out")
}

if (problems.length) {
  console.error(`\ncheck:routes — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error(`\n  (read the ${layout} layout)`)
  process.exit(1)
}
console.log(`check:routes — PASS, ${addressed.length} pages: static, canonical, own title and preview, case study in each project's HTML; sitemap exact; robots names it — read the ${layout} layout`)
