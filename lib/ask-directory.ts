// The answer to "What can I ask you?", as data.
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────────
//
// 36 voice answers are written. Three were reachable from the front door and
// eight more from the rotation pool; the other 24 said, in their own noChip
// field, "typed-question coverage, not offered." They answered only for a
// visitor who already guessed the words. SideBar had no chip and no rail row:
// you found it by knowing the name.
//
// This is the directory that opens them. It is a list a visitor READS and then
// types, not a wall of buttons — 19 chips would be noise, and the front door
// already carries three.
//
// ── PAIRS, NOT PROSE, AND THAT IS THE WHOLE SAFETY MECHANISM ──────────────
//
// Every entry declares the answer it expects to reach. A list of sentences
// would drift silently the day a trigger changed: the site would be telling
// people to type something it can no longer answer, and nothing would notice.
// Declaring the destination makes the claim checkable, and check:chips asserts
// every pair below still lands where it says — the same rule it already runs
// on chip labels, for the same reason.
//
// That gate has caught this exact class before. Its own header records two
// labels that read as obviously correct and were wrong: "What design tools do
// you use?" fell through to the API because the trigger is `what tools` and
// the word *design* breaks the substring, and "How do you work with PMs and
// engineers?" returned the handoff answer because `engineer` is tested first.
// Neither was visible by reading. One question here was rewritten for exactly
// that reason — see the note at `metrics`.
//
// ── PHRASED AS QUESTIONS, BECAUSE THEY GET TYPED ──────────────────────────
//
// Not topics. A visitor reads a line and types it, so each line has to be the
// thing you would actually say, and it has to match the matcher. Those two
// constraints pull in different directions and the matcher wins — a beautiful
// phrasing that routes nowhere is worse than a plain one that works.

export interface AskEntry {
  /** The line a visitor reads and types. */
  q: string
  /** The answer id it must reach. check:chips asserts this. */
  answerId: string
}

export interface AskGroup {
  heading: string
  questions: AskEntry[]
}

export const ASK_GROUPS: AskGroup[] = [
  {
    heading: "How I work",
    questions: [
      { q: "What's your design process?", answerId: "design-process" },
      { q: "How do you run user research?", answerId: "user-research" },
      // NOT "How do you measure whether a design worked?" — the more natural
      // phrasing, and it routes NOWHERE. The metrics triggers are `metric`,
      // `analytics`, `measure success`, `measure the success`; that wording
      // contains none of them and fell through to the API. This matches
      // `measure success` exactly. Change the question, change the trigger, in
      // the same commit — check:chips rule 3 will insist.
      { q: "How do you measure success?", answerId: "metrics" },
    ],
  },
  {
    heading: "Working with people",
    questions: [
      { q: "How do you work with product managers?", answerId: "pms" },
      { q: "How do you hand off to engineers?", answerId: "engineers" },
      { q: "How do you work with difficult stakeholders?", answerId: "difficult-stakeholders" },
    ],
  },
  {
    heading: "Craft",
    questions: [
      { q: "How do you approach accessibility?", answerId: "accessibility" },
      { q: "How do you think about design systems?", answerId: "design-systems" },
      { q: "What design fundamentals do you work from?", answerId: "fundamentals" },
    ],
  },
  {
    heading: "Me",
    questions: [
      { q: "Why are you leaving your current role?", answerId: "why-leaving" },
      { q: "What does your day to day look like?", answerId: "day-to-day" },
      { q: "What are your strengths and weaknesses?", answerId: "strengths-weaknesses" },
    ],
  },
]

// ── WHAT WAS CUT, AND WHY, SO NOBODY RE-ADDS IT BY ACCIDENT ───────────────
// Nineteen questions were drafted and twelve survive — three per group, which
// is a shape decision rather than a coverage one. All seven cuts still ANSWER;
// they are simply not advertised here, and their noChip reason says so.
//
//   tradeoffs, ambiguous   second-order versions of "design process". A reader
//                          who asks about process gets both inside that answer.
//   critique, conflict     good answers, less often the thing a hiring reader
//                          opens with than difficult stakeholders, which covers
//                          the same ground with the Volkswagen story in it.
//   mentoring              the closest call. It matters for a lead role and it
//                          lost to keeping three per group.
//   salary                 answerable and deliberately names no figure, but a
//                          menu is a strange place to raise it first.
//   years                  a fact the resume states on its own row.
//
// THE LEDE IS ONE LINE AND STAYS ONE LINE. A list of questions explained by a
// paragraph is a paragraph nobody reads twice.
export const ASK_LEDE = "You can ask me about things like:"

/** Every question, flat. For the gate and for anything that needs the set. */
export const ASK_QUESTIONS: AskEntry[] = ASK_GROUPS.flatMap((g) => g.questions)

/**
 * The whole answer, as ONE text block.
 *
 * ── HOW THIS RENDERS, AND WHY IT IS NOT A NEW BLOCK KIND ──────────────────
 *
 * TextBubble already splits on "\n" and emits one <p> per line inside a single
 * <div>, each with `margin-top: var(--space-within)` after the first. So a
 * newline-joined string is ONE bubble with 8px between lines — and 8px is the
 * token defined as "parts of one thing", which is exactly what a list of lines
 * belonging to one answer is. Twelve separate text blocks would be twelve
 * bubbles; this is one.
 *
 * A blank line before each heading yields an empty <p>, which has no height but
 * does carry the 8px margin, so a heading sits ~16px below the line above it
 * and its own questions sit 8px beneath. Group separation and line spacing come
 * out of one mechanism with no CSS.
 *
 * Headings are `**bold**` because renderInline already transforms that into
 * <strong>. A section-heading block would be a SEPARATE bubble, which is the
 * one thing this answer must not be.
 *
 * ⚠ THESE ARE PARAGRAPHS, NOT A LIST, AND A SCREEN READER HEARS THAT. It
 * announces 19 paragraphs and 3 headings rather than "list, 19 items". The
 * visual reading is a list; the semantics are not. A real <ul> needs a new
 * MessageBlock kind and a second render path in TextBubble, which was judged
 * too much machinery for one answer. Recorded here rather than left for
 * somebody to discover: if a list kind is ever added for another reason, this
 * is its first caller.
 */
export function askDirectoryText(): string {
  return [
    ASK_LEDE,
    ...ASK_GROUPS.map(
      (g) => `**${g.heading}**\n${g.questions.map((e) => `- ${e.q}`).join("\n")}`
    ),
  ].join("\n\n")
}
