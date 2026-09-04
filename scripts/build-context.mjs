// Generates three sections of lib/edwin-context.md:
//   - Projects, from lib/projects.ts
//   - Case Study Deck, from lib/sources/meridian-case-study.txt
//   - In His Own Words, from lib/sources/voice.md
//
// That section used to be hand-written prose paraphrasing data that already
// exists verbatim in projects.ts. It drifted: it re-attributed the Meridian
// app's userbase to the institution's totals, moved Coinley's decision text
// into its challenge, and re-introduced an "App Store" specificity that had
// already been removed from projects.ts once. Nothing checked it, because
// nothing could.
//
//   node scripts/build-context.mjs           rewrite the section
//   node scripts/build-context.mjs --check   fail if it is out of date
//
// Only the regions between the GENERATED markers are touched. The biography,
// hand-copied from resume.txt, stays hand-written and is the last section of
// this file that nothing checks.
//
// THE VOICE SECTIONS USED TO BE HAND-WRITTEN TOO, and the note here said they
// were "verbatim-checked by check-voice.mjs". THAT WAS FALSE. check-voice.mjs
// reads voice.md, voice-answers.ts, currently-reading.ts and about-pane.tsx —
// it has never opened lib/edwin-context.md. Seventeen sections of Edwin's own
// writing sat in the model's reference document with nothing comparing them to
// their source, and the decision to leave them that way rested on a protection
// that did not exist. They had not drifted; there was simply nothing to stop
// them. Generating them made an empty diff, which is the evidence that the
// copy was faithful up to the moment it stopped needing to be.
import { readFileSync, writeFileSync } from "fs"

const CONTEXT = "lib/edwin-context.md"
const PROJECTS = "lib/projects.ts"
const BEGIN = "<!-- BEGIN GENERATED: projects (scripts/build-context.mjs) -->"
const END = "<!-- END GENERATED: projects -->"

const VOICE_TXT = "lib/sources/voice.md"
const VOICE_BEGIN = "<!-- BEGIN GENERATED: voice (scripts/build-context.mjs) -->"
const VOICE_END = "<!-- END GENERATED: voice -->"

// Sections of voice.md that are NOT part of In His Own Words, each because it
// is already quoted somewhere else in edwin-context.md and stating it twice
// would put the same sentence in front of the model in two registers:
//
//   Intro             -> § Who Edwin Is quotes it as the headline.
//   Outside work      -> § Outside Work quotes it in full.
//   Currently reading -> the same § Outside Work quote carries the books.
//
// This is a list of exclusions rather than a list of inclusions on purpose: a
// new section added to voice.md should appear in the prompt by default. Having
// to remember to opt it in is how a source and its copy drift.
const VOICE_EXCLUDE = new Set(["Intro", "Outside work", "Currently reading"])

const DECK_TXT = "lib/sources/meridian-case-study.txt"
const DECK_BEGIN = "<!-- BEGIN GENERATED: deck (scripts/build-context.mjs) -->"
const DECK_END = "<!-- END GENERATED: deck -->"

// lib/projects.ts is imported directly rather than parsed, which relies on
// --experimental-strip-types. That flag strips types but does NOT resolve a
// TypeScript module graph: the moment projects.ts imports anything, the
// import throws a module-resolution error whose message says nothing about
// this constraint. Check for it up front and fail with an explanation.
const projectsSource = readFileSync(PROJECTS, "utf8")
const imports = projectsSource.match(/^\s*import\s.+$/gm)
if (imports) {
  console.error(
    `${PROJECTS} now has ${imports.length} import(s):\n` +
      imports.map((i) => "  " + i.trim()).join("\n") +
      "\n\nThis script imports that file directly under" +
      " --experimental-strip-types, which strips types but cannot resolve a" +
      " TypeScript module graph. Either keep projects.ts dependency-free, or" +
      " move this script behind a bundler/tsx and delete this check."
  )
  process.exit(1)
}

const { projects, SOURCED_FIELDS } = await import("../lib/projects.ts")
// THE VIBE PROJECT IS IN THE DOCUMENT TOO. It was not, and nothing said why:
// this mapped `projects` while the rail, the matcher and allProjects have
// always carried eight. The model could be asked about the Ideas Dashboard —
// the proudest answer describes it at length — and had no project entry to
// answer from. Reading allProjects fixes an omission rather than widening a
// boundary.
const { vibeProjects } = await import("../lib/vibe-projects.ts")
// The parsed résumé, for reconcile() below. lib/resume.ts reads and validates
// lib/sources/resume.txt and throws loudly if the shape changed, so importing
// it here means this script fails on a malformed source rather than silently
// reconciling against nothing.
const { resume } = await import("../lib/resume.ts")
const allProjects = [...projects, ...vibeProjects]

const STATUS_LABEL = { live: "Live", wip: "Work in progress" }

