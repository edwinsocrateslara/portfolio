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
  // `role` is sourced from lib/sources/resume.txt, NOT framer-export.json —
  // a deliberate exception to the otherwise-strict 1:1 mapping. The Framer
  // export says "Lead product designer" on every row, including Meridian and
  // Volkswagen, where the résumé (and LinkedIn) say Senior. The résumé wins.
  // Do not "correct" these back to the export in a future audit.
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
      "I'm building a business-to-business and business-to-government AI-powered workforce development platform, featuring an AI coach that will assist users navigate the job search process and provide career coaching.",
    role: "Lead Product Designer",
    status: "wip",
    tags: ["AI", "design systems", "workforce", "B2B"],
    previewImage: {
      url: "/framer/ai-workforce-development/preview-image.png",
      alt: "", // TODO: alt text
    },
    images: [
      {
        url: "/framer/ai-workforce-development/image-1.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/ai-workforce-development/image-2.png",
        alt: "", // TODO: alt text
      },
    ],
    // Framer's Formatted Text 3 is empty ("<p><br></p>") and Formatted Text 2
    // has no "What was at stake" / "Why I made this decision" clauses for
    // this row — no challenge/atStake/decision content exists in the export.
    impacts: ["work in progress; coming soon."],
    roleDescription:
      "Lead product designer.\n\nCurrent focus:\n- conducting user research to uncover issues faced by new job-seekers, individuals undergoing career transitions, and fresh grads;\n- understanding how AI can coach individuals to obtain better outcomes in cold outreaches; improved resumes; better accountability, etc.\n- creating and designing the AI coach and deploying to clients;\n- creating an AI-compatible design system using design tokens and Shadcn, for use in AI development tools, such as V0, Lovable, and Claude Code.",
  },
  {
    slug: "retail-banking",
    client: "Meridian",
    projectTitle: "Mobile Banking Redesign",
    tagline:
      "I led the end-to-end redesign of Meridian Credit Union apps which now serves over 370,000 customers and supports over $26 billion in managed assets.",
    role: "Senior Product Designer",
    status: "live",
    tags: ["mobile", "fintech", "redesign", "design systems"],
    previewImage: {
      url: "/framer/retail-banking/preview-image.png",
      alt: "", // TODO: alt text
    },
    images: [
      {
        url: "/framer/retail-banking/image-1.jpg",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/retail-banking/image-2.jpg",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/retail-banking/image-3.jpg",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/retail-banking/image-4.jpg",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/retail-banking/image-5.jpg",
        alt: "", // TODO: alt text
      },
    ],
    challenge:
      "Users reviews for the Meridian app cited poor user experience, and UI, and lack of key features, such as investing and borrowing/credit cards. Without a major redesign, Meridian would lose users to competitors with better digital experiences.",
    impacts: [
      "Within the first month of launch, the redesigned app received overwhelming positive user reviews in the app store.",
      "Meridian Credit Union adopted the new design across its entire ecosystem.",
    ],
    roleDescription:
      "Lead product designer. I created a new design system and pushed for two controversial additions: a price-matching feature and animations on positive actions like deposits and bill payments.",
    atStake:
      "Stakeholders wanted to keep the conservative look and feel of the old app, but we ran the risk of losing users due to a poor app experience.",
    decision:
      "Price-matching gave younger, price-conscious users a desirable money-saving tool and reason to engage with the app beyond basic transactions. Animations created an engaging experience tailored for our target demographic.",
  },
  {
    slug: "ai-investing",
    client: "Coinley AI",
    projectTitle: "AI Crypto Investing App",
    tagline:
      "I helped build and release the MVP for a crypto investing platform on the App Store.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["AI", "mobile", "fintech", "MVP", "crypto"],
    previewImage: {
      url: "/framer/ai-investing/preview-image.png",
      alt: "", // TODO: alt text
    },
    images: [
      {
        url: "/framer/ai-investing/image-1.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/ai-investing/image-2.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/ai-investing/image-3.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/ai-investing/image-4.png",
        alt: "", // TODO: alt text
      },
    ],
    challenge:
      "Traditional investing platforms overwhelm beginners with complex interfaces and workflows. We wanted to make investing accessible through conversational AI.",
    // Framer's Formatted Text 2 header here is "KEY LEARNINGS", not "KEY
    // IMPACTS" — per the settled mapping, learnings content isn't relabeled
    // into impacts. No impacts field is populated for this row.
    roleDescription:
      "Lead Product Designer. I designed a chat-based interface for users to receive investment advice.",
    atStake:
      "A regular crypto app wouldn't differentiate Coinley in the beginner market they were targeting. But introducing AI agents for investment advice was risky as users might not trust AI to guide financial decisions.",
    decision:
      "First-time crypto investors have to learn investing basics, blockchain concepts, candlestick charts, and data interpretation all at once. They needed a tutor to guide them through the process. I designed the AI as a conversational agent to make investing feel accessible rather than intimidating.",
  },
  {
    slug: "live-selling",
    client: "Complex NTWRK",
    projectTitle: "Live Selling & Auction Experience",
    tagline: "I led the end-to-end design of a live-selling and auction experience.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["live commerce", "mobile", "real-time", "e-commerce"],
    previewImage: {
      url: "/framer/live-selling/preview-image.png",
      alt: "", // TODO: alt text
    },
    images: [
      {
        url: "/framer/live-selling/image-1.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/live-selling/image-2.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/live-selling/image-3.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/live-selling/image-4.png",
        alt: "", // TODO: alt text
      },
    ],
    challenge:
      "Users were window-shopping but not buying. Engagement was low and watch-time was short. We needed to create a feature that would increase user engagement and revenue on the platform.",
    impacts: [
      "Within its first year of launch: auctions made up 63% of revenue, with a quarterly growth rate of 23%",
      "over 2,269+ auction shows conducted, 59K+ items featured",
      "172% increase in chat messages per show",
      "5 minute increase in average watch time.",
    ],
    roleDescription:
      "Lead product designer. I designed a real-time auction/live-selling interface combining live-chat, bid updates, countdown timers and product details into a single mobile screen.",
    atStake:
      "The interface required providing a lot of real-time information in a small space. The safe approach would have been to create static auction pages for each product. This was a net-new product for the company and if the UI failed or confused users during live shows, the launch would fail.",
    decision:
      "Live selling and auctions demand real-time updates and interactions between buyer and seller. I believed that this format would create urgency and encourage fast purchase decisions in 30-60 second windows.",
  },
  {
    slug: "car-comparison",
    client: "Volkswagen",
    projectTitle: "Cross-Brand Car Comparison Tool",
    tagline:
      "I created a car comparison tool that balances utility for users with upselling Volkswagen vehicles.",
    role: "Senior Product Designer",
    status: "live",
    tags: ["automotive", "web", "e-commerce", "conversion"],
    previewImage: {
      url: "/framer/car-comparison/preview-image.png",
      alt: "", // TODO: alt text
    },
    images: [
      {
        url: "/framer/car-comparison/image-1.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/car-comparison/image-2.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/car-comparison/image-3.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/car-comparison/image-4.png",
        alt: "", // TODO: alt text
      },
    ],
    challenge:
      "VW didn't have a comparison tool and recognized that a comparison tool is a big part of the purchase process. VW wanted to meet the needs of potential buyers, but also wanted to create a tool that would help potential buyers move down the sales funnel (e.g. either visiting a dealership or building a vehicle online).",
    impacts: [
      "Since it's launch, the tool serves over 112,000 customers across Canada on a monthly basis.",
    ],
    roleDescription:
      "Lead product designer. I designed a car comparison tool that balanced utility for potential buyers while upselling VW products.",
    atStake:
      "VW stakeholders wanted a tool that only compared Volkswagen vehicles against each other. However, most of VW's competitors had comparison tools that let users compare vehicles across brands. Restricting the tool to VW-only vehicles would've made the tool less useful for potential buyers and create a missed opportunity to showcase how VW vehicles outperform competitors.",
    decision:
      "I pushed to include other brands but designed the comparison experience to favour and upsell VW throughout. The first vehicle loaded in the tool is always a VW vehicle. I integrated VW-specific marketing content (like videos showcasing brake assist technology) and visual call-outs that highlighted VW advantages. I made these design decision to create an experience that would give users the utility they expected while upselling VW at every touchpoint.",
  },
  {
    slug: "ecommerce",
    client: "Complex NTWRK",
    projectTitle: "E-commerce Platform Integration",
    tagline:
      "I designed an e-commerce experience that integrated NTWRK into Complex.com's brand post-acquisition.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["e-commerce", "mobile", "social commerce", "acquisition integration"],
    previewImage: {
      url: "/framer/ecommerce/preview-image.png",
      alt: "", // TODO: alt text
    },
    images: [
      {
        url: "/framer/ecommerce/image-1.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/ecommerce/image-2.png",
        alt: "", // TODO: alt text
      },
    ],
    challenge:
      "After acquiring Complex, NTWRK needed to merge two platforms: Complex's massive media reach and NTWRK's exclusive access to celebrities, brands, and limited drops. The goal was to create a unified media and shopping experience where music fans could browse Complex content and purchase both exclusive drops and evergreen merch.",
    impacts: [
      "launched with over 50 brands on day one",
      "currently receive approximately 1M monthly users",
      "supporting over $100M in revenue",
    ],
    roleDescription:
      "Lead Product Designer. I designed a mobile-first shopping experience that leveraged Complex.com's social media presence to introduce users to NTWRK's e-commerce platform.",
    atStake:
      "Complex users came for media content, not shopping. If we pushed them through a traditional homepage-to-shop flow, they'd ignore it. We risked launching a shop that existing Complex users would never discover or use.",
    // Source defect carried verbatim: "not on on Complex.com's homepage" and
    // the repeated "When users clicked through from Instagram or TikTok,"
    // clause are duplicated in Framer's own text — see migration report.
    decision:
      "I led the integration strategy by auditing both Complex.com and NTWRK's e-commerce platform, mapping information architecture concepts, and designing how the platforms could merge visually. Because Complex's audience lives mostly on social media and not on on Complex.com's homepage, I decided to design mobile-first product pages optimized for sharing on social media. When users clicked through from Instagram or TikTok, When users clicked through from Instagram or TikTok, they'd land on pages that felt native to mobile, giving them a seamless shopping experience while subtly establishing Complex as a shopping destination.",
  },
  {
    slug: "product-management",
    client: "Complex NTWRK",
    projectTitle: "Seller Dashboard",
    tagline: "I created the primary tool for sellers to manage products on Complex NTWRK.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["B2B", "dashboard", "product management", "e-commerce"],
    previewImage: {
      url: "/framer/product-management/preview-image.png",
      alt: "", // TODO: alt text
    },
    images: [
      {
        url: "/framer/product-management/image-1.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/product-management/image-2.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/product-management/image-3.png",
        alt: "", // TODO: alt text
      },
      {
        url: "/framer/product-management/image-4.png",
        alt: "", // TODO: alt text
      },
    ],
    challenge:
      "Sellers had to link Shopify stores to the Complex NTWRK platform, which created constant problems, such as inventory uploaded improperly and inaccurate product count data. Sellers had to navigate between two systems, which was confusing and inefficient, and Sellers were expected to be familiar with Shopify, which was often not the case.\n\nWe needed a custom product management tool that worked with Complex NTWRK’s unique features, while feeling familiar to users coming from other platforms.",
    impacts: [
      "Within the first year of launch: nearly 400 sellers use Seller Dashboard;",
      "Seller Dashboard manages 210K+ products;",
      "106,372+ orders fulfilled;",
      "$10,500,000+ revenue generated",
    ],
    roleDescription:
      "Lead product designer. I designed a custom product management dashboard to mitigate issues from poor integration with Shopify.",
    atStake:
      "Complex NTWRK depends on premium sellers. Incorrect product data and inventory mismatches meant buyers tried to purchase products that didn't exist. When sellers lose sales and customers due to platform failures, they leave for competitors.",
    decision:
      "I could've designed a completely custom dashboard for Complex NTWRK, but unfamiliar workflows would've scared off new sellers. Instead, I made it feel familiar to Shopify users while integrating features for Complex NTWRK's unique sales channels (live-selling, auctions, buy-now). Familiarity reduced onboarding friction and kept sellers confident in the system.",
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

// The "vibe-coded" case-study variant is still supported by the Project type
// and rendered by case-study-view.tsx, but no project currently uses it. The
// placeholder that exercised it was removed before merge rather than shipped.
