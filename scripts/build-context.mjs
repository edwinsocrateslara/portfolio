// Generates two sections of lib/edwin-context.md:
//   - Projects, from lib/projects.ts
//   - Case Study Deck, from lib/sources/meridian-case-study.txt
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
// Only the region between the GENERATED markers is touched. The biography
// (from resume.txt) and the voice sections (from voice.md, verbatim-checked
// by check-voice.mjs) stay hand-written.
import { readFileSync, writeFileSync } from "fs"

const CONTEXT = "lib/edwin-context.md"
const PROJECTS = "lib/projects.ts"
const BEGIN = "<!-- BEGIN GENERATED: projects (scripts/build-context.mjs) -->"
const END = "<!-- END GENERATED: projects -->"

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

const { projects, REPO_AUTHORED_FIELDS } = await import("../lib/projects.ts")

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
    `Not traceable to lib/sources/: ${REPO_AUTHORED_FIELDS.join(", ")}. See the`,
    "comment on that field in lib/projects.ts.",
    "",
  ].join("\n")

  const body = projects.map(section).join("\n\n---\n\n")
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

let next = file
next = splice(next, BEGIN, END, build(), "projects")
next = splice(next, DECK_BEGIN, DECK_END, buildDeck(), "deck")

if (!process.argv.includes("--check")) {
  if (next === file) {
    console.log(`no change — ${CONTEXT} already up to date`)
  } else {
    writeFileSync(CONTEXT, next)
    console.log(`wrote ${projects.length} project sections + the deck to ${CONTEXT}`)
  }
}