function section(p) {
  const out = []
  out.push(`### ${p.client} — ${p.projectTitle}`)
  out.push(`- **Slug:** ${p.slug}`)
  out.push(`- **Status:** ${STATUS_LABEL[p.status] ?? p.status}`)
  out.push(`- **Role:** ${p.role}`)
  out.push("")
  out.push(p.tagline)

  // Order mirrors lib/project-flow.ts, which is what the chat and the
  // /case-study route render, so the prompt describes the work in the same
  // shape a visitor sees. Absent fields drop with their label rather than
  // leaving an empty heading.
  if (p.impacts?.length) {
    out.push("")
    out.push("**Key impacts:**")
    for (const item of p.impacts) out.push(`- ${item}`)
  }
  if (p.roleDescription) {
    out.push("")
    out.push(`**My role:** ${p.roleDescription}`)
  }
  if (p.atStake) {
    out.push("")
    out.push(`**What was at stake:** ${p.atStake}`)
  }
  if (p.decision) {
    out.push("")
    out.push(`**Why I made those decisions:** ${p.decision}`)
  }
  if (p.challenge) {
    out.push("")
    out.push(`**The challenge:** ${p.challenge}`)
  }
  return out.join("\n")
}

function build() {
  const header = [
    BEGIN,
    "",
    "## Projects",
    "",
    "Generated from lib/projects.ts by scripts/build-context.mjs. Do not edit",
    "by hand: run the script. Every string below is the project data verbatim,",
    "so it cannot drift from what the site renders.",
    "",
    "Project copy is authored in lib/projects.ts and is the source of truth",
    `for it. ${Object.entries(SOURCED_FIELDS).map(([f, src]) => `\`${f}\` follows ${src}`).join("; ")}.`,
    "`alt` is written for screen readers and is excluded from this section.",
    "",
  ].join("\n")

  const body = allProjects.map(section).join("\n\n---\n\n")
  return `${header}\n${body}\n\n${END}`
}

// The deck text is pdftotext -layout output, so slide columns are held apart
// by runs of dozens of spaces. Those runs are collapsed to one space and the
// repo-authored preamble above the first PAGE delimiter is dropped. No word
// is altered, reordered, or removed — which is checkable, because this is
// generated rather than transcribed.
function buildDeck() {
  const raw = readFileSync(DECK_TXT, "utf8")
  const firstPage = raw.indexOf("════════ PAGE 1 ════════")
  if (firstPage === -1) {
    console.error(`No "PAGE 1" delimiter found in ${DECK_TXT}.`)
    process.exit(1)
  }
  const body = raw
    .slice(firstPage)
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/════════ PAGE (\d+) ════════/g, "\n**Slide $1**")
    .trim()

  const header = [
    DECK_BEGIN,
    "",
    "## Case Study Deck — Meridian / motusbank",
    "",
    `Generated from ${DECK_TXT} by scripts/build-context.mjs. Do not edit by`,
    "hand: run the script. This is the text of the 21-slide PDF, verbatim",
    "except that pdftotext's column padding is collapsed to single spaces.",
    "",
    "The deck names the product motusbank; the site names the client Meridian.",
    "Both are correct — see the motusbank note under In His Own Words. The",
    "browsable version is at /case-study/meridian-deck and the PDF is",
    "[DOC:meridian-case-study]. Slide numbers below match that page's grid.",
    "",
  ].join("\n")

  return `${header}\n${body}\n\n${DECK_END}`
}

// § In His Own Words, from voice.md's ## sections in source order.
//
// The section headings become #### subheadings unchanged, so the two files can
// be read side by side. voice.md separates sections with a `---` rule and
// carries an HTML comment of editor notes at the top; neither belongs in a
// system prompt, and both are stripped. Nothing else is touched — no word is
// altered, reordered or removed, which is checkable precisely because this is
// generated rather than transcribed.
function buildVoice() {
  const raw = readFileSync(VOICE_TXT, "utf8")

  // Split on the headings rather than regex-matching each section whole: a
  // lazy [\s\S]*? across a 165-line file is the kind of pattern that quietly
  // stops matching when someone adds a `##` inside a paragraph.
  const lines = raw.split("\n")
  const heads = []
  lines.forEach((line, i) => {
    const m = /^## (.+)$/.exec(line)
    if (m) heads.push({ title: m[1].trim(), at: i })
  })
  if (!heads.length) {
    console.error(`No "## " sections found in ${VOICE_TXT}.`)
    process.exit(1)
  }

  const sections = []
  heads.forEach((h, i) => {
    if (VOICE_EXCLUDE.has(h.title)) return
    const end = i + 1 < heads.length ? heads[i + 1].at : lines.length
    const body = lines
      .slice(h.at + 1, end)
      .join("\n")
      .replace(/<!--[\s\S]*?-->/g, "")
      .replace(/^\s*---\s*$/gm, "")
      .trim()
    if (!body) return
    sections.push(`#### ${h.title}\n\n${body}`)
  })

  const header = [
    VOICE_BEGIN,
    "",
    "### In His Own Words",
    "",
    "The section below is Edwin's own writing, from lib/sources/voice.md. Quote or",
    "draw from it directly when answering questions about how he works, what he",
    "values, or what he is looking for. It is the only permitted basis for those",
    "answers.",
    "",
  ].join("\n")

  // Two blank lines between sections, matching the spacing the hand-written
  // block used. That is not cosmetic here: it is what makes the first
  // generated output byte-identical to what it replaced, which is the only
  // evidence available that the copy had not drifted.
  return `${header}\n${sections.join("\n\n\n")}\n\n${VOICE_END}`
}

