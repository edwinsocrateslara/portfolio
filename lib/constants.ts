export const DOCS = {
  // ⚠ THE FILE AT THIS PATH IS A PLACEHOLDER, not the résumé. It is one page
  // reading "PLACEHOLDER - NOT A RESUME", written so that if it ever reaches
  // the live site it is unmistakably an error rather than somebody's career.
  // Replace the FILE; this entry does not change when the real one lands.
  //
  // Local, so DocLinkBubble renders it as a download — that is derived from
  // the url rather than declared, so pointing here was the whole change. The
  // DocHub URL that used to live here is dead and was reachable three ways.
  resume: {
    key: "resume",
    label: "Edwin Socrates Lara — Resume 2026",
    description: "Product design resume",
    url: "/edwin-lara-resume-2026.pdf",
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
  // right shape for it — title, mono meta, trailing mark. A second card
  // component that differed only in the noun would be a second place for the
  // external-link rules to drift; DocLinkBubble now reads the difference off
  // this url instead, so there is nothing here to keep in agreement by hand.
  //
  // A redacted clone of the internal tool, so it can be opened by anyone. It
  // is the one thing a vibe-coded entry can offer that the seven work projects
  // structurally cannot: the actual artefact, running.
  //
  // The label is a VERB where the other two are titles, and that is the point:
  // the others hand you a thing, this one sends you somewhere. It also sits
  // under a heading that already names the project, so repeating the name here
  // spent the line twice.
  "ideas-showcase": {
    key: "ideas-showcase",
    label: "View live project",
    description: "Redacted, running",
    url: "https://future-fit-ideas-showcase.vercel.app",
  },
} as const

export type DocKey = keyof typeof DOCS
