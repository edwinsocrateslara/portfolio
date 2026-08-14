// Scripted answers drawn from lib/sources/voice.md.
//
// Every `paragraphs` entry below must appear VERBATIM in voice.md,
// character for character, not paraphrased. `npm run check:voice` walks
// this table and fails if any string is missing from the source, so this
// duplication is machine-checked rather than trusted.
//
// Order matters: the first entry whose trigger substring appears in the
// user's lowercased question wins, so narrower topics come before broader
// ones.

export interface VoiceAnswer {
  id: string
  /** Lowercase substrings; matched against the lowercased question. */
  triggers: string[]
  /** Verbatim paragraphs from voice.md, in order. */
  paragraphs: string[]

  // ── Chip routing ────────────────────────────────────────────────────
  // Declared HERE, next to the answer, rather than in a separate list of
  // labels. A second file would drift the moment an answer was added: the
  // build has no way to notice a list that was not updated. `npm run
  // check:chips` walks this table and fails if an entry has neither a chip
  // nor a stated reason for not having one, so adding an answer and
  // forgetting to route it is a build error rather than a dead topic.
  /**
   * The chip label, phrased the way a visitor would ask it. MUST match this
   * entry's own `triggers` when typed, not only when clicked — the gate
   * runs it through the real buildResponse and asserts it lands here.
   */
  chip?: string
  /** Where the chip appears. Front-door entries also need `chipOrder`. */
  placement?: "front-door" | "rotation"
  /** Left-to-right position on the front door. Front-door entries only. */
  chipOrder?: number
  /** Why this answer has no chip. Required when `chip` is absent. */
  noChip?: string
}

