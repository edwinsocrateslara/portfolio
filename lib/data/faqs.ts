export interface FAQ {
  question: string
  answer: string
  category?: string
}

export const faqs: FAQ[] = [
  {
    question: "Are you available for freelance work?",
    answer:
      "Yes — I'm open to freelance and contract engagements for product design, prototyping, and design systems work. Best reached by email at edwinsocrateslara@gmail.com.",
    category: "availability",
  },
  {
    question: "What industries have you worked in?",
    answer:
      "Consumer fintech, live commerce, automotive, e-commerce, B2B SaaS, and AI products. Most of my work has been at the lead designer level with direct impact on business outcomes.",
    category: "background",
  },
  {
    question: "Do you do design systems work?",
    answer:
      "Yes. I built the design system for FutureFit AI using Shadcn and design tokens, specifically to work well with AI tools like v0, Lovable, and Claude Code. I also built one for Meridian Credit Union as part of their full mobile app redesign.",
    category: "skills",
  },
  {
    question: "What tools do you use?",
    answer:
      "Figma, Shadcn, v0, Claude Code, Lovable, OpenAI API, Maze, UserTesting, GitHub.",
    category: "skills",
  },
]
