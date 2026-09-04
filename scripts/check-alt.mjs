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
// THAT EXEMPTION IS NOW BACKED BY THE TYPE, and this check asserts the type is
// still doing its job. `PreviewImage` has no `alt` property, so writing one is
// a compile error. It was not always: six projects carried 19-29 word
// descriptions of their thumbnails, roughly 140 words, read by nothing —
// sidebar.tsx and project-sampler.tsx both hard-code alt="". Two comments and
// this exemption all said "decorative" while the data said otherwise.
//
// ── WHAT THIS CHECK CANNOT DO, STATED SO NOBODY ASSUMES MORE OF IT ────────
//
// It can refuse alt that is ABSENT, PADDED, WRONGLY PREFIXED, CROSS-
// REFERENTIAL or UNPUNCTUATED. It cannot make alt TRUE. Nothing here compares
// a string to a .webp, so an alt that confidently describes the wrong
// screenshot passes every rule below. An audit of all 61 image entries found
// exactly one of those — a marketing site rendered on a phone, described as
// "the mobile app" — and no gate could have.
//
// Same shape of limit scripts/check-docs.mjs states about a PDF: it does not
// try to validate that the document is a good résumé, because it cannot, and a
// check that pretended to would be worse than none.
//
// The rule these assertions are a subset of is lib/sources/README.md
// § "Alt text describes the frame". Clauses 1, 3 and 5 are judgment and are
// deliberately not here.
//
//   node --import ./scripts/ts-extensionless.mjs scripts/check-alt.mjs
import { readFileSync, readdirSync, statSync } from "fs"
import { join, relative } from "path"
import { projects } from "../lib/projects.ts"
import { vibeProjects } from "../lib/vibe-projects.ts"
import { meridianDeck } from "../lib/case-study-deck.ts"
import { PHOTOS } from "../lib/about-photos.ts"

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

// ── The written-alt rules ────────────────────────────────────────────────
// Every one of these is a fact about the STRING, decidable without seeing the
// image. Anything needing the image is not here; see the note at the top.

/** 32 words. No floor — a title card holding 2 words earns a 10-word alt and
 *  padding it to a house length is worse than brevity. */
const MAX_WORDS = 32

/** Openings that announce the medium instead of describing it. A screen
 *  reader already says "image"; "Image of a chart" says it twice. Closed list
 *  of literal prefixes, so it cannot fire on prose that merely contains one. */
const BANNED_OPENING = /^\s*(an?\s+|the\s+)?(image|photo|photograph|picture|graphic|icon|screenshot|screen\s?grab)\s+(of|showing|that shows)\b/i

/** Phrases that make an alt depend on a neighbour. The lightbox opens at any
 *  index and a screen reader hears one image at a time, so "the same product
 *  page" and "3 more screens" are unresolvable by the person they were written
 *  for. Both were real: ecommerce[0] pointed at a decorative thumbnail that is
 *  never announced, and deck slide 6 needed slide 5.
 *
 *  ── THESE ARE NARROWER THAN THEY FIRST WERE, AND THAT IS THE POINT ───────
 *  The first version flagged any "the same" and any "above". It fired on two
 *  CORRECT alts immediately: "the marketing site on a laptop and the same site
 *  on a phone" resolves inside its own sentence, and "a wireframe flow … above
 *  the full information architecture sitemap" is describing where things sit
 *  IN the frame, not a reading order.
 *
 *  Rewriting good prose to satisfy a greedy pattern is the wrong repair — the
 *  pattern is what was wrong. So "above/below" is now only the reading-order
 *  idioms, and "the same" is checked by RESOLUTION rather than by presence:
 *  see resolvesInPlace below. */
const CROSS_REFERENCE = [
  [/\b\d+\s+more\b/i, 'refers to a previous image — "N more …"'],
  [/\b(as|see|shown)\s+(above|below)\b/i, "assumes a reading order"],
  [/\b(the\s+)?previous\s+(image|screen|slide|one)\b/i, "refers to a previous image"],
]

/** "the same X" is fine when X is already named in this alt, and dangling when
 *  it is not. "The marketing site on a laptop and the same site on a phone" —
 *  `site` appears before it, so a listener can resolve it. "Shopping grid of
 *  the collection … alongside the same product page" — no `product`, no
 *  `page`, so the referent is another image they will never hear.
 *
 *  Head noun = the words between "the same" and the next preposition or the
 *  end. Crude, and crude is right here: it only has to decide whether ANY of
 *  those words occurred earlier in the same string. */
function resolvesInPlace(alt) {
  const m = /\bthe same\b/i.exec(alt)
  if (!m) return true
  const before = alt.slice(0, m.index).toLowerCase()
  const after = alt.slice(m.index + m[0].length)
  const head = after
    .split(/\b(?:on|in|at|of|from|with|rendered|shown|across|beside)\b/i)[0]
    .toLowerCase()
    .match(/[a-z]+/g) ?? []
  return head.some((word) => word.length > 3 && before.includes(word))
}

