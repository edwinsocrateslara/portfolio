"use client"

import Image from "next/image"
import { useState } from "react"
import type { Project } from "@/lib/projects"

interface LandingProjectCardProps {
  project: Project
  index: number
  onClick: (slug: string) => void
}

export function LandingProjectCard({ project, index, onClick }: LandingProjectCardProps) {
  const [hover, setHover] = useState(false)
  const isAiProject = project.tags.some(
    (t) => t.toLowerCase() === "ai"
  )

  return (
    <button
      type="button"
      onClick={() => onClick(project.slug)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="w-full text-left"
      style={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image area — 1:1 aspect, grayscale(.15) → grayscale(0) + border-strong + lift on hover */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "1 / 1",
          overflow: "hidden",
          background: "rgb(var(--bureau-elevated))",
          border: `1px solid rgb(var(--bureau-${hover ? "border-strong" : "border"}))`,
          borderRadius: "var(--bureau-radius-card)",
          transform: hover ? "translateY(-1px)" : "translateY(0)",
          transition: "border-color 0.25s cubic-bezier(0.2, 0.8, 0.2, 1), transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Image
          src={project.previewImage.url}
          alt={project.previewImage.alt}
          fill
          className="object-contain p-[6%]"
          style={{
            transform: hover ? "scale(1.02)" : "scale(1)",
            transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1), filter 0.2s",
            filter: hover ? "grayscale(0)" : "grayscale(.15)",
          }}
          sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, 33vw"
        />
        {isAiProject && (
          <div
            className="type-badge"
            style={{
              position: "absolute",
              top: "var(--space-12)",
              left: "var(--space-12)",
              // Asymmetric: optical compensation for uppercase mono's
              // trailing letter-space. Documented exception.
              padding: "var(--space-4) 7px",
              background: "rgb(var(--bureau-bg) / 0.72)",
              border: "1px solid rgb(var(--bureau-border))",
              borderRadius: "var(--bureau-radius-chip)",
              color: "rgb(var(--bureau-text-primary))",
              backdropFilter: "blur(4px)",
            }}
          >
            AI
          </div>
        )}
        {project.status === "wip" && (
          <div
            className="type-badge"
            style={{
              position: "absolute",
              top: "var(--space-12)",
              right: "var(--space-12)",
              // Asymmetric: see AI badge above. Documented exception.
              padding: "var(--space-4) 7px",
              borderRadius: "var(--bureau-radius-chip)",
              background: "rgb(var(--bureau-accent))",
              color: "rgb(var(--bureau-on-accent))",
            }}
          >
            In progress
          </div>
        )}
        <div
          className="type-nav"
          style={{
            position: "absolute",
            bottom: "var(--space-8)",
            right: "var(--space-12)",
            color: "rgb(var(--bureau-text-primary))",
            textShadow: "0 1px 3px rgba(0, 0, 0, .6)",
          }}
        >
          {String(index + 1).padStart(2, "0")}
        </div>
      </div>

      {/* Body */}
      <div
        style={{
          padding: "var(--space-20) var(--space-24) var(--space-24)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--space-within)",
          flex: 1,
        }}
      >
        <span
          className="type-label"
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          {project.client}
        </span>
        <h3
          className="type-card-h3"
          style={{
            color: "rgb(var(--bureau-text-primary))",
            margin: 0,
          }}
        >
          {project.projectTitle}
        </h3>
        <p
          className="type-caption"
          style={{
            color: "rgb(var(--bureau-text-secondary))",
            margin: 0,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {project.tagline}
        </p>
        <div
          style={{
            marginTop: "auto",
            paddingTop: "var(--space-between)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "var(--space-within)",
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-within)" }}>
            {project.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                className="type-label"
                style={{
                  // Asymmetric: see badges above. Documented exception.
                  padding: "var(--space-4) 7px",
                  color: "rgb(var(--bureau-text-muted))",
                  border: "1px solid rgb(var(--bureau-border))",
                  borderRadius: "var(--bureau-radius-chip)",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <span
            className="type-label"
            style={{
              color: "rgb(var(--bureau-text-primary))",
              display: "inline-flex",
              alignItems: "center",
              gap: "var(--space-within)",
            }}
          >
            View
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              style={{
                transform: hover ? "translate(2px, -2px)" : "translate(0, 0)",
                transition: "transform 0.2s",
              }}
            >
              <path
                d="M7 17L17 7M17 7H9M17 7V15"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </div>
    </button>
  )
}
