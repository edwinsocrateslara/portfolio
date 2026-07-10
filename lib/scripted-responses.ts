import { projects } from "./projects"
import type { DocKey } from "./constants"

type MessageTemplate =
  | { kind: "text"; text: string }
  | {
      kind: "project-header"
      project: {
        slug: string
        client: string
        projectTitle: string
        role: string
        year?: string
        previewImage: string
      }
    }
  | { kind: "image"; image: { url: string; alt?: string }; caption?: string }
  | {
      kind: "image-row"
      images: { url: string; alt?: string }[]
      caption?: string
    }
  | { kind: "impact"; label?: string; items: string[] }
  | {
      kind: "followups"
      text?: string
      chips: { text: string; slug?: string }[]
    }
  | { kind: "doc-link"; docKey: DocKey }

// Build a project stream from project data
function projectStream(p: (typeof projects)[0]): MessageTemplate[] {
  const stream: MessageTemplate[] = [
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
    { kind: "text", text: p.tagline },
  ]

  // Add challenge
  if (p.challenge) {
    stream.push({
      kind: "text",
      text: `**The challenge:** ${p.challenge}`,
    })
  }

  // Add images (first 2-3)
  if (p.images && p.images.length > 0) {
    const imagesToShow = p.images.slice(0, Math.min(3, p.images.length))
    if (imagesToShow.length === 1) {
      stream.push({
        kind: "image",
        image: { url: imagesToShow[0].url, alt: imagesToShow[0].alt },
      })
    } else {
      stream.push({
        kind: "image-row",
        images: imagesToShow.map((img) => ({ url: img.url, alt: img.alt })),
      })
    }
  }

  // Add decision/approach
  if (p.decision) {
    stream.push({
      kind: "text",
      text: `**Key decision:** ${p.decision}`,
    })
  }

  // Add impacts
  if (p.impacts && p.impacts.length > 0) {
    stream.push({
      kind: "impact",
      label: "Impact",
      items: p.impacts,
    })
  }

  // Add follow-ups
  stream.push({
    kind: "followups",
    text: "Want to explore another project or ask something specific?",
    chips: [
      { text: "Walk me through your work" },
      { text: "How do you design with AI?" },
      { text: "Show me your résumé" },
    ],
  })

  return stream
}

