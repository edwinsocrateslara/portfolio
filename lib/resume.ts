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

export interface Resume {
  roles: ResumeRole[]
  education: ResumeEducation[]
  skills: string[]
}

const SOURCE = join(process.cwd(), "lib", "sources", "resume.txt")

// A heading is a short all-caps line. "EDWIN SOCRATES LARA" matches too and is
// simply never read — the contact block it introduces is deliberately not
// rendered, because the rail footer already carries email and LinkedIn and a
// third copy on the résumé page would be the third on screen.
const HEADING = /^[A-Z][A-Z&\s]+$/

/** Hard-wrapped prose in the source; one paragraph on the page. */
const unwrap = (s: string) => s.replace(/\s*\n\s*/g, " ").trim()

function parse(): Resume {
  const raw = readFileSync(SOURCE, "utf8")

  const sections: Record<string, string[]> = {}
  let current: string | null = null
  for (const line of raw.split("\n")) {
    const t = line.trim()
    if (t && HEADING.test(t) && t.split(" ").length <= 3) {
      current = t
      sections[current] = []
      continue
    }
    if (current) sections[current].push(line)
  }

  const blocks = (key: string) =>
    (sections[key] ?? [])
      .join("\n")
      .split(/\n\s*\n/)
      .map((b) => b.trim())
      .filter(Boolean)

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

  const skills = unwrap(blocks("SKILLS & METHODOLOGIES")[0] ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)

  // FAIL LOUDLY. A parser that silently returns nothing renders an empty page
  // that looks like a styling bug, and the build would pass. These assertions
  // are floors, not exact counts — adding a role or a tool must not break the
  // build, but losing all of them must.
  const problems: string[] = []
  if (roles.length < 6) problems.push(`expected at least 6 roles, parsed ${roles.length}`)
  if (education.length < 3) problems.push(`expected at least 3 education entries, parsed ${education.length}`)
  if (skills.length < 20) problems.push(`expected at least 20 skills, parsed ${skills.length}`)
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

  return { roles, education, skills }
}

/** Parsed once per process. The source cannot change while the server runs. */
export const resume: Resume = parse()
