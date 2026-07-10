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
      {/* Image area — 16:11 aspect, grayscale(.15) → grayscale(0) + border-strong + lift on hover */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 11",
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
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              padding: "4px 7px",
              font: "600 9px/1 var(--ff-plex-mono)",
              letterSpacing: "0.8px",
              background: "rgba(19, 19, 19, .72)",
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
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "4px 7px",
              font: "700 8px/1 var(--ff-plex-mono)",
              letterSpacing: "0.8px",
              textTransform: "uppercase",
              borderRadius: "var(--bureau-radius-chip)",
              background: "rgb(var(--bureau-accent))",
              color: "rgb(var(--bureau-on-accent))",
            }}
          >
            In progress
          </div>
        )}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            right: 12,
            font: "500 11px/1 var(--ff-plex-mono)",
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
          padding: "20px 24px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          flex: 1,
        }}
      >
        <span
          style={{
            font: "600 10px/1 var(--ff-plex-mono)",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: "rgb(var(--bureau-text-secondary))",
          }}
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
          style={{
            font: "400 13.5px/1.5 var(--ff-archivo)",
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
            paddingTop: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {project.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                style={{
                  padding: "4px 7px",
                  font: "600 9px/1 var(--ff-plex-mono)",
                  letterSpacing: "0.6px",
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
            style={{
              font: "600 10px/1 var(--ff-plex-mono)",
              letterSpacing: "1px",
              color: "rgb(var(--bureau-text-primary))",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              textTransform: "uppercase",
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
