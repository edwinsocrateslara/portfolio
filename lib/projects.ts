export interface ProjectImage {
  url: string
  alt: string
}

export interface ProofLinks {
  demo?: string
  repo?: string
  video?: string
}

export interface Project {
  slug: string
  client: string
  projectTitle: string
  tagline: string
  role: string
  status: "live" | "wip"
  tags: string[]
  previewImage: ProjectImage
  images: ProjectImage[]

  // "traditional" (design-process case study) is the default when omitted.
  // "vibe-coded" case studies use the fields below instead of
  // challenge/impacts/roleDescription/atStake/decision.
  variant?: "traditional" | "vibe-coded"

  // Traditional case-study fields
  challenge?: string
  impacts?: string[]
  roleDescription?: string
  atStake?: string
  decision?: string

  // Vibe-coded case-study fields
  whatItIs?: string
  problem?: string
  architecture?: string
  stack?: string[]
  keyDecision?: string
  tradeoff?: string
  whatsNext?: string
  proofLinks?: ProofLinks
}

export const projects: Project[] = [
  {
    slug: "ai-workforce-development",
    client: "FutureFit AI",
    projectTitle: "AI Workforce Development Platform",
    tagline:
      "Building a B2B and B2G AI-powered workforce development platform with an AI coach that helps users navigate job search and career development.",
    role: "Lead Product Designer",
    status: "wip",
    tags: ["AI", "design systems", "workforce", "B2B"],
    previewImage: {
      url: "https://framerusercontent.com/images/oYR8CP8kVduq6F5uyfOKbfqNM.png",
      alt: "FutureFit AI platform preview",
    },
    images: [
      {
        url: "https://framerusercontent.com/images/1LIXcNkshk927udC5loCF9CgQ.png",
        alt: "FutureFit AI interface",
      },
      {
        url: "https://framerusercontent.com/images/gFk0tf92bDnitqHsUHdRpSGx0D4.png",
        alt: "FutureFit AI design details",
      },
    ],
    challenge:
      "Job-seekers, career-changers, and fresh graduates face overwhelming and fragmented career support. Existing tools are passive — they don't coach, follow up, or adapt to individual users. The platform needed to make AI feel like a real career ally, not just another tool.",
    impacts: ["Work in progress — case study coming soon."],
    roleDescription:
      "Conducting user research to uncover the specific pain points of new job-seekers, career-changers, and recent graduates. Designing the AI coach experience and deploying it to clients. Building an AI-compatible design system using design tokens and Shadcn for use in tools like v0, Lovable, and Claude Code.",
    atStake:
      "If the AI coach feels generic or robotic, users won't trust it with something as high-stakes as their job search. The design had to make the AI feel genuinely invested in the user's success.",
    decision:
      "Designing the AI as a conversational coach — not a dashboard or checklist tool — so that guidance feels personal and responsive rather than automated.",
  },
  {
    slug: "retail-banking",
    client: "Meridian Credit Union",
    projectTitle: "Mobile Banking Redesign",
    tagline:
      "End-to-end redesign of the Meridian Credit Union mobile apps, serving 370,000+ members and supporting $26B+ in managed assets.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["mobile", "fintech", "redesign", "design systems"],
    previewImage: {
      url: "https://framerusercontent.com/images/mhEG6U9Z8HY3ZQ4WVBA4xUdG4.png",
      alt: "Meridian mobile app redesign preview",
    },
    images: [
      {
        url: "https://framerusercontent.com/images/YecS0VRFYPpdSQ2wqURpQYkJM.jpg",
        alt: "Meridian app screens",
      },
      {
        url: "https://framerusercontent.com/images/i5PtoaEcvLycHUYHql4mLsvLaMU.jpg",
        alt: "Meridian design system components",
      },
      {
        url: "https://framerusercontent.com/images/QCOP7oFpLRKH3itSc2K6qqwYfIA.jpg",
        alt: "Meridian app feature screens",
      },
      {
        url: "https://framerusercontent.com/images/z8hHU9MYLNv4kSSXQhjE1Ee4cE.jpg",
        alt: "Meridian animated transaction states",
      },
      {
        url: "https://framerusercontent.com/images/mymAT7v0S22d7npoKsJ8WVCNdqo.jpg",
        alt: "Meridian price-matching feature",
      },
    ],
    challenge:
      "App Store reviews were damaging. Users cited poor UX, a dated UI, and missing key features — specifically investing and borrowing/credit cards. Without a major redesign, Meridian risked losing members to digital-first competitors who offered a more modern experience.",
    impacts: [
      "Within the first month of launch, the redesigned app received overwhelming positive user reviews in the App Store.",
      "Meridian Credit Union adopted the new design across its entire ecosystem.",
    ],
    roleDescription:
      "Lead product designer. Created a new design system and pushed for two additions that stakeholders initially resisted: a price-matching feature and animations on positive actions like deposits and bill payments.",
    atStake:
      "Stakeholders wanted to preserve the conservative look and feel of the old app. The risk was a redesign that felt safe internally but failed to resonate with the target demographic — younger, price-conscious members who had modern fintech alternatives.",
    decision:
      "Price-matching gave users a tangible money-saving tool and a reason to engage beyond basic transactions. Animations on positive financial actions (deposits, bill payments) created moments of delight that match what the target demographic expects from apps like Cash App and Robinhood. Both decisions were about making the app feel worth using — not just functional.",
  },
  {
    slug: "ai-investing",
    client: "Coinley AI",
    projectTitle: "AI Crypto Investing App",
    tagline:
      "Designed and shipped the MVP for a conversational AI crypto investing platform, available on the App Store.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["AI", "mobile", "fintech", "MVP", "crypto"],
    previewImage: {
      url: "https://framerusercontent.com/images/U41M5uD5R3UnCrJjmw2lGN9sdM.png",
      alt: "Coinley AI app preview",
    },
    images: [
      {
        url: "https://framerusercontent.com/images/Q7XxfF6VboWSsqsuR4bZ3F8drfY.png",
        alt: "Coinley AI chat interface",
      },
      {
        url: "https://framerusercontent.com/images/jOsgkBzoP4BwDlrfP011Fe9YTmM.png",
        alt: "Coinley AI investment screens",
      },
      {
        url: "https://framerusercontent.com/images/qkzbZaXCQFF87pQmjIfdW1g6wA.png",
        alt: "Coinley AI portfolio view",
      },
      {
        url: "https://framerusercontent.com/images/8vqodEjPL12T54sZP7Z4QAVM.png",
        alt: "Coinley AI market data view",
      },
    ],
    challenge:
      "Traditional investing platforms overwhelm beginners with complex interfaces. First-time crypto investors have to learn blockchain concepts, candlestick charts, data interpretation, and portfolio management all at once. The interface itself becomes a barrier.",
    impacts: [
      "Shipped and live on the App Store as a fully functional MVP.",
      "Integrated Firebase for backend and CoinMarketCap API for real-time cryptocurrency data.",
    ],
    roleDescription:
      "Lead Product Designer. Designed a chat-based interface where an AI agent guides users through investment decisions. Collaborated closely with the developer to evaluate and select the technical backend — Firebase for infrastructure and CoinMarketCap API for real-time data.",
    atStake:
      "A standard crypto app wouldn't differentiate Coinley in the beginner market. But introducing AI for investment advice carried real trust risk — if users don't trust the AI, they won't act on its guidance, especially with financial decisions.",
    decision:
      "Designed the AI as a conversational agent rather than a dashboard tool. The goal was to make investing feel like getting advice from a knowledgeable friend — something that builds trust incrementally through conversation rather than asking users to interpret charts immediately.",
  },
  {
    slug: "live-selling",
    client: "Complex NTWRK",
    projectTitle: "Live Selling & Auction Experience",
    tagline:
      "End-to-end design of a live-selling and auction feature that became the platform's primary revenue driver.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["live commerce", "mobile", "real-time", "e-commerce"],
    previewImage: {
      url: "https://framerusercontent.com/images/MnqWnCukRKj1V1uHPomORtlxmk.png",
      alt: "Complex NTWRK live selling experience preview",
    },
    images: [
      {
        url: "https://framerusercontent.com/images/fl7miqI4kLtozmVX8pjcZscmk0E.png",
        alt: "Complex NTWRK live auction interface",
      },
      {
        url: "https://framerusercontent.com/images/3WXpM3rekP9FMTv7oxpqzZV3SA.png",
        alt: "Complex NTWRK bid and countdown UI",
      },
      {
        url: "https://framerusercontent.com/images/YRNFxAkIMXzcZA9As7GdgtD6T14.png",
        alt: "Complex NTWRK live chat integration",
      },
      {
        url: "https://framerusercontent.com/images/xHFeTq4jKi2Yee9YSvSAHBFYTE.png",
        alt: "Complex NTWRK product details during live show",
      },
    ],
    challenge:
      "Users were window-shopping but not buying. Engagement was low and average watch time was short. The platform needed a mechanism that would create urgency and convert passive viewers into active buyers.",
    impacts: [
      "Auctions made up 63% of revenue within the first year, with 23% quarterly growth.",
      "2,269+ auction shows conducted, featuring 59,000+ items.",
      "172% increase in chat messages per show.",
      "5-minute increase in average watch time.",
    ],
    roleDescription:
      "Lead product designer. Designed a net-new real-time auction/live-selling interface — a single mobile screen combining live chat, bid updates, countdown timers, and dynamically updated product details as sellers changed items mid-show.",
    atStake:
      "The interface had to surface a lot of real-time information in a very small space. The safe play was static auction pages per product. This was a net-new product category for the company — if the UI confused users during a live show, the launch would fail publicly.",
    decision:
      "Live selling and auctions work because of urgency — buyers need to react in 30-60 second windows. A static interface would mute the energy of the format entirely. The bet was that a dynamic, multi-signal UI matched the pace of the experience and would drive faster purchase decisions.",
  },
  {
    slug: "car-comparison",
    client: "Volkswagen",
    projectTitle: "Cross-Brand Car Comparison Tool",
    tagline:
      "Designed a car comparison tool that gives buyers genuine utility while systematically upselling Volkswagen at every touchpoint. Serves 112,000+ users monthly across Canada.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["automotive", "web", "e-commerce", "conversion"],
    previewImage: {
      url: "https://framerusercontent.com/images/ZVLYXl62gksREBpOCLxJhttVHEI.png",
      alt: "Volkswagen car comparison tool preview",
    },
    images: [
      {
        url: "https://framerusercontent.com/images/zecOCikKPMEukzBJqEJEFx1rk.png",
        alt: "Volkswagen comparison interface",
      },
      {
        url: "https://framerusercontent.com/images/kOuaaWCgO3WevMDSaDbAFkMZFUA.png",
        alt: "Volkswagen vehicle comparison details",
      },
      {
        url: "https://framerusercontent.com/images/ennlv8WOo05XWKWybvqeV0c4Ls.png",
        alt: "Volkswagen comparison feature highlights",
      },
      {
        url: "https://framerusercontent.com/images/HDwgEpwkjinY2WdDAq5JXc904yk.png",
        alt: "Volkswagen upsell touchpoints in comparison",
      },
    ],
    challenge:
      "VW had no comparison tool, and car comparison is a standard part of the purchase process. VW needed to meet buyer expectations while using the tool to move prospects down the sales funnel — toward visiting a dealership or building a vehicle online.",
    impacts: [
      "Serves 112,000+ users monthly across Canada since launch.",
    ],
    roleDescription:
      "Lead product designer. Pushed back on the initial brief to include competitor vehicles in the comparison, then designed the entire experience to favor VW at every touchpoint.",
    atStake:
      "VW stakeholders initially wanted a tool that only compared Volkswagen vehicles against each other. A VW-only tool would have been less useful than what competitors already offered — buyers would simply go elsewhere to do their research, and VW would lose the opportunity entirely.",
    decision:
      "Included other brands to give users the utility they expected, but built VW advantages into the structure of the experience: the first vehicle loaded is always a Volkswagen; VW-specific marketing content (videos of brake assist and safety tech) is integrated throughout; visual call-outs consistently highlight VW advantages in each comparison dimension. The tool feels fair to users because it is — while building the case for VW at every step.",
  },
  {
    slug: "ecommerce",
    client: "Complex NTWRK",
    projectTitle: "E-commerce Platform Integration",
    tagline:
      "Designed the e-commerce experience that integrated NTWRK into Complex.com post-acquisition. Now supporting ~1M monthly users and $100M+ in revenue.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["e-commerce", "mobile", "social commerce", "acquisition integration"],
    previewImage: {
      url: "https://framerusercontent.com/images/WVh3PMdQhpPpXW5dFa477LuFs.png",
      alt: "Complex NTWRK e-commerce integration preview",
    },
    images: [
      {
        url: "https://framerusercontent.com/images/XvezNg0HNikL6lx3gWC0jw7myE.png",
        alt: "Complex NTWRK shopping experience",
      },
      {
        url: "https://framerusercontent.com/images/58QxHV01mM3F4Fnv6aBOI60fy8.png",
        alt: "Complex NTWRK mobile product pages",
      },
    ],
    challenge:
      "After acquiring Complex, NTWRK needed to merge two platforms: Complex's massive media reach and NTWRK's exclusive access to celebrities, brands, and limited drops. The goal was a unified experience where fans could browse Complex content and purchase exclusive drops and evergreen merch — without it feeling bolted on.",
    impacts: [
      "Launched with 50+ brands on day one.",
      "Currently receives approximately 1M monthly users.",
      "Supporting $100M+ in revenue.",
    ],
    roleDescription:
      "Lead Product Designer. Audited both Complex.com and NTWRK's e-commerce platform, mapped the information architecture across both, and designed a mobile-first integration strategy that prioritized social media as the primary entry point.",
    atStake:
      "Complex users came for editorial content — music, culture, news — not shopping. If the shop was buried behind a homepage-first navigation flow, the core audience would never find it. The risk was launching a shop that existing Complex users never discovered.",
    decision:
      "Skipped the homepage-first strategy entirely. Because Complex's audience lives on social media rather than on Complex.com's homepage, I designed mobile-first product pages built to be shared. When a user taps through from Instagram or TikTok, they land on a page that feels native to mobile — giving them a seamless shopping experience while establishing Complex as a shopping destination through the channels where its audience already spends time.",
  },
  {
    slug: "product-management",
    client: "Complex NTWRK",
    projectTitle: "Seller Dashboard",
    tagline:
      "Designed the primary tool for sellers to manage products on Complex NTWRK. Within the first year: 400 sellers, 210K+ products, 106K+ orders, $10.5M+ revenue.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["B2B", "dashboard", "product management", "e-commerce"],
    previewImage: {
      url: "https://framerusercontent.com/images/xZ8h8dJCwdW5NXpTOYPrV6qdo.png",
      alt: "Complex NTWRK Seller Dashboard preview",
    },
    images: [
      {
        url: "https://framerusercontent.com/images/rFwFJwPyVIR9k09btWdgurBBdo.png",
        alt: "Seller Dashboard product listing view",
      },
      {
        url: "https://framerusercontent.com/images/uqlvFbnz8MUD6LIiSigZCTDMHUM.png",
        alt: "Seller Dashboard inventory management",
      },
      {
        url: "https://framerusercontent.com/images/Sl1qkatCZdmLY1vkiSyYWpuLyI.png",
        alt: "Seller Dashboard order management",
      },
      {
        url: "https://framerusercontent.com/images/1pyJBJbHaWJu9KzUuv7m0p4vOA.png",
        alt: "Seller Dashboard channel management",
      },
    ],
    challenge:
      "Sellers linking Shopify stores to Complex NTWRK hit constant failures — inventory uploaded incorrectly, product counts were inaccurate, and navigating between two disconnected systems was confusing. Many sellers weren't familiar with Shopify at all, breaking the fundamental assumption the integration relied on. Premium sellers are the lifeblood of the marketplace. Platform failures that cost sellers sales send them to competitors.",
    impacts: [
      "Nearly 400 sellers using Seller Dashboard within the first year.",
      "210,000+ products managed through the platform.",
      "106,372+ orders fulfilled.",
      "$10,500,000+ in revenue generated.",
    ],
    roleDescription:
      "Lead product designer. Designed a custom product management dashboard purpose-built for Complex NTWRK's sales channels — live-selling, auctions, and buy-now — while making it feel familiar to sellers coming from Shopify.",
    atStake:
      "Complex NTWRK depends on premium sellers to supply inventory for exclusive drops and auctions. Incorrect product data and inventory mismatches meant buyers tried to purchase products that didn't exist. Losing seller trust means losing the inventory that makes the platform worth visiting.",
    decision:
      "Rather than building something fully custom (which would have introduced fear and hesitation during seller onboarding), I designed the dashboard to feel like Shopify for users who knew Shopify — while building in features specific to Complex NTWRK's sales channels. Familiarity reduced the learning curve; the unique features gave sellers control over channels that Shopify never supported.",
  },
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function getLiveProjects(): Project[] {
  return projects.filter((p) => p.status === "live")
}

export function getProjectsByTag(tag: string): Project[] {
  return projects.filter((p) =>
    p.tags.some((t) => t.toLowerCase() === tag.toLowerCase())
  )
}

// ── Vibe-coded case-study variant: placeholder for visual review only ──────
// Deliberately NOT part of `projects` above — never wired into scripted
// responses, chip lists, or the project grid. Reachable only by navigating
// directly to /case-study/placeholder-vibe-project. Every text field is
// prefixed "[PLACEHOLDER]" so it can never be mistaken for real content.

export const placeholderVibeCodedProject: Project = {
  slug: "placeholder-vibe-project",
  client: "[PLACEHOLDER] Personal Project",
  projectTitle: "[PLACEHOLDER] Vibe-Coded Prototype Name",
  tagline:
    "[PLACEHOLDER] One-line summary of what this tool does, for card previews and grids.",
  role: "[PLACEHOLDER] Built by Edwin",
  status: "wip",
  tags: ["[PLACEHOLDER] AI", "[PLACEHOLDER] Tool"],
  previewImage: {
    url: "https://picsum.photos/id/180/640/440",
    alt: "[PLACEHOLDER] prototype interface preview",
  },
  images: [
    {
      url: "https://picsum.photos/id/0/480/360",
      alt: "[PLACEHOLDER] prototype screen one",
    },
    {
      url: "https://picsum.photos/id/2/480/360",
      alt: "[PLACEHOLDER] prototype screen two",
    },
  ],
  variant: "vibe-coded",
  whatItIs:
    "[PLACEHOLDER] A tool that does X for Y so that Z.",
  problem:
    "[PLACEHOLDER] An itch I had, or a gap the team needed filled — describe the recurring friction that made this worth building.",
  architecture:
    "[PLACEHOLDER] Two to three sentences of concrete architecture: the frontend framework, where data is stored, where the LLM sits in the flow, and how a request moves end to end.",
  stack: ["[PLACEHOLDER] Next.js", "[PLACEHOLDER] Supabase", "[PLACEHOLDER] Claude API", "[PLACEHOLDER] Vercel Cron"],
  keyDecision:
    "[PLACEHOLDER] Symptom — what broke or felt wrong. Diagnosis — the actual cause once dug into. Fix — the technical choice made in response.",
  impacts: [
    "[PLACEHOLDER] Impact item — users, usage volume, or what manual process this replaced.",
    "[PLACEHOLDER] Second impact item.",
  ],
  tradeoff:
    "[PLACEHOLDER] What was deliberately given up (robustness, coverage, polish) and why that was the right call for a prototype at this stage.",
  whatsNext:
    "[PLACEHOLDER] The honest gap between this prototype and a real product — what's missing before it could ship broadly.",
  proofLinks: {
    demo: "https://placeholder.example/demo",
    repo: "https://github.com/placeholder-org/placeholder-vibe-project",
  },
}

export const PLACEHOLDER_PROJECT_IDS: string[] = [placeholderVibeCodedProject.slug]
