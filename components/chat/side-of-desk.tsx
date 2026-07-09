"use client"

import { useState } from "react"

interface SideProject {
  companies: string[]
  title: string
  description: string
  url: string
  status?: "in-progress" | "live"
}

const PROJECTS: SideProject[] = [
  {
    companies: ["FutureFit AI"],
    title: "Sample prototype one",
    description:
      "Short placeholder description of what this prototype does and the problem it solves.",
    url: "#",
    status: "in-progress",
  },
  {
    companies: ["FutureFit AI", "Coinley AI"],
    title: "Sample prototype two",
    description:
      "Another placeholder description covering the second prototype's purpose and outcome.",
    url: "#",
    status: "live",
  },
]

function SideProjectCard({ project }: { project: SideProject }) {
  const [hovered, setHovered] = useState(false)

  return (
    <a
      href={project.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block",
        background: hovered ? "#1f1f1f" : "#1a1a1a",
        border: `1px solid ${hovered ? "#3a3a3a" : "#262626"}`,
        borderRadius: 8,
        padding: "clamp(24px, 3vw, 36px) clamp(24px, 3vw, 40px)",
        textDecoration: "none",
        transition: "background 0.15s, border-color 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 24,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Company eyebrow */}
          <div
            style={{
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              color: "rgb(var(--color-accent))",
              marginBottom: 8,
            }}
          >
            {project.companies.join(" · ")}
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: "clamp(18px, 2vw, 22px)",
              fontWeight: 400,
              lineHeight: 1.2,
              color: "#ffffff",
              margin: "0 0 8px",
            }}
          >
            {project.title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.6,
              color: "#b4b4b4",
              margin: "0 0 20px",
            }}
          >
            {project.description}
          </p>

          {/* View → CTA */}
          <span
            style={{
              fontSize: 12,
              color: "rgb(var(--color-accent))",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            View
            <span
              style={{
                display: "inline-block",
                transform: hovered ? "translateX(4px)" : "translateX(0)",
                transition: "transform 0.15s",
              }}
            >
              →
            </span>
          </span>
        </div>

        {/* Status badge */}
        {project.status && (
          <div style={{ flexShrink: 0, paddingTop: 4 }}>
            {project.status === "in-progress" ? (
              <span
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  padding: "4px 8px",
                  background: "rgb(var(--color-accent))",
                  color: "#ffffff",
                }}
              >
                In Progress
              </span>
            ) : (
              <span
                style={{
                  display: "inline-block",
                  fontSize: 10,
                  fontWeight: 400,
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                  padding: "4px 8px",
                  border: "1px solid rgb(var(--color-accent) / 0.4)",
                  color: "rgb(var(--color-accent))",
                }}
              >
                Live
              </span>
            )}
          </div>
        )}
      </div>
    </a>
  )
}

export function SideOfDesk() {
  return (
    <section
      id="ai"
      className="mx-auto max-w-7xl px-6 py-20"
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 48,
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              color: "rgb(var(--color-accent))",
              marginBottom: 8,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, background: "rgb(var(--color-accent))", flexShrink: 0 }} /> AI Practice
          </div>
          <h2
            style={{
              fontSize: 48,
              fontWeight: 500,
              lineHeight: 1.15,
              color: "#ffffff",
              margin: 0,
            }}
          >
            Vibe Coded Prototypes & Tools
          </h2>
        </div>
      </div>

      {/* Card list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {PROJECTS.map((project) => (
          <SideProjectCard key={project.title} project={project} />
        ))}
      </div>
    </section>
  )
}
