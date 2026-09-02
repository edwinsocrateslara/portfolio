// Rule: a figure the site states must be the figure the project data states.
//
// ── WHAT THIS GUARDS, AND WHY IT MOVED ───────────────────────────────────
// It began pointed at ONE string — the walk-through answer in
// scripted-responses.ts, which restated four of lib/projects.ts's outcome
// figures in prose. That answer is gone: the portfolio is the walk through,
// and a paragraph summarising seven projects duplicated a rail that already
// lists all of them.
//
// Deleting the gate with it would have been wrong. The duplication MOVED, it
// did not disappear. Mapped across the repo, the six figures are stated in
// seven files, and the gates tie them into three closed loops:
//
//   A  projects.ts ──check:context──► edwin-context.md § Projects
//   B  voice.md    ──check:voice────► voice-answers.ts
//                  ──check:context──► edwin-context.md § In His Own Words
//   C  meridian-case-study.txt ──check:context──► edwin-context.md § Deck
//
// Every copy inside edwin-context.md sits in a generated block, so the system
// prompt cannot drift. But NOTHING CONNECTED LOOP A TO LOOP B. projects.ts
// says 63%, voice.md says 63%, and no gate compared them; the old gate was the
// only thread between the two, and it ran through the file being emptied.
//
// So this now reads the three places a figure is WRITTEN BY HAND and asserts
// each against the project data:
//
//   lib/sources/voice.md         Edwin's own words. The SOURCE, not
//                                voice-answers.ts — checking the derived copy
//                                would leave the original unguarded, and the
//                                source is where an edit actually happens.
//   lib/scripted-responses.ts    the emitted `text:` literals.
//   lib/sources/resume.txt       states five of the six and NO gate read it.
//                                It is also the file that becomes the PDF a
//                                recruiter sees, and its wording had already
//                                started to diverge — "63% of company revenue"
//                                against projects.ts's "63% of revenue".
//
// lib/case-study-deck.ts is deliberately NOT read. Its 370,000 is alt text
// transcribed from a slide image; the deck is a historical record of what was
// presented, not a live claim about today.
//
// ── WHAT COUNTS AS A FIGURE ──────────────────────────────────────────────
// A number with a THOUSANDS SEPARATOR or a trailing PERCENT. That filter is
// the whole reason this can read prose files without crying wolf: it skips the
// 690 records, 153 conversations and 38 participants in the design-process
// answer, "WCAG 2.2 AA", the 9/10 ratings in core skills, every date, and every
// day-count in the sizing system — none of which is a project outcome.
//
// It also skips "59K+", which IS one. A K-suffixed figure has neither mark.
// Stated rather than hidden: widening the pattern to catch it would also catch
// prose that has nothing to do with outcomes, and one missed figure is a better
// trade than a gate people learn to ignore.
//
// ── THE COUNT PER FILE IS PART OF THE REPORT ─────────────────────────────
// A file that contributes zero figures is PRINTED as zero rather than passing
// silently. This repo has found five gates that reported PASS while guarding
// nothing; the count is what makes that visible the day it happens.
//
//   node scripts/check-numbers.mjs
import { readFileSync } from "fs"

const DATA = ["lib/projects.ts", "lib/vibe-projects.ts"]

// Figures that legitimately have no counterpart in the project data. Each needs
// a reason, because an exceptions map without one is an ignore list.
const EXCEPTIONS = {
  "50,000":
    "Super.com's credit-building cashback card, in resume.txt. Super.com is an " +
    "Additional Role rather than one of the seven portfolio projects, so " +
    "lib/projects.ts has no entry that could state it.",
  "106,000":
    "resume.txt rounds. lib/projects.ts states \"106,372+ orders fulfilled\" for " +
    "the seller dashboard. Rounding on a resume is ordinary, and the pair is " +
    "written down here so it stays a decision rather than becoming a drift " +
    "nobody noticed. If the resume is ever restated exactly, delete this line.",
}

const stripLineComments = (s, marker) =>
  s.split("\n").filter((l) => !l.trim().startsWith(marker)).join("\n")

/** Where the prose is, per file. Reading a whole .ts would pick up code. */
const SOURCES = {
  "lib/sources/voice.md": (s) => s,
  "lib/sources/resume.txt": (s) => stripLineComments(s, "#"),
  "lib/scripted-responses.ts": (s) =>
    [...stripLineComments(s.replace(/\/\*[\s\S]*?\*\//g, ""), "//")
      .matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).join("\n"),
}

// A thousands separator, or a trailing percent. See the note above.
const FIGURE = /\d[\d,]*(?:\.\d+)?%|\d{1,3}(?:,\d{3})+/g

const data = DATA.map((f) => readFileSync(f, "utf8")).join("\n")
const inData = (core) =>
  new RegExp(`(?<![\\d,.])${core.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d,])`).test(data)

const problems = []
const counts = []
for (const [file, extract] of Object.entries(SOURCES)) {
  const text = extract(readFileSync(file, "utf8"))
  const found = new Map()
  for (const m of text.matchAll(FIGURE)) {
    if (!found.has(m[0])) {
      found.set(m[0], text.slice(Math.max(0, m.index - 44), m.index + 20).replace(/\s+/g, " "))
    }
  }
  let excused = 0
  for (const [fig, context] of found) {
    if (EXCEPTIONS[fig]) { excused++; continue }
    if (inData(fig.replace(/%$/, ""))) continue
    problems.push(
      `${fig} in ${file} is not in the project data\n` +
      `      …${context}…\n` +
      `      Either the figure changed in ${DATA[0]} and this did not follow it,\n` +
      `      or it is a claim nothing backs. If it genuinely has no project\n` +
      `      counterpart, add it to EXCEPTIONS with the reason.`
    )
  }
  counts.push({ file, n: found.size, excused })
}

if (problems.length) {
  console.error(`\ncheck:numbers — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error("")
  process.exit(1)
}
console.log("check:numbers — PASS")
for (const { file, n, excused } of counts) {
  const note = n === 0 ? "  ← states none" : excused ? `  (${excused} excepted)` : ""
  console.log(`  ${String(n).padStart(2)} figure(s)  ${file}${note}`)
}
