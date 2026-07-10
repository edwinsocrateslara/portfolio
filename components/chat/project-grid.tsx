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
        <h2 className="type-h2" style={{ margin: 0, color: "rgb(var(--bureau-text-primary))" }}>
          Selected Work
        </h2>
        <span
          style={{
            fontFamily: "var(--ff-plex-mono)", fontWeight: 500, fontSize: "12px", lineHeight: "1",
            letterSpacing: "1.5px",
            color: "rgb(var(--bureau-text-muted))",
          }}
        >
          01 — {String(projects.length).padStart(2, "0")}
        </span>
      </div>
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 26,
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
