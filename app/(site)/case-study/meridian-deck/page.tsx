import { DeckPane } from "@/components/case-study/deck-pane"
import { pageMetadata } from "@/lib/page-metadata"

// The deck's own URL, kept exactly as it was — it may already be shared.
//
// The deck renders on the SERVER, into this page's HTML, and the shell
// (app/(site)/layout.tsx) places it in the pane and marks the rail's CASE
// STUDY row active, because PANE_FOR_PATH maps this path to "deck". Until 24
// November the shell loaded the deck client-side with ssr: false, and this
// URL's HTML carried 55 visible words and not one slide's text.
// The description names the deck's sections — what the document contains,
// not a claim about Edwin — and predates the routing work.
export const metadata = pageMetadata({
  path: "/case-study/meridian-deck",
  title: "Meridian Mobile Banking — Case Study",
  description:
    "The full case study deck for the Meridian mobile banking redesign: research, the old app, the redesign, testing, and impact.",
})

export default function MeridianDeckPage() {
  return <DeckPane />
}
