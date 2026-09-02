import { projects } from "./projects"
import { vibeProjects } from "./vibe-projects"
import { buildProjectBodyBlocks } from "./project-flow"
import { matchVoiceAnswer, voiceAnswerById } from "./voice-answers"
import { asksLocation } from "./location-intent"
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


export const SCRIPTED_TOPICS: ScriptedTopic[] = [
  {
    // RETIRED as a scripted answer; the id stays only in this note. It held two
    // inline paragraphs — a Meridian one and a Volkswagen one — that were never
    // in voice.md and so were never checked against anything. The triggers
    // `stakeholder` and `pushback` now belong to the difficult-stakeholders
    // VOICE_ANSWERS entry, which tells the Volkswagen story in Edwin's own
    // words and IS checked. It sat above matchVoiceAnswer in the chain, so
    // while it existed no voice answer could ever claim those words.
    id: "downtime",
    noChip:
      "typed-question coverage, not offered. The About page carries this, and a chip asking after someone's hobbies is not what the front door is for.",
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
  // THE WALK-THROUGH ANSWER IS GONE, and so are the three project chips it
  // ended with — "Tell me about FutureFit AI", "Show me the Meridian
  // redesign", "How did the live selling work?". They were defined once and
  // emitted from one place, this branch, so they left with it.
  //
  // The reason was already written down, on project-reveal's noChip note,
  // before there were chips to apply it to: "Seven rail rows and three sampler
  // cards already point at the projects. A chip naming one duplicates the rail
  // and spends a slot the chat could use on something only the chat answers."
  // The walk-through answer was a fourth copy of that navigation, and the
  // first thing a visitor was offered.
  //
  // "walk me through", "show me your work", "your projects" and "portfolio"
  // now fall to the model, which answers them from the generated Projects
  // section — seven projects with their figures, where this covered four in
  // prose. Verified against the live endpoint before removing this.
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
  // The stakeholder/pushback branch that stood here is gone. See the note in
  // SCRIPTED_TOPICS: those triggers now reach difficult-stakeholders in
  // VOICE_ANSWERS, which is Edwin's wording and is checked against voice.md.
  // A scripted branch above matchVoiceAnswer would still intercept them.
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
  // Verbatim from lib/sources/voice.md, INLINE. Do not paraphrase: this is the
  // only place the site says anything about Edwin personally, and the wording
  // is his. check-voice.mjs asserts the literal below against the source — the
  // word INLINE is what tells it this is a pasted string rather than one read
  // through voiceAnswerById, which the deck answer above uses instead.
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
          text: "In my downtime, I'm usually bouldering or running races, camping and hiking with my ten-year-old Alaskan Malamute.",
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
  //
  // PHRASES, NOT THE WORD "where". This is the last branch before the API
  // fallback, so a bare t.includes("where") claimed every un-triggered
  // question containing it: "Where did you study?" answered "Toronto,
  // Ontario, Canada."
  //
  // The ordering above is what kept that from being worse and is deliberately
  // untouched — matchVoiceAnswer runs first, so the shipped chip "Where do you
  // see yourself in five years?" resolves on its own triggers and never
  // reaches here. This narrows the branch; it does not move it.
  //
  // "based" is likewise a phrase now: "Which projects were based on research?"
  // is not a question about where anyone lives.
  if (asksLocation(t)) {
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
