import type { Project } from "./projects"

// Vibe-coded projects — a second rail section beside WORK, and the same
// `Project` type, so an entry here is a first-class project: it opens a chat
// thread through the standard project flow, carries images and follow-up
// chips, and needs no variant of anything. The vibe-coded case-study variant
// was deleted precisely so there would be one path.
//
// WHY A SEPARATE FILE, and this is structural rather than tidiness:
// scripts/build-context.mjs imports lib/projects.ts directly to generate the
// chat's system prompt, and it HARD-FAILS if that file gains any import at
// all — it runs under --experimental-strip-types, which strips types but
// cannot resolve a module graph. So vibe entries cannot live in projects.ts
// behind a flag the generator filters out.
//
// Keeping them here means the generator has no path to this file. Placeholder
// copy CANNOT reach lib/edwin-context.md, and therefore cannot become
// something the chat states as fact. That is a property of the module graph,
// not a promise made by a filter somebody could later remove.
//
// DEV-ONLY, and the gate is on the DATA, not the render. `process.env.NODE_ENV`
// is inlined at build time, so in production this collapses to a constant and
// the minifier drops the array literal — the strings never reach the bundle.
// Same pattern the Side of Desk cards used before they were deleted.
//
// Consequence, intended: with only a dev-only entry, the whole VIBE CODING
// section is absent in production. The rail renders the header only when there
// is something under it — a section heading above nothing is worse than no
// section.
export const vibeProjects: Project[] =
  process.env.NODE_ENV === "development"
    ? [
        {
          slug: "futurefit-ideas-dashboard",
          client: "FutureFit AI",
          projectTitle: "Ideas Dashboard",
          railSubtitle: "Ideas Dashboard",
          // Deliberately empty. No case-study copy exists for this in any
          // source file, and writing some would put invented words on the one
          // surface that is supposed to be sourced. buildProjectBodyBlocks
          // skips an empty tagline rather than rendering a blank bubble.
          tagline: "",
          role: "",
          status: "wip",
          tags: [],
          // No image exists. The rail row draws an empty frame rather than
          // borrowing a screenshot from another project — see .rail-thumb-empty.
          previewImage: { url: "", alt: "" },
          images: [],
        },
      ]
    : []

// Both sections, in rail order. The chat resolves slugs against this so a vibe
// project is findable by exactly the same path as the seven.
