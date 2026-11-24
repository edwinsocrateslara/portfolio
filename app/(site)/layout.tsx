import { AppShell } from "@/components/shell/app-shell"
import { projects } from "@/lib/projects"
import { offRailVibeProjects, vibeProjects } from "@/lib/vibe-projects"
import { toProjectIndex } from "@/lib/project-index"

// THE SHELL LIVES HERE, IN A LAYOUT, so it mounts ONCE per visit.
//
// An App Router layout is not re-rendered from scratch when the visitor moves
// between the pages under it — it persists, and so does every piece of state
// inside it: each project's thread, the chat in flight, the scroll positions.
// That is what lets these routes become real URLs (PRODUCT.md, "A URL
// addresses a thread, never a page") without a navigation throwing away the
// conversation. Before 24 November each page rendered its own AppShell, so a
// route change would have remounted the shell and discarded every thread —
// which is why the rail's document rows were buttons rather than links.
//
// The pages under this group are thin: they carry their metadata and, later,
// the server-rendered content of their route. The shell reads the URL itself
// (usePathname) to know what to show, because a layout cannot be handed props
// by the page beneath it.
//
// The route group "(site)" adds nothing to the URL. Everything outside it —
// /api/*, the icon and link-card routes, and not-found — renders without the
// shell, as before.

// DERIVED HERE, in a server component, and handed down as a prop. The full
// project modules are imported on the server — where they cost nothing — and
// only the 6 fields the rail needs cross into the client tree. See
// lib/project-index.ts for why that is a mapping rather than a second file.
const index = [
  ...toProjectIndex(projects, "work"),
  ...toProjectIndex(vibeProjects, "vibe"),
  ...toProjectIndex(offRailVibeProjects, "off-rail"),
]

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppShell projectIndex={index} />
      {children}
    </>
  )
}
