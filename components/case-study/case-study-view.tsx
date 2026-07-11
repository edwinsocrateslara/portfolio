"use client"

import { useState } from "react"
import Link from "next/link"
import type { Project } from "@/lib/projects"
import { CONTENT_WIDTH } from "@/lib/layout"
import { ChatInput } from "@/components/chat/chat-input"
import {
  TextBubble,
  ProjectHeaderBubble,
  ImageBubble,
  ImageRowBubble,
  ImpactBubble,
  FollowupsBubble,
} from "@/components/chat/message-bubbles"
import { ArchitectureSection } from "@/components/case-study/architecture-section"
import { ProofLinks } from "@/components/case-study/proof-links"

const CHAT_COLUMN = { maxWidth: CONTENT_WIDTH, margin: "0 auto" } as const

const FOLLOWUP_CHIPS = [
  { text: "Walk me through your work" },
  { text: "How do you design with AI?" },
  { text: "Show me your résumé" },
]

function ImagesSection({ images }: { images: Project["images"] }) {
  if (!images || images.length === 0) return null
  const shown = images.slice(0, Math.min(3, images.length))
  if (shown.length === 1) {
    return <ImageBubble image={{ url: shown[0].url, alt: shown[0].alt }} />
  }
  return <ImageRowBubble images={shown.map((img) => ({ url: img.url, alt: img.alt }))} />
}

function TraditionalSections({ project }: { project: Project }) {
  return (
    <>
      <TextBubble text={project.tagline} />
      {project.challenge && <TextBubble text={`**The challenge:** ${project.challenge}`} />}
      <ImagesSection images={project.images} />
      {project.decision && <TextBubble text={`**Key decision:** ${project.decision}`} />}
      {project.impacts && project.impacts.length > 0 && (
        <ImpactBubble label="Impact" items={project.impacts} />
      )}
    </>
  )
}

function VibeCodedSections({ project }: { project: Project }) {
  return (
    <>
      {project.whatItIs && <TextBubble text={project.whatItIs} />}
      {project.problem && <TextBubble text={`**The problem:** ${project.problem}`} />}
      {project.architecture && (
        <ArchitectureSection architecture={project.architecture} stack={project.stack || []} />
      )}
      <ImagesSection images={project.images} />
      {project.keyDecision && <TextBubble text={`**Key decision:** ${project.keyDecision}`} />}
      {project.tradeoff && <TextBubble text={`**The tradeoff:** ${project.tradeoff}`} />}
      {project.impacts && project.impacts.length > 0 && (
        <ImpactBubble label="Impact" items={project.impacts} />
      )}
      {project.whatsNext && <TextBubble text={`**What's next:** ${project.whatsNext}`} />}
      {project.proofLinks && <ProofLinks links={project.proofLinks} />}
    </>
  )
}

export function CaseStudyView({ project }: { project: Project }) {
  const [input, setInput] = useState("")
  const isVibeCoded = project.variant === "vibe-coded"

  return (
    <div className="flex h-dvh flex-col" style={{ background: "rgb(var(--bureau-bg))" }}>
      {/* Header — mirrors the chat header chrome for direct visual comparison */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-5"
        style={{ borderBottom: "1px solid rgb(var(--bureau-border))" }}
      >
        <Link
          href="/"
          className="flex items-center gap-2"
          style={{
            fontFamily: "var(--ff-plex-mono)",
            fontWeight: 600,
            fontSize: "11px",
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: "rgb(var(--bureau-text-secondary))",
          }}
        >
          ← Back
        </Link>
        <span
          style={{
            fontFamily: "var(--ff-plex-mono)",
            fontWeight: 700,
            fontSize: "12px",
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "rgb(var(--bureau-text-primary))",
          }}
        >
          EdwinOS
        </span>
        <a
          href="https://www.edwinsocrates.com"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: "var(--ff-plex-mono)",
            fontWeight: 600,
            fontSize: "11px",
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: "rgb(var(--bureau-text-secondary))",
          }}
        >
          Portfolio
        </a>
      </header>

      {/* Case study body */}
      <div className="flex-1 overflow-y-auto px-5">
        <div
          style={{ ...CHAT_COLUMN, paddingTop: 32, paddingBottom: 8 }}
          className="flex flex-col gap-4"
        >
          <div style={{ display: "flex", gap: 14 }}>
            <span style={{ width: 26, flexShrink: 0 }} />
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
              <ProjectHeaderBubble
                project={{
                  slug: project.slug,
                  client: project.client,
                  projectTitle: project.projectTitle,
                  role: project.role,
                  previewImage: project.previewImage.url,
                }}
              />
              {isVibeCoded ? (
                <VibeCodedSections project={project} />
              ) : (
                <TraditionalSections project={project} />
              )}
              <FollowupsBubble
                text="Want to explore another project or ask something specific?"
                chips={FOLLOWUP_CHIPS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bottom composer — decorative on this review-only route */}
      <div
        className="px-5 pb-6 pt-1"
        style={{
          background: "linear-gradient(to bottom, transparent 0%, rgb(var(--bureau-bg)) 40%)",
        }}
      >
        <div style={CHAT_COLUMN}>
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={() => setInput("")}
            isLoading={false}
            placeholder="Ask a follow-up..."
          />
        </div>
      </div>
    </div>
  )
}
