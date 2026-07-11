import { notFound } from "next/navigation"
import { projects, placeholderVibeCodedProject } from "@/lib/projects"
import { CaseStudyView } from "@/components/case-study/case-study-view"

// Direct-navigation-only review route. Not linked from anywhere in the
// live site — reachable by typing the URL, for visually reviewing a case
// study (traditional or vibe-coded) outside the chat flow.
const REVIEWABLE_PROJECTS = [...projects, placeholderVibeCodedProject]

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = REVIEWABLE_PROJECTS.find((p) => p.slug === slug)

  if (!project) {
    notFound()
  }

  return <CaseStudyView project={project} />
}
