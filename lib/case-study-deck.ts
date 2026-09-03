// The Meridian case study deck.
//
// Deliberately NOT a Project. It has no client, role, status, or
// challenge/at-stake/decision — forcing it into that type would mean a pile of
// optional fields that every real project leaves empty. A dormant second
// variant on Project once demonstrated that shape problem and was deleted for
// it. This is a document, so it gets a document's type.
//
// `alt` here is repo-authored, like the alt on Project images: the source PDF
// carries no alt text. It was written from viewing each rendered slide, to the
// rule in lib/sources/README.md § "Alt text describes the frame".
//
// ── PERSONAL DATA VISIBLE IN THE SLIDES: RULED ON, RECORDED, CLOSED ───────
//
// An audit of all 21 rendered slides raised three of these. All three were
// ruled on by Edwin and NONE of them is a defect. They are written down here
// so the next audit finds the ruling instead of re-raising the finding — which
// is the whole reason this file carries comments at all.
//
// NO IMAGE IN THIS DECK IS TO BE EDITED. Nothing blurred, nothing redacted,
// nothing cropped. The deck ships exactly as the company cleared it for
// publication, and a well-meant redaction would be a portfolio piece that no
// longer matches the artefact it claims to be.
//
//   SLIDE 18 (slide-19.webp) — 4 tester email addresses are legible in the
//   TestFlight panels. RULED: the deck was cleared for publication by
//   Meridian with those panels in it. It ships as-is, deliberately. This is
//   not an oversight and not a thing to fix later.
//
//   SLIDE 05 (slide-05.webp) — the side menu shows a name and the account
//   number 1000114239. RULED: confirmed dummy data. The balances are $0.00
//   and the last-login date reads "January 1st 0001"; it is a test account.
//
//   (The third was public/framer/product-management/image-2.png, outside this
//   file — an order detail showing a customer name, email, phone and address.
//   RULED: confirmed dummy data. Noted here because the audit that found it
//   found these two in the same pass.)
//
// The deck names the product "motusbank", Meridian Credit Union's digital-only
// bank. The site names this work Meridian throughout. Both are correct; see
// lib/sources/README.md and the relationship line in lib/sources/voice.md.

import { DOCS } from "./constants"

export interface DeckSlide {
  url: string
  alt: string
}

export interface CaseStudyDeck {
  slug: string
  /** Prose form, for the chat's deck answer. The pane does not show it. */
  title: string
  /** Atomic, because the metadata row joins them with punctuation the data
      should not carry: "{client} — {subject} · {n} slides". Same split as
      Project's client/railSubtitle. */
  client: string
  subject: string
  /** Served from public/, downloadable. Sourced from DOCS rather than written
      here — see the note on the value below. */
  pdf: string
  slides: DeckSlide[]
}