const words = (s) => s.trim().split(/\s+/).filter(Boolean).length

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

// ── PASS 2: the written alt, against the rules a program can hold ────────
// Imports the real data rather than reading source, so a string that moves
// file or gains a line break is still checked.
//
// THE ABOUT PHOTOGRAPHS ARE HERE NOW, and the comment they replace said they
// did not need to be: "their PHOTOS map is module-private to about-pane.tsx —
// and pass 1 above already covers the only thing that can be wrong with them
// today." Pass 1 only sees `alt: ""`. Everything else this file checks —
// length, the full stop, medium-announcing openings, cross-references — never
// looked at the 3 images whose alt is written in Edwin's own first person and
// is the hardest to get right. Deleting the final full stop from one of them
// left this gate green.
//
// The map is exported from about-pane.tsx for exactly this reason. That the
// data was private was a fact about the module, not a reason the rule stopped
// applying at its edge.
const written = [
  ...[...projects, ...vibeProjects].flatMap((p) =>
    (p.images ?? []).map((im, i) => ({ where: `${p.slug}[${i}]`, alt: im.alt }))
  ),
  ...meridianDeck.slides.map((sl, i) => ({ where: `deck slide ${i + 1}`, alt: sl.alt })),
  ...Object.entries(PHOTOS).map(([key, ph]) => ({ where: `about.${key}`, alt: ph.alt })),
].filter((e) => e.alt)

const broken = []
for (const { where, alt } of written) {
  const n = words(alt)
  if (n > MAX_WORDS) {
    broken.push(`${where}: ${n} words, over the ${MAX_WORDS}-word ceiling\n      ${alt}`)
  }
  if (BANNED_OPENING.test(alt)) {
    broken.push(
      `${where}: opens by announcing the medium\n      ${alt}\n` +
      `      A screen reader already says "image". Describe the frame instead.`
    )
  }
  if (!alt.trimEnd().endsWith(".")) {
    broken.push(`${where}: does not end in a full stop\n      ${alt}`)
  }
  if (!resolvesInPlace(alt)) {
    broken.push(
      `${where}: "the same …" has no referent in this alt\n      ${alt}\n` +
      `      The thing it points at is in another image, which a screen reader\n` +
      `      user hears separately or not at all.`
    )
  }
  for (const [re, why] of CROSS_REFERENCE) {
    if (re.test(alt)) {
      broken.push(
        `${where}: ${why}\n      ${alt}\n` +
        `      Alt is heard one image at a time and the lightbox opens at any\n` +
        `      index, so this cannot be resolved by the person it is for.`
      )
    }
  }
}

// ── PASS 3: previewImage carries no alt ──────────────────────────────────
// tsc is the real gate — PreviewImage has no `alt` property, so writing one is
// a compile error. This asserts the TYPE is still the one being used, which
// tsc cannot tell you if somebody widens it back to ProjectImage.
for (const rel of ["lib/projects.ts", "lib/vibe-projects.ts"]) {
  const src = readFileSync(join(ROOT, rel), "utf8")
  for (const m of src.matchAll(/previewImage:\s*\{([\s\S]*?)\}/g)) {
    if (/(^|[\s,{])alt\s*:/.test(m[1])) {
      broken.push(
        `${rel}: a previewImage carries alt\n      ${m[1].trim().slice(0, 70)}\n` +
        `      Rail and sampler thumbnails are decorative — both renderers\n` +
        `      hard-code alt="". PreviewImage has no alt property; if this\n` +
        `      compiled, the field's type was widened back.`
      )
    }
  }
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
}

if (broken.length) {
  console.error(`\ncheck:alt — ${broken.length} written alt problem(s)\n`)
  for (const b of broken) console.error(`  x ${b}`)
  console.error(
    `\n  These are the parts of lib/sources/README.md § "Alt text describes the\n` +
    `  frame" that a program can hold. The clauses it cannot — describe the\n` +
    `  frame rather than the product, don't interpret, register — are yours.\n`
  )
}

// BOTH passes report before this exits. An early exit after pass 1 would hide
// every written-alt problem behind the unwritten ones, and the unwritten ones
// are the slowest to clear — you would fix eight images and only then discover
// the ninth thing.
if (missing.length || broken.length) process.exit(1)

console.log(
  `check:alt — PASS, no content image is missing alt text` +
  (pending.length ? ` (${pending.length} slot(s) awaiting a file)` : "") +
  `; ${written.length} written alt(s) under ${MAX_WORDS} words, punctuated, ` +
  `self-contained, no medium-announcing openings`
)
