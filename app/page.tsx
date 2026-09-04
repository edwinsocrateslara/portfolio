import { AppShell } from "@/components/shell/app-shell"
import { projects } from "@/lib/projects"
import { vibeProjects } from "@/lib/vibe-projects"
import { toProjectIndex } from "@/lib/project-index"

// The shell itself lives in components/shell/app-shell.tsx because the deck
// route renders it too. This file is only the "/" entry point.
//
// THE RÉSUMÉ USED TO BE PARSED HERE and passed down. It is not any more: a
// prop is serialised into this page's HTML, so every visitor received 6 roles,
// 21 bullets, 6 skills bands and 3 education entries whether or not they ever
// opened the Resume pane. The pane fetches /api/resume instead, which imports
// the same parser — one source, delivered to the people who ask for it.

// DERIVED HERE, in a server component, and handed down as a prop. The full
// project modules are imported on the server — where they cost nothing — and
// only the 6 fields the rail needs cross into the client tree. See
// lib/project-index.ts for why that is a mapping rather than a second file.
const index = [...toProjectIndex(projects, "work"), ...toProjectIndex(vibeProjects, "vibe")]

export default function HomePage() {
  return <AppShell projectIndex={index} />
}