export const meridianDeck: CaseStudyDeck = {
  slug: "meridian-deck",
  title: "Meridian Mobile Banking",
  client: "Meridian",
  subject: "Mobile Banking",
  // ONE PATH, ONE PLACE. This used to restate "/meridian-case-study.pdf",
  // which DOCS["meridian-case-study"].url already said — the same file named
  // in two files with nothing keeping them in step.
  //
  // The asymmetry was what made it worth removing rather than guarding:
  // check:docs imports DOCS and asserts the file exists. It has never read
  // this file. Rename or move that PDF, update DOCS, and the gate goes green
  // while the deck pane's Download button 404s — the one path not covered is
  // the one that breaks. Reading it from DOCS deletes the duplication instead
  // of adding a second thing to check.
  pdf: DOCS["meridian-case-study"].url,
  slides: [
    {
      url: "/case-study/meridian/slide-01.webp",
      alt: "Title slide reading \"Past Work\" in white type on black.",
    },
    {
      url: "/case-study/meridian/slide-02.webp",
      alt: "Background slide: motusbank is Meridian's digital bank for younger customers. Beside it, 2 screens from the redesigned app — an accounts list and a prompt to add a first e-Transfer contact.",
    },
    {
      url: "/case-study/meridian/slide-03.webp",
      alt: "Team slide: an Area VP, senior and product managers, and 5 developers. Beside them the product designer's contributions, from research and user stories through wireframes, IA and UI to testing and handoff.",
    },
    {
      url: "/case-study/meridian/slide-04.webp",
      alt: "Old-design findings from tellers and earlier surveys: broken navigation, confusing flows, an unappealing interface, missing investing and credit products, no Face ID. Beside them, a Meridian branch with a living plant wall.",
    },
    {
      url: "/case-study/meridian/slide-05.webp",
      alt: "4 screens of the old Meridian app annotated in red, marking confusing navigation, no way back, information overload, and key products missing from the side menu.",
    },
    {
      url: "/case-study/meridian/slide-06.webp",
      alt: "3 old-app screens annotated in red: poor wayfinding on the e-Transfer request, confusing verbiage on cheque deposit, and weak hierarchy in the settings list.",
    },
    {
      url: "/case-study/meridian/slide-07.webp",
      alt: "App Store reviews of the old app with the critical passages highlighted, complaining about the look, the layout, slowness, a cluttered account screen, and the missing Face ID option.",
    },
    {
      url: "/case-study/meridian/slide-08.webp",
      alt: "Data team findings on what customers actually did in the app, beside the board's KPIs for ratings, onboarding, retention and product opening.",
    },
    {
      url: "/case-study/meridian/slide-09.webp",
      alt: "Solution slide showing the redesigned sign-in screen and accounts overview from the new Meridian app.",
    },
    {
      url: "/case-study/meridian/slide-10.webp",
      alt: "3 redesigned confirmation screens, each with an illustrated character and a prompt asking what the customer wants to do next.",
    },
    {
      url: "/case-study/meridian/slide-11.webp",
      alt: "The redesigned apps section, with remote cheque deposit and the Price Drop feature, its onboarding, and a scanned receipt under review.",
    },
    {
      url: "/case-study/meridian/slide-12.webp",
      alt: "Research inputs: a survey chart ranking how people allocate a paycheck, and a persona board covering media, food, financial habits and attitudes.",
    },
    {
      url: "/case-study/meridian/slide-13.webp",
      alt: "Process work in progress: a printed day-in-the-life journey map, and whiteboards of sticky notes grouping features under transfers, bills, fun and get in touch.",
    },
    {
      url: "/case-study/meridian/slide-14.webp",
      alt: "The project board tracking discovery, design and validation tasks alongside user stories grouped by bill planning, omnichannel, sending money, tracking, and credit and loans.",
    },
    {
      url: "/case-study/meridian/slide-15.webp",
      alt: "A wireframe flow for setting up a transfer between accounts, annotated scenario by scenario, above the full information architecture sitemap for the app.",
    },
    {
      url: "/case-study/meridian/slide-16.webp",
      alt: "A still from a user testing session, with a participant and moderator seated in a meeting room.",
    },
    {
      url: "/case-study/meridian/slide-17.webp",
      alt: "User testing feedback listing 6 changes made in response, including moving remote cheque deposit into its own section, updating confusing iconography, and repositioning the amount field.",
    },
    {
      url: "/case-study/meridian/slide-18.webp",
      // 546 is this slide's headline and the only figure on it, and it was
      // missing from this string until an audit read the frame. It is stated
      // in exactly 2 places on purpose — here, and verbatim in
      // lib/sources/meridian-case-study.txt, which reaches the model. Adding
      // it to the Meridian project copy was proposed and declined; the
      // reasoning is at that entry in lib/projects.ts.
      alt: "Beta test with 546 users. 4 TestFlight screenshot-feedback panels, each pairing a tester's annotated screenshot with their written comment.",
    },
    {
      url: "/case-study/meridian/slide-19.webp",
      alt: "App Store reviews after launch, 4 and 5 star ratings praising the redesign, several with developer replies.",
    },
    {
      url: "/case-study/meridian/slide-20.webp",
      alt: "Adoption slide noting Meridian rolled the new design patterns across all mobile products, beside an accounts screen in Meridian's own blue and gold branding.",
    },
    {
      url: "/case-study/meridian/slide-21.webp",
      alt: "Impact slide: used by 370,000 customers, helping manage $26 billion in assets.",
    },
  ],
}
