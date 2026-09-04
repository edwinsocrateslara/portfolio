import type { Project } from "./projects"

// The few fields the rail, the sampler and the top bar need before any project
// is opened — and nothing else.
//
// ── WHY THIS TYPE EXISTS ──────────────────────────────────────────────────
//
// components/shell/sidebar.tsx and components/chat/project-sampler.tsx used to
// `import { projects } from "@/lib/projects"` directly. Both are client
// components, so that import pulled every project's tagline, challenge,
// atStake, decision, impacts, roleDescription, sections and alt text into the
// first load — to render a thumbnail, a client name and a subtitle.
//
// The reveal prose is what a visitor sees AFTER clicking a row. Shipping it to
// render the row is the whole of the finding.
//
// ── NOT A SECOND SOURCE ───────────────────────────────────────────────────
//
// `toProjectIndex` DERIVES this from the same Project objects at the server
// boundary. There is no second file to keep in agreement and nothing is
// retyped: app/page.tsx and the deck route import lib/projects.ts (server
// side, where it costs nothing) and hand the mapped result down as a prop.
//
// If a field is added to the rail, it is added here and it arrives from the
// same objects. The compiler enforces that the names match Project, because
// the mapper reads them off one.
export interface ProjectIndexEntry {
  slug: string
  /** Top line of a rail row and the sampler card. */
  client: string
  /** The project's own name — used by the top bar and the API history line. */
  projectTitle: string
  /** Second line of a rail row: what tells three "Complex NTWRK" rows apart. */
  railSubtitle: string
  /** What Edwin was hired as. The API history line names it so the model does
   *  not have to infer a role from the prose it is about to be asked about. */
  role: string
  /** Rail thumbnail. `url` only — `alt` never existed on PreviewImage, which is
   *  decorative and hard-codes alt="" at both call sites. */
  previewImage: { url: string }
  /** Which rail section this row belongs under.
   *
   *  The SERVER knows this, because it knows which module the entry came from.
   *  The alternative was a slug list in the client, which is a second place to
   *  record the same fact and the one that goes stale. */
  section: "work" | "vibe"
}

/** Map full projects to the slim shape, at a server boundary. */
export function toProjectIndex(
  list: readonly Project[],
  section: ProjectIndexEntry["section"]
): ProjectIndexEntry[] {
  return list.map((p) => ({
    section,
    slug: p.slug,
    client: p.client,
    projectTitle: p.projectTitle,
    railSubtitle: p.railSubtitle,
    role: p.role,
    previewImage: { url: p.previewImage.url },
  }))
}
