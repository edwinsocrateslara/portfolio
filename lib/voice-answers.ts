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
//
// ── A TRIGGER'S COST SCALES WITH ITS ANSWER'S LENGTH ─────────────────────
// A loose trigger on a one-paragraph answer is free. A loose trigger on a
// thirteen-paragraph answer is a wall, and it takes the question away from
// the model, which could have answered the part that was actually asked.
//
// The case that produced this rule: `strength` matched "what's one of your
// strengths" and played all 13 blocks of Strengths and weaknesses, opening on
// the weakness. Asked the same question, the model answered with one strength,
// the Volkswagen example behind it, and the 9/10 rating from Core design
// skills — drawing on two sections a single scripted answer cannot combine.
//
// SO: A PARTIAL QUESTION IS THE MODEL'S TO ANSWER. Triggers should match the
// question the answer actually answers, not any sentence the topic appears in.
// "how do you handle pushback" is not "how do you work with difficult
// stakeholders"; "who were the stakeholders on Meridian" is not either.
//
// THE TRADE IS DELIBERATE AND WORTH STATING: a narrowed trigger means a
// partial question gets the model's third-person paraphrase instead of Edwin's
// verbatim words. That is the right trade when the alternative is a wall of
// blocks answering a question nobody asked.
//
// IT DOES NOT APPLY EVERYWHERE. `salary` is deliberately WIDE — it is one
// paragraph, so there is no wall to hit, and it is the most consequential
// sentence on the site: a paraphrase could imply a number the document does
// not contain. `motusbank` is wide for the same reason, being a one-line
// naming clarification. Short answers should be easy to reach.

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
    id: "motusbank",
    triggers: ["motusbank", "motus bank", "motus"],
    noChip: "Surfaced inside the deck response, which the rail's CASE STUDY row already reaches.",
    paragraphs: [
      "The deck refers to the product as motusbank, Meridian Credit Union's digital-only bank. I refer to this work as Meridian throughout.",
    ],
  },
  {
    id: "years",
    triggers: ["how many years", "years of experience", "how long have you been"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "10+ years",
    ],
  },
  {
    id: "disagreement",
    triggers: ["disagree", "disagreed", "disagreement"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "During the redesign of Meridian Credit Union's mobile app, a PM and I disagreed about the navigation. They felt removing the labels would create a cleaner interface, while I believed keeping them would make the navigation easier to understand.",
      "My goal was to make sure we weren't prioritizing visual simplicity at the expense of usability and to find a way to resolve the disagreement based on evidence rather than personal preference.",
      "Rather than debating which direction was better, we tested both versions with users during beta testing, one with navigation labels and one without.",
      "The version with labels was easier for users to navigate. We observed less confusion about which section they were in and how to move between sections, giving us clear evidence for which direction to take.",
      "We kept the labels and moved forward with the direction that performed better in testing.",
      "The redesigned app went on to serve more than 370,000 customers, received overwhelmingly positive App Store reviews within its first month, and the new design was eventually adopted across Meridian's broader ecosystem.",
    ],
  },
  {
    id: "conflict",
    triggers: ["conflict", "tension with", "difficult conversation"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I try to handle conflict or disagreement directly and early. My first step is usually to speak with the person involved, understand their perspective, explain mine, and try to find common ground. Most disagreements can be resolved that way. If we genuinely can't resolve something ourselves, or it's an issue I feel strongly about, I'll ask my manager for perspective before deciding whether it needs to be escalated.",
      "1 example was when someone made changes to my design work without discussing them with me first. I spoke with them directly and explained that my concern wasn't simply that the design had changed—it was that making changes without context could affect work already in flight, introduce inconsistencies, or create confusion for others working from those designs.",
      "They understood my perspective and acknowledged that it should have been handled differently. We resolved it quickly and moved forward.",
      "In general, I approach conflict by trying to understand the other person's perspective, clearly communicating my own, and working together to find a resolution.",
    ],
  },
  {
    id: "ai-tools",
    triggers: ["ai tools", "ai in your workflow", "ai workflow", "use ai in your"],
    chip: "How do you use AI in your workflow?",
    placement: "front-door",
    chipOrder: 3,
    paragraphs: [
      "**Planning and problem solving**",
      "I use AI as a thinking partner when working through ambiguous or complex problems. That might mean breaking down a large product initiative, exploring different approaches, planning a prototype or internal tool, or working through technical constraints and implementation decisions before I start building.",
      "For larger problems, I use goal-driven workflows, task decomposition, and subagents to divide the work into smaller areas, explore problems in parallel, and work toward a defined outcome.",
      "Claude · ChatGPT · Subagents · Goal-Driven Workflows · Task Decomposition",
      "**Context and systems**",
      "I build context systems that give AI the knowledge, constraints, and decision-making frameworks it needs to work effectively. This includes maintaining CLAUDE.md files, custom skills, project instructions, and personas that capture product knowledge, conventions, processes, and previous decisions.",
      "Rather than starting from scratch with every prompt, I treat context as part of the system itself. This makes my AI workflows more consistent, reusable, and reliable over time.",
      "Claude Code · CLAUDE.md · Custom Skills · Context Engineering · Prompt & Persona Engineering",
      "**Building and prototyping**",
      "I use AI extensively to move from ideas to working software. I build prototypes, scripts, internal tools, APIs, integrations, databases, and features directly within existing codebases.",
      "I use Claude Code and Cursor to understand codebases, gather technical context, scope features, debug problems, and work across implementation. I also use hooks and agentic loops to automate parts of the development process and work through multi-step tasks.",
      "This lets me work directly with technologies like TypeScript, React, Next.js, Node, Python, Supabase/PostgreSQL, GraphQL, and REST APIs, while tools like v0 and Lovable help me move quickly from concepts to functional prototypes.",
      "Claude Code · Cursor · Hooks · Agentic Loops · v0 · Lovable · TypeScript · React · Next.js · Node · Python · Supabase/PostgreSQL · REST APIs · GraphQL · Vercel · Git/GitHub",
      "**Analysis and evaluation**",
      "I use AI to synthesize large amounts of company, product, research, and technical information, identify patterns across different sources, interrogate data, and evaluate the products and systems I'm building.",
      "I also use it to challenge assumptions, critique implementations, validate LLM outputs, and identify where an approach might break down. When needed, I combine AI with product analytics, research data, and SQL to investigate behavior and make more informed product decisions.",
      "LLM Output Validation · AI-Assisted Synthesis · SQL · Heap · Hotjar · Contentsquare",
    ],
  },
  {
    id: "design-systems",
    triggers: ["design system", "component library", "design token"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "My approach to design systems is to build from a shared foundation of variables and design tokens, then use those foundations to create reusable atoms, molecules, organisms, and templates. I try to keep the system closely connected to code, so tokens can be exported to CSS and components can be implemented as live, reusable components rather than existing only in Figma.",
      "I'm also comfortable leveraging existing foundations like shadcn/ui rather than building everything from scratch. The goal is to create a system that gives designers and engineers a common language while making it faster to design, build, and maintain consistent experiences as the product scales.",
      "More recently, I've been thinking about how design systems need to evolve for AI-generated interfaces. My current approach is to build more modular, composable UI—almost like a system of Bento-style building blocks—that can be understood and consumed by tools like Lovable, Claude, and other design or code-generation systems. Instead of an LLM generating an entire interface from scratch, it can select and compose contextual pieces from an established system based on what the user needs.",
      "To me, scaling a design system now means more than creating a larger component library. It means establishing the tokens, components, rules, documentation, and context that allow both people and AI systems to reliably assemble new experiences without losing consistency.",
    ],
  },
  {
    id: "motivates",
    triggers: ["motivat", "what drives you"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I'm motivated by finding problems where I can create something that has a strong impact.",
      "I'm drawn to 2 kinds of problems. The first is high-urgency problems, where there's a real cost to not finding a solution quickly, such as finding work or accessing financial support.",
      "The second is overlooked everyday problems: recurring frustrations that people have simply learned to live with. For example, climbers wear climbing shoes barefoot, so odor is a common problem, but there are few solutions designed specifically around that behavior. Something as simple as a foot powder or shoe treatment that fits naturally into their existing routine could solve it.",
      "I like uncovering those kinds of latent needs and building solutions where the value feels obvious once you see it.",
    ],
  },
  {
    id: "background",
    triggers: ["about yourself", "your background", "how did you get into", "career path"],
    chip: "Tell me about your background",
    placement: "front-door",
    chipOrder: 1,
    paragraphs: [
      "My name is Edwin, and my path into product design started somewhat indirectly. I began in advertising, where I found myself drawn to the graphic design side of the program. That interest led me to study graphic design, where I got to explore visual design more deeply. From there, I completed a postgraduate program in interactive design, which introduced me to user experience design and ultimately set me on the path I'm on today.",
      "I got my start professionally at a small web and app design studio before moving into fintech, where I worked on digital products for several major Canadian financial institutions, including Bank of Montreal, Meridian Credit Union, and Toronto-Dominion Bank.",
      "From there, I moved into e-commerce at Super.com, a hotel booking platform that was expanding into fintech with the introduction of its own credit card. I was then recruited by Complex NTWRK, where I worked on the challenge of bringing live shopping and selling experiences to the platform.",
      "Today, I work in AI, designing products focused on workforce development and helping people navigate their careers.",
    ],
  },
  {
    id: "currently-reading",
    triggers: ["currently reading", "reading now", "reading lately", "reading at the moment", "what are you reading", "what book", "which book"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "Right now I'm in the middle of Rock Climbing Technique: The Practical Guide to Movement Mastery by John Kettle, and Simple Numbers, Straight Talk, Big Profits! by Greg Crabtree.",
    ],
  },
  {
    id: "proudest",
    triggers: ["most proud", "proudest", "proud of"],
    chip: "What project are you most proud of?",
    placement: "rotation",
    paragraphs: [
      "At FutureFit AI, customer and staff feedback was coming in faster than the team could realistically review it. Feedback was spread across product boards, internal conversations, and customer calls, which meant decisions about what to build next were often being made without considering most of that context.",
      "I saw an opportunity to create a system that could bring that feedback together and give the team a more consistent, evidence-based way to decide what was worth working on.",
      "I took on the project independently and designed and built it end to end over 14 weeks.",
      "I built an internal tool, the Ideas Dashboard, that brings customer and staff feedback from multiple sources into one place and uses AI to evaluate it against the company's current strategy and technical architecture.",
      "The system produces 2 streams of work each week.",
      "The first is a Top 10, where ideas have to qualify against our strategy before being ranked based on things like strategic fit, urgency, and specificity. This means an idea with 3 votes can outrank one with 30 if it better supports an active company priority.",
      "The second is Quick Wins, smaller opportunities that have a clear solution, are technically bounded, and can deliver value without competing with the Top 10.",
      "I also designed human oversight into the system. The model explains its reasoning, every AI-generated field can be manually overridden, and human decisions remain separate from model output so the team stays in control of what moves forward.",
      "I built the system using Next.js, Supabase, Claude, and API integrations with our feedback and engineering tools. When an idea is accepted, it can become an engineering ticket, the system tracks its status, and once it ships, the original feedback can be closed so the person who requested it hears back.",
      "The tool now works across a corpus of 457 feedback posts, with roughly 300 evaluated during each weekly run and 10 strategic priorities surfaced for review alongside a separate stream of Quick Wins.",
      "More importantly, it introduced a new way for the team to align on what to work on. Instead of prioritization being based on whichever feedback people happened to see or remember, we now have a shared process that connects customer and staff feedback to company strategy, technical feasibility, and opportunities the team can actually act on.",
      "I'm particularly proud of it because I took it from an organizational problem to a working product operations tool myself, bringing together product design, AI, research, systems thinking, and engineering.",
    ],
  },
  {
    id: "challenging-project",
    triggers: ["challenging project", "hardest project", "difficult project", "toughest project"],
    chip: "Tell me about a challenging project.",
    placement: "rotation",
    paragraphs: [
      "While working on Volkswagen's vehicle comparison tool, leadership wanted customers to compare VW models only with other VW vehicles.",
      "However, my research showed that people naturally compare cars across brands. Limiting the tool to Volkswagen would likely push users elsewhere to complete their research.",
      "My challenge was to meet Volkswagen's business goals without compromising how people actually shop for cars.",
      "I proposed keeping cross-brand comparison available while designing the experience to favor Volkswagen.",
      "VW vehicles received richer content, including videos, feature imagery, and more detailed information. I also preselected popular Volkswagen models, such as the Tiguan, in the first comparison slot to make VW the natural starting point.",
      "I presented the approach to leadership as a way to meet the intent behind their requirement without restricting the user experience.",
      "Leadership approved the approach, allowing us to support cross-brand comparison while keeping Volkswagen at the center of the experience.",
      "The result balanced the business need to promote VW vehicles with the user need to make realistic purchasing comparisons.",
    ],
  },
  {
    id: "strengths-weaknesses",
    triggers: ["strengths and weaknesses", "strengths & weaknesses", "weaknesses and strengths", "strengths and weakness"],
    chip: "What are your strengths and weaknesses?",
    placement: "rotation",
    paragraphs: [
      "**Weakness**",
      "One of my weaknesses is exploring beyond the agreed scope. When I see an adjacent opportunity, I naturally want to understand where it could lead, and sometimes I spend more time on that exploration than I should.",
      "While leading the redesign of Meridian Credit Union's mobile app, I saw an opportunity to use financial data and AI to give customers more personalized insights into their spending and financial activity. We were already exploring a vendor that could support this type of data visualization, so I felt the idea was feasible.",
      "My actual responsibility was delivering the broader app redesign, so this wasn't part of the agreed scope.",
      "I explored and visualized the concept alongside the core work and presented it to the team. The idea was well received, but we ultimately didn't have the time or resources to implement it.",
      "I'm now more conscious about separating valuable ideas from what needs to be solved right now. I still explore adjacent opportunities, but I'm much more deliberate about which ones I pursue by considering things like feasibility, effort, and how closely they support the project's goals.",
      "**Strength**",
      "One of my strengths is uncovering latent needs, identifying needs or behaviors that users may not explicitly ask for, but that can meaningfully shape the product.",
      "While working with Volkswagen, I conducted discovery research to understand how people shop for vehicles across the entire car-buying process.",
      "My role was to identify opportunities from that research that could improve the buying experience and help customers move through the purchase journey.",
      "One thing I uncovered was that buying a car often isn't an individual decision. People were sharing vehicle specs and configurations with spouses, partners, friends, and family as part of deciding what to buy.",
      "I used that insight to design a feature that let customers configure a vehicle, choose the specs they wanted to share, and send them through email or a generated PDF.",
      "That insight reframed part of the experience from an individual shopping journey into a shared decision-making process. It's an approach I bring to other projects: looking beyond what users explicitly ask for to uncover needs that can lead to new product opportunities.",
    ],
  },
  {
    id: "core-skills",
    triggers: ["core skills", "core design skills", "rate your", "rate yourself", "skill areas"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I'd say my 3 strongest areas are uncovering latent needs, gathering context and working cross-functionally, and technical execution.",
      "**Uncovering latent needs (9/10)**",
      "One of my biggest strengths is identifying needs or behaviors that users may not explicitly ask for, but that can meaningfully shape the product. I tend to look beyond the immediate task to understand what someone is actually trying to accomplish and find opportunities that might otherwise be overlooked.",
      "**Context gathering and cross-functional collaboration (8/10)**",
      "I'm strong at gathering context from different sources—customer research, product data, stakeholder knowledge, technical constraints, and market patterns—and bringing those perspectives together. I work closely with Product, Engineering, Customer Success, GTM, and leadership to make sure design decisions aren't being made in isolation.",
      "**Technical execution (8/10)**",
      "I've become increasingly technical as a designer. I can work directly in codebases, build prototypes and internal tools, create API integrations, work with databases, and use AI tooling to move from an idea toward a working implementation. It also helps me collaborate with engineers because I can understand more of the technical context and constraints behind what we're building.",
    ],
  },
  {
    id: "next-role",
    triggers: ["next role", "looking for in", "ideal role", "what kind of role", "new role", "hiring"],
    chip: "What are you looking for in your next role?",
    placement: "front-door",
    chipOrder: 2,
    paragraphs: [
      "I want to work on AI-first products and have the freedom to help build the AI workflows, tools, and infrastructure that support how the organization works.",
      "I'm looking for high autonomy within a collaborative team. I'm especially interested in new workflows where I can work directly in the codebase, move ideas from prototype to production quickly, ship frequently, and iterate on what works.",
      "I'm drawn to 2 kinds of problems. The first is high-urgency problems, where there's a real cost to not finding a solution quickly, such as finding work, accessing financial support.",
      "The second is overlooked everyday problems: recurring frustrations that people have simply learned to live with. For example, climbers wear climbing shoes barefoot, so odor is a common problem, but there are few solutions designed specifically around that behavior. Something as simple as a foot powder or shoe treatment that fits naturally into their existing routine could solve it. I like finding those kinds of latent needs, where the value of the solution feels obvious once you see it.",
    ],
  },
  {
    id: "why-leaving",
    triggers: ["why are you leaving", "leaving your", "why leave", "want to leave"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I'm looking for my next challenge in the AI space. In my current role, AI powers and enables parts of the product, but I'm interested in joining a company where AI is more central to the product itself and the problems the team is solving.",
      "I'm also looking to move further into an AI builder role. Over the past few years, I've developed the technical skills to go beyond designing experiences and actually build them, from prototypes and internal tools to working directly in production code.",
      "That's a direction I've become increasingly excited about, and I'm looking for a role where I can combine my background in design with my growing ability to build with AI.",
    ],
  },
  {
    id: "five-years",
    triggers: ["five years", "5 years", "long term", "career goal", "see yourself"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "In 5 years, I hope I'm still learning and pushing myself to understand what's possible with AI. I'm really focused on learning how to harness these tools to create better products and services, and I see that as an ongoing journey.",
      "I'd also love to be teaching and sharing what I've learned, building tools and resources that support the broader community, while helping organizations create products where AI is at the core of the experience.",
    ],
  },
  {
    id: "user-research",
    triggers: ["user research", "usability", "user testing", "validate", "validating", "prototype test"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I increasingly use LLM tooling to scale my research and discovery process. I build API integrations into different data sources, bring the research together as context, and use LLMs to synthesize large amounts of information and surface recurring themes and opportunities.",
      "That context can include existing research and reports, product data, customer and client feedback, ratings and reviews, user interviews, surveys, journey maps, and competitive audits. The methods I use depend on what I'm trying to learn.",
      "From there, I build prototypes, increasingly directly in the codebase, and validate them with users through methods like first-click and task-based testing.",
      "Validation continues after launch. I'll ship to smaller beta groups, gather feedback, and use behavioral data from tools like Heap to understand what's working, what isn't, and where to iterate next.",
    ],
  },
  {
    id: "metrics",
    triggers: ["metric", "analytics", "measure success", "measure the success"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I try to benchmark what success looks like with the team before a feature ships and connect it back to the product or roadmap goal we're trying to move.",
      "Depending on the feature, that might mean engagement, conversion, completion rates, retention, drop-off, or feature usage. I use behavioral data from tools like Heap and Hotjar to establish a baseline and understand current behavior.",
      "After launch, I revisit those metrics to understand what changed and whether the design is moving us toward the intended outcome.",
      "I also look at broader signals when they're relevant, like CSAT scores, App Store ratings, and reviews, to understand whether users perceived an improvement in the overall experience.",
    ],
  },
  {
    id: "engineers",
    triggers: ["handoff", "hand off", "engineer", "feasibility"],
    chip: "How do you hand off work to engineers?",
    placement: "rotation",
    paragraphs: [
      "My process is increasingly code-first. I run the production codebase locally and use Claude Code to understand where a feature lives, trace the existing components and dependencies, and check feasibility while I'm still designing.",
      "That means I can answer questions earlier: What already exists? What would need to change? What are the technical constraints? How much of this can I prototype myself? I use that context to scope the feature before investing heavily in a design direction, then work with engineering on anything that needs deeper technical input.",
      "I also build prototypes directly in the codebase. Instead of handing over static designs, I can push a PR with a working implementation that engineers can review, refine, or build from. For contained work, I can take it all the way through by myself, for example, I've shipped WCAG improvements with Cypress test coverage directly into production.",
      "Design, feasibility, prototyping, and implementation happen much closer together, with engineering involved throughout the process.",
    ],
  },
  {
    id: "pms",
    triggers: ["product manager", "with pms", "pms", "cross-functional", "cross functional"],
    chip: "How do you work with product managers?",
    placement: "rotation",
    paragraphs: [
      "At FutureFit AI, customer and product insights were spread across different tools and teams. Feedback lived in Canny, client conversations in Clarify, and behavioral data in Heap, which made it difficult for Product and Design to see the full picture when defining problems and priorities.",
      "I wanted to make our collaboration more evidence-driven by giving Product, Design, Customer Success, and GTM a shared view of what users and customers were telling us.",
      "I partnered with my PM during discovery and worked with Customer Success and GTM to understand where their feedback lived.",
      "Using Claude Code, I wrote scripts to connect to our internal tools through their APIs, pulling feedback from Canny, recurring themes from Clarify conversations, and behavioral data from Heap. I then used LLMs to help analyze and surface patterns across that data.",
      "I also created shared product dashboards that made priorities and opportunities visible to the wider team. I meet weekly with my PM to review the work, align on priorities, and identify quick wins that engineering or I can ship.",
      "Instead of customer and product insights sitting across separate tools and conversations, the team has a more centralized way to use that evidence during discovery and prioritization.",
      "It has also made collaboration more continuous: PM, Design, GTM, Customer Success, and Engineering can work from the same signals when deciding what to explore or build next.",
    ],
  },
  {
    id: "critique",
    triggers: ["critique", "design review", "giving feedback", "receiving feedback"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I try to make feedback a continuous part of the design process rather than waiting.",
      "I proactively share work in progress through meeting reviews and async reviews. I gather input from Product, Engineering, leadership, and other stakeholders, then synthesize and prioritize. I also use LLM tooling to capture and structure feedback from review sessions. As the design evolves, I document key decisions and changes so the team understands what changed between iterations and why.",
      "When giving feedback, I try to ground it in evidence rather than personal preference. I'll look for supporting data from customer research, product feedback, Heap, or an audit of comparable products. When data isn't available, I'll draw on my experience with UX and product principles and explain the reasoning behind my recommendation.",
    ],
  },
  {
    id: "communicate",
    triggers: ["defend", "present a design", "presenting a design", "communicate a design"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I proactively share work in progress through meeting reviews and async reviews. I gather input from Product, Engineering, leadership, and other stakeholders, then synthesize and prioritize it. As the design evolves, I document key decisions and changes so the team understands what changed between iterations and why.",
      "When presenting or defending a design decision, I try to ground it in evidence rather than personal preference. I'll look for supporting data from customer research, product feedback, Heap, or an audit of comparable products. When data isn't available, I'll draw on my experience with UX and product principles and explain the reasoning behind my recommendation.",
    ],
  },
  {
    id: "tradeoffs",
    triggers: ["tradeoff", "trade-off", "competing priorities", "user needs and business"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I prioritize around the primary user and business goal, then use research and data to decide what deserves focus and what can be reduced, moved, or removed.",
      "While leading the design of Complex NTWRK's live auction experience, we had to fit product information, bidding, and a timer into a very limited mobile interface. The goal was to increase engagement, watch time, and sales.",
      "I needed to determine what information and actions were critical during a fast-moving auction and create a hierarchy that made it easy for people to understand the product and bid quickly.",
      "I prioritized every element against those goals. Research showed that product details, especially size, were critical, so they stayed prominent alongside price and the countdown. Bidding was the primary action, so I placed it within easy thumb reach and optimized it for speed.",
      "Lower-priority actions were moved to less prominent areas or outside the core auction interface. I used user testing and existing data to support these trade-offs with stakeholders.",
      "Within the first year, auctions accounted for 63% of platform revenue and grew 23% quarter over quarter. More than 2,269 auction shows were held, featuring 59,000+ items.",
      "The experience also increased chat messages per show by 172% and average watch time by 5 minutes, directly improving the engagement metrics we had prioritized the interface around.",
    ],
  },
  {
    id: "difficult-stakeholders",
    triggers: ["difficult stakeholder", "difficult client", "handle stakeholders", "stakeholder pushback", "pushback on a design"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "My general approach is to find middle ground. I try to understand what the stakeholder is ultimately trying to achieve, and find an approach that addresses their concerns without compromising what I believe is best for the product.",
      "While redesigning Volkswagen's digital shopping experience, one of our goals was to improve the journey and help move customers toward next steps like Build & Price and Find a Dealer.",
      "As part of that work, I was designing a vehicle comparison tool. Volkswagen leadership initially wanted customers to compare VW models only with other VW vehicles.",
      "My research showed that people naturally compare vehicles across brands when shopping for a car. Restricting the tool to Volkswagen would make it less useful and potentially force customers to leave the experience to complete their research elsewhere.",
      "My challenge was to find a middle ground that addressed Volkswagen's concerns while creating a comparison tool that supported the broader goal of helping customers move forward in their buying journey.",
      "I proposed allowing cross-brand comparisons while giving Volkswagen vehicles a stronger presence within the experience.",
      "VW vehicles received richer content, including feature videos, imagery, and more detailed information. I also preselected popular Volkswagen models, such as the Tiguan, in the first comparison slot, making Volkswagen the natural starting point without restricting customers from comparing competitors.",
      "I used designs to show leadership how cross-brand comparison could become an upsell opportunity for Volkswagen, rather than a compromise.",
      "Volkswagen was extremely happy with the final direction and approved the cross-brand comparison approach.",
      "We were able to preserve how customers naturally shop for vehicles while still keeping Volkswagen prominent and supporting the broader buying journey. Since launch, the tool has served more than 112,000 customers across Canada each month.",
    ],
  },
  {
    id: "deadlines",
    triggers: ["deadline", "workload", "prioriti", "manage your time", "juggle"],
    chip: "How do you prioritise a heavy workload?",
    placement: "rotation",
    paragraphs: [
      "I handle tight deadlines by making priorities and trade-offs clear early.",
      "I work with Product and Engineering to rank projects based on what needs to happen first, then use a flexible sizing system to estimate the design effort: Low is up to 5 days, Medium is 5–10 days, High is 2–4 weeks, and Very High is 4+ weeks. Those ranges can adapt depending on the team's cadence and the complexity of the work.",
      "I track active and future projects in a shared spreadsheet, including priority, estimated effort, deadlines, quarter, and the OKRs they support. As priorities change, I revisit the ranking rather than treating the roadmap as fixed.",
      "I also proactively share progress and changes, so Product, Engineering, and other stakeholders know what's in progress, what's coming next, and where timelines or priorities have shifted.",
    ],
  },
  {
    id: "ambiguous",
    triggers: ["ambiguous problem", "ambiguous or open", "open-ended problem", "not well defined", "vague brief", "approach ambiguity"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I use my discover, define, validate, and deliver framework to bring structure to ambiguous problems.",
      "**Discover**",
      "Discover starts with finding the right context. I identify who has relevant knowledge, where the information lives, and what evidence can help us understand the problem.",
      "**Define**",
      "Define is about using that context to identify the insights that matter and narrow the problem into a direction we can explore.",
      "**Validate**",
      "Validate is where I test that direction with users and gather evidence to build confidence in the decisions we're making.",
      "**Deliver**",
      "Deliver is about aligning the team around the direction, getting buy-in, and moving it into the product.",
      "I use the framework to progressively reduce uncertainty, build confidence, and gain buy-in around a direction.",
    ],
  },
  {
    id: "fundamentals",
    triggers: ["fundamental", "spacing scale", "design principle", "grid system"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "**Modular UI**",
      "More recently, I've been thinking about interfaces as modular systems rather than fixed pages. Bento-style components can be composed and rearranged based on context, which becomes especially interesting with LLMs that can determine which components are most relevant and render the experience dynamically.",
      "**Designing for the next action**",
      "I try to anticipate where someone is likely to go after completing a task. Rather than creating dead ends, I look for ways to make the experience feel continuous and naturally guide people toward what they might want to do next.",
      "**4-point grid systems**",
      "I like using a system where spacing, sizing, and other measurements follow multiples of 4. It creates consistency across the UI and makes components easier to scale and maintain.",
    ],
  },
  {
    id: "accessibility",
    triggers: ["accessib", "a11y", "wcag", "inclusive design"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I treat accessibility as something that needs to be considered throughout the entire design and development process, not just at the beginning or as a final check.",
      "I follow WCAG standards and build accessibility requirements into the design system so they're applied consistently across the product. I consider things like color contrast, keyboard navigation, focus states, target sizes, semantic structure, and ARIA labels as I design and test the UI.",
      "Increasingly, I'm also implementing accessibility improvements myself. I've shipped ARIA and other accessibility improvements directly into the production codebase, which allows me to identify issues, fix them, and validate the implementation.",
    ],
  },
  {
    id: "mentoring",
    triggers: ["mentor", "grow other", "junior designer", "coach"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I mentor other designers by first understanding where they need support and what they want to develop, then giving them guidance and resources specific to those areas.",
      "I also try to give them opportunities to grow by delegating work they're interested in, as well as work slightly outside their comfort zone—like running their first user test. I stay available for questions and check in on their progress without taking ownership of the work away from them.",
      "For example, I managed a designer who was struggling with visual fidelity. I gave them targeted resources, including Erik Kennedy's Learn UI Design, and created a cheat sheet of design principles they could reference in their day-to-day work. I checked in regularly, reviewed their work with them, and adjusted my guidance as they improved.",
      "My approach is really about understanding what someone needs, giving them the right support, and creating opportunities for them to build those skills through real work.",
    ],
  },
  {
    id: "product-admired",
    triggers: ["admire", "product you like", "app you like", "favourite product", "favorite product"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "A product I really admire is Terminal on Mac. I love how raw and simple it is. There's very little interface and no prescribed way of using it—it gives you direct access to your computer and, if you know how to use it, the flexibility to build almost anything.",
      "If I were improving it, I'd focus on how Terminal could evolve for AI-assisted and agentic development without losing that simplicity.",
      "I'd make it easier to run and monitor multiple terminals at once, with flexible layouts and better notifications when an agent finishes a task, needs input, or runs into a problem. I'd also explore ways to visualize what's happening behind the scenes—active agents, tasks, dependencies, system architecture, and how different parts of a codebase connect.",
    ],
  },
  {
    id: "inspiration",
    triggers: ["inspiration", "stay current", "keep up with", "who do you follow", "blogs"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I stay current by following leading design and AI voices on LinkedIn and regularly audit frontier AI products and models to understand how interaction patterns are evolving, which conventions are starting to emerge, and where there are still opportunities to do something differently.",
      "I use Mobbin to study patterns and flows across major AI products, and increasingly use the Mobbin MCP to quickly find and compare a larger number of examples.",
    ],
  },
  {
    id: "day-to-day",
    triggers: ["day to day", "day-to-day", "typical day", "your day like", "your day look"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "My day-to-day work is a mix of design, research, collaboration, and increasingly technical work.",
      "I meet with Product, Engineering, Customer Success, and other stakeholders to gather context, share work, and stay aligned on what we're building.",
      "I maintain internal tools I've built for the team and write scripts and REST API integrations to bring together customer and product data that can inform our decisions. For example, I'll analyze the language customers use so we can reflect that language back in the product experience.",
      "I also design and prototype features, pick up tickets I can implement directly in the codebase, and test the UI to make sure what we ship works as intended.",
    ],
  },
  {
    id: "salary",
    triggers: ["salary", "compensation", "notice period", "how much notice", "start date", "when can you start", "availability", "are you available", "when are you available", "currently available", "day rate", "your rate", "hourly rate", "pay expectations", "pay range", "what do you charge"],
    noChip: "typed-question coverage, not offered.",
    paragraphs: [
      "I'm available to start immediately. My salary expectations are flexible and depend on the overall opportunity, including the scope of the role, nature of the work, location, equity, benefits, and total compensation package.",
    ],
  },
  {
    id: "tools",
    triggers: ["what tools", "which tools", "your stack", "software do you"],
    chip: "What tools do you use?",
    placement: "rotation",
    paragraphs: [
      "AI tools are a big part of my workflow. I use Claude Code, Codex, Claude Design, Cursor, v0, Lovable, the Claude API, OpenAI API, and Vercel AI SDK.",
      "For building and shipping, I use TypeScript, React, Next.js, Node, Python, Supabase/PostgreSQL, Vercel, Vite, Tailwind, Git, GitHub, shadcn/ui, and S3.",
      "For integrations, I've built custom API connections with Canny, Jira, Clarify, and Slack, working with REST APIs and GraphQL.",
      "For design, I use Figma, Storybook, Miro, Lottie Lab, and Jitter.",
      "For research and analytics, I use Heap, Hotjar, Contentsquare, Maze, UserTesting, Useberry, SQL.",
      "For accessibility, I work with WCAG 2.2 AA, axe.",
      "The exact tool depends on the problem, but increasingly my workflow moves between AI, design, research, and production code rather than treating them as separate parts of the process.",
    ],
  },
  {
    id: "design-process",
    triggers: ["design process", "your process", "how do you work", "workflow", "approach a project"],
    chip: "What's your design process?",
    placement: "rotation",
    paragraphs: [
      "I work in 4 loose stages: discover, define, validate, and deliver. The AI coach work I did at FutureFit AI shows this process at a smaller scale, but it can adapt depending on the project.",
      "FutureFit AI helps people find jobs, training programs, and new career paths. We were adding our AI coach, Miles, to 3 areas of the product: the homepage, job details, and career details.",
      "The challenge was deciding which suggested prompts would be most useful across 3 different user types: active job seekers, career changers, and people just starting their careers.",
      "My role was to determine which AI prompts should appear on each page, how they should be worded, and validate that people would actually use them.",
      "**Discover**",
      "Our sales and support teams were already collecting customer feedback, but it wasn't searchable. I built API integrations with Clarify and Canny and pulled 690 records.",
      "I grouped the feedback by where it was most relevant: evaluating a job went to job details, exploring a career went to career details, and broader questions like \"What should I do next?\" went to the homepage.",
      "I then identified the most common needs to use as the starting point for the prompts.",
      "**Define**",
      "I turned those needs into prompt candidates for each page.",
      "I analyzed 153 real conversations with Miles to understand how people naturally asked these questions and used that language to refine the wording.",
      "I also used the Mobbin MCP to research how other products design and present suggested prompts.",
      "From there, I narrowed the options and built prototypes directly in the production codebase.",
      "**Validate**",
      "I tested the prototypes with 38 participants across our 3 user types.",
      "On the homepage, job details, and career details, I measured which AI chips people clicked first and which they said they'd be most likely to use.",
      "**Deliver**",
      "I reviewed the results with the team and removed options that were already covered elsewhere in the product.",
      "I presented the final direction to the exec and development teams, then shipped the AI chips and prompts directly into the codebase.",
      "The research shaped the final prompts and also uncovered broader product insights. It also revealed gaps in the existing experience, giving us opportunities to improve other parts of the product.",
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
