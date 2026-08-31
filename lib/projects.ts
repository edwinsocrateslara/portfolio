export interface ProjectImage {
  url: string
  // `alt` is written here, from looking at the images. There is nothing
  // upstream to derive it from and nothing to check it against.
  // It is for screen readers and is deliberately excluded from the generated
  // section of lib/edwin-context.md, so the chat never quotes it back.
  alt: string
}

export interface Project {
  slug: string
  client: string
  // `projectTitle` is the case study's own name, authored here. It is not an
  // employer and not a client — resume.txt names employers, `client` names
  // clients, and neither is a title for the work.
  projectTitle: string
  // `railSubtitle` is the short label for the sidebar rail, authored here.
  //
  // Used by the rail ONLY. `projectTitle` remains the project's name
  // everywhere else — the chat's project card and the generated Projects
  // section of edwin-context.md. Do not substitute one for the other.
  railSubtitle: string
  tagline: string
  // `role` follows lib/sources/resume.txt, kept in agreement with LinkedIn. It
  // is the one field on Project sourced outside this file.
  //
  // `roleDescription` opens by restating the title, so the two have to agree.
  // They have disagreed before — a card reading Senior above a body reading
  // Lead, a few blocks apart in the same conversation.
  role: string
  status: "live" | "wip"
  tags: string[]
  previewImage: ProjectImage
  images: ProjectImage[]

  // Traditional case-study fields — used by all 7 projects.
  challenge?: string
  impacts?: string[]
  roleDescription?: string
  atStake?: string
  decision?: string
}

// The one field on Project sourced outside this file. scripts/build-context.mjs
// reads it to annotate the generated section, so the sourcing travels with the
// output instead of living only here.
//
// It was REPO_AUTHORED_FIELDS, listing the three fields that did not trace to
// the Framer CMS export. Once that export went, "does not trace to
// lib/sources/" became true of nearly every field on this type, and a list of
// three read as if the rest were sourced. Inverted rather than extended: one
// name, and it is accurate.
export const SOURCED_FIELDS = { role: "lib/sources/resume.txt" } as const

