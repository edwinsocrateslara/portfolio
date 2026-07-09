export interface LinkedInPosition {
  company: string
  title: string
  startDate: string
  endDate: string | null   // null = current
  description: string
}

export interface LinkedInEducation {
  institution: string
  degree: string
  field: string
  graduationYear: number
}

export interface LinkedInProfile {
  name: string
  headline: string
  location: string
  url: string
  positions: LinkedInPosition[]
  education: LinkedInEducation[]
  skills: string[]
}

export const linkedIn: LinkedInProfile = {
  name: "Edwin Socrates Lara",
  headline: "Lead Product Designer — AI products & workflows",
  location: "Toronto, Canada",
  url: "https://linkedin.com/in/edwinsocrateslara",
  positions: [
    {
      company: "FutureFit AI",
      title: "Lead Product Designer",
      startDate: "2023",
      endDate: null,
      description:
        "Lead designer on a B2B and B2G AI-powered workforce development platform. Designing the AI coach experience, conducting user research, and building an AI-compatible design system.",
    },
    {
      company: "Coinley AI",
      title: "Lead Product Designer",
      startDate: "2022",
      endDate: "2023",
      description:
        "Designed and shipped the MVP for a conversational AI crypto investing app, now live on the App Store.",
    },
    {
      company: "Complex NTWRK",
      title: "Lead Product Designer",
      startDate: "2019",
      endDate: "2022",
      description:
        "Led design across live selling & auctions, e-commerce platform integration, and seller tooling. Products collectively support $100M+ in revenue.",
    },
    {
      company: "Volkswagen Canada",
      title: "Product Designer",
      startDate: "2018",
      endDate: "2019",
      description:
        "Designed the cross-brand car comparison tool, now serving 112,000+ monthly users across Canada.",
    },
    {
      company: "Meridian Credit Union",
      title: "Lead Product Designer",
      startDate: "2017",
      endDate: "2018",
      description:
        "End-to-end redesign of the mobile banking app for 370,000+ members. Design adopted across the entire Meridian ecosystem.",
    },
  ],
  education: [
    {
      institution: "Placeholder University",
      degree: "Bachelor of Design",
      field: "Interaction Design",
      graduationYear: 2017,
    },
  ],
  skills: [
    "Product Design",
    "Design Systems",
    "AI Products",
    "Figma",
    "User Research",
    "Prototyping",
    "Shadcn",
    "Claude Code",
  ],
}
