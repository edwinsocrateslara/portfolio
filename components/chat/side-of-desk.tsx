"use client"

import { useState } from "react"

interface SideProject {
  companies: string[]
  title: string
  description: string
  url: string
  status?: "in-progress" | "live"
}

// Placeholder cards, dev-only. They exist to visualise the section's end
// state while there is no real content for it. The ternary is deliberate:
// `process.env.NODE_ENV` is inlined at build time, so in a production build
// this collapses to a constant-false condition and the minifier drops the
// array literal entirely — the placeholder copy and its "#" hrefs never
// reach the client bundle. Replace with real entries when they exist.
const PROJECTS: SideProject[] =
  process.env.NODE_ENV === "development"
    ? [
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
    : []

function SideProjectCard({ project }: { project: SideProject }) {
  const [hovered, setHovered] = useState(false)
  const isInternal = project.url.startsWith("/")

  return (
    <a
      href={project.url}
      target={isInternal ? undefined : "_blank"}
      rel={isInternal ? undefined : "noopener noreferrer"}
      style={{
        display: "block",
        background: "rgb(var(--bureau-surface))",
        border: `1px solid rgb(var(--bureau-${hovered ? "border-strong" : "border"}))`,
        borderRadius: "var(--bureau-radius-card)",
        padding: "clamp(var(--space-24), 3vw, var(--space-32))",
        textDecoration: "none",
        transition: "border-color 0.15s, transform 0.15s",
        transform: hovered ? "translateY(-1px)" : "translateY(0)",
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
          gap: "var(--space-group)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Company eyebrow */}
          <div
            className="type-label"
            style={{
              color: "rgb(var(--bureau-text-secondary))",
              marginBottom: "var(--space-within)",
            }}
          >
            {project.companies.join(" · ")}
          </div>

          {/* Title */}
          <h3
            className="type-title"
            style={{
              color: "rgb(var(--bureau-text-primary))",
              margin: "0 0 var(--space-within)",
            }}
          >
            {project.title}
          </h3>

          {/* Description */}
          <p
            style={{
              color: "rgb(var(--bureau-text-secondary))",
              margin: "0 0 var(--space-between)",
            }}
            className="type-caption"
          >
            {project.description}
          </p>

          {/* View → CTA */}
          <span
            className="type-label"
            style={{
              color: "rgb(var(--bureau-text-primary))",
              borderBottom: "1px solid rgb(var(--bureau-border-strong))",
              // Optical: cap-height-to-underline gap on uppercase mono.
              // 4px visibly loosens it. Documented exception.
              paddingBottom: 3,
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-within)",
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
          <div style={{ flexShrink: 0, paddingTop: "var(--space-4)" }}>
            {project.status === "in-progress" ? (
              <span
                className="type-label"
                style={{
                  display: "inline-block",
                  // Asymmetric: optical compensation for uppercase mono
                  // tracking. Documented exception.
                  padding: "5px 9px",
                  border: "1px solid rgb(var(--bureau-border-strong))",
                  borderRadius: "var(--bureau-radius-chip)",
                  color: "rgb(var(--bureau-text-secondary))",
                }}
              >
                In Progress
              </span>
            ) : (
              <span
                className="type-badge"
                style={{
                  display: "inline-block",
                  // Asymmetric: see above. Documented exception.
                  padding: "5px 9px",
                  borderRadius: "var(--bureau-radius-chip)",
                  background: "rgb(var(--bureau-accent))",
                  color: "rgb(var(--bureau-on-accent))",
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

// Whether there is anything to show. The sidebar reads this to decide if the
// VIBE CODING rail row should exist at all: in production PROJECTS is empty
// (see the note on the array), and a rail row leading to a blank pane is the
// same "bare heading over an empty list" problem this component already
// refuses to render. One flag, so the two cannot disagree.
export const hasSideProjects = PROJECTS.length > 0

export function SideOfDesk() {
  // With the placeholders gone in production there is nothing to show, and a
  // bare heading over an empty list reads as broken. Drop the whole section
  // until it has real entries.
  if (PROJECTS.length === 0) return null

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
          marginBottom: "var(--space-group)",
          gap: "var(--space-group)",
        }}
      >
        <div>
          <div
            className="type-label"
            style={{
              color: "rgb(var(--bureau-text-secondary))",
              marginBottom: "var(--space-between)",
              display: "flex",
              alignItems: "center",
              gap: "var(--space-within)",
            }}
          >
            <span style={{ display: "inline-block", width: "var(--space-8)", height: "var(--space-8)", background: "rgb(var(--bureau-text-secondary))", flexShrink: 0 }} /> AI Practice
          </div>
          <h2 className="type-h2" style={{ margin: 0, color: "rgb(var(--bureau-text-primary))" }}>
            Vibe Coded Prototypes & Tools
          </h2>
        </div>
      </div>

      {/* Card list */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-between)" }}>
        {PROJECTS.map((project) => (
          <SideProjectCard key={project.title} project={project} />
        ))}
      </div>
    </section>
  )
}
