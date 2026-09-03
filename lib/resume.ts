import { readFileSync } from "fs"
import { join } from "path"

// The résumé, parsed from lib/sources/resume.txt at build time.
//
// NOTHING IS RETYPED HERE. Every string the Resume pane renders comes out of
// that file, which is the same discipline the case studies hold: a second copy
// is a second thing to keep true, and the one that isn't checked is the one
// that rots. Editing resume.txt changes the page; there is no other edit.
//
// ⚠ THIS RUNS AT MODULE SCOPE, on the server, at build time. It is imported by
// app/page.tsx and the deck route — both server components — which pass the
// result into AppShell as a prop. It CANNOT be imported by a client component:
// `fs` does not exist there, and everything under components/shell/app-shell
// is a client tree.
//
// The file is not a module, so nothing invalidates it — editing resume.txt has
// no effect on a running dev server until it restarts. Same trap as
// app/api/chat/route.ts reading edwin-context.md; documented there too.

/** A run of bullets, optionally under a label. Five roles have exactly one
 *  group with a null label; the contracting block has three labelled ones
 *  (Fintech / Viafoura / Volkswagen). ONE SHAPE, no optional field used by a
 *  single entry — that asymmetry is what killed the vibe-coded variant. */
export interface ResumeGroup {
  label: string | null
  bullets: string[]
}

export interface ResumeRole {
  employer: string
  location: string
  title: string
  dates: string
  groups: ResumeGroup[]
}

export interface ResumeEducation {
  qualification: string
  institution: string
}

/** One labelled band of the skills list. The label is CONTENT — it is printed
 *  above the run it names — and the order of the bands is the order in the
 *  source. Six today; the parser counts them rather than knowing them, so
 *  adding a seventh band is a source edit and nothing else. */
export interface ResumeSkillBand {
  label: string
  items: string[]
}

export interface Resume {
  roles: ResumeRole[]
  education: ResumeEducation[]
  skills: ResumeSkillBand[]

  // ── THREE FIELDS THE PANE DOES NOT RENDER, AND SHOULD NOT ──────────────
  // resume-pane.tsx omits the contact block and the summary on purpose, and
  // its comment says why: the rail footer already carries email and LinkedIn,
  // and the summary is marketing register the roles do not need. That has not
  // changed.
  //
  // A DOWNLOADED DOCUMENT IS A DIFFERENT ARTEFACT. It arrives with no rail
  // beside it and no site around it. A résumé file with no name on it is not
  // a stripped-down résumé, it is an anonymous one, and the summary is the
  // first thing a recruiter reads. scripts/build-resume.mjs needs all three;
  // the pane goes on ignoring them.
  //
  // Parsed rather than hardcoded in the generator for the reason everything
  // else here is: resume.txt is the master, and a name typed a second place
  // is a second place to change it.
  /** The document's first heading — the all-caps name line. */
  name: string
  /** The lines under it: email, LinkedIn, domain. In source order. */
  contact: string[]
  /** PROFESSIONAL SUMMARY, unwrapped to one paragraph. */
  summary: string
}

const SOURCE = join(process.cwd(), "lib", "sources", "resume.txt")

// A heading is a short all-caps line. "EDWIN SOCRATES LARA" matches too and is
// simply never read — the contact block it introduces is deliberately not
// rendered, because the rail footer already carries email and LinkedIn and a
// third copy on the résumé page would be the third on screen.
const HEADING = /^[A-Z][A-Z&\s]+$/

/** Hard-wrapped prose in the source; one paragraph on the page. */
const unwrap = (s: string) => s.replace(/\s*\n\s*/g, " ").trim()

// A NOTE LINE. `#` at the start of a line, and the rest of that line is for
// whoever opens the file — never parsed, never rendered.
//
// The file had no comment syntax, which meant there was nowhere to say why the
// content is the shape it is. That is not a theoretical gap: the education
// block carries no years ON PURPOSE, and with no way to write that down the
// omission reads as an oversight — which is exactly how three invented years
// ended up on a set of design boards. A blank line separates blocks here, so a
// note written without this convention becomes a fourth education entry rather
// than a note.
//
// Stripped before anything else looks at the file, so a note is invisible to
// every rule below it: headings, roles, group labels, bullets, blocks.
const COMMENT = /^\s*#/

