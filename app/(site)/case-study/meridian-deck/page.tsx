// The deck's own URL, kept exactly as it was — it may already be shared.
//
// The shell is rendered by app/(site)/layout.tsx and opens the deck pane when
// it sees this path (see the note on PANE_FOR_PATH in app-shell.tsx). This
// page carries the route's metadata and nothing else.
//
// In-app, the rail's CASE STUDY row still swaps the pane rather than linking
// here. That is now a choice rather than a constraint: since the shell moved
// into the shared layout (24 November), navigating to this route would NOT
// remount it or discard any thread. Turning the rail's document rows into real
// links is the next piece of the routing work.
export const metadata = {
  title: "Meridian Mobile Banking — Case Study",
  description:
    "The full case study deck for the Meridian mobile banking redesign: research, the old app, the redesign, testing, and impact.",
}

export default function MeridianDeckPage() {
  return null
}
