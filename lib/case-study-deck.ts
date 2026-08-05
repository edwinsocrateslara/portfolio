// The Meridian case study deck.
//
// Deliberately NOT a Project. It has no client, role, status, tags, or
// challenge/at-stake/decision — forcing it into that type would mean another
// eight optional fields that every real project leaves empty, which is the
// shape problem the dormant vibe-coded variant already demonstrates. It is a
// document, so it gets a document's type.
//
// `alt` here is repo-authored, like the alt on Project images: the source PDF
// carries no alt text. It was written from viewing each rendered slide.
//
// The deck names the product "motusbank", Meridian Credit Union's digital-only
// bank. The site names this work Meridian throughout. Both are correct; see
// lib/sources/README.md and the relationship line in lib/sources/voice.md.

export interface DeckSlide {
  url: string
  alt: string
}

export interface CaseStudyDeck {
  slug: string
  title: string
  subtitle: string
  intro: string
  /** Served from public/, downloadable. */
  pdf: string
  slides: DeckSlide[]
}

export const meridianDeck: CaseStudyDeck = {
  slug: "meridian-deck",
  title: "Meridian Mobile Banking",
  subtitle: "Case study deck",
  intro:
    "The full deck: research, the old app, the redesign, testing, and impact.",
  pdf: "/meridian-case-study.pdf",
  slides: [
    {
      url: "/case-study/meridian/slide-01.webp",
      alt: "Title slide reading \"Past Work\" in white type on black.",
    },
    {
      url: "/case-study/meridian/slide-02.webp",
      alt: "Background slide introducing the Meridian project, with two screens from the redesigned app: an accounts list and an empty-state prompt to add a first e-Transfer contact.",
    },
    {
      url: "/case-study/meridian/slide-03.webp",
      alt: "Team slide listing an Area VP, senior and product managers, and five developers, beside the product designer contributions: research and workshops, user stories, wireframes and information architecture, UI, reviews, prototypes, user testing and developer handoff.",
    },
    {
      url: "/case-study/meridian/slide-04.webp",
      alt: "Old-design findings from tellers and earlier surveys: broken navigation, confusing flows, an unappealing interface, missing investing and credit products, and no Face ID login. Beside them, a photo of a Meridian branch with a living plant wall.",
    },
    {
      url: "/case-study/meridian/slide-05.webp",
      alt: "Four screens of the old Meridian app annotated in red, marking confusing navigation, no way back, information overload, and key products missing from the side menu.",
    },
    {
      url: "/case-study/meridian/slide-06.webp",
      alt: "Three more old-app screens annotated in red, marking poor wayfinding, confusing verbiage, and weak hierarchy in the settings list.",
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
      alt: "Three redesigned confirmation screens, each with an illustrated character and a prompt asking what the customer wants to do next.",
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
      alt: "User testing feedback listing six changes made in response, including moving remote cheque deposit into its own section, updating confusing iconography, and repositioning the amount field.",
    },
    {
      url: "/case-study/meridian/slide-18.webp",
      alt: "Screenshot feedback from the beta, four TestFlight panels each pairing a tester's annotated screenshot with their written comment.",
    },
    {
      url: "/case-study/meridian/slide-19.webp",
      alt: "App Store reviews after launch, four and five star ratings praising the redesign, several with developer replies.",
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
