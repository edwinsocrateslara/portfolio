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
        padding: "clamp(24px, 3vw, 30px) clamp(24px, 3vw, 32px)",
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
          gap: 24,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Company eyebrow */}
          <div
            style={{
              fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "10px", lineHeight: "1",
              letterSpacing: "1.4px",
              textTransform: "uppercase",
              color: "rgb(var(--bureau-text-secondary))",
              marginBottom: 12,
            }}
          >
            {project.companies.join(" · ")}
          </div>

          {/* Title */}
          <h3
            style={{
              fontFamily: "var(--ff-archivo)", fontWeight: 600, fontSize: "20px", lineHeight: "1.2",
              color: "rgb(var(--bureau-text-primary))",
              margin: "0 0 8px",
            }}
          >
            {project.title}
          </h3>

          {/* Description */}
          <p
            style={{
              fontFamily: "var(--ff-archivo)", fontWeight: 400, fontSize: "14px", lineHeight: "1.55",
              color: "rgb(var(--bureau-text-secondary))",
              margin: "0 0 18px",
            }}
          >
            {project.description}
          </p>

          {/* View → CTA */}
          <span
            style={{
              fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "11px", lineHeight: "1",
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "rgb(var(--bureau-text-primary))",
              borderBottom: "1px solid rgb(var(--bureau-border-strong))",
              paddingBottom: 3,
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
                  fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "9px", lineHeight: "1",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
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
                style={{
                  display: "inline-block",
                  fontFamily: "var(--ff-plex-mono)", fontWeight: 700, fontSize: "9px", lineHeight: "1",
                  letterSpacing: "1px",
                  textTransform: "uppercase",
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
          marginBottom: 48,
          gap: 24,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "10px", lineHeight: "1",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgb(var(--bureau-text-secondary))",
              marginBottom: 18,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, background: "rgb(var(--bureau-text-secondary))", flexShrink: 0 }} /> AI Practice
          </div>
          <h2 className="type-h2" style={{ margin: 0, color: "rgb(var(--bureau-text-primary))" }}>
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
