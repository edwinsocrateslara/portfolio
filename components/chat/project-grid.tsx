import { projects } from "@/lib/projects"
import { LandingProjectCard } from "@/components/chat/landing-project-card"

interface ProjectGridProps {
  onProjectClick: (slug: string) => void
}

export function ProjectGrid({ onProjectClick }: ProjectGridProps) {
  return (
    <section id="work">
      {/* Header row */}
      <div
        className="mb-12 flex items-baseline justify-between flex-wrap gap-2"
      >
        <h2
          style={{
            fontSize: 48,
            fontWeight: 500,
            lineHeight: 1.15,
            color: "#ffffff",
            margin: 0,
          }}
        >
          Selected Work
        </h2>
        <span
          className="font-mono text-[12px] uppercase tracking-[0.5px]"
          style={{ color: "rgb(var(--color-accent))" }}
        >
          01 — {String(projects.length).padStart(2, "0")}
        </span>
      </div>
      <div
        className="grid gap-5"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
        }}
      >
        {projects.map((project, index) => (
          <LandingProjectCard
            key={project.slug}
            project={project}
            index={index}
            onClick={onProjectClick}
          />
        ))}
      </div>
      <style>{`
        @media (max-width: 860px) {
          section#work > div:last-child { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 560px) {
          section#work > div:last-child { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </section>
  )
}
