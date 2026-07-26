import { notFound } from "next/navigation"
import { projects } from "@/lib/projects"
import { CaseStudyView } from "@/components/case-study/case-study-view"

// Direct-navigation-only review route. Not linked from anywhere in the
// live site — reachable by typing the URL, for visually reviewing a case
// study outside the chat flow.

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)

  if (!project) {
    notFound()
  }

  return <CaseStudyView project={project} />
}
