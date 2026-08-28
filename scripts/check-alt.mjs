// Rule: an image a sighted reader learns something from must say what it is.
//
// `alt: ""` is not "unfinished". To a screen reader it DECLARES the image
// decorative and removes it from the accessibility tree entirely, so an empty
// alt on a content image is an active claim that there is nothing to convey.
// The About photographs are described in their own file as the only human
// presence on the site; the reveal screenshots include a system-architecture
// diagram that carries case-study evidence. None of that reaches a screen
// reader today, and "Open image full-screen" does not stand in for it.
//
// WHY A GATE AND NOT A COMMENT. about-pane.tsx already carries a ⚠ note saying
// the empty strings there are "actively wrong, not merely unfinished". It has
// been accurate and shipping. That is the pattern: a defect a gate can see
// cannot ship, a defect in a comment waits for someone to forget.
//
// WHAT IS EXEMPT, and it is one narrow category: `previewImage`. Those are the
// rail and sampler thumbnails, and every one sits beside the project name as
// visible text. An alt there would be read out twice. Decorative is correct
// for them, so they are skipped by NAME rather than by being allowed to be
// empty — a content image cannot become exempt by moving.
//
//   node --experimental-strip-types scripts/check-alt.mjs
import { readFileSync, readdirSync, statSync } from "fs"
import { join, relative } from "path"

const ROOT = process.cwd()
const ROOTS = ["lib", "components", "app"]

/** Every .ts/.tsx under the roots. */
function walk(dir, acc = []) {
  for (const name of readdirSync(join(ROOT, dir))) {
    if (name === "node_modules" || name.startsWith(".")) continue
    const rel = `${dir}/${name}`
    if (statSync(join(ROOT, rel)).isDirectory()) walk(rel, acc)
    else if (/\.tsx?$/.test(name)) acc.push(rel)
  }
  return acc
}

// An `alt:` whose value is an empty string literal. Deliberately literal:
// a computed alt is somebody's decision and this cannot read it.
const EMPTY_ALT = /alt:\s*""/g

const findings = []
for (const rel of walk(ROOTS[0]).concat(walk(ROOTS[1]), walk(ROOTS[2]))) {
  const src = readFileSync(join(ROOT, rel), "utf8")
  const lines = src.split("\n")
  lines.forEach((line, i) => {
    if (line.trim().startsWith("//") || line.trim().startsWith("*")) return
    EMPTY_ALT.lastIndex = 0
    if (!EMPTY_ALT.test(line)) return

    // The thumbnail exemption. Either on the same line, or on the property
    // this object literal belongs to when it spans several lines.
    const window = lines.slice(Math.max(0, i - 4), i + 1).join("\n")
    if (/previewImage\s*:/.test(window)) return

    // A slot with no file yet carries no <img> at all, so there is nothing to
    // describe until the photograph lands. It is listed as outstanding rather
    // than failed.
    const nullSrc = /src:\s*null/.test(line)

    findings.push({ file: rel, line: i + 1, text: line.trim(), pending: nullSrc })
  })
}

const missing = findings.filter((f) => !f.pending)
const pending = findings.filter((f) => f.pending)

if (missing.length) {
  console.error(`\ncheck:alt — ${missing.length} image(s) with no alt text\n`)
  for (const f of missing) {
    console.error(`  x ${f.file}:${f.line}`)
    console.error(`      ${f.text}`)
  }
  if (pending.length) {
    console.error(`\n  Not counted — no src yet, so no <img> is rendered:`)
    for (const f of pending) console.error(`      ${f.file}:${f.line}`)
  }
  console.error(
    `\n  Write one sentence per image saying what a sighted reader gets from it.\n` +
    `  An empty alt is not a placeholder: it tells a screen reader the image\n` +
    `  carries nothing. previewImage thumbnails are exempt and already skipped.\n`
  )
  process.exit(1)
}
console.log(
  `check:alt — PASS, no content image is missing alt text` +
  (pending.length ? ` (${pending.length} slot(s) awaiting a file)` : "")
)
