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
  // Not a document, and that is a deliberate stretch of this table rather than
  // an oversight. It is a running deployment, and the doc-link card is the
  // right shape for it — glyph, title, mono meta, trailing mark. A second card
  // component that differed only in the noun would be a second place for the
  // external-link rules to drift.
  //
  // A redacted clone of the internal tool, so it can be opened by anyone. It
  // is the one thing a vibe-coded entry can offer that the seven work projects
  // structurally cannot: the actual artefact, running.
  "ideas-showcase": {
    key: "ideas-showcase",
    label: "Weekly Feedback Synthesis — live showcase",
    description: "Redacted, running",
    url: "https://future-fit-ideas-showcase.vercel.app",
  },
} as const

export type DocKey = keyof typeof DOCS
