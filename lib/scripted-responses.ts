import { projects } from "./projects"
import { buildProjectBodyBlocks } from "./project-flow"
import { matchVoiceAnswer, voiceAnswerById } from "./voice-answers"
import { meridianDeck } from "./case-study-deck"
import type { MessageBlock } from "@/hooks/use-scripted-stream"

// The chat reveal: header, the shared body, then follow-up chips. The order
// of the body lives in lib/project-flow.ts and is shared with the standalone
// /case-study route so the two cannot drift.
function projectStream(p: (typeof projects)[0]): MessageBlock[] {
  return [
    {
      kind: "project-header",
      project: {
        slug: p.slug,
        client: p.client,
        projectTitle: p.projectTitle,
        role: p.role,
        previewImage: p.previewImage.url,
      },
    },
    ...buildProjectBodyBlocks(p),
    {
      kind: "followups",
      text: "Want to explore another project or ask something specific?",
      chips: [
        { text: "Walk me through your work" },
        { text: "How do you design with AI?" },
        { text: "Show me your résumé" },
      ],
    },
  ]
}

// Initial intro sequence - a warm welcome
export const INTRO_SEQUENCE: MessageBlock[] = [
  {
    kind: "text",
    text: "Hey! I'm Edwin's AI assistant. I can walk you through his work, show you specific projects, or pull up his résumé.",
  },
  {
    kind: "text",
    text: "Edwin is a product designer focused on **AI products and workflows** — lately building AI coaches, conversational agents, and design systems that work with tools like Claude Code and v0.",
  },
  {
    kind: "followups",
    text: "Where would you like to start?",
    chips: [
      { text: "Walk me through your work" },
      { text: "How do you design with AI?" },
      { text: "Show me your résumé" },
    ],
  },
]

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

  if (matchSlug) {
    // If asking about the SAME project already being discussed, let Claude API handle it
    if (matchSlug === currentProjectSlug && !preloadedSlug) {
      return { response: null, projectSlug: currentProjectSlug }
    }
    // New project or explicit preloaded slug - show scripted reveal
    const p = projects.find((x) => x.slug === matchSlug)
    if (p) return { response: projectStream(p), projectSlug: matchSlug }
  }

  // The case study deck. After the project matchers, per the ruling that the
  // deck and the Meridian project reveal stay separate — the deck does not
  // appear inside the project's chat reveal, and asking about the project
  // does not surface the deck. `projectSlug: null` keeps the two from
  // sharing conversation state.
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
          chips: [
            { text: "Show me the Meridian redesign", slug: "retail-banking" },
            { text: "Walk me through your work" },
          ],
        },
      ],
      projectSlug: null,
    }
  }

  // "Walk me through your work" - overview of all projects
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
          chips: [
            { text: "Tell me about FutureFit AI", slug: "ai-workforce-development" },
            { text: "Show me the Meridian redesign", slug: "retail-banking" },
            { text: "How did the live-selling work?", slug: "live-selling" },
          ],
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

  // Resume
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
          text: "It's here: [Edwin Socrates Lara — Résumé](https://dochub.com/edwinsocrateslara/orO7lgeVLk9z02JKjMP2p5/edwin-socrates-lara-2026-docx)\n\nHappy to walk through any section in more detail.",
          chips: [
            { text: "Walk me through your work" },
            { text: "How do you design with AI?" },
          ],
        },
      ],
      projectSlug: null,
    }
  }

  // Stakeholder pushback — only the two documented instances. The framing
  // that used to wrap them ("a risk the stakeholder hasn't articulated yet",
  // the closing pattern statement) was invented and has been removed; any
  // generalised philosophy belongs in lib/sources/voice.md first.
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
          chips: [
            { text: "Show me the Meridian redesign", slug: "retail-banking" },
            { text: "Show me the VW comparison tool", slug: "car-comparison" },
          ],
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
          chips: [
            { text: "Walk me through your work" },
            { text: "Show me your résumé" },
          ],
        },
      ],
      projectSlug: null,
    }
  }

  // Outside work — verbatim from lib/sources/voice.md. Do not paraphrase:
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
          text: "In my downtime, I like to stay active by running races, camping or hiking with my ten-year-old Alaskan Malamute. I'm always reading; my recent reads include: Meditations by Marcus Aurelius, The Personal MBA by Josh Kaufman, and How to Win Friends and Influence People by Dale Carnegie.",
        },
        {
          kind: "followups",
          chips: [
            { text: "Walk me through your work" },
            { text: "Show me your résumé" },
          ],
        },
      ],
      projectSlug: null,
    }
  }

  // Location
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
