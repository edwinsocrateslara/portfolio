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
// ── EXCEPTIONS: KEYED BY FILE, THEN BY FIGURE ────────────────────────────
// The file key is not decoration. Keyed by bare figure — which is how this
// started — an entry excused that figure in EVERY source, forever: excusing
// "90%" for the resume's SideBar bullet would have made 90% unassertable in
// voice.md and scripted-responses.ts too, and nothing would ever have said so.
// An excuse is earned in one place and should be spent in one place.
//
// AN EXCEPTION MEANS UNCHECKED, and that is the whole cost of using one. The
// loop below `continue`s, so nothing at all holds the figure afterwards. That
// is honest for Super.com's 50,000, which one file states and nothing else
// can. It is NOT enough for a figure two files state — see the note above
// NAMED_FACTS, and the SideBar entries there, which is where the assertion
// these exceptions give up is put back.
const EXCEPTIONS = {
  "lib/sources/resume.txt": {
    "50,000":
      "Super.com's credit-building cashback card. Super.com is an Additional " +
      "Role rather than one of the seven portfolio projects, so " +
      "lib/projects.ts has no entry that could state it.",

    // The three SideBar figures, all the same case: SideBar is described on
    // the résumé and in voice.md and has no lib/projects.ts entry, so there
    // is no project data to compare against. Each is paired with a
    // NAMED_FACTS entry below, which asserts the two files agree.
    //
    // 80% IS HERE FOR A SECOND REASON WORTH RECORDING. Before the haystack
    // stopped reading comments, this figure PASSED — `inData("80")` matched
    // "the first 80 rows went" in a comment in lib/vibe-projects.ts about
    // cropping a spreadsheet screenshot. A résumé claim about user testing
    // was being verified by a note on image composition. It was the only
    // figure in either source whose verdict the comment-stripping changed,
    // and it needed exactly what the other two needed all along.
    "90%":
      "SideBar user testing, published by the Christensen Institute. No " +
      "lib/projects.ts entry states it; held by NAMED_FACTS against voice.md.",
    "80%":
      "SideBar user testing, published by the Christensen Institute. No " +
      "lib/projects.ts entry states it; held by NAMED_FACTS against voice.md.",
    "73%":
      "SideBar user testing, published by the Christensen Institute. No " +
      "lib/projects.ts entry states it; held by NAMED_FACTS against voice.md.",
  },
  "lib/sources/voice.md": {
    "90%": "The same three figures, stated in Edwin's voice. See resume.txt above.",
    "80%": "The same three figures, stated in Edwin's voice. See resume.txt above.",
    "73%": "The same three figures, stated in Edwin's voice. See resume.txt above.",
  },
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

  // ── The three SideBar figures ──────────────────────────────────────────
  // These are here for a DIFFERENT REASON from the four above. Those four are
  // bare integers the FIGURE pattern cannot see. These three are percentages
  // it sees perfectly well — they are here because they are EXCUSED from the
  // pattern check, SideBar having no project entry to compare against, and an
  // excuse on its own leaves a figure with nothing holding it at all.
  //
  // So the exception gives up one assertion and this gives back a stronger
  // one: the résumé and voice.md must state the same number in the same
  // sentence. That is the drift that could actually happen here — two
  // descriptions of one study, written apart, either rewritable alone.
  //
  // THE PHRASES DIFFER BY FILE ON PURPOSE. The résumé compresses to "73% with
  // prior coaching experience"; the voice section says "73% of participants
  // with prior coaching experience", because it is a spoken sentence. Both are
  // correct in their own register, so the check names each file's own wording
  // rather than forcing one on both.
  //
  // If the Christensen Institute republishes different figures, change them in
  // both files and update the phrases here. The provenance — Appendix B, focus
  // group data, 20 users and 20 respondents against roughly 3,000 platform
  // users — is recorded in the comment above ## SideBar in voice.md.
  {
    figure: "90%",
    fact: "of SideBar testers reached outreach",
    states: {
      "lib/sources/resume.txt": "90% reached outreach",
      "lib/sources/voice.md": "90% reached outreach",
    },
  },
  {
    figure: "80%",
    fact: "would send the AI-drafted message",
    states: {
      "lib/sources/resume.txt": "80% would send the AI-drafted message",
      "lib/sources/voice.md": "80% would send the AI-drafted message",
    },
  },
  {
    figure: "73%",
    fact: "with prior coaching experience preferred it to a human counselor",
    states: {
      "lib/sources/resume.txt": "73% with prior coaching experience preferred it to a human counselor",
      "lib/sources/voice.md": "73% of participants with prior coaching experience preferred it to a human counselor",
    },
  },
]

const stripLineComments = (s, marker) =>
  s.split("\n").filter((l) => !l.trim().startsWith(marker)).join("\n")

/** Where the prose is, per file. Reading a whole .ts would pick up code. */
const SOURCES = {
  "lib/sources/voice.md": (s) => s.replace(/<!--[\s\S]*?-->/g, ""),
  "lib/sources/resume.txt": (s) => stripLineComments(s, "#"),
  "lib/scripted-responses.ts": (s) =>
    [...stripLineComments(s.replace(/\/\*[\s\S]*?\*\//g, ""), "//")
      .matchAll(/text:\s*"((?:[^"\\]|\\.)*)"/g)].map((m) => m[1]).join("\n"),
}

// A thousands separator, or a trailing percent. See the note above.
const FIGURE = /\d[\d,]*(?:\.\d+)?%|\d{1,3}(?:,\d{3})+/g

// ── THE HAYSTACK IS CONTENT, NOT SOURCE ──────────────────────────────────
// Comments are stripped before anything is compared against this. They used
// not to be, and it was not a theoretical hole: "80%" on the résumé passed
// because `(?<![\d,.])80(?![\d,])` matched "the first 80 rows went" in a
// comment in lib/vibe-projects.ts about how a screenshot was cropped. A claim
// about user testing was verified by a note on image composition.
//
// Any number written in a comment could do that — a pixel dimension, a line
// number, a percentage in an explanation of why something was rejected. The
// comparison is between what the site SAYS, so both sides read content only:
// the SOURCES extractors above already do it, and this is the other half.
const data = DATA.map((f) =>
  readFileSync(f, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//"))
    .join("\n")
).join("\n")
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
    if (EXCEPTIONS[file]?.[fig]) { excused++; continue }
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
    // WHITESPACE-INSENSITIVE, and it has to be. lib/sources/resume.txt is
    // hard-wrapped at ~80 columns, so a phrase of any length crosses a line
    // break and a raw `includes` fails on a file that states the fact
    // perfectly well. The first attempt at the SideBar entries failed exactly
    // that way — "80% would send the AI-drafted message" is split across
    // lines 96 and 97. Collapsing runs of whitespace on both sides compares
    // the sentence rather than the wrapping, which is what was meant. It also
    // means re-wrapping a paragraph cannot break this gate, and re-wrapping is
    // not a content change.
    const flat = (t) => t.replace(/\s+/g, " ")
    if (flat(readFileSync(file, "utf8")).includes(flat(phrase))) continue
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