function parse(): Resume {
  const raw = readFileSync(SOURCE, "utf8")
    .split("\n")
    .filter((line) => !COMMENT.test(line))
    .join("\n")

  const sections: Record<string, string[]> = {}
  let current: string | null = null
  // The FIRST heading in the file is the name. Captured positionally rather
  // than matched against a literal, so the one place the name is written stays
  // one place — see `name` on the Resume interface.
  let name = ""
  for (const line of raw.split("\n")) {
    const t = line.trim()
    if (t && HEADING.test(t) && t.split(" ").length <= 3) {
      current = t
      if (!name) name = t
      sections[current] = []
      continue
    }
    if (current) sections[current].push(line)
  }
  const contact = (sections[name] ?? []).map((l) => l.trim()).filter(Boolean)

  const blocks = (key: string) =>
    (sections[key] ?? [])
      .join("\n")
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean)

  const summary = unwrap(blocks("PROFESSIONAL SUMMARY").join(" "))

  // A ROLE STARTS AT ITS "Employer — Location" LINE, not at a block boundary.
  //
  // This used to alternate header/prose blocks split on blank lines, which
  // meant a blank line anywhere inside a role body silently shifted every role
  // after it. Detecting the start by pattern makes the format robust to how the
  // file is typed — blank lines between groups are now harmless rather than
  // load-bearing.
  //
  // The body format, both rules visible in a plain-text editor:
  //   "- text"    starts a bullet
  //   "  text"    continues the bullet above it
  //   "Label:"    opens a group; its bullets run until the next label
  const HEAD = /^(.+?) — (.+)$/
  const roles: ResumeRole[] = []
  const xp = (sections["EXPERIENCE"] ?? []).map((l) => l.replace(/\s+$/, ""))
  let role: ResumeRole | null = null
  let group: ResumeGroup | null = null

  // Returns the group rather than assigning the closure variable: TypeScript
  // cannot see a mutation through a helper, and narrowed `group` to `never`
  // at the push below.
  const openGroup = (label: string | null): ResumeGroup => {
    const g: ResumeGroup = { label, bullets: [] }
    role?.groups.push(g)
    return g
  }

  for (let i = 0; i < xp.length; i++) {
    const line = xp[i]
    const t = line.trim()
    if (!t) continue

    const head = !line.startsWith("-") && !line.startsWith(" ") && HEAD.exec(t)
    if (head) {
      role = {
        employer: head[1].trim(),
        location: head[2].trim(),
        title: (xp[i + 1] ?? "").trim(),
        dates: (xp[i + 2] ?? "").trim(),
        groups: [],
      }
      roles.push(role)
      group = null
      i += 2
      continue
    }
    if (!role) continue

    if (t.endsWith(":") && !line.startsWith("-") && !line.startsWith("  ")) {
      group = openGroup(t.slice(0, -1))
      continue
    }
    if (line.startsWith("- ")) {
      if (!group) group = openGroup(null)
      group.bullets.push(t.slice(2))
      continue
    }
    // A continuation line: joins the bullet above it.
    if (group && group.bullets.length) {
      group.bullets[group.bullets.length - 1] += " " + t
    }
  }
  for (const r of roles) {
    for (const g of r.groups) g.bullets = g.bullets.map((b) => unwrap(b))
  }

  const education: ResumeEducation[] = blocks("EDUCATION").map((b) => {
    const [qualification, institution] = b.split("\n")
    return {
      qualification: qualification?.trim() ?? "",
      institution: institution?.trim() ?? "",
    }
  })

  // SPLIT ON COMMAS THAT ARE NOT INSIDE PARENTHESES.
  //
  // `.split(",")` looks obviously right and is not: the Integrations band
  // carries "REST APIs built from scratch (Canny, Jira, Clarify)", which a
  // naive split shreds into three items, two of them fragments with an
  // unbalanced bracket. It fails silently — the page renders, the count goes
  // up, and the list reads as noise. The depth counter is four lines and the
  // assertion below refuses anything with brackets left open.
  const splitItems = (line: string) => {
    const out: string[] = []
    let depth = 0
    let buf = ""
    for (const ch of line) {
      if (ch === "(") depth++
      else if (ch === ")") depth--
      if (ch === "," && depth === 0) { out.push(buf); buf = "" } else buf += ch
    }
    out.push(buf)
    return out.map((t) => t.trim()).filter(Boolean)
  }

  // Six blocks, each "Label:" then a comma-separated run over one or more
  // hard-wrapped lines. The label line is REQUIRED: a block without one is a
  // problem rather than an unnamed band, because the alternative is a mistyped
  // label quietly turning six bands into five and one long anonymous run.
  const skills: ResumeSkillBand[] = []
  const skillProblems: string[] = []
  for (const block of blocks("SKILLS & METHODOLOGIES")) {
    const [head, ...rest] = block.split("\n")
    const label = head.trim()
    if (!label.endsWith(":") || !rest.length) {
      skillProblems.push(`skills block has no "Label:" line: ${JSON.stringify(block.slice(0, 40))}`)
      continue
    }
    skills.push({ label: label.slice(0, -1), items: splitItems(unwrap(rest.join("\n"))) })
  }

  // FAIL LOUDLY. A parser that silently returns nothing renders an empty page
  // that looks like a styling bug, and the build would pass. These assertions
  // are floors, not exact counts — adding a role or a tool must not break the
  // build, but losing all of them must.
  const problems: string[] = []
  // Floors for the three document-only fields. The pane would render fine
  // without them, so nothing on screen would go wrong — the failure would be a
  // downloaded résumé with no name on it, which is exactly the kind of defect
  // that ships because nobody looks at the artefact after generating it.
  if (!name) problems.push("no name heading — the first all-caps line is missing")
  if (contact.length < 2) problems.push(`expected at least 2 contact lines, parsed ${contact.length}`)
  if (summary.length < 80) problems.push(`PROFESSIONAL SUMMARY is ${summary.length} chars — did it parse?`)
  if (roles.length < 6) problems.push(`expected at least 6 roles, parsed ${roles.length}`)
  if (education.length < 3) problems.push(`expected at least 3 education entries, parsed ${education.length}`)
  // The skills floor is now three claims, not one count. A single
  // `terms >= 20` would still pass if the six labelled bands collapsed into
  // one anonymous run of thirty — which is exactly the shape this parse
  // replaced, so it is exactly the regression worth naming.
  problems.push(...skillProblems)
  const terms = skills.reduce((n, b) => n + b.items.length, 0)
  if (skills.length < 6) problems.push(`expected at least 6 skill bands, parsed ${skills.length}`)
  if (terms < 20) problems.push(`expected at least 20 skill terms, parsed ${terms}`)
  for (const band of skills) {
    if (!band.items.length) problems.push(`skills band "${band.label}" has no items under it`)
    for (const item of band.items) {
      // A bracket left open means splitItems ran off the end of a term — the
      // fragment case, caught at the source rather than on the page.
      const opens = (item.match(/\(/g) ?? []).length
      const closes = (item.match(/\)/g) ?? []).length
      if (opens !== closes) problems.push(`skills item has unbalanced brackets: ${JSON.stringify(item)}`)
    }
  }
  for (const r of roles) {
    if (!r.employer || !r.title || !r.dates) {
      problems.push(`incomplete role header: ${r.employer || "(no employer)"}`)
    }
    const bullets = r.groups.reduce((n, g) => n + g.bullets.length, 0)
    if (bullets === 0) problems.push(`${r.employer}: no bullets parsed`)
    if (r.groups.some((g) => g.bullets.length === 0)) {
      problems.push(`${r.employer}: a group label with no bullets under it`)
    }
  }
  if (problems.length) {
    throw new Error(
      `lib/resume.ts could not parse ${SOURCE}:\n  ` +
        problems.join("\n  ") +
        "\n\nThe file's shape changed. Fix the parser in the same commit as the source."
    )
  }

  return { roles, education, skills, name, contact, summary }
}

/** Parsed once per process. The source cannot change while the server runs. */
export const resume: Resume = parse()
