import { AppShell } from "@/components/shell/app-shell"

// A static segment, so it takes precedence over the [slug] route alongside
// it. It exists for deep links — sharing the deck, or landing on it from the
// chat — and renders the SAME shell as "/" with the deck pane already open,
// so a visitor arriving here gets the rail rather than an orphaned page.
//
// In-app, the rail's CASE STUDY row does NOT navigate here: it swaps the
// pane, because a route change would remount the shell and discard every
// project thread. This route is the deep-link entry, not the in-app path.
export const metadata = {
  title: "Meridian Mobile Banking — Case Study",
  description:
    "The full case study deck for the Meridian mobile banking redesign: research, the old app, the redesign, testing, and impact.",
}

export default function MeridianDeckPage() {
  return <AppShell initialPane="deck" />
}