export const VOICE_ANSWERS: VoiceAnswer[] = [
  {
    // The deck matcher in scripted-responses.ts intercepts these triggers
    // before matchVoiceAnswer runs, and reads this paragraph by id — so the
    // entry is not dead, it is the single source for that line and the reason
    // check-voice.mjs asserts it against voice.md. The triggers stay here so
    // the answer survives if the deck matcher is ever narrowed.
    id: "motusbank",
    triggers: ["motusbank", "motus bank", "motus"],
    noChip:
      "Surfaced inside the deck response, which the rail's CASE STUDY row opens. A chip would be a third path to the same document.",
    paragraphs: [
      "The deck refers to the product as motusbank, Meridian Credit Union's digital-only bank. I refer to this work as Meridian throughout.",
    ],
  },
  {
    // Composed from three sections, verbatim and in this order: the
    // tradeoffs position leads, then process, then tools. No section
    // answers this on its own, and no connective words are added.
    id: "design-with-ai",
    triggers: ["design with ai", "designing with ai", "ai design", "design ai", "use ai in your"],
    chip: "How do you use AI in your design work?",
    placement: "front-door",
    chipOrder: 4,
    paragraphs: [
      "User research is strongest at the evaluative layer, which of these would you choose, what's unclear, where did this break down. It's weakest at invention. Nobody asks for AI chips in an interface; that comes from understanding the system and what the model can do. With AI especially, the gap between what users can articulate and what's now possible keeps growing.",
      "It usually starts with data. I build integrations into the places feedback already lives (Canny, Clarify) and pull from them directly rather than waiting for a research cycle. From there I move quickly into prototypes, test them remotely with tools like Useberry, and iterate. Once the feedback is in, I make a recommendation on the direction with evidence behind it.",
      "Proficient with Claude Code, Cursor, GitHub, Vercel, Supabase, CloudFront, S3, and git, along with Claude Design and Figma. Most of my work now happens in LLM-based tools: they let me handle discovery, design, and building in one place rather than moving between separate stacks. I still bring my design fundamentals to that work, applying things like spacing systems and layout principles to what I build with them.",
    ],
  },
  {
    // Placed BEFORE the scripted "downtime" branch can see the question:
    // matchVoiceAnswer runs first in buildResponse, and downtime triggers on
    // the bare word "reading". Without this entry, "what are you reading?"
    // returned the Outside-work paragraph — which lists RECENT READS, books
    // already finished. Both answers are true and they are not the same
    // question, so the narrower one has to win.
    id: "currently-reading",
    triggers: [
      "currently reading",
      "reading now",
      "reading lately",
      "reading at the moment",
      "what are you reading",
      "what book",
      "which book",
    ],
    paragraphs: [
      "Right now I'm in the middle of Rock Climbing Technique: The Practical Guide to Movement Mastery by John Kettle, and Simple Numbers, Straight Talk, Big Profits! by Greg Crabtree.",
    ],
    chip: "What are you reading?",
    placement: "rotation",
  },
  {
    id: "proudest",
    triggers: ["most proud", "proudest", "proud of"],
    chip: "What project are you most proud of?",
    placement: "rotation",
    paragraphs: [
      "The work I'm most proud of is the livestream bidding feature I helped ship at NTWRK. At the time, all our videos were prerecorded, people watched, then shopped. The insight was that watch time was the real conversion lever: the longer someone stayed with the content, the more likely they were to buy.",
      "Taking inspiration from Asian livestreaming culture, we introduced live shopping, sellers showcasing products in real time, with viewers bidding on the items they wanted. It gave people a reason to stay, and a reason to act while they were there.",
      "It ended up driving over 63% of NTWRK's revenue.",
    ],
  },
  {
    id: "challenging-project",
    triggers: ["challenging project", "hardest project", "difficult project", "toughest"],
    chip: "What's the most challenging project you've worked on?",
    placement: "rotation",
    paragraphs: [
      "While working on Volkswagen's vehicle comparison tool, leadership set a clear requirement: VW models could only be compared against other VW models. My user research pointed the other way, people cross-shop across brands, and a tool that pretended otherwise would send them elsewhere to do the comparison anyway.",
      "I showed the execs a design that met the underlying goal in a different way. Cross-brand comparison stayed available, but the experience was weighted toward Volkswagen: only VW vehicles carried the rich marketing content, like video, cinematic shots of key features and the first comparison slot came preselected with VW's most popular models, like the Tiguan.",
    ],
  },
  {
    id: "strengths-weaknesses",
    triggers: ["strength", "weakness", "weaknesses"],
    chip: "What are your strengths and weaknesses?",
    placement: "rotation",
    paragraphs: [
      "**Strengths**",
      "My strengths are learning quickly and connecting pieces that don't obviously go together. I'm comfortable starting from an ambiguous direction with no clear brief, scattered data, and turning it into a coherent feature. Part of that is being able to build the tooling I need to understand the problem, and part of it is taste: knowing what \"good\" is once the picture comes together.",
      "**Weakness**",
      "My weakness is exploring beyond the scope. When I'm given a problem, I tend to follow the threads around it, adjacent opportunities, what the system could become, and that exploration can pull me past what the project actually called for. The work usually gets better for it, but it costs time, and I've had to learn to pull it back to the scope we agreed on.",
    ],
  },
  {
    id: "next-role",
    triggers: ["next role", "looking for in", "ideal role", "what kind of role", "new role", "hiring"],
    chip: "What are you looking for in your next role?",
    placement: "front-door",
    chipOrder: 3,
    paragraphs: [
      "High autonomy on a team that's genuinely collaborative, one that ships frequently, tests, and iterates hard on whatever's working. I want big swings in the mix: a few of the highest-urgency, highest-stakes features shipped every year, not a roadmap of small increments.",
      "I also want the freedom to build AI tooling and infrastructure, and to work in the codebase directly, shipping accessibility work and smaller features myself rather than handing everything off. And a culture where a prototype is a legitimate way to propose something new.",
    ],
  },
  {
    id: "five-years",
    triggers: ["five years", "5 years", "long term", "career goal", "see yourself"],
    chip: "Where do you see yourself in five years?",
    placement: "rotation",
    paragraphs: [
      "I want to be building at the edge of what AI tooling makes possible, running experiments, and turning the ones that work into tools others can adopt. Alongside that, teaching: the vibe coding community is growing fast and under-supported, and I'd like to be one of the people making it easier to get good at this.",
    ],
  },
  {
    id: "user-research",
    triggers: ["user research", "usability", "user testing", "validate", "validating", "prototype test"],
    chip: "How do you validate your designs with users?",
    placement: "rotation",
    paragraphs: [
      "I test with real prototypes, currently running them remotely through Useberry to get volume on the feedback. Sometimes not the whole prototype either, a first-click test on one page or one feature answers the question faster. On the quantitative side, I'm pairing Heap with LLMs to get more out of the analytics.",
    ],
  },
  {
    id: "metrics",
    triggers: ["metric", "analytics", "measure success", "measure the success"],
    chip: "How do you measure the success of a design?",
    placement: "rotation",
    paragraphs: [
      "I build out my own integrations across Canny, Clarify, Heap, and similar tools. I've also started wiring Heap and Contentsquare into my prototypes directly, which lets me do journey mapping on a prototype rather than waiting for production data.",
    ],
  },
  {
    id: "engineers",
    triggers: ["handoff", "hand off", "engineer", "feasibility"],
    chip: "How do you hand off work to engineers?",
    placement: "rotation",
    paragraphs: [
      "Handoff depends on the work. Sometimes I ship it myself as a pull request; other times I write a codebase rundown with links to the prototype. We're on a shared design system, so it's less about annotating specs and more about the intent. I walk the team through features in review, and I QA and verify them once they're ready.",
    ],
  },
  {
    id: "pms",
    triggers: ["product manager", "with pms", "pms", "cross-functional", "cross functional"],
    chip: "How do you work with product managers?",
    placement: "rotation",
    paragraphs: [
      "I partner with PMs during the early stages of discovery, by bringing data to the table while defining the problem. In practice that means writing my own scripts in Claude Code to hit the APIs of our internal tools: pulling customer feedback out of Canny, extracting recurring pain points from client conversations in Clarify (our AI meeting tool), and analyzing Heap data with LLMs to discover insights.",
      "I also worked with the customer success and go-to-market teams to stand those integrations up, so market and customer feedback flows into one place and gets distilled with LLM tooling instead of sitting in scattered call notes and support threads.",
      "I meet weekly with my PM, and beyond that I set up the shared infrastructure the team actually uses day to day, including product dashboards that surface roadmap priority and flag quick wins that engineering can pick up, or that I can build and ship myself.",
    ],
  },
  {
    id: "critique",
    triggers: ["critique", "design review", "giving feedback", "receiving feedback"],
    chip: "How do you handle feedback and critique?",
    placement: "rotation",
    paragraphs: [
      "I hold design reviews to get feedback from key stakeholders, and I use LLM tooling to capture and structure what comes out of them. Rather than letting notes scatter, it gives me a way to see patterns across sessions and decide what's actually worth pursuing.",
    ],
  },
  {
    id: "tradeoffs",
    triggers: ["tradeoff", "trade-off", "constraint", "compromise"],
    chip: "How do you handle tradeoffs between user needs and business goals?",
    placement: "rotation",
    paragraphs: [
      "I lead with business goals. Design and user experience only exist inside a business that can fund them, and I'm honest that those things sometimes trade against each other. I advocate for users within that, but for net-new work I lean on internal knowledge, because users can't specify what they've never seen.",
      "User research is strongest at the evaluative layer, which of these would you choose, what's unclear, where did this break down. It's weakest at invention. Nobody asks for AI chips in an interface; that comes from understanding the system and what the model can do. With AI especially, the gap between what users can articulate and what's now possible keeps growing.",
    ],
  },
  {
    id: "deadlines",
    triggers: ["deadline", "workload", "prioriti", "manage your time", "juggle"],
    chip: "How do you prioritise a heavy workload?",
    placement: "rotation",
    paragraphs: [
      "I rank priority collaboratively with PMs and engineering to figure out what's needed first. I weight toward high-impact work and anything with a tight deadline. I track it all in a spreadsheet, revisit the ranking as things shift, and keep everyone current on where things stand.",
    ],
  },
  {
    id: "fundamentals",
    triggers: ["fundamental", "spacing scale", "design principle", "grid system"],
    chip: "What design fundamentals do you work from?",
    placement: "rotation",
    paragraphs: [
      "A 4-point spacing scale, proximity hierarchy, sibling, parent, grandparent, so spacing communicates relationship, and an 80/20 rule for color balance.",
    ],
  },
  {
    id: "inspiration",
    triggers: ["inspiration", "stay current", "keep up with", "who do you follow", "blogs"],
    chip: "Where do you find inspiration?",
    placement: "rotation",
    paragraphs: [
      "I stay current by following leading design and AI voices on LinkedIn, and I use Mobbin to break down how major apps handle their flows, seeing how established products solve a problem before deciding how I want to.",
    ],
  },
  {
    id: "tools",
    triggers: ["what tools", "which tools", "figma", "your stack", "software do you"],
    chip: "What tools do you use?",
    placement: "rotation",
    paragraphs: [
      "Proficient with Claude Code, Cursor, GitHub, Vercel, Supabase, CloudFront, S3, and git, along with Claude Design and Figma. Most of my work now happens in LLM-based tools: they let me handle discovery, design, and building in one place rather than moving between separate stacks. I still bring my design fundamentals to that work, applying things like spacing systems and layout principles to what I build with them.",
    ],
  },
  {
    id: "design-process",
    triggers: ["design process", "your process", "how do you work", "workflow", "approach a project"],
    chip: "What's your design process?",
    placement: "front-door",
    chipOrder: 2,
    paragraphs: [
      "It usually starts with data. I build integrations into the places feedback already lives (Canny, Clarify) and pull from them directly rather than waiting for a research cycle. From there I move quickly into prototypes, test them remotely with tools like Useberry, and iterate. Once the feedback is in, I make a recommendation on the direction with evidence behind it.",
    ],
  },
]

/** Lookup by id, for callers that want one specific answer rather than a match. */
export function voiceAnswerById(id: string): VoiceAnswer {
  const found = VOICE_ANSWERS.find((a) => a.id === id)
  if (!found) throw new Error(`No VOICE_ANSWERS entry with id "${id}"`)
  return found
}

/** First entry whose trigger appears in the lowercased question. */
export function matchVoiceAnswer(lowercased: string): VoiceAnswer | null {
  return (
    VOICE_ANSWERS.find((a) => a.triggers.some((t) => lowercased.includes(t))) ?? null
  )
}