const file = readFileSync(CONTEXT, "utf8")
function splice(source, begin, end, generated, label) {
  const start = source.indexOf(begin)
  const stop = source.indexOf(end)
  if (start === -1 || stop === -1) {
    console.error(`Markers not found in ${CONTEXT}. Expected:\n  ${begin}\n  ${end}`)
    process.exit(1)
  }
  const current = source.slice(start, stop + end.length)
  if (process.argv.includes("--check")) {
    if (current !== generated) {
      console.error(
        `${CONTEXT} ${label} section is out of date.\nRun: node scripts/build-context.mjs`
      )
      process.exit(1)
    }
    console.log(`PASS — ${CONTEXT} ${label} section is up to date`)
    return source
  }
  return source.slice(0, start) + generated + source.slice(stop + end.length)
}

// ── THE HAND-WRITTEN HEAD IS RECONCILED, NOT GENERATED ────────────────────
//
// The biography, contact block and Work History at the top of edwin-context.md
// are hand-written, and the comment at the top of this file used to say so and
// leave it there: "the last section of this file that nothing checks." That was
// accurate and it was a hole. Those lines duplicate lib/sources/resume.txt, and
// a controlled mutation proved the consequence — change a role's title or dates
// in the résumé, regenerate everything, and every gate stays green while the
// model keeps answering with the old value. The visible résumé would be right
// and the chat would be confidently wrong.
//
// GENERATING THEM WAS THE OTHER OPTION AND IS THE WRONG ONE. The biography is
// prose written for a model to read, not a rendering of résumé rows — "a B2B
// and B2G AI-powered workforce development platform" appears in no source file
// and should not have to. What is duplicated is the FACTS inside it, so the
// facts are what get reconciled: each assertion below names a field of the
// parsed résumé and the exact string the context must contain.
//
// A phrase, not a regex, and not a whole-line match: the context is allowed to
// say things its own way as long as the fact survives. "He is currently
// Designer & AI Builder at FutureFit AI" satisfies the title and employer
// assertions without being a row.
function reconcile(source) {
  const problems = []
  const flat = source.replace(/\s+/g, " ")
  const need = (phrase, why) => {
    if (!flat.includes(phrase.replace(/\s+/g, " "))) problems.push(`${why}\n      expected: ${phrase}`)
  }

  need(resume.summary, "the professional summary does not match resume.txt")
  for (const line of resume.contact) need(line, `a contact line is missing or changed: ${line}`)

  for (const role of resume.roles) {
    need(`**${role.employer}** — ${role.title}`, `the Work History row for ${role.employer} is stale`)
    // Dates are written with an en dash in the context and a spaced en dash in
    // the résumé, so the halves are asserted rather than the joined string.
    const [from, to] = role.dates.split(/\s*[–-]\s*/)
    need(from, `${role.employer}'s start date is missing: ${from}`)
    need(to, `${role.employer}'s end date is missing: ${to}`)
  }

  const current = resume.roles[0]
  need(current.title, "the current-role sentence does not name the résumé's current title")
  need(current.employer, "the current-role sentence does not name the current employer")

  if (problems.length) {
    console.error(
      `\n${CONTEXT} disagrees with lib/sources/resume.txt in ${problems.length} place(s):\n`
    )
    for (const p of problems) console.error(`  x ${p}\n`)
    console.error(
      `  These sections are hand-written on purpose — the biography is prose for a\n` +
      `  model, not a rendering of résumé rows — so this reconciles the FACTS inside\n` +
      `  them rather than regenerating the words. Edit ${CONTEXT} to agree, or edit\n` +
      `  the assertion in scripts/build-context.mjs if the fact itself changed.\n`
    )
    process.exit(1)
  }
  console.log(
    `PASS — ${CONTEXT} biography, contact and work history agree with resume.txt ` +
    `(${resume.roles.length} roles, ${resume.contact.length} contact lines)`
  )
}
reconcile(file)

let next = file
next = splice(next, BEGIN, END, build(), "projects")
next = splice(next, DECK_BEGIN, DECK_END, buildDeck(), "deck")
next = splice(next, VOICE_BEGIN, VOICE_END, buildVoice(), "voice")

if (!process.argv.includes("--check")) {
  if (next === file) {
    console.log(`no change — ${CONTEXT} already up to date`)
  } else {
    writeFileSync(CONTEXT, next)
    console.log(`wrote ${allProjects.length} project sections + the deck to ${CONTEXT}`)
  }
}
