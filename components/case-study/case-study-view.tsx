"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Project } from "@/lib/projects"
import { CONTENT_WIDTH } from "@/lib/layout"
import { ChatInput } from "@/components/chat/chat-input"
import {
  ProjectHeaderBubble,
  MessageContent,
  FollowupsBubble,
} from "@/components/chat/message-bubbles"
import { buildProjectBodyBlocks } from "@/lib/project-flow"

const CHAT_COLUMN = { maxWidth: CONTENT_WIDTH, margin: "0 auto" } as const

const FOLLOWUP_CHIPS = [
  { text: "Walk me through your work" },
  { text: "How do you design with AI?" },
  { text: "Show me your résumé" },
]

// The chat state lives on the landing page, so a chip picked here hands off
// to it via a query param rather than trying to answer in place.
function useChipHandoff() {
  const router = useRouter()
  return useCallback(
    (chip: { text: string; slug?: string }) => {
      const params = new URLSearchParams({ ask: chip.text })
      if (chip.slug) params.set("slug", chip.slug)
      router.push(`/?${params.toString()}`)
    },
    [router]
  )
}

// Renders the shared body flow. The order lives in lib/project-flow.ts and
// is the same one the chat reveal streams — this route previously kept its
// own ordering, which is how the two drifted and how roleDescription and
// atStake ended up rendered nowhere on this page.
function TraditionalSections({ project }: { project: Project }) {
  return (
    <>
      {buildProjectBodyBlocks(project).map((block, i) => (
        <MessageContent key={i} message={block} />
      ))}
    </>
  )
}

function TraditionalCaseStudy({ project }: { project: Project }) {
  const [input, setInput] = useState("")
  const handleChipPick = useChipHandoff()

  return (
    <>
      <div className="review-scroll" style={{ scrollbarGutter: "stable" }}>
        <div
          style={{ ...CHAT_COLUMN, paddingTop: "var(--space-group)", paddingBottom: "var(--space-within)", gap: "var(--space-between)" }}
          className="flex flex-col"
        >
          <div style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: "var(--space-group)" }}>
            <ProjectHeaderBubble
              project={{
                slug: project.slug,
                client: project.client,
                projectTitle: project.projectTitle,
                role: project.role,
                previewImage: project.previewImage.url,
              }}
            />
            <TraditionalSections project={project} />
            <FollowupsBubble
              text="Want to explore another project or ask something specific?"
              chips={FOLLOWUP_CHIPS}
              onPick={handleChipPick}
            />
          </div>
        </div>
      </div>
      <div
        className="review-dock"
        style={{
          // Reserve the same scrollbar gutter the messages pane above
          // reserves, so both columns centre in the same available width.
          // `overflow: hidden` makes this a scroll container so the gutter
          // applies, without ever showing a scrollbar. Deliberately NOT a
          // fixed padding of --chat-scrollbar: that value is only correct
          // in WebKit, and Firefox's `thin` is a different, unsettable
          // width. Reserving a gutter matches whatever the browser uses.
          overflow: "hidden",
          scrollbarGutter: "stable",
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
    </>
  )
}

export function CaseStudyView({ project }: { project: Project }) {
  return (
    <div className="flex h-dvh flex-col" style={{ background: "rgb(var(--bureau-bg))" }}>
      {/* Header — mirrors the chat header chrome for direct visual comparison */}
      <header
        className="review-header"
        style={{ borderBottom: "1px solid var(--hairline)" }}
      >
        <Link
          href="/"
          className="type-label flex items-center"
          style={{ color: "rgb(var(--bureau-text-secondary))", gap: "var(--space-within)" }}
        >
          ← Back
        </Link>
        <span
          className="type-badge"
          style={{ color: "rgb(var(--bureau-text-primary))" }}
        >
          Edwin Socrates Lara
        </span>
        <a
          href="https://www.edwinsocrates.com"
          target="_blank"
          rel="noopener noreferrer"
          className="type-label"
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          Portfolio
        </a>
      </header>

      <TraditionalCaseStudy project={project} />
    </div>
  )
}
