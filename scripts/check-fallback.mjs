// Rule: a custom property that CSS reads WITH A FALLBACK must be removed when
// it does not apply, never set to a zero-ish literal.
//
// WHY. `.pane-scroll` reads `padding: … var(--dock-h, var(--space-80))`. The
// fallback is the whole point — it is what holds while the observer has not
// reported yet, and what holds on a pane with no dock at all. Writing an
// explicit "0px" does not mean "no dock", it means "a dock of height zero",
// and it DEFEATS the fallback: the padding collapses to nothing and the last
// message sits under a composer that is still painted on top of it.
//
// That shipped. The dock effect's no-dock branch wrote "0px" on <main>, custom
// properties inherit, and every later pane got 0 padding where 80 was intended
// — 35px of suggestion chips under the dock at 1440, 39px at 380. Had the code
// never run, the fallback would have been correct.
//
// THE PROPERTY LIST IS DERIVED, NOT HARDCODED. Every `var(--x, …)` in the
// stylesheets is found by reading them, so a second fallback-bearing property
// is covered the day it is written and nobody has to remember this file. Today
// that set is exactly one; the check does not care.
//
// WHAT COUNTS AS ZEROING: a literal whose numeric value is 0 in any unit, or
// an empty string. `removeProperty` is the correct expression of "this does
// not apply". A computed value is somebody's decision and is left alone.
//
//   node scripts/check-fallback.mjs
import { readFileSync, readdirSync, statSync } from "fs"
import { join } from "path"

const ROOT = process.cwd()

function walk(dir, test, acc = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name === "node_modules" || name.startsWith(".")) continue
    const rel = `${dir}/${name}`
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, test, acc)
    else if (test(name)) acc.push(rel)
  }
  return acc
}

// ── 1. Which properties are read with a fallback? ────────────────────────
const styleSheets = walk("app", (n) => n.endsWith(".css"))
const withFallback = new Map() // name -> [file:line, …]
for (const rel of styleSheets) {
  readFileSync(join(ROOT, rel), "utf8").split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/var\(\s*(--[a-z0-9-]+)\s*,/gi)) {
      const list = withFallback.get(m[1]) ?? []
      list.push(`${rel}:${i + 1}`)
      withFallback.set(m[1], list)
    }
  })
}

// ── 2. Where is any of them written to a zero-ish literal? ───────────────
const sources = walk("app", (n) => /\.tsx?$/.test(n))
  .concat(walk("components", (n) => /\.tsx?$/.test(n)))
  .concat(walk("hooks", (n) => /\.tsx?$/.test(n)))

// setProperty("--name", "<literal>") — only a quoted literal is judged.
const WRITE = /setProperty\(\s*["'`](--[a-z0-9-]+)["'`]\s*,\s*["'`]([^"'`]*)["'`]\s*\)/gi
const isZeroish = (v) => v.trim() === "" || /^0(?:[a-z%]+)?$/i.test(v.trim())

const problems = []
for (const rel of sources) {
  readFileSync(join(ROOT, rel), "utf8").split("\n").forEach((line, i) => {
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return
    WRITE.lastIndex = 0
    let m
    while ((m = WRITE.exec(line)) !== null) {
      const [, name, value] = m
      if (!withFallback.has(name)) continue
      if (!isZeroish(value)) continue
      problems.push({
        file: rel, line: i + 1, name, value,
        readAt: withFallback.get(name).join(", "),
        text: line.trim(),
      })
    }
  })
}

if (problems.length) {
  console.error(`\ncheck:fallback — ${problems.length} problem(s)\n`)
  for (const p of problems) {
    console.error(`  x ${p.file}:${p.line} sets ${p.name} to ${JSON.stringify(p.value)}`)
    console.error(`      ${p.text}`)
    console.error(`      ${p.name} is read WITH A FALLBACK at ${p.readAt}, so this does not`)
    console.error(`      mean "does not apply" — it means "applies, and is zero", and it`)
    console.error(`      defeats the fallback. Use removeProperty(${JSON.stringify(p.name)}).`)
  }
  console.error("")
  process.exit(1)
}
console.log(
  `check:fallback — PASS, ${withFallback.size} fallback-bearing propert${withFallback.size === 1 ? "y" : "ies"} ` +
  `(${[...withFallback.keys()].join(", ")}), none zeroed across ${sources.length} files`
)