export const projects: Project[] = [
  {
    slug: "ai-workforce-development",
    client: "FutureFit AI",
    projectTitle: "AI Workforce Development Platform",
    railSubtitle: "AI Workforce Development",
    tagline:
      "I'm building a business-to-business and business-to-government AI-powered workforce development platform, featuring an AI coach that will assist users navigate the job search process and provide career coaching.",
    role: "Lead Product Designer",
    status: "wip",
    tags: ["AI", "design systems", "workforce", "B2B"],
    // ALL THREE IMAGES WERE REPLACED, AND ALL THREE ALT STRINGS WENT WITH
    // THEM. The previous set showed a dark Career Explorer chat and a dark job
    // detail; these show the light career-paths graph and the light role
    // detail. The old alt was authored and accurate — to screens that are no
    // longer here. A correct-sounding description of an image that is not on
    // the page is worse than none, because nothing about it reads as
    // unfinished, so it went empty with the others rather than being kept.
    //
    // New filenames rather than overwrites: the old ones had been fetched, and
    // a dev server that predates the swap will keep serving the old bytes for
    // the same URL. See DESIGN.md, Photography — "Replacing an image in place".
    //
    // TODO(edwin): alt text for all three. Authored, never generated — same
    // rule as the rest. The graph needs a sentence carrying that it relates
    // roles across three seniority levels by three kinds of connection; the
    // role detail one pairing requirements and learning with labour-market
    // figures.
    previewImage: {
      url: "/framer/ai-workforce-development/preview-image.webp",
      alt: "",
    },
    images: [
      {
        url: "/framer/ai-workforce-development/career-paths-graph.webp",
        alt: "",
      },
      {
        url: "/framer/ai-workforce-development/role-detail.webp",
        alt: "",
      },
    ],
    // ⚠ PLACEHOLDER, AND IT SHIPS. "work in progress; coming soon." renders as
    // the impacts block on the live reveal — `impacts?.length` is 1, so the
    // section is drawn with that as its content rather than skipped. This is
    // the only placeholder string in the project copy. It needs writing, or
    // the field needs deleting so the block is omitted like Coinley's.
    impacts: ["work in progress; coming soon."],
    roleDescription:
      "Lead product designer.\n\nCurrent focus:\n- conducting user research to uncover issues faced by new job-seekers, individuals undergoing career transitions, and fresh grads;\n- understanding how AI can coach individuals to obtain better outcomes in cold outreaches; improved resumes; better accountability, etc.\n- creating and designing the AI coach and deploying to clients;\n- creating an AI-compatible design system using design tokens and Shadcn, for use in AI development tools, such as V0, Lovable, and Claude Code.",
  },
  {
    slug: "retail-banking",
    client: "Meridian",
    projectTitle: "Mobile Banking Redesign",
    railSubtitle: "Retail Banking",
    tagline:
      "I led the end-to-end redesign of Meridian Credit Union apps which now serves over 370,000 customers and supports over $26 billion in managed assets.",
    role: "Senior Product Designer",
    status: "live",
    tags: ["mobile", "fintech", "redesign", "design systems"],
    previewImage: {
      url: "/framer/retail-banking/preview-image.png",
      alt:
        "Accounts screen showing Deposits tab with a total balance and a chequing account, over the bank's multi-coloured arc graphic.",
    },
    images: [
      {
        url: "/framer/retail-banking/image-1.jpg",
        alt:
          "Accounts home with tabs for All, Deposits, Investing and Borrowing, a total deposits card, and a chequing account balance.",
      },
      {
        url: "/framer/retail-banking/image-2.jpg",
        alt:
          "Bill payment flow across three screens: the biller list, the payment form with Now, Later and Ongoing scheduling options, and the confirmation.",
      },
      {
        url: "/framer/retail-banking/image-3.jpg",
        alt:
          "Chequing account detail on the Summary tab, showing balance, account type, interest rate and direct deposit details.",
      },
      {
        url: "/framer/retail-banking/image-4.jpg",
        alt:
          "Money transfer flows: an Interac e-Transfer with amount and security question, transfers between linked accounts including an external bank, and the transfers menu.",
      },
      {
        url: "/framer/retail-banking/image-5.jpg",
        alt:
          "Cheque deposit with camera capture, and the price-matching feature: receipt scanning onboarding with partner retailers, and a receipts list tracking submitted purchases.",
      },
    ],
    challenge:
      "User reviews for the Meridian app cited poor user experience, UI, and lack of key features, such as investing and borrowing/credit cards. Without a major redesign, Meridian would lose users to competitors with better digital experiences.",
    impacts: [
      "Within the first month of launch, the redesigned app received overwhelming positive user reviews in the app store.",
      "Meridian Credit Union adopted the new design across its entire ecosystem.",
    ],
    roleDescription:
      "Senior product designer. I created a new design system and pushed for two controversial additions: a price-matching feature and animations on positive actions like deposits and bill payments.",
    atStake:
      "Stakeholders wanted to keep the conservative look and feel of the old app, but we ran the risk of losing users due to a poor app experience.",
    decision:
      "Price-matching gave younger, price-conscious users a desirable money-saving tool and reason to engage with the app beyond basic transactions. Animations created an engaging experience tailored for our target demographic.",
  },
  {
    slug: "ai-investing",
    client: "Coinley AI",
    projectTitle: "AI Crypto Investing App",
    railSubtitle: "AI Investing",
    tagline:
      "I helped build and release the MVP for a crypto investing platform on the App Store.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["AI", "mobile", "fintech", "MVP", "crypto"],
    previewImage: {
      url: "/framer/ai-investing/preview-image.png",
      alt:
        "Crypto wallet totalling just over $20,000, with separate Bitcoin, Dash, Ethereum and Litecoin holdings showing dollar value and coin amount.",
    },
    images: [
      {
        url: "/framer/ai-investing/image-1.png",
        alt:
          "Wallet home listing four cryptocurrency holdings under a combined total, each with its dollar value and quantity.",
      },
      {
        url: "/framer/ai-investing/image-2.png",
        alt:
          "Conversational investing across three screens: asking the assistant to check finances, typing a reply, and placing a $5,250 investment in IOTA after the assistant offers to send an analysis.",
      },
      {
        url: "/framer/ai-investing/image-3.png",
        alt:
          "Bitcoin holding detail with current price, weekly change, and a dated activity list of sent, bought, sold, requested and traded transactions marked pending or complete.",
      },
      {
        url: "/framer/ai-investing/image-4.png",
        alt:
          "Marketing site and mobile app side by side, headlined \"A personal broker for cryptocurrency\" with an App Store download link and a preview of the chat interface.",
      },
    ],
    challenge:
      "Traditional investing platforms overwhelm beginners with complex interfaces and workflows. We wanted to make investing accessible through conversational AI.",
    // No impacts for this row. What exists for this project is learnings, and
    // learnings are not impacts — an impact is an outcome the work produced,
    // and relabelling one as the other would put a claim on the page that
    // nobody made. The block is absent rather than filled.
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
    railSubtitle: "Live Selling",
    tagline: "I led the end-to-end design of a live-selling and auction experience.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["live commerce", "mobile", "real-time", "e-commerce"],
    previewImage: {
      url: "/framer/live-selling/preview-image.png",
      alt:
        "Live auction stream with a seller presenting sneakers, viewer comments scrolling over the video, and a bid panel showing the current price, a 30-second countdown and a bid button.",
    },
    images: [
      {
        url: "/framer/live-selling/image-1.png",
        alt:
          "Live shopping screen combining the seller's video, viewer comments, the item on offer, a countdown and bid buttons.",
      },
      {
        url: "/framer/live-selling/image-2.png",
        alt:
          "Custom bid entry sliding over the live stream, showing the current bid, a typed higher amount, and a numeric keypad.",
      },
      {
        url: "/framer/live-selling/image-3.png",
        alt:
          "Product catalogue panel over the live stream, split into auction and buy-now tabs, with sneaker cards labelled current or upcoming.",
      },
      {
        url: "/framer/live-selling/image-4.png",
        alt:
          "Tagging a friend in the live chat with an autocomplete list, a shipping costs and handling time breakdown, and a billing and shipping summary.",
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
    railSubtitle: "Car Comparison",
    tagline:
      "I created a car comparison tool that balances utility for users with upselling Volkswagen vehicles.",
    role: "Product Designer",
    status: "live",
    tags: ["automotive", "web", "e-commerce", "conversion"],
    previewImage: {
      url: "/framer/car-comparison/preview-image.png",
      alt:
        "Vehicle comparison tool with a suggested Volkswagen Beetle in the first slot, a Mazda in the second, an empty third slot, and a Compare Vehicles button.",
    },
    images: [
      {
        url: "/framer/car-comparison/image-1.png",
        alt:
          "Comparison tool at the start, with a Volkswagen preselected in the first slot and two empty slots inviting the shopper to add vehicles.",
      },
      {
        url: "/framer/car-comparison/image-2.png",
        alt:
          "Side-by-side comparison of a Volkswagen, a Mazda and a Honda, filtered to safety features, with rows for ABS, anti-theft protection and brake assist.",
      },
      {
        url: "/framer/car-comparison/image-3.png",
        alt:
          "Vehicle picker with make, model and year dropdowns for adding a car to the comparison.",
      },
      {
        url: "/framer/car-comparison/image-4.png",
        alt:
          "Brake Assist System feature detail with a video of the Volkswagen Beetle and thumbnails for related features like electronic stability control and lane keeping assist.",
      },
    ],
    challenge:
      "VW didn't have a comparison tool and recognized that a comparison tool is a big part of the purchase process. VW wanted to meet the needs of potential buyers, but also wanted to create a tool that would help potential buyers move down the sales funnel (e.g. either visiting a dealership or building a vehicle online).",
    impacts: [
      "Since its launch, the tool serves over 112,000 customers across Canada on a monthly basis.",
    ],
    roleDescription:
      "Product designer. I designed a car comparison tool that balanced utility for potential buyers while upselling VW products.",
    atStake:
      "VW stakeholders wanted a tool that only compared Volkswagen vehicles against each other. However, most of VW's competitors had comparison tools that let users compare vehicles across brands. Restricting the tool to VW-only vehicles would've made the tool less useful for potential buyers and create a missed opportunity to showcase how VW vehicles outperform competitors.",
    decision:
      "I pushed to include other brands but designed the comparison experience to favour and upsell VW throughout. The first vehicle loaded in the tool is always a VW vehicle. I integrated VW-specific marketing content (like videos showcasing brake assist technology) and visual call-outs that highlighted VW advantages. I made these design decisions to create an experience that would give users the utility they expected while upselling VW at every touchpoint.",
  },
  {
    slug: "ecommerce",
    client: "Complex NTWRK",
    projectTitle: "E-commerce Platform Integration",
    railSubtitle: "E-commerce",
    tagline:
      "I designed an e-commerce experience that integrated NTWRK into Complex.com's brand post-acquisition.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["e-commerce", "mobile", "social commerce", "acquisition integration"],
    previewImage: {
      url: "/framer/ecommerce/preview-image.png",
      alt:
        "Product page for a Malbon x New Balance jacket, with collection description, size selector, price, and add to bag and Apple Pay buttons.",
    },
    images: [
      {
        url: "/framer/ecommerce/image-1.png",
        alt:
          "Shopping grid of the collection with filters and sort, alongside the same product page rendered on mobile.",
      },
      {
        url: "/framer/ecommerce/image-2.png",
        alt:
          "The same product page on desktop and phone, showing how the layout reflows between them.",
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
    decision:
      "I led the integration strategy by auditing both Complex.com and NTWRK's e-commerce platform, mapping information architecture concepts, and designing how the platforms could merge visually. Because Complex's audience lives mostly on social media and not on Complex.com's homepage, I decided to design mobile-first product pages optimized for sharing on social media. When users clicked through from Instagram or TikTok, they'd land on pages that felt native to mobile, giving them a seamless shopping experience while subtly establishing Complex as a shopping destination.",
  },
  {
    slug: "product-management",
    client: "Complex NTWRK",
    projectTitle: "Seller Dashboard",
    railSubtitle: "Product Management",
    tagline: "I created the primary tool for sellers to manage products on Complex NTWRK.",
    role: "Lead Product Designer",
    status: "live",
    tags: ["B2B", "dashboard", "product management", "e-commerce"],
    previewImage: {
      url: "/framer/product-management/preview-image.png",
      alt:
        "Seller dashboard product catalogue as a table of sneakers with price, quantity, category, handling time, shipping profile and created date, one row selected.",
    },
    images: [
      {
        url: "/framer/product-management/image-1.png",
        alt:
          "Product catalogue table with bulk actions for delete, duplicate, edit and filter, and a Create Product button.",
      },
      {
        url: "/framer/product-management/image-2.png",
        alt:
          "Order detail with order IDs, the purchased item and ship-by date, customer contact and shipping address, a fulfil items action, and an empty shipments panel.",
      },
      {
        url: "/framer/product-management/image-3.png",
        alt:
          "Product creation form with title, price and description fields, an image uploader showing two images added, and a shipping profile selector.",
      },
      {
        url: "/framer/product-management/image-4.png",
        alt:
          "Shipping label creation with package template, weight, dimensions and carrier rate options.",
      },
    ],
    challenge:
      "Sellers had to link Shopify stores to the Complex NTWRK platform, which created constant problems, such as inventory uploaded improperly and inaccurate product count data. Sellers had to navigate between two systems, which was confusing and inefficient, and sellers were expected to be familiar with Shopify, which was often not the case.\n\nWe needed a custom product management tool that worked with Complex NTWRK’s unique features, while feeling familiar to users coming from other platforms.",
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

