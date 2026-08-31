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
// PUBLIC. This was gated on NODE_ENV while the case study was unfinished — the
// gate sat on the DATA rather than the render, so the minifier dropped the
// strings entirely and the whole VIBE CODING section was absent in production.
// The case study is finished, so the gate is gone and the section ships.
//
// The rail still renders the header only when there is something under it, so
// emptying this array removes the section rather than leaving a heading above
// nothing. That guard is in sidebar.tsx and is unrelated to the environment.
export const vibeProjects: Project[] = [
        {
          slug: "futurefit-ideas-dashboard",
          client: "FutureFit AI",
          projectTitle: "Weekly Feedback Synthesis",
          // Names the DOMAIN, like the seven — Retail Banking, AI Investing,
          // Live Selling. "Feedback Synthesis" named the mechanism, which no
          // other row does, and it read as a second title rather than as the
          // line that tells rows apart. projectTitle stays "Weekly Feedback
          // Synthesis": the mechanism is the right name for the thing itself.
          railSubtitle: "Product Prioritization",
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
          // The dashboard in a laptop mockup, square, matching how the seven
          // frame theirs — they are device mockups on a dark ground too, which
          // is what makes this sit in the sampler beside them rather than
          // beside them looking like a different kind of thing.
          //
          // 1200px square from a 2160 source: the largest it ever renders is
          // the sampler card at 227px, so 455 at 2x, and 1200 leaves room
          // without paying for pixels nothing displays. Same filename the
          // seven use — the role IS the name here, and it does not collide
          // with dashboard.webp beside it, which is the 16:9 reveal image of
          // the same screen.
          previewImage: { url: "/framer/futurefit-ideas-dashboard/preview-image.webp", alt: "" },
          // Slot order here is DECLARATION order, not render order — the vibe
          // flow places them; see lib/project-flow.ts.
          //
          //   0  the dashboard — the weekly ten, rendered after the opening
          //      line, where a reader has just been told what the tool does.
          //      A laptop mockup, unlike every other image here: the browser
          //      window is 58.2% of the frame rather than the whole of it.
          //      Encoded at 2750 rather than the siblings' 1600 so that window
          //      still carries 1601px — the same pixel width a sibling's whole
          //      frame does. That is a resolution decision about the picture,
          //      which is ours to make. How large the dashboard's OWN interface
          //      text ends up is not: see DESIGN.md under the 12px floor. A
          //      screenshot is a picture of a thing, and its contents are
          //      subject matter rather than type this system set.
          //   1  a single feedback post with its board, status and Slack-bot
          //      origin — the convergence point
          //   2  the meeting-notes table, transcripts tagged by type — the
          //      tributary before it converges
          //   3  the system architecture diagram — the whole tool, placed at
          //      the END of the pipeline section because it depicts all three
          //      of its paragraphs, not the first
          //
          // 2 and 1 both render inside the pipeline section, against the
          // paragraph describing the sources, and in that order: upstream
          // (transcripts) then downstream (the board post the paragraph lands
          // on). A fourth image would fall through to after the proof links,
          // which is the wrong place — see the warning in project-flow.ts.
          //
          // THE ARCHITECTURE DIAGRAM IS NOW HERE, as slot 3, and both reasons
          // it was excluded are gone.
          //
          // The crop was the one that stood: at 16:10 into a 16:9 frame it lost
          // 10% of its height and the first 80 rows went, taking the top
          // annotation line (first ink at y=78) with it. The redraw is 7680x4320
          // — exactly 16:9 — so the crop is 0.0000px, measured against the live
          // frame rather than assumed.
          //
          // The other reason was that its annotations measured 4px, weighed
          // against the 12px type floor. That was a category error and is
          // withdrawn: see DESIGN.md under the floor. What replaces it is a
          // legibility judgment made by looking — the annotations were rendered
          // at each real display scale and read: legible in the lightbox at
          // both 1440x900 and 1440x720, not legible in the chat block, which is
          // the same contract every other screenshot here has.
          //
          // Encoded at 2650 because the lightbox caps at 1325 CSS px and 2x is
          // the useful ceiling; beyond that is bytes nothing can display.
          //
          // REDACTION IS SETTLED AND CONSISTENT, though it does not look it.
          // The dashboard's white boxes are not something applied to the
          // screenshot: it is captured from the public showcase build, which
          // redacts at the DATABASE level, so those blanks are what that
          // system renders. The Canny and Clarify shots carry visible customer
          // names because everything in them is cleared for publication. All
          // four ship as they are; the difference is provenance, not an
          // oversight, and it is recorded here so it stops being re-raised.
          //
          // TODO(edwin): alt text for all four. Authored, never generated —
          // same rule as the 32 project images. The diagram needs the most
          // care: it is the one image here whose content is a structure rather
          // than a screenshot, so its alt has to carry the flow, not the look.
          images: [
            // NAMED FOR WHAT THEY SHOW, not image-1/2/3. Two reasons, and the
            // second is why the first was worth the churn:
            //
            // A dev server running since before an image was replaced can keep
            // serving the old bytes for the same URL — see DESIGN.md,
            // Photography, "Replacing an image in place". A new name is the
            // reliable fix, and a folder of image-N.webp makes every future
            // swap reach for the unreliable one.
            //
            // And image-3.webp told nobody what image-3 was. It was read as a
            // product-feedback list that contradicted the slot comment, when
            // it is in fact exactly what the comment says: the meeting-notes
            // table. Its Feedback type column carries the same four tags the
            // pipeline copy names — friction/pain point, unmet need, feature
            // request, competitive mention — which is the thing that
            // identifies it, and a positional filename hid that.
            //
            // The names now carry the SOURCE SYSTEM as well as the view, which
            // is the part that was actually load-bearing: "meeting-notes" did
            // not survive contact with a window titled Product Feedback, and
            // "clarify-meeting-notes" would have. Replacing these two was also
            // the first test of the rename rule — the files changed, so the
            // names did too, rather than the bytes moving under a URL that had
            // already been fetched.
            { url: "/framer/futurefit-ideas-dashboard/dashboard.webp", alt: "" },
            { url: "/framer/futurefit-ideas-dashboard/canny-board-post.webp", alt: "" },
            { url: "/framer/futurefit-ideas-dashboard/clarify-meeting-notes.webp", alt: "" },
            { url: "/framer/futurefit-ideas-dashboard/system-architecture.webp", alt: "" },
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
            "Feedback reaches the boards three ways. Most is posted straight to them — running lists where customers and staff file requests and vote on each other's, of which the tool reads 4, one per product area. Some arrives through a bot in the company chat, so anyone can file something without leaving the conversation they had it in. The rest comes from recorded customer calls, which a meeting-notes service transcribes and tags by type — pain point, unmet need, feature request, competitive mention; what it finds there is filed as an ordinary board post, so something said out loud lands in the same pile as something typed. Everything converges before the tool sees it, and the tool reads one place.\n" +
            "Once a week a scheduled job collects everything new and copies it into the tool's own database, so nothing downstream depends on any of those services being reachable. It then sends the pooled items — ~300 of the 457 — to a language model, along with the company's 5 current strategy documents and a reference describing the platform's own architecture, and asks for 10. The strategy documents are what an item has to earn its place against; the architecture reference is what lets the model tell a contained change from one that touches everything. If the model returns anything that doesn't match the expected shape, the run is rejected and logged rather than saved.\n" +
            "People review the 10. Every field the model set can be overridden by hand, and accepting an item creates a ticket in the engineering tracker. A daily check watches that ticket, and when it ships the tool closes the original post — so the person who asked for it hears back.",
        },
      ]

// Both sections, in rail order. The chat resolves slugs against this so a vibe
// project is findable by exactly the same path as the seven.
