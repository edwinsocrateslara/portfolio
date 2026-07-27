"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import type { Project } from "@/lib/projects"
import { CONTENT_WIDTH } from "@/lib/layout"
import { ChatInput } from "@/components/chat/chat-input"
import {
  AssistantBubble,
  TypingIndicator,
  ProjectHeaderBubble,
  MessageContent,
  FollowupsBubble,
} from "@/components/chat/message-bubbles"
import { useScriptedStream, type MessageBlock } from "@/hooks/use-scripted-stream"
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

// Reveal order: header card -> what-it-is -> The problem -> How it's built +
// stack pills -> image row -> Key decision -> The tradeoff -> IMPACT box ->
// What's next -> proof links -> follow-up chips.
function buildVibeCodedBlocks(project: Project): MessageBlock[] {
  const blocks: MessageBlock[] = [
    {
      kind: "project-header",
      project: {
        slug: project.slug,
        client: project.client,
        projectTitle: project.projectTitle,
        role: project.role,
        previewImage: project.previewImage.url,
      },
    },
  ]

  if (project.whatItIs) {
    blocks.push({ kind: "text", text: project.whatItIs })
  }
  if (project.problem) {
    blocks.push({ kind: "text", text: `**The problem:** ${project.problem}` })
  }
  if (project.architecture) {
    blocks.push({
      kind: "architecture",
      architecture: project.architecture,
      stack: project.stack || [],
    })
  }

  const images = project.images || []
  if (images.length === 1) {
    blocks.push({ kind: "image", image: { url: images[0].url, alt: images[0].alt } })
  } else if (images.length > 1) {
    blocks.push({
      kind: "image-row",
      images: images.map((img) => ({ url: img.url, alt: img.alt })),
    })
  }

  if (project.keyDecision) {
    blocks.push({ kind: "text", text: `**Key decision:** ${project.keyDecision}` })
  }
  if (project.tradeoff) {
    blocks.push({ kind: "text", text: `**The tradeoff:** ${project.tradeoff}` })
  }
  if (project.impacts && project.impacts.length > 0) {
    blocks.push({ kind: "impact", label: "Impact", items: project.impacts })
  }
  if (project.whatsNext) {
    blocks.push({ kind: "text", text: `**What's next:** ${project.whatsNext}` })
  }
  if (project.proofLinks) {
    blocks.push({ kind: "proof-links", links: project.proofLinks })
  }

  blocks.push({
    kind: "followups",
    text: "Want to explore another project or ask something specific?",
    chips: FOLLOWUP_CHIPS,
  })

  return blocks
}

// ⚠ DORMANT — no project currently sets variant: "vibe-coded", so nothing
// renders this. It is kept for future software and tooling case studies,
// where architecture / stack / tradeoff describe the work better than the
// traditional challenge / at-stake / decision shape.
//
// It is NOT a skin over TraditionalCaseStudy: that one renders statically in
// one pass, while this streams its blocks through useScriptedStream the way
// the main chat flow does. Consolidating them later means choosing one render
// model, not merging two templates.
//
// With zero users, nothing will catch this rotting. Changes to
// TraditionalCaseStudy (or to the Project fields, or the bubble components)
// should be mirrored here deliberately.
function VibeCodedCaseStudy({ project }: { project: Project }) {
  const [input, setInput] = useState("")
  const { messages, isTyping, enqueue } = useScriptedStream()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const hasStartedRef = useRef(false)
  const handleChipPick = useChipHandoff()

  // Kick off the reveal once on mount. Guarded so React StrictMode's
  // dev-only double-invoke of effects can't queue the stream twice.
  useEffect(() => {
    if (hasStartedRef.current) return
    hasStartedRef.current = true
    enqueue(buildVibeCodedBlocks(project))
  }, [enqueue, project])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isTyping])

  const lastAssistantIdx = messages.length - 1

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarGutter: "stable" }}>
        <div
          style={{ ...CHAT_COLUMN, paddingTop: "var(--space-group)", paddingBottom: "var(--space-within)" }}
          className="flex flex-col gap-4"
        >
          {messages.map((message, i) => (
            <AssistantBubble
              key={message.id}
              message={message}
              onChipPick={handleChipPick}
              isLastAssistant={i === lastAssistantIdx}
            />
          ))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div
        className="px-5 pb-6 pt-1"
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
            isLoading={isTyping}
            placeholder="Ask a follow-up..."
          />
        </div>
      </div>
    </>
  )
}

function TraditionalCaseStudy({ project }: { project: Project }) {
  const [input, setInput] = useState("")
  const handleChipPick = useChipHandoff()

  return (
    <>
      <div className="flex-1 overflow-y-auto px-5" style={{ scrollbarGutter: "stable" }}>
        <div
          style={{ ...CHAT_COLUMN, paddingTop: "var(--space-group)", paddingBottom: "var(--space-within)" }}
          className="flex flex-col gap-4"
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
        className="px-5 pb-6 pt-1"
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
          className="type-label flex items-center gap-2"
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          ← Back
        </Link>
        <span
          className="type-badge"
          style={{ color: "rgb(var(--bureau-text-primary))" }}
        >
          EdwinOS
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

      {isVibeCoded ? (
        <VibeCodedCaseStudy project={project} />
      ) : (
        <TraditionalCaseStudy project={project} />
      )}
    </div>
  )
}
