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
          // WHAT IT IS. Two sentences, no jargon, no company-specific nouns —
          // a visitor who has never heard of FutureFit understands it. The
          // terms are defined later, in the pipeline, as they appear.
          tagline:
            "I built an internal tool that reads everything customers and staff have said about the product and, once a week, puts ten things at the top of the list with a written reason attached to each. It exists because feedback was arriving faster than anyone could read it, so decisions about what to build next were being made without most of it.",
          // Sourced from lib/sources/resume.txt, same as the seven — FutureFit
          // AI, Lead Product Designer (Contract). The (Contract) suffix is
          // dropped here because no other entry carries an engagement type.
          role: "Lead Product Designer",
          status: "wip",
          // Deliberately empty, like the seven that leave it so. Nothing renders
          // tags — verified, zero consumers outside the data file — so filling
          // it would store data no surface displays.
          tags: [],
          // No preview yet, so the rail row draws an empty frame rather than
          // borrowing a screenshot from another project — see .rail-thumb-empty.
          previewImage: { url: "", alt: "" },
          // Slot 0 renders after the opening line; slot 1 after the pipeline
          // prose. Two, and deliberately not three — see the note on image
          // order in lib/project-flow.ts for why a third would land in the
          // wrong place.
          //
          //   0  the dashboard — the weekly ten, where a reader has just been
          //      told what the tool does and wants to see it
          //   1  a single feedback post with its board, status and Slack-bot
          //      origin — the convergence point the paragraph above describes
          //
          // The architecture diagram is NOT here. Measured at the exact render
          // sizes it comes out at 4px annotation ink in the chat block and 7px
          // in the lightbox, against this system's 12px type floor, so it is
          // linked at native size instead.
          //
          // TODO(edwin): alt text. Authored, never generated — same rule as
          // the 32 project images.
          images: [
            { url: "/framer/futurefit-ideas-dashboard/image-1.webp", alt: "" },
            { url: "/framer/futurefit-ideas-dashboard/image-2.webp", alt: "" },
          ],

          // FIELD LENGTHS. Two fields here run past the longest of the seven
          // in lib/projects.ts — roleDescription at 34 words against 28, and
          // decision at 91 against 82. Deliberate, and not a drift to correct:
          // that "max" is the longest of seven samples, not a rule. The extra
          // words in roleDescription are the sole-authorship sentence, which
          // no other entry needs; decision absorbs the architecture material
          // that would otherwise want a field of its own, and a seventh
          // optional field on Project that six entries never fill is the
          // pattern that killed the vibe-coded variant.
          // STACK AND NUMBERS. Reference material, rendered as one mono block
          // rather than the accent impact card — these are facts about how the
          // thing is built, not claims about what it achieved. This is also
          // where the tools are finally named, after the pipeline has
          // explained what each one does in plain words.
          impacts: [
            "**STACK** — Next.js, Supabase, Claude, and the APIs of the feedback board and the engineering tracker",
            "**CADENCE** — collects Monday, ranks 15 minutes later, retries Tuesday if Monday failed, checks ticket status daily",
            "**CORPUS** — 457 feedback items, ~300 sent per run",
            "**OUTPUT** — 10 ranked per week, 66 synthesis runs logged in production",
            "**SHIPPED** — 14 items accepted into tickets, closed back on the original post",
            "**BUILT** — 14 weeks, sole author, 34 migrations, 25 API routes",
          ],
          roleDescription:
            "Lead product designer. I was the only person on it, and built it end to end over fourteen weeks. I later rebuilt a redacted version so the work could be shown outside the company.",
          // Deliberately unread by the vibe flow — see lib/project-flow.ts.
          // The reason the tool exists is the opening line's job in this
          // shape, and saying it twice would be saying it weakly. Kept rather
          // than deleted because it is the sharpest statement of the problem
          // and belongs in the source if this ever moves to the work template.
          atStake:
            "457 feedback posts had accumulated across four boards and nobody was working through them. The volume made starting feel impossible, so prioritisation defaulted to whatever was loudest: the highest vote count, the most persistent internal advocate, the account that escalated most visibly. Each is a proxy for importance rather than a measure of it.",
          // THE CALLS. Kept from the previous pass, with the override feedback
          // loop moved in from the old challenge field — the pipeline now
          // describes the mechanism, so this can stay about the reasoning.
          // The technical calls that were here have moved too: denormalising
          // and schema rejection are described in the pipeline where they
          // happen, rather than asserted here as principles.
          decision:
            "I ranked on strategic fit, not demand: 3 votes can outrank 30 if one maps to a live commitment. Model output and human judgement sit in separate columns; every model field has a manual override, and the weekly run rewrites only its own. A rationale freezes on acceptance, so a shipped ticket still explains why it was chosen. The last four weeks of overrides feed into the next run, deliberately scoped to influence the ordering of the 10 rather than which items qualify — so consistent disagreement is learned from without letting it quietly pull selection away from the strategy documents.",
          // THE PIPELINE. Carried by `challenge` because the vibe flow heads
          // it "The pipeline" — see lib/project-flow.ts. Every domain term is
          // defined at the moment it appears and none of the vendors is named:
          // a reader who has never heard of Canny or Clarify follows all of
          // it, and the products are named once, later, in the stack block.
          // Newlines split into paragraphs in TextBubble.
          challenge:
            "Feedback reaches the boards three ways. Most is posted straight to them — running lists where customers and staff file requests and vote on each other's, of which the tool reads 4, one per product area. Some arrives through a bot in the company chat, so anyone can file something without leaving the conversation they had it in. The rest comes from recorded customer calls, which a meeting-notes service transcribes; what it finds there is filed as an ordinary board post, so something said out loud lands in the same pile as something typed. Everything converges before the tool sees it, and the tool reads one place.\n" +
            "Once a week a scheduled job collects everything new and copies it into the tool's own database, so nothing downstream depends on any of those services being reachable. It then sends the pooled items — ~300 of the 457 — to a language model, along with the company's 5 current strategy documents and a reference describing the platform's own architecture, and asks for 10. The strategy documents are what an item has to earn its place against; the architecture reference is what lets the model tell a contained change from one that touches everything. If the model returns anything that doesn't match the expected shape, the run is rejected and logged rather than saved.\n" +
            "People review the 10. Every field the model set can be overridden by hand, and accepting an item creates a ticket in the engineering tracker. A daily check watches that ticket, and when it ships the tool closes the original post — so the person who asked for it hears back.",
        },
      ]
    : []

// Both sections, in rail order. The chat resolves slugs against this so a vibe
// project is findable by exactly the same path as the seven.
