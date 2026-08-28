import { projects } from "./projects"
import { vibeProjects } from "./vibe-projects"
import { buildProjectBodyBlocks } from "./project-flow"
import { matchVoiceAnswer, voiceAnswerById } from "./voice-answers"
import { meridianDeck } from "./case-study-deck"
import { rotationFor } from "./chips"
import type { MessageBlock } from "@/hooks/use-scripted-stream"

// ── Scripted topics and their chip routing ─────────────────────────────
// Every branch buildResponse can return, declared next to the code that
// returns it. Same contract as the `chip` / `noChip` fields on
// VOICE_ANSWERS: an entry with neither is a build failure, so a new
// scripted answer cannot quietly end up with no way to reach it.
//
// `id` is the branch, not a trigger. The triggers stay inline below where
// the matching happens — duplicating them here would create exactly the
// second list this table exists to avoid.
export interface ScriptedTopic {
  id: string
  chip?: string
  placement?: "front-door" | "rotation"
  chipOrder?: number
  noChip?: string
}

// Rotation indices for the non-project surfaces. Projects take 0..6 (their
// position in `projects`), so these continue past them — two surfaces sharing
// an index would show identical chips.
const SURFACE = {
  deck: 7,
  resume: 8,
  stakeholder: 9,
  voice: 10,
  downtime: 11,
} as const

// The one place project chips earn a slot. Everywhere else they duplicate the
// rail; here the answer has just narrated all seven and "which one?" is the
// actual next step. Labels are matched by TEXT, not by the slug they carry —
// "How did the live-selling work?" used to sit here with a hyphen while the
// matcher tests "live selling" with a space, so it resolved only because the
// slug bypassed the text match and broke the moment anyone typed it.
const PROJECT_HANDOFF_CHIPS = [
  { text: "Tell me about FutureFit AI", slug: "ai-workforce-development" },
  { text: "Show me the Meridian redesign", slug: "retail-banking" },
  { text: "How did the live selling work?", slug: "live-selling" },
]

export const SCRIPTED_TOPICS: ScriptedTopic[] = [
  {
    id: "walk-through",
    chip: "Walk me through your work",
    placement: "front-door",
    chipOrder: 1,
  },
  {
    id: "stakeholder",
    chip: "How do you handle pushback on a design decision?",
    placement: "rotation",
  },
  {
    id: "downtime",
    chip: "What do you do outside of work?",
    placement: "rotation",
  },
  {
    id: "project-reveal",
    noChip:
      "Seven rail rows and three sampler cards already point at the projects. A chip naming one duplicates the rail and spends a slot the chat could use on something only the chat answers.",
  },
  {
    id: "deck",
    noChip: "The rail's CASE STUDY row opens the deck as a pane swap.",
  },
  {
    id: "resume",
    noChip:
      "The rail's RESUME row opens the real document. A chip would be a second path to the same PDF.",
  },
  {
    id: "location",
    noChip:
      "One line, and it deliberately renders no follow-ups. Not worth a slot.",
  },
]

// The chat reveal: the shared body, then follow-up chips. The order of the
// body lives in lib/project-flow.ts, which is the single statement of block
// order for both flows.
//
// No project-header card. The rail names the open project permanently, and on
// mobile the top bar does — a card repeating it at the top of the transcript
// was a third copy that scrolled away the moment the reveal got going.
// The bubble is gone too, with the "project-header" kind — it had no producer
// and the renderer advertised a state that could not occur.
/** The seven, then the vibe-coded ones. Rail order, and the order slugs and
 *  rotation indices resolve against. */
export const allProjects = [...projects, ...vibeProjects]

function projectStream(p: (typeof projects)[0]): MessageBlock[] {
  // Chips rotate per project rather than repeating one generic trio seven
  // times. A visitor who just read a case study has seen the work and is the
  // best candidate for the person questions, so the pool is all person
  // questions and contains no project chips at all — they have the rail, and
  // they just used it.
  // Against ALL projects, not just the seven. findIndex returns -1 for a vibe
  // project, and rotationFor(-1) yields [undefined, undefined, undefined] —
  // three blank chips rather than an error, which is the kind of thing that
  // ships. Verified before fixing.
  const index = allProjects.findIndex((x) => x.slug === p.slug)
  return [
    ...buildProjectBodyBlocks(p),
    {
      kind: "followups",
      // NO HEADING. The chips are self-evidently questions and were being
      // introduced by a line that asked one; FollowupsBubble already drops the
      // gap above them when there is no text, so nothing is left hanging.
      chips: rotationFor(index).map((c) => ({ text: c.label })),
    },
  ]
}


