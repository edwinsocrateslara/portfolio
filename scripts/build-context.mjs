// Generates the Projects section of lib/edwin-context.md from lib/projects.ts.
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

const file = readFileSync(CONTEXT, "utf8")
const start = file.indexOf(BEGIN)
const end = file.indexOf(END)
if (start === -1 || end === -1) {
  console.error(`Markers not found in ${CONTEXT}. Expected:\n  ${BEGIN}\n  ${END}`)
  process.exit(1)
}

const current = file.slice(start, end + END.length)
const generated = build()

if (process.argv.includes("--check")) {
  if (current !== generated) {
    console.error(
      `${CONTEXT} is out of date with lib/projects.ts.\nRun: node scripts/build-context.mjs`
    )
    process.exit(1)
  }
  console.log(`PASS — ${CONTEXT} projects section matches lib/projects.ts`)
} else {
  if (current === generated) {
    console.log(`no change — ${CONTEXT} already up to date`)
  } else {
    writeFileSync(CONTEXT, file.slice(0, start) + generated + file.slice(end + END.length))
    console.log(`wrote ${projects.length} project sections to ${CONTEXT}`)
  }
}
