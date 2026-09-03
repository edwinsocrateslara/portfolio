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
//
// IT HOLDS ONE ENTRY, and that is worth knowing rather than hiding. It briefly
// held two: resume.txt rounded projects.ts's 106,372 to 106,000, and the pair
// was written down here instead of reconciled. Edwin's ruling was that the two
// files should agree rather than that the disagreement should be documented,
// so the figure was fixed and the entry deleted. If this map ever grows a
// second entry, ask the same question first — an exception is a last resort,
// not a place to file a mismatch.
const EXCEPTIONS = {
  "50,000":
    "Super.com's credit-building cashback card, in resume.txt. Super.com is an " +
    "Additional Role rather than one of the seven portfolio projects, so " +
    "lib/projects.ts has no entry that could state it.",
}

// ── NAMED FACTS ──────────────────────────────────────────────────────────
// Four figures the FIGURE pattern above cannot see, and will never be able to.
//
// WHY THEY ARE HERE RATHER THAN IN THE REGEX. 457, 300, 10 and 14 are bare
// integers. Nothing about their shape distinguishes them from the 38
// participants, 690 records and 153 conversations in the design-process
// answer, the 5 and 10 day bands in the sizing system, or the 9/10 in core
// skills. Widening the pattern to catch bare integers would fire on all of
// those, and a gate that cries wolf on ordinary prose is one people learn to
// skip. Normalising the spelled-out numbers to digits did not help either —
// it was tried, and made no difference, because the problem is shape rather
// than spelling.
//
// WHAT THEY GUARD. The FutureFit ideas dashboard is described twice: as a case
// study in lib/vibe-projects.ts, and in Edwin's own voice in the proudest
// answer. The two were written months apart, and either could be rewritten
// alone — which is the actual risk here, not a typo.
//
// EACH ENTRY STATES ITS FACT IN WORDS, and names the phrase each file must
// carry, because the bare figure is not enough on its own: "14" appears in the
// vibe file twice for two different facts — 14 weeks to build, and 14 items
// accepted into tickets. A check on the number alone would pass while the
// sentence it belongs to disappeared.
//
// If a fact genuinely changes, change it in both files and update the phrase
// here. If one of these projects stops being described twice, delete the entry
// rather than loosening it.
//
// WHAT IT DOES NOT ASSERT, stated so nobody assumes more of it than it does:
// that the file states the fact ONCE, or in a particular field. `457 feedback
// posts` appears twice in the vibe file — the CORPUS impact and the atStake —
// and removing either alone leaves the fact stated, so the check passes. That
// is correct by its own contract, and it was found by trying to break it: the
// first attempt to prove this gate fires did not fire, because deleting one of
// two statements had not actually removed the fact.
const NAMED_FACTS = [
  {
    figure: "457",
    fact: "feedback posts in the corpus",
    states: {
      "lib/sources/voice.md": "457 feedback posts",
      "lib/vibe-projects.ts": "457 feedback posts",
    },
  },
  {
    figure: "300",
    fact: "posts sent to the model in each weekly run",
    states: {
      "lib/sources/voice.md": "roughly 300 evaluated",
      "lib/vibe-projects.ts": "~300 evaluated per run",
    },
  },
  {
    figure: "10",
    fact: "items ranked and surfaced each week",
    states: {
      "lib/sources/voice.md": "10 strategic priorities",
      "lib/vibe-projects.ts": "10 strategic priorities per week",
    },
  },
  {
    figure: "14",
    fact: "weeks to design and build it",
    states: {
      "lib/sources/voice.md": "over 14 weeks",
      "lib/vibe-projects.ts": "14 weeks · sole contributor",
    },
  },
]

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

// ── the named facts, checked by phrase rather than by pattern ────────────
const named = { checked: 0, files: new Set() }
for (const { figure, fact, states } of NAMED_FACTS) {
  for (const [file, phrase] of Object.entries(states)) {
    named.checked++
    named.files.add(file)
    if (readFileSync(file, "utf8").includes(phrase)) continue
    problems.push(
      `${file} no longer states the ${figure} — ${fact}\n` +
      `      expected the phrase: ${JSON.stringify(phrase)}\n` +
      `      The same fact is stated in ${Object.keys(states).filter((f) => f !== file).join(", ")}.\n` +
      `      If it changed, change it in both and update NAMED_FACTS. If this\n` +
      `      project is no longer described twice, delete the entry.`
    )
  }
}

if (problems.length) {
  console.error(`\ncheck:numbers — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error("")
  process.exit(1)
}
console.log("check:numbers — PASS")
console.log(
  `  ${NAMED_FACTS.length} named fact(s), ${named.checked} statement(s) across ` +
  `${named.files.size} file(s): ${NAMED_FACTS.map((n) => n.figure).join(", ")}`
)
for (const { file, n, excused } of counts) {
  const note = n === 0 ? "  ← states none" : excused ? `  (${excused} excepted)` : ""
  console.log(`  ${String(n).padStart(2)} figure(s)  ${file}${note}`)
}
