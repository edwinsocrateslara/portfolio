// Every rail handle a tool hard-codes still points at something that exists.
//
//   npm run check:tools        (and npm run build, before next build)
//
// ── THE CLASS THIS EXISTS FOR ────────────────────────────────────────────
//
// Five tools drive the rail by hand — check:paint, check:geometry, and the
// artboard setups in scripts/setups/ — and none of them is a build gate,
// because each needs a browser and a running server. On 24 November piece 1
// of the routing work moved the Ideas Dashboard off the rail. The build
// passed, every gate passed, the site was right — and two tools broke without
// a sound: scripts/setups/vibe.js threw "no rail row for
// futurefit-ideas-dashboard" from then on, and check-geometry's vibe-reveal
// surface clicked a row that was gone. The first was found when item 4
// happened to read the setups; the second only when this gate first ran.
//
// AND THEN TWO MORE, THAT THIS GATE CANNOT SEE: the same session that wrote
// it had broken check:geometry at 380 (item 3's visible-only link selector)
// and kept the same flaw in setups/meridian.js. Found by running the tools at
// 380, not by any gate. The full incident is at DESIGN.md § The rail.
//
// The tools themselves cannot run here. What CAN run here, offline and in the
// build, is the part of that failure that is referential: a tool naming a
// project slug or a document pane that the rail no longer offers. That is
// exactly what broke, and it is checkable from source alone.
//
// ── WHAT IT ASSERTS ──────────────────────────────────────────────────────
//
//   1. every project slug a tool hard-codes — `data-project-slug="…"` or
//      bySlug("…") — is a project the rail LISTS (lib/projects.ts and
//      `vibeProjects`; an off-rail project has no row to click)
//   2. every document pane a tool hard-codes — `data-pane="…"` or
//      byPane("…") — is one of the documents (components/shell/
//      document-links.tsx)
//   3. the components still emit the handles the tools select by:
//      data-project-slug on the rail rows, data-pane on the document links
//
// ── WHAT IT CANNOT SEE, AND WHAT IS WRITTEN DOWN INSTEAD ─────────────────
//
// Behaviour. A handle can still resolve while the click does something else —
// a reveal that stops streaming, a pane that moves, a link that becomes a
// header. So the rule is written in scripts/setups/README.md and at the top of
// DESIGN.md § The rail: CHANGING THE RAIL OR THE DOCUMENT LINKS MEANS RUNNING
// THE BROWSER TOOLS (check:paint, check:threads, check:geometry, and the
// setups through canvas-artboard). This gate keeps them pointed at real
// things; it does not prove they still pass.
import { readdirSync, readFileSync } from "fs"
import { join } from "path"

const ROOT = process.cwd()
const problems = []

const { projects } = await import("../lib/projects.ts")
const { vibeProjects, offRailVibeProjects } = await import("../lib/vibe-projects.ts")
const listed = new Set([...projects, ...vibeProjects].map((p) => p.slug))
const offRail = new Set(offRailVibeProjects.map((p) => p.slug))

const docLinks = readFileSync(join(ROOT, "components/shell/document-links.tsx"), "utf8")
const panes = new Set([...docLinks.matchAll(/pane: "([a-z]+)"/g)].map((m) => m[1]))
if (panes.size === 0) problems.push("components/shell/document-links.tsx: found no document panes — the DOCUMENTS list moved; update this gate")

// 3. the handles exist where the tools expect them
const sidebar = readFileSync(join(ROOT, "components/shell/sidebar.tsx"), "utf8")
if (!/className="rail-item"/.test(sidebar) || !/data-project-slug=\{p\.slug\}/.test(sidebar)) {
  problems.push("components/shell/sidebar.tsx: rail rows no longer carry class rail-item with data-project-slug — every tool that opens a project by slug is now blind")
}
if ((docLinks.match(/data-pane=\{pane\}/g) ?? []).length < 2) {
  problems.push("components/shell/document-links.tsx: the document links no longer both carry data-pane — the tools that open documents are now blind")
}

// 1 and 2, across every tool
const files = [
  ...readdirSync(join(ROOT, "scripts")).filter((f) => f.endsWith(".mjs") && f !== "check-tools.mjs").map((f) => `scripts/${f}`),
  ...readdirSync(join(ROOT, "scripts/setups")).filter((f) => f.endsWith(".js")).map((f) => `scripts/setups/${f}`),
]
let handles = 0
for (const rel of files) {
  const src = readFileSync(join(ROOT, rel), "utf8")
  const lineOf = (i) => src.slice(0, i).split("\n").length
  for (const m of src.matchAll(/data-project-slug="([a-z0-9-]+)"|bySlug\("([a-z0-9-]+)"\)/g)) {
    handles++
    const slug = m[1] ?? m[2]
    if (!listed.has(slug)) {
      const why = offRail.has(slug) ? "is OFF the rail (lib/vibe-projects.ts) — it has no row to click" : "is not a project the rail lists"
      problems.push(`${rel}:${lineOf(m.index)}: opens project "${slug}" by its rail row, but it ${why}`)
    }
  }
  for (const m of src.matchAll(/data-pane="([a-z]+)"|byPane\("([a-z]+)"\)/g)) {
    handles++
    const pane = m[1] ?? m[2]
    if (!panes.has(pane)) problems.push(`${rel}:${lineOf(m.index)}: opens document pane "${pane}", which is not one of ${[...panes].join(", ")}`)
  }
}

if (problems.length) {
  console.error(`\ncheck:tools — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error(`\n  A tool that drives the rail is pointing at something the rail no longer offers.\n  Fix the tool — and run it: changing the rail means running the browser tools.\n`)
  process.exit(1)
}
console.log(`check:tools — PASS, ${handles} rail handles across ${files.length} tool files all resolve to a listed project or a document`)
