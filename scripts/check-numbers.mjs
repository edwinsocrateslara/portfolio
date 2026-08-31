// Rule: a number the chat states must also be a number the project data states.
//
// ── WHY THIS EXISTS ──────────────────────────────────────────────────────
// lib/scripted-responses.ts emits fifteen prose strings. Fourteen of them are
// authored inline with no upstream — they are navigational copy ("Which one
// catches your interest?"), not Edwin's voice, and moving them into voice.md
// would be filing them under the wrong thing. So they cannot be verbatim-
// checked the way voice-answers.ts is.
//
// But four of them carry FIGURES, and those figures are also stated in
// lib/projects.ts:
//
//   370,000   Meridian customers        walk-through answer + retail-banking tagline
//   112,000   Volkswagen customers      walk-through answer + car-comparison impacts
//        63   % of NTWRK revenue        walk-through answer + live-selling impacts
//       100   $M e-commerce revenue     walk-through answer + ecommerce impacts
//
// That is the same fact in two files with nothing keeping them in step, and it
// is the walk-through answer — the FIRST front-door chip, the most-read content
// on the site. Change an impact in projects.ts and the reveal says one number
// while the chat's summary says another, in the same conversation.
//
// ── WHAT IT ASSERTS, AND WHAT IT DELIBERATELY DOES NOT ───────────────────
// It asserts the NUMBER, not the prose. There is no claim here that the
// sentences are traceable to anything; they are not, and a gate that implied
// otherwise would be worse than none. What is checkable is narrow and worth
// checking: every numeral the chat says out loud also appears in the project
// data it is summarising.
//
// SCOPED TO THE EMITTED TEXT. Only `text:` string literals are read — the
// things that become a bubble or a chip label. Comments, trigger lists, slice
// indices, timing constants and every other numeral in the file are invisible
// to it, because none of them is something a visitor reads.
//
// NO ALLOWLIST, on purpose. A number in the chat's prose that is NOT in the
// project data is either a typo or a claim with no evidence behind it, and
// both are things to look at rather than to register. If a legitimate one ever
// appears the failure explains the choice; adding an escape hatch before there
// is anything to escape is how a gate becomes decorative.
//
//   node scripts/check-numbers.mjs
import { readFileSync } from "fs"

const SPEAKER = "lib/scripted-responses.ts"
const DATA = ["lib/projects.ts", "lib/vibe-projects.ts"]

const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "")

// The emitted prose: `text: "…"`. Template literals and computed values are
// not matched and not asserted — a number built at runtime is not a literal
// somebody typed, and this checks what was typed.
const said = stripComments(readFileSync(SPEAKER, "utf8"))
const strings = [...said.matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1])

const data = DATA.map((f) => readFileSync(f, "utf8")).join("\n")

// A figure is a run of digits with optional thousands separators. The trailing
// %, +, M or K and a leading $ are carried into the report so a human reads
// "$100M" rather than "100", but the COMPARISON is on the digits: projects.ts
// writes "$100M in revenue" where the chat writes "~$100M+", and the unit is
// the same fact wearing different punctuation.
const FIGURE = /(\$?)(\d[\d,]*(?:\.\d+)?)\s*(%|M\b|K\b)?(\+)?/g

const found = new Map() // digits -> { shown, contexts: [] }
for (const s of strings) {
  FIGURE.lastIndex = 0
  let m
  while ((m = FIGURE.exec(s)) !== null) {
    const [, dollar, digits, unit, plus] = m
    const shown = `${dollar}${digits}${unit ?? ""}${plus ?? ""}`
    const entry = found.get(digits) ?? { shown, contexts: [] }
    entry.contexts.push(s.slice(Math.max(0, m.index - 40), m.index + 26).replace(/\s+/g, " "))
    found.set(digits, entry)
  }
}

// Bounded on both sides so "100" does not match inside "1000" or "100,000".
const statedInData = (digits) =>
  new RegExp(`(?<![\\d,.])${digits.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\d,])`).test(data)

const problems = []
for (const [digits, { shown, contexts }] of found) {
  if (statedInData(digits)) continue
  problems.push(
    `${shown} is said by the chat and is not in the project data\n` +
    `      …${contexts[0]}…\n` +
    `      Either the figure changed in ${DATA[0]} and this sentence did not\n` +
    `      follow it, or the chat is stating a number nothing backs. If it is\n` +
    `      genuinely not a project figure, that is the thing to look at.`
  )
}

if (problems.length) {
  console.error(`\ncheck:numbers — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error("")
  process.exit(1)
}
const list = [...found.values()].map((v) => v.shown).join(", ")
console.log(
  `check:numbers — PASS, ${found.size} figure(s) in ${strings.length} emitted string(s) ` +
  `all stated in the project data: ${list}`
)
