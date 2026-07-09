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
      className="w-full text-left overflow-hidden"
      style={{
        background: "#1a1a1a",
        borderRadius: 8,
        boxShadow: hover
          ? "rgb(var(--color-accent) / 0.15) 0px 8px 32px, rgb(var(--color-accent) / 0.10) 0px 16px 48px"
          : "rgb(var(--color-accent) / 0.08) 0px 4px 16px",
        transition: "all 0.25s cubic-bezier(0.2, 0.8, 0.2, 1)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image area — 4:3 aspect */}
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          overflow: "hidden",
          background: "#262626",
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
            transition: "transform 0.2s cubic-bezier(0.2, 0.8, 0.2, 1)",
            filter: "drop-shadow(0 8px 20px rgba(0, 0, 0, 0.4))",
          }}
          sizes="(max-width: 560px) 100vw, (max-width: 860px) 50vw, 33vw"
        />
        {isAiProject && (
          <div
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 400,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              background: "#1f1f1f",
              color: "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <span style={{ display: "inline-block", width: 8, height: 8, background: "rgb(var(--color-accent))", flexShrink: 0 }} /> AI
          </div>
        )}
        {project.status === "wip" && (
          <div
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              padding: "4px 8px",
              fontSize: 10,
              fontWeight: 400,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              background: "rgb(var(--color-accent))",
              color: "#ffffff",
            }}
          >
            In progress
          </div>
        )}
        <div
          className="font-mono"
          style={{
            position: "absolute",
            bottom: 12,
            right: 12,
            fontSize: 11,
            color: "rgb(var(--color-accent))",
            fontWeight: 400,
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
            fontSize: 10,
            fontWeight: 400,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            color: "rgb(var(--color-accent))",
          }}
        >
          {project.client}
        </span>
        <h3
          style={{
            fontSize: 20,
            lineHeight: 1.2,
            color: "#ffffff",
            margin: 0,
            fontWeight: 500,
          }}
        >
          {project.projectTitle}
        </h3>
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: "#b4b4b4",
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {project.tags.slice(0, 2).map((t) => (
              <span
                key={t}
                style={{
                  padding: "4px 8px",
                  fontSize: 11,
                  color: "#b4b4b4",
                  background: "#262626",
                  textTransform: "uppercase",
                  letterSpacing: "0.3px",
                }}
              >
                {t}
              </span>
            ))}
          </div>
          <span
            style={{
              fontSize: 12,
              color: hover ? "rgb(var(--color-accent))" : "#ffffff",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              transition: "color 0.15s",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
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
