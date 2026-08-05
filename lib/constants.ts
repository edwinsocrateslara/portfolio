export const DOCS = {
  resume: {
    key: "resume",
    label: "Edwin Socrates Lara — Resume 2026",
    description: "Product design resume",
    url: "https://dochub.com/edwinsocrateslara/orO7lgeVLk9z02JKjMP2p5/edwin-socrates-lara-2026-docx?dt=DxoBt5hCbfZDbPkqfswW",
  },
  // Served from public/, not dochub. The deck is 21 slides and 7.2 MB; a
  // third-party viewer that could rot, rate-limit, or reflow it was doing no
  // work that the file itself doesn't do. The browsable version is at
  // /case-study/meridian-deck; this URL is the raw download.
  "meridian-case-study": {
    key: "meridian-case-study",
    label: "Meridian Credit Union — Case Study",
    description: "Full case study PDF",
    url: "/meridian-case-study.pdf",
  },
} as const

export type DocKey = keyof typeof DOCS
