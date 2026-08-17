// Fails if any scripted answer string is not present verbatim in voice.md.
// Guards the deliberate duplications in the source layer.
//
// Three kinds of duplication are checked, and they are checked for different
// reasons:
//
//   1. voice-answers.ts paragraphs — the chat's own words.
//   2. currently-reading.ts book fields — structured data DERIVED from a
//      sentence in voice.md, so the page and the chat cannot disagree about
//      what Edwin is reading.
//   3. the About page's lede — a JSX literal. This one is the reason the
//      whitespace handling below exists, and the reason this rule was added:
//      it is the least visible drift in the repo, because nobody compares an
//      About page against a chat answer.
//
// WHY A CHECK AND NOT A SHARED CONSTANT. voice.md is hand-wrapped prose under
// markdown headings. The smallest thing addressable in it is a section, not a
// sentence — "the first sentence of § Outside work" is a rule that breaks the
// moment Edwin adds a clause or reorders the paragraph, and the page would
// change silently rather than loudly. The book fields could be extracted
// because a title and an author genuinely ARE fields; a sentence inside a
// paragraph is not. So the copy stays explicit where a human reads it, and
// drift becomes a build failure.
import { readFileSync } from "fs"

// WHITESPACE-NORMALISED, on both sides. voice.md hand-wraps at ~76 columns and
// JSX wraps at the printer's width, so the same sentence is line-broken
// differently in each file and a raw substring test compares two things that
// were never going to match. The previous version of this script did exactly
// that; it passed only because every section it happened to check was written
// as one long unwrapped line. § Outside work is wrapped, and the About lede
// would have reported a false failure on a sentence that was in fact correct.
const flat = (s) => s.replace(/\s+/g, " ").trim()

// JSX cannot carry a bare apostrophe, so the lede is authored with &apos;.
// Decode the entities the source layer can actually produce before comparing —
// otherwise the check demands voice.md contain an HTML entity.
const unescapeJsx = (s) =>
  s
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&mdash;/g, "—")

const voice = flat(readFileSync("lib/sources/voice.md", "utf8"))
const src = readFileSync("lib/voice-answers.ts", "utf8")

// Pull every string literal inside a `paragraphs: [...]` block.
const blocks = [...src.matchAll(/paragraphs:\s*\[([\s\S]*?)\n    \],/g)].map((m) => m[1])
const strings = blocks.flatMap((b) =>
  [...b.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
    m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\")
  )
)

// The About page renders lib/currently-reading.ts, which restates the two
// books as structured title/author pairs. That is a derivation of voice.md,
// so every field has to be verbatim in it too — otherwise the page and the
// chat could quietly disagree about what Edwin is reading.
const reading = readFileSync("lib/currently-reading.ts", "utf8")
const bookFields = [...reading.matchAll(/(?:title|author):\s*\n?\s*"((?:[^"\\]|\\.)*)"/g)].map(
  (m) => m[1].replace(/\\"/g, '"')
)

// The About page's lede. Matched by CLASS, not by position: `.about-lede` is
// the element that renders Edwin's words, and a rename is a deliberate edit
// somebody makes, whereas "the second <p> in the spine" silently stops
// pointing at the right thing the moment the header gains a line — which it
// did, this week.
const aboutSrc = readFileSync("components/about/about-pane.tsx", "utf8")
const ledeMatch = aboutSrc.match(
  /className="[^"]*\babout-lede\b[^"]*"\s*>([\s\S]*?)<\/p>/
)
// A missing element is a FAILURE, not a skip. A gate that quietly checks
// nothing when its target moves is worse than no gate: it keeps reporting PASS
// while the thing it guards drifts.
const ledeStrings = []
if (!ledeMatch) {
  console.error(
    "ABOUT LEDE NOT FOUND: no element with class `about-lede` in " +
      "components/about/about-pane.tsx.\n" +
      "  If the class was renamed, update this script in the same commit.\n"
  )
} else {
  ledeStrings.push(unescapeJsx(flat(ledeMatch[1])))
}

let bad = ledeMatch ? 0 : 1
for (const f of bookFields) {
  if (!voice.includes(flat(f))) {
    bad++
    console.error("BOOK FIELD NOT IN voice.md:\n  " + f + "\n")
  }
}

for (const s of strings) {
  if (!voice.includes(flat(s))) {
    bad++
    console.error("NOT VERBATIM IN voice.md:\n  " + s.slice(0, 110) + "…\n")
  }
}

for (const s of ledeStrings) {
  if (!voice.includes(s)) {
    bad++
    console.error(
      "ABOUT LEDE NOT VERBATIM IN voice.md:\n  " +
        s.slice(0, 140) +
        "…\n  The About page renders Edwin's own words; they must be his.\n"
    )
  }
}

console.log(
  `checked ${strings.length} scripted strings + ${bookFields.length} book fields` +
    ` + ${ledeStrings.length} About lede against lib/sources/voice.md`
)
if (bad) {
  console.error(`FAIL — ${bad} not found verbatim`)
  process.exit(1)
}
console.log("PASS — all verbatim")
