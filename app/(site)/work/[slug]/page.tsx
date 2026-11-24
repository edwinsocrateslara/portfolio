import type { Metadata } from "next"
import { projects } from "@/lib/projects"
import { vibeProjects } from "@/lib/vibe-projects"

// /work/<slug> — a project's THREAD, not a page (PRODUCT.md, "A URL addresses
// a thread, never a page"). The shell renders it: on a fresh load its first
// render builds the reveal FINISHED from this path (finishedReveal in
// app-shell.tsx), so the case study is in this URL's HTML as the site's own
// messages, with the composer beneath them. This file renders nothing itself —
// a project page with its own layout here is exactly what PRODUCT.md rules out.
//
// ONE ROUTE PER PROJECT THE RAIL LISTS: the seven Work projects and whatever
// is in `vibeProjects`, so a new vibe project gets its URL by being added
// there, like it gets its rail row. offRailVibeProjects is deliberately not
// here — unlisted projects have no URL — and dynamicParams = false makes any
// other slug, the off-rail one included, a 404 rather than an empty thread.
const LISTED = [...projects, ...vibeProjects]

export const dynamicParams = false

export function generateStaticParams() {
  return LISTED.map((p) => ({ slug: p.slug }))
}

// The title is the project's own fields, from lib/projects.ts — its source of
// truth — not copy written for this page. Descriptions and link-card details
// are the search piece of the routing work.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const p = LISTED.find((x) => x.slug === slug)
  return p ? { title: `${p.projectTitle} — ${p.client} · Edwin Socrates Lara` } : {}
}

export default function ProjectPage() {
  return null
}
