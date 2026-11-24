import { AboutPane } from "@/components/about/about-pane"

// /about — rendered on the server into this page's HTML; the shell places it
// in the pane and marks the rail's ABOUT row active (PANE_FOR_PATH).
//
// TITLE ONLY, deliberately: the description falls back to the site's. A
// description is what a search result shows, so it is a claim about Edwin and
// has to trace to lib/sources/. The About lede is a JSX literal that
// check:voice asserts against voice.md in place and cannot be imported, and a
// paraphrase here would be unsourced copy. Per-page descriptions are the
// search piece of the routing work.
export const metadata = {
  title: "About — Edwin Socrates Lara",
}

export default function AboutPage() {
  return <AboutPane />
}