// Build response based on user input
// Returns { response, projectSlug } where projectSlug is the new project being discussed
export function buildResponse(
  text: string,
  options?: { preloadedSlug?: string; currentProjectSlug?: string | null }
): { response: MessageBlock[] | null; projectSlug: string | null } {
  const t = text.toLowerCase()
  const { preloadedSlug, currentProjectSlug } = options || {}

  // The deck and the Meridian project are separate things that share a name.
  // Bare "meridian" means the project — that is the ruling, and the deck
  // response below sits after the project matcher to honour it. But the chip
  // label is "See the Meridian case study", which contains "meridian", so the
  // project matcher would swallow it before the deck matcher was ever
  // reached. These triggers are the narrow set that unambiguously means the
  // document: they suppress the project match rather than reordering the
  // blocks.
  const wantsDeck = [
    "motusbank",
    "motus bank",
    "motus",
    "case study deck",
    "slide deck",
    "the deck",
    "slides",
    "see the meridian case study",
  ].some((k) => t.includes(k))

  // Project-specific responses
  const matchSlug =
    preloadedSlug ||
    (wantsDeck
      ? null
      : t.includes("meridian")
      ? "retail-banking"
      : t.includes("futurefit") || t.includes("workforce")
        ? "ai-workforce-development"
        : t.includes("coinley")
          ? "ai-investing"
          : t.includes("live selling") || t.includes("auction")
            ? "live-selling"
            : t.includes("volkswagen") || t.includes("car comp") || t.includes(" vw")
              ? "car-comparison"
              : t.includes("e-commerce") ||
                  (t.includes("complex") && t.includes("integration"))
                ? "ecommerce"
                : t.includes("seller dashboard")
                  ? "product-management"
                  : null)

  // SCRIPTED_TOPICS "project-reveal"
  if (matchSlug) {
    // If asking about the SAME project already being discussed, let Claude API handle it
    if (matchSlug === currentProjectSlug && !preloadedSlug) {
      return { response: null, projectSlug: currentProjectSlug }
    }
    // New project or explicit preloaded slug - show scripted reveal
    const p = allProjects.find((x) => x.slug === matchSlug)
    if (p) return { response: projectStream(p), projectSlug: matchSlug }
  }

  // The case study deck. After the project matchers, per the ruling that the
  // deck and the Meridian project reveal stay separate — the deck does not
  // appear inside the project's chat reveal, and asking about the project
  // does not surface the deck. `projectSlug: null` keeps the two from
  // sharing conversation state.
  // SCRIPTED_TOPICS "deck"
  if (wantsDeck) {
    return {
      response: [
        {
          kind: "text",
          text: `The **${meridianDeck.title}** case study deck — ${meridianDeck.slides.length} slides covering research, the old app, the redesign, testing, and impact.`,
        },
        // Verbatim from lib/sources/voice.md, read by id so check-voice.mjs
        // asserts it against the source.
        ...voiceAnswerById("motusbank").paragraphs.map((text) => ({
          kind: "text" as const,
          text,
        })),
        { kind: "slide-grid", slides: meridianDeck.slides },
        { kind: "doc-link", docKey: "meridian-case-study" },
        {
          kind: "followups",
          // No link to /case-study/meridian-deck here. It was the only path in
          // the app that destroyed thread state — a real navigation remounts
          // the shell — and it is redundant now that the rail's CASE STUDY row
          // opens the same deck as a pane swap.
          text: "Any slide opens full size.",
          chips: rotationFor(SURFACE.deck, 2).map((c) => ({ text: c.label })),
        },
      ],
      projectSlug: null,
    }
  }

  // "Walk me through your work" - overview of all projects.
  // SCRIPTED_TOPICS "walk-through"
  if (
    t.includes("walk me through") ||
    t.includes("show me your work") ||
    t.includes("your projects") ||
    t.includes("portfolio")
  ) {
    return {
      response: [
        {
          kind: "text",
          text: "I'll give you the highlights — seven projects across AI, fintech, e-commerce, and automotive.",
        },
        {
          kind: "text",
          text: "**Most recent:** I'm currently at **FutureFit AI**, designing an AI career coach for job-seekers. Before that, I was at **Complex NTWRK**. I also helped build and release the MVP for **Coinley AI**, a crypto investing platform on the App Store.",
        },
        {
          kind: "text",
          text: "**Fintech:** Led the end-to-end redesign of **Meridian Credit Union's** mobile apps — 370,000+ customers, overwhelmingly positive app store reviews after launch.",
        },
        {
          kind: "text",
          text: "**E-commerce:** At **Complex NTWRK**, I designed their live-selling and auction experience (63% of revenue in year one), plus the seller dashboard and the e-commerce integration post-acquisition (~$100M+ revenue).",
        },
        {
          kind: "text",
          text: "**Automotive:** Built a cross-brand car comparison tool for **Volkswagen** that serves 112,000+ customers across Canada on a monthly basis.",
        },
        {
          kind: "followups",
          text: "Which one catches your interest?",
          chips: PROJECT_HANDOFF_CHIPS,
        },
      ],
      projectSlug: null, // Overview, not a specific project
    }
  }

  // NOTE: there is deliberately no scripted answer for "how do you design
  // with AI" / design-process questions. The previous one asserted a design
  // philosophy with no basis in any source file. Until Edwin writes it in
  // lib/sources/voice.md, these fall through to the API, whose system prompt
  // refuses anything not in the reference document.

  // Resume. SCRIPTED_TOPICS "resume"
  if (t.includes("resume") || t.includes("résumé") || t.includes("cv")) {
    return {
      response: [
        {
          kind: "text",
          text: "My résumé — Complex NTWRK, Super.com, Backbase, Meridian, the contracting years including Volkswagen, and now FutureFit AI.",
        },
        { kind: "doc-link", docKey: "resume" },
        {
          kind: "followups",
          // The card directly above already names the document and offers it.
          // This used to open with "It's here:" and a link to the same place —
          // two controls, one destination, six inches apart — and the link was
          // to DocHub, which is dead. What is left is the part that was doing
          // work: an offer to keep talking.
          text: "Happy to walk through any section in more detail.",
          chips: rotationFor(SURFACE.resume, 2).map((c) => ({ text: c.label })),
        },
      ],
      projectSlug: null,
    }
  }

  // Stakeholder pushback — only the two documented instances. The framing
  // that used to wrap them ("a risk the stakeholder hasn't articulated yet",
  // the closing pattern statement) was invented and has been removed; any
  // generalised philosophy belongs in lib/sources/voice.md first.
  // SCRIPTED_TOPICS "stakeholder"
  if (t.includes("stakeholder") || t.includes("pushback")) {
    return {
      response: [
        {
          kind: "text",
          text: "At **Meridian**, stakeholders wanted to keep the conservative look and feel of the old app. I pushed for two controversial additions: a price-matching feature and animations on positive actions like deposits and bill payments.",
        },
        {
          kind: "text",
          text: 'At **VW**, stakeholders wanted a tool that only compared Volkswagen vehicles against each other. I pushed to include other brands — restricting it to VW-only would have made the tool less useful for potential buyers — but designed the comparison experience to favour and upsell VW throughout.',
        },
        {
          kind: "followups",
          chips: rotationFor(SURFACE.stakeholder, 2, ["stakeholder"]).map((c) => ({
            text: c.label,
          })),
        },
      ],
      projectSlug: null,
    }
  }

  // The former "design systems + AI" answer lived here. It asserted a
  // philosophy that appears in no source file ("Figma-first systems that
  // ship as screenshots let AI-produced UI drift", "engineers ship
  // faster"). Deleted rather than reworded; the sourced answer to this
  // question is the composed design-with-ai entry in voice-answers.ts.

  // Everything Edwin has written about how he works, verbatim from
  // lib/sources/voice.md via the VOICE_ANSWERS table. Placed after the
  // project matchers so a question naming a project still gets the case
  // study, and before the location matcher so its broader triggers don't
  // swallow these. `npm run check:voice` asserts the copy stays verbatim.
  const voice = matchVoiceAnswer(t)
  if (voice) {
    return {
      response: [
        ...voice.paragraphs.map((text) => ({ kind: "text" as const, text })),
        {
          kind: "followups",
          chips: rotationFor(SURFACE.voice, 2, [voice.id]).map((c) => ({
            text: c.label,
          })),
        },
      ],
      projectSlug: null,
    }
  }

  // Outside work. SCRIPTED_TOPICS "downtime"
  // Verbatim from lib/sources/voice.md. Do not paraphrase:
  // this is the only place the site says anything about Edwin personally,
  // and the wording is his.
  if (
    t.includes("downtime") ||
    t.includes("hobb") ||
    t.includes("free time") ||
    t.includes("outside work") ||
    t.includes("outside of work") ||
    t.includes("spare time") ||
    t.includes("for fun") ||
    t.includes("reading") ||
    t.includes("book")
  ) {
    return {
      response: [
        {
          kind: "text",
          text: "In my downtime, I'm usually bouldering or running races, camping and hiking with my ten-year-old Alaskan Malamute. I'm always reading; my recent reads include: Meditations by Marcus Aurelius, The Personal MBA by Josh Kaufman, and How to Win Friends and Influence People by Dale Carnegie.",
        },
        {
          kind: "followups",
          chips: rotationFor(SURFACE.downtime, 2, ["downtime"]).map((c) => ({
            text: c.label,
          })),
        },
      ],
      projectSlug: null,
    }
  }

  // Location. SCRIPTED_TOPICS "location"
  if (t.includes("based") || t.includes("where") || t.includes("location")) {
    return {
      response: [
        {
          kind: "text",
          text: "Toronto, Ontario, Canada.",
        },
      ],
      projectSlug: null,
    }
  }

  // Return null to indicate we should use the real Claude API
  return { response: null, projectSlug: currentProjectSlug || null }
}

export type { MessageBlock }
