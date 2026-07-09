export interface Identity {
  name: string
  headline: string
  summary: string
  location: string
  yearsOfExperience: number
  languages: string[]
  contact: {
    email: string
    portfolio: string
    linkedin: string
  }
}

export interface ExperienceItem {
  company: string
  location: string
  title: string
  type: "full-time" | "contract" | "freelance"
  startDate: string
  endDate: string | null   // null = present
  highlights: string[]
}

export interface EducationItem {
  credential: string
  institution: string
  location: string
}

export interface Skills {
  tools: string[]
  methodologies: string[]
}

// ── Identity ───────────────────────────────────────────────────────────────

export const identity: Identity = {
  name: "Edwin Socrates Lara",
  headline:
    "Senior Product Designer — AI-driven experiences, conversational design & agentic workflows",
  summary:
    "Highly accomplished Senior Product Designer with 10+ years of experience specialising in AI-driven user experiences, conversational design, and agentic workflows. Adept at translating complex business goals into intuitive, elegant, and high-impact user experiences driving digital innovation across workforce development, e-commerce and fintech. Deep expertise in user-centered design, developing robust design systems, and crafting scalable product strategies.",
  location: "Toronto, Ontario, Canada",
  yearsOfExperience: 10,
  languages: ["English", "Spanish"],
  contact: {
    email: "edwinsocrateslara@gmail.com",
    portfolio: "https://www.edwinsocrates.com",
    linkedin: "https://linkedin.com/in/edwinsocrateslara",
  },
}

// ── Experience ─────────────────────────────────────────────────────────────

export const experience: ExperienceItem[] = [
  {
    company: "FutureFit AI",
    location: "Toronto, Ontario",
    title: "Lead Product Designer",
    type: "contract",
    startDate: "Oct 2025",
    endDate: null,
    highlights: [
      "Building an AI-powered workforce development platform that helps businesses and governments guide unemployed and underemployed people toward meaningful opportunities.",
      "Building data-driven user-testing and research practices to deeply understand B2G, B2B, and B2C users.",
      "Designing chat-driven UX and agentic AI experiences that enhance workforce development.",
      "Creating an AI-compatible design system using design tokens and Shadcn, for use in AI development tools such as v0, Lovable, and Claude Code.",
    ],
  },
  {
    company: "Complex NTWRK",
    location: "Toronto, Ontario",
    title: "Lead Product Designer",
    type: "full-time",
    startDate: "Apr 2022",
    endDate: "Oct 2025",
    highlights: [
      "Spearheaded the design and launch of the Auctions feature, directly contributing to 63% of company revenue and achieving 23% quarterly growth, a 172% increase in chat messages per show, and 5-minute increase in average show watch time.",
      "Designed and iterated the Seller Dashboard, a critical product management and order fulfillment tool utilized by 400+ sellers to process 106,000+ orders, generating over $10.5 million in total revenue.",
      "Led the end-to-end design integration during acquisition of Complex, merging e-commerce and media into a unified platform.",
    ],
  },
  {
    company: "Super.com",
    location: "Toronto, Ontario",
    title: "Senior Product Designer",
    type: "full-time",
    startDate: "Nov 2021",
    endDate: "Apr 2022",
    highlights: [
      "Led the UX design for SuperCash credit-building cashback card, achieving 50,000+ cards issued within 7 months of launch.",
      "Shipped MVP of unified 'super app,' integrating hotel booking, e-commerce and financial services post-rebrand to Super.com.",
    ],
  },
  {
    company: "Backbase",
    location: "Toronto, Ontario",
    title: "Senior Product Designer",
    type: "full-time",
    startDate: "Nov 2020",
    endDate: "Nov 2021",
    highlights: [
      "Directed the full lifecycle UX/UI and technical integration of Backbase's platform across NA and EU financial institutions, customizing solutions for regional compliance and needs.",
      "Facilitated cross-functional teams (development, product, compliance) to navigate complex integration challenges, ensuring the delivery of scalable and user-centric digital banking solutions.",
    ],
  },
  {
    company: "Meridian Credit Union",
    location: "Toronto, Ontario",
    title: "Senior Product Designer",
    type: "full-time",
    startDate: "May 2019",
    endDate: "Nov 2020",
    highlights: [
      "Led the redesign of the Meridian Credit Union mobile app for 370,000+ users, significantly enhancing usability, engagement and improving retention.",
      "Established a comprehensive IA and design system to ensure a cohesive and user-friendly digital banking experience.",
      "Conducted extensive user-centric research, including user testing and surveys, and analyzed key data to inform design decisions and understand specific consumer banking behaviors.",
    ],
  },
  {
    company: "Contracting",
    location: "Toronto, Ontario",
    title: "Senior Product Designer",
    type: "freelance",
    startDate: "Dec 2015",
    endDate: "May 2019",
    highlights: [
      "Bank of Montreal: Led the end-to-end redesign of the bank's entire public website and core navigation to better direct users to the bank's products.",
      "Toronto-Dominion Bank: Led redesign initiatives for MBNA credit card application process, enhancing user experience and optimizing the credit card application journey.",
      "Viafoura: Spearheaded the design of a commenting and chat tool used by USA Today, The Telegraph, The Globe and Mail, CBC, The Independent, Dow Jones, and many more.",
      "Viafoura: Developed a data segmenting and insights tool that tracks user behaviour and engagement to help media publishers understand user preferences.",
      "Volkswagen: Conceptualized and designed a car comparison tool that serves over 112,000 customers per month.",
    ],
  },
]

// ── Education ──────────────────────────────────────────────────────────────

export const education: EducationItem[] = [
  {
    credential: "Graduate Diploma, Interactive Design",
    institution: "CFC Media Lab",
    location: "Toronto, Ontario, Canada",
  },
  {
    credential: "Certificate, Graphic Design",
    institution: "Toronto School of Art",
    location: "Toronto, Ontario, Canada",
  },
  {
    credential: "Diploma, Advertising",
    institution: "Sheridan College",
    location: "Oakville, Ontario, Canada",
  },
]

// ── Skills ─────────────────────────────────────────────────────────────────

export const skills: Skills = {
  tools: [
    "Figma",
    "Aura Build",
    "Claude Code",
    "Lovable",
    "OpenAI API",
    "v0",
    "GitHub",
    "Shadcn",
    "Maze",
    "UserTesting",
    "ProtoPie",
    "Marvel App",
    "Lottie Lab",
    "Magic Animator",
    "Jitter",
    "Miro",
  ],
  methodologies: [
    "Design Thinking",
    "Information Architecture",
    "Design Systems",
    "User Research",
    "Prototyping",
    "A/B Testing",
    "Accessibility",
    "Agile/Scrum",
    "Product Strategy",
    "UX Strategy",
    "Conversational Design",
    "Agentic Workflow Design",
  ],
}
