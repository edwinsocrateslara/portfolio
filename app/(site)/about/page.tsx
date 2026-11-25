import { AboutPane } from "@/components/about/about-pane"
import { pageMetadata, SITE_DESCRIPTION } from "@/lib/page-metadata"

// /about — rendered on the server into this page's HTML; the shell places it
// in the pane and marks the rail's ABOUT row active (PANE_FOR_PATH).
//
// THE SITE'S DESCRIPTION, deliberately, not one of its own. A description is
// what a search result shows, so it is a claim about Edwin and has to trace to
// lib/sources/. The About lede is a JSX literal that check:voice asserts
// against voice.md in place and cannot be imported, and a paraphrase here
// would be unsourced copy. If the lede ever moves into an importable,
// voice-checked constant, it becomes this description.
export const metadata = pageMetadata({
  path: "/about",
  title: "About — Edwin Socrates Lara",
  description: SITE_DESCRIPTION,
})

export default function AboutPage() {
  return <AboutPane />
}