// Initial intro sequence - a warm welcome
export const INTRO_SEQUENCE: MessageTemplate[] = [
  {
    kind: "text",
    text: "Hey! I'm Edwin's AI assistant. I can walk you through his work, answer questions about his design process, or show you specific projects.",
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
): { response: MessageTemplate[] | null; projectSlug: string | null } {
  const t = text.toLowerCase()
  const { preloadedSlug, currentProjectSlug } = options || {}

  // Project-specific responses
  const matchSlug =
    preloadedSlug ||
    (t.includes("meridian")
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
          text: "**Most recent:** I'm currently at **FutureFit AI**, designing an AI career coach for job-seekers. Before that, I shipped an AI crypto investing app at **Coinley AI** that's live on the App Store.",
        },
        {
          kind: "text",
          text: "**Fintech:** Led the end-to-end redesign of **Meridian Credit Union's** mobile apps — 370,000+ members, overwhelmingly positive App Store reviews after launch.",
        },
        {
          kind: "text",
          text: "**E-commerce:** At **Complex NTWRK**, I designed their live-selling and auction experience (63% of revenue in year one), plus the seller dashboard and the e-commerce integration post-acquisition (~$100M+ revenue).",
        },
        {
          kind: "text",
          text: "**Automotive:** Built a cross-brand car comparison tool for **Volkswagen** that serves 112,000+ monthly users across Canada.",
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

  // AI design philosophy
  if (
    t.includes("design with ai") ||
    t.includes("ai design") ||
    t.includes("design ai")
  ) {
    return {
      response: [
        {
          kind: "text",
          text: "Short version: AI-first design isn't about hiding the model behind a dashboard. It's about making the AI feel genuinely invested in what the user's trying to do.",
        },
        {
          kind: "text",
          text: "Three moves I reach for —\n\n**1.** Design the AI as a coach or collaborator, not a tool. Chat-first flows let it ask a follow-up instead of forcing the user to interpret a chart.\n\n**2.** Make the AI's reasoning visible at the right fidelity — enough to build trust, not so much that it overwhelms.\n\n**3.** Build a design system AI tools (v0, Lovable, Claude Code) can consume, so prompts produce your design language, not theirs.",
        },
        {
          kind: "followups",
          text: "That's the shape of the work at FutureFit and Coinley AI. Want to see either one?",
          chips: [
            { text: "Show me FutureFit AI", slug: "ai-workforce-development" },
            { text: "Show me Coinley AI", slug: "ai-investing" },
          ],
        },
      ],
      projectSlug: null,
    }
  }

  // Resume
  if (t.includes("resume") || t.includes("résumé") || t.includes("cv")) {
    return {
      response: [
        {
          kind: "text",
          text: "My 2026 résumé is a one-pager — last ~6 years across Complex NTWRK, Meridian, Volkswagen, Coinley AI, and now FutureFit AI.",
        },
        { kind: "doc-link", docKey: "resume" },
        {
          kind: "followups",
          text: "It's here: [Edwin Socrates Lara — Résumé 2026](https://dochub.com/edwinsocrateslara/orO7lgeVLk9z02JKjMP2p5/edwin-socrates-lara-2026-docx)\n\nHappy to walk through any section in more detail.",
          chips: [
            { text: "Walk me through your work" },
            { text: "How do you design with AI?" },
          ],
        },
      ],
      projectSlug: null,
    }
  }

  // Stakeholder pushback
  if (t.includes("stakeholder") || t.includes("pushback")) {
    return {
      response: [
        {
          kind: "text",
          text: 'I try to reframe pushback as "a risk the stakeholder hasn\'t articulated yet."',
        },
        {
          kind: "text",
          text: "At **Meridian**, leadership wanted to preserve the conservative look of the old app — the real fear was alienating existing members. I kept familiar navigation patterns while pushing for things the target demographic actually wanted: price-matching, delightful micro-interactions.",
        },
        {
          kind: "text",
          text: 'At **VW**, the brief said "compare only VW vehicles." I pushed back — that would be less useful than what competitors offered. We landed on cross-brand comparison with VW advantages built into the structure.',
        },
        {
          kind: "followups",
          text: "Pattern: find the risk underneath the objection, then design something that answers both.",
          chips: [
            { text: "Show me the Meridian redesign", slug: "retail-banking" },
            { text: "Show me the VW comparison tool", slug: "car-comparison" },
          ],
        },
      ],
      projectSlug: null,
    }
  }

  // Design systems + AI
  if (t.includes("design system") && t.includes("ai")) {
    return {
      response: [
        {
          kind: "text",
          text: "AI-compatible design systems are where a huge amount of my attention goes right now.",
        },
        {
          kind: "text",
          text: "The short version: generative UI tools (v0, Lovable, Claude Code, Cursor) are only as good as the primitives they can reach for. Figma-first systems that ship as screenshots let AI-produced UI drift — wrong spacing, wrong tokens, invented components.",
        },
        {
          kind: "followups",
          text: "At FutureFit I'm building on Shadcn + design tokens, structured so AI tools compose real components. Prompts produce your design language; engineers ship faster; designers spend time on judgment calls, not shepherding pixel mistakes.",
          chips: [{ text: "Show me FutureFit AI", slug: "ai-workforce-development" }],
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
          text: "Toronto — remote-first across Canadian and US teams. Available for new work now.",
        },
      ],
      projectSlug: null,
    }
  }

  // Return null to indicate we should use the real Claude API
  return { response: null, projectSlug: currentProjectSlug || null }
}

export type { MessageTemplate }
