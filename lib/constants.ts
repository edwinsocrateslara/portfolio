export const DOCS = {
  // GENERATED, NOT AUTHORED. All three files are written by
  // `npm run build:resume` from lib/sources/resume.txt, which is the master.
  // Do not hand-edit them; the next regeneration discards the edit, and
  // check:docs fails in the meantime because the stamp no longer matches.
  //
  // This entry replaced a one-page PDF reading "PLACEHOLDER - NOT A RESUME",
  // which was accurate, documented, and shipping — the defect that made
  // scripts/check-docs.mjs exist. It is now the same gate that guarantees the
  // real files track the source.
  //
  // Local, so DocLinkBubble renders it as a download — that is derived from
  // the url rather than declared. The DocHub URL that used to live here is
  // dead and was reachable three ways.
  resume: {
    key: "resume",
    label: "Edwin Socrates Lara — Resume 2026",
    description: "Product design resume",

    // ── `url` IS STILL THE DOCUMENT, AND `formats` IS ADDITIVE ────────────
    // Every existing reader of DOCS — DocLinkBubble, check:docs' existence
    // pass, the résumé pane's pill — asks for `url` and gets one file. Adding
    // a second field rather than replacing `url` with an array is what kept
    // this change to one component: the chat card is unchanged, because a
    // card in a transcript should hand you the document rather than ask you
    // to choose.
    //
    // PDF IS FIRST BECAUSE IT IS THE DEFAULT, and that is asserted rather
    // than assumed: check:docs fails if formats[0].url and url disagree. Two
    // ways to say which file is the default is two things to keep in
    // agreement by hand, and this is the cheap way out of it.
    url: "/edwin-lara-resume-2026.pdf",
    formats: [
      { ext: "pdf", label: "PDF", meta: "Formatted", url: "/edwin-lara-resume-2026.pdf" },
      { ext: "docx", label: "Word", meta: "Editable", url: "/edwin-lara-resume-2026.docx" },
      { ext: "md", label: "Markdown", meta: "Plain text", url: "/edwin-lara-resume-2026.md" },
    ],
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

/** One downloadable format of a document. Only `resume` has these today. */
export type DocFormat = { ext: string; label: string; meta: string; url: string }

/** The formats for a document, or null when it is offered as one file. */
export function docFormats(key: DocKey): readonly DocFormat[] | null {
  const doc = DOCS[key] as { formats?: readonly DocFormat[] }
  return doc.formats ?? null
}
