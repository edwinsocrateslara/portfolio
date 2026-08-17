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
          projectTitle: "Weekly Feedback Synthesis",
          railSubtitle: "Feedback Synthesis",
          tagline:
            "I built a weekly tool that ranks a backlog of 457 customer feedback items against the company's strategy documents and returns a shortlist of ten.",
          // Sourced from lib/sources/resume.txt, same as the seven — FutureFit
          // AI, Lead Product Designer (Contract). The (Contract) suffix is
          // dropped here because no other entry carries an engagement type.
          role: "Lead Product Designer",
          status: "wip",
          // Deliberately empty, like the seven that leave it so. Nothing renders
          // tags — verified, zero consumers outside the data file — so filling
          // it would store data no surface displays.
          tags: [],
          // No image exists yet. The rail row draws an empty frame rather than
          // borrowing a screenshot from another project — see .rail-thumb-empty.
          // TODO(edwin): screenshots, and their alt text. Alt is authored, never
          // generated — same rule as the 32 project images.
          previewImage: { url: "", alt: "" },
          images: [],

          // FIELD LENGTHS. Two fields here run past the longest of the seven
          // in lib/projects.ts — roleDescription at 34 words against 28, and
          // decision at 91 against 82. Deliberate, and not a drift to correct:
          // that "max" is the longest of seven samples, not a rule. The extra
          // words in roleDescription are the sole-authorship sentence, which
          // no other entry needs; decision absorbs the architecture material
          // that would otherwise want a field of its own, and a seventh
          // optional field on Project that six entries never fill is the
          // pattern that killed the vibe-coded variant.
          impacts: [
            "14 items accepted into delivery tickets and closed back on the original feedback post when they shipped.",
            "The ranked list became the working document in a fortnightly review with the CEO, product, engineering, customer success and go-to-market.",
            "A backlog nobody was reading became a weekly ten that leadership worked through.",
            "Ran unattended for months: 66 synthesis runs logged in production.",
          ],
          roleDescription:
            "Lead product designer. I was the only person on it, and built it end to end over fourteen weeks. I later rebuilt a redacted version so the work could be shown outside the company.",
          atStake:
            "457 feedback posts had accumulated across four boards and nobody was working through them. The volume made starting feel impossible, so prioritisation defaulted to whatever was loudest: the highest vote count, the most persistent internal advocate, the account that escalated most visibly. Each is a proxy for importance rather than a measure of it.",
          decision:
            "I ranked on strategic fit, not demand: three votes can outrank thirty if one maps to a live commitment. Model output and human judgement sit in separate columns; every model field has a manual override, and the weekly run rewrites only its own. A rationale freezes on acceptance, so a shipped ticket still explains why it was chosen. External data is denormalised so the interface never depends on a third-party API, model output that fails schema validation is rejected rather than persisted, and every run is logged against a versioned prompt.",
          challenge:
            "The hard part was not ranking the items. It was building a ranking people would trust and still be able to overrule. Consistent disagreement feeds back into the next run as a weak signal, so the ranking learns from overrides rather than being re-fought weekly. The real test was whether a room with the CEO, engineering, customer success and go-to-market would accept a machine-generated ranking as the basis for what to build.",
        },
      ]
    : []

// Both sections, in rail order. The chat resolves slugs against this so a vibe
// project is findable by exactly the same path as the seven.
