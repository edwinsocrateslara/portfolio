"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ArrowLeft } from "lucide-react"
import { ChatInput } from "@/components/chat/chat-input"
import { PromptChip } from "@/components/chat/prompt-chip"
import { ProjectGrid } from "@/components/chat/project-grid"
import { SideOfDesk } from "@/components/chat/side-of-desk"
import { NowPlaying } from "@/components/chat/now-playing"
import { DOCS } from "@/lib/constants"
import { CONTENT_WIDTH } from "@/lib/layout"
import {
  buildResponse,
  INTRO_SEQUENCE,
} from "@/lib/scripted-responses"
import {
  AssistantBubble,
  UserBubble,
  TypingIndicator,
  type StructuredMessage,
} from "@/components/chat/message-bubbles"
import { useScriptedStream, generateMessageId } from "@/hooks/use-scripted-stream"

const CHAT_COLUMN = { maxWidth: CONTENT_WIDTH, margin: "0 auto" } as const

const PROMPT_CHIPS = [
  "Walk me through your work",
  "How do you design with AI?",
  "Show me your résumé",
] as const

type Mode = "landing" | "chat"

function createTransport() {
  return new DefaultChatTransport({ api: "/api/chat" })
}

export default function HomePage() {
  const [mode, setMode] = useState<Mode>("landing")
  const [input, setInput] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Structured messages for scripted flow — reveal queue/timing/firstOfStreak
  // logic lives in useScriptedStream, shared with the case-study review route.
  const {
    messages: structuredMessages,
    isTyping,
    enqueue: queueScriptedMessages,
    appendImmediate,
    reset: resetStream,
  } = useScriptedStream()

  // Track if we've exhausted scripted responses and should use API
  const [useApiMode, setUseApiMode] = useState(false)
  // Track how many messages in apiMessages are history (shouldn't be rendered)
  const [apiHistoryCount, setApiHistoryCount] = useState(0)
  // Track current project being discussed (to avoid repeating scripted reveals)
  const [currentProjectSlug, setCurrentProjectSlug] = useState<string | null>(null)

  // Claude API chat (for when scripted responses don't match)
  const { messages: apiMessages, sendMessage, status, setMessages: setApiMessages } = useChat({
    transport: createTransport(),
  })

  const isApiLoading = status === "streaming" || status === "submitted"

  // Scroll to bottom on new messages
  useEffect(() => {
    if (mode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }
  }, [structuredMessages, apiMessages, isTyping, mode])

  // Build conversation history from structured messages for API context
  // Convert all message types to text so API understands the project context
  const buildApiHistory = useCallback(() => {
    const history: { id: string; role: "user" | "assistant"; parts: { type: "text"; text: string }[] }[] = []

    for (const m of structuredMessages) {
      let content = ""

      switch (m.kind) {
        case "text":
          content = (m as { text: string }).text
          break
        case "project-header": {
          const p = (m as { project: { client: string; projectTitle: string; role: string } }).project
          content = `[Currently discussing: ${p.client} — ${p.projectTitle}. Edwin's role: ${p.role}]`
          break
        }
        case "impact": {
          const items = (m as { items: string[] }).items
          content = `Impact: ${items.join("; ")}`
          break
        }
        case "followups": {
          const text = (m as { text?: string }).text
          if (text) content = text
          break
        }
        // Skip image, image-row, and doc-link as they don't add conversational context
        default:
          continue
      }

      if (content) {
        history.push({
          id: m.id,
          role: m.role as "user" | "assistant",
          parts: [{ type: "text", text: content }],
        })
      }
    }

    return history
  }, [structuredMessages])

  // Handle user input
  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping || isApiLoading) return

    const userText = input.trim()
    setInput("")
    setMode("chat")

    // Add user message
    const userMessage: StructuredMessage = {
      id: generateMessageId(),
      role: "user",
      kind: "text",
      text: userText,
      firstOfStreak: true,
    } as StructuredMessage & { kind: "text"; text: string }

    appendImmediate(userMessage)

    // Try to get a scripted response
    const { response, projectSlug } = buildResponse(userText, { currentProjectSlug })

    if (response) {
      queueScriptedMessages(response)
      if (projectSlug) setCurrentProjectSlug(projectSlug)
    } else {
      // Fall back to Claude API - sync conversation history first
      setUseApiMode(true)
      const history = buildApiHistory()
      // Track history count so we don't render these (already shown in structuredMessages)
      // +1 for the user message we're about to send
      setApiHistoryCount(history.length + 1)
      // Set history then send new message
      setApiMessages(history)
      // Small delay to ensure state is updated before sending
      setTimeout(() => {
        sendMessage({ text: userText })
      }, 0)
    }
  }, [input, isTyping, isApiLoading, appendImmediate, queueScriptedMessages, sendMessage, buildApiHistory, setApiMessages, currentProjectSlug])

  // Handle chip selection
  const handleChipSelect = useCallback((text: string) => {
    setMode("chat")

    // Add user message
    const userMessage: StructuredMessage = {
      id: generateMessageId(),
      role: "user",
      kind: "text",
      text: text,
      firstOfStreak: true,
    } as StructuredMessage & { kind: "text"; text: string }

    appendImmediate(userMessage)

    // Get scripted response
    const { response, projectSlug } = buildResponse(text, { currentProjectSlug })
    if (response) {
      queueScriptedMessages(response)
      if (projectSlug) setCurrentProjectSlug(projectSlug)
    } else {
      // Fall through to the API (which refuses anything not in its reference
      // document) rather than leaving the chip silently unanswered — not
      // every chip still has a scripted response behind it.
      setUseApiMode(true)
      const history = buildApiHistory()
      setApiHistoryCount(history.length + 1)
      setApiMessages(history)
      setTimeout(() => {
        sendMessage({ text })
      }, 0)
    }
  }, [appendImmediate, queueScriptedMessages, sendMessage, buildApiHistory, setApiMessages, currentProjectSlug])

  // Handle followup chip clicks
  const handleFollowupChip = useCallback((chip: { text: string; slug?: string }) => {
    // Add user message
    const userMessage: StructuredMessage = {
      id: generateMessageId(),
      role: "user",
      kind: "text",
      text: chip.text,
      firstOfStreak: true,
    } as StructuredMessage & { kind: "text"; text: string }

    appendImmediate(userMessage)

    // Get scripted response (with optional slug for project-specific)
    const { response, projectSlug } = buildResponse(chip.text, {
      preloadedSlug: chip.slug,
      currentProjectSlug,
    })
    if (response) {
      queueScriptedMessages(response)
      if (projectSlug) setCurrentProjectSlug(projectSlug)
    } else {
      // Fall back to API - sync conversation history first
      setUseApiMode(true)
      const history = buildApiHistory()
      // Track history count so we don't render these (+1 for user message)
      setApiHistoryCount(history.length + 1)
      setApiMessages(history)
      setTimeout(() => {
        sendMessage({ text: chip.text })
      }, 0)
    }
  }, [appendImmediate, queueScriptedMessages, sendMessage, buildApiHistory, setApiMessages, currentProjectSlug])

  // Handle project click from grid
  const handleProjectClick = useCallback((slug: string) => {
    setMode("chat")

    // Get project-specific response
    const { response, projectSlug } = buildResponse("", { preloadedSlug: slug })
    if (response) {
      queueScriptedMessages(response)
      if (projectSlug) setCurrentProjectSlug(projectSlug)
    }
  }, [queueScriptedMessages])

  // Handle back button
  const handleBack = useCallback(() => {
    setMode("landing")
    setInput("")
    resetStream()
    setApiMessages([])
    setUseApiMode(false)
    setApiHistoryCount(0)
    setCurrentProjectSlug(null)
  }, [resetStream, setApiMessages])

  // Find last assistant message index for followup chip activation
  const lastAssistantIdx = structuredMessages.reduce(
    (acc, m, i) => (m.role === "assistant" ? i : acc),
    -1
  )

  /* ── LANDING ──────────────────────────────────────────────── */
  if (mode === "landing") {
    return (
      <div className="min-h-dvh overflow-y-auto" style={{ background: "rgb(var(--bureau-bg))" }}>
        {/* Hero section — Dark canvas */}
        <div className="mx-auto max-w-7xl px-6 pt-16 pb-16">
          {/* Top bar */}
          <div
            className="mb-20 flex items-center justify-between animate-fade-in"
            style={{ animationDelay: "0ms" }}
          >
            <div className="flex items-center gap-[10px]">
              <span
                className="uppercase"
                style={{
                  fontFamily: "var(--ff-plex-mono)", fontWeight: 700, fontSize: "15px", lineHeight: "1",
                  letterSpacing: "1px",
                  color: "rgb(var(--bureau-text-primary))",
                }}
              >
                EdwinOS
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 9999,
                  background: "rgb(var(--bureau-text-primary))",
                  display: "inline-block",
                }}
              />
              <span
                className="uppercase"
                style={{
                  fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "10px", lineHeight: "1",
                  letterSpacing: "1.4px",
                  color: "rgb(var(--bureau-text-muted))",
                }}
              >
                Available
              </span>
            </div>

            <nav className="flex items-center gap-[30px]">
              {[
                { label: "WORK", href: "#work" },
                { label: "AI", href: "#ai" },
                { label: "CASE STUDY", href: DOCS["meridian-case-study"].url },
                { label: "RESUME", href: DOCS["resume"].url },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  target={href.startsWith("#") ? undefined : "_blank"}
                  rel="noopener noreferrer"
                  className="transition-colors"
                  style={{
                    fontFamily: "var(--ff-plex-mono)", fontWeight: 500, fontSize: "11px", lineHeight: "1",
                    letterSpacing: "1.4px",
                    color: "rgb(var(--bureau-text-secondary))",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "rgb(var(--bureau-text-primary))"
                    e.currentTarget.style.textDecoration = "underline"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "rgb(var(--bureau-text-secondary))"
                    e.currentTarget.style.textDecoration = "none"
                  }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* Hero — Massive display typography */}
          <div
            className="mb-8 animate-fade-in"
            style={{ animationDelay: "60ms" }}
          >
            <h1
              className="type-hero mb-2"
              style={{
                maxWidth: 900,
                color: "rgb(var(--bureau-text-primary))",
              }}
            >
              I&apos;m Edwin, a product designer interested in{" "}
              <span
                style={{
                  textDecoration: "underline",
                  textDecorationThickness: "2px",
                  textUnderlineOffset: "5px",
                  textDecorationColor: "rgb(var(--bureau-border-strong))",
                }}
              >
                AI products and workflows
              </span>
              .
            </h1>
            <p
              style={{
                fontFamily: "var(--ff-archivo)", fontWeight: 400, fontSize: "16px", lineHeight: "1.6",
                color: "rgb(var(--bureau-text-secondary))",
                maxWidth: 520,
              }}
            >
              I combine AI and design to create user-centric products and
              systems that solve complex business problems.
            </p>
          </div>

          <div
            className="mb-4 animate-fade-in"
            style={{ animationDelay: "100ms", maxWidth: CONTENT_WIDTH }}
          >
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSend}
              isLoading={isTyping}
              placeholder="Ask anything..."
            />
          </div>

          {/* Prompt chips — Dark surface, sharp corners */}
          <div
            className="flex flex-wrap gap-2 animate-fade-in"
            style={{ animationDelay: "150ms" }}
          >
            {PROMPT_CHIPS.map((chip) => (
              <PromptChip
                key={chip}
                label={chip}
                onClick={() => handleChipSelect(chip)}
                disabled={isTyping}
              />
            ))}
          </div>
        </div>

        {/* Section divider */}
        <div
          className="mx-auto max-w-7xl px-6"
          style={{ borderTop: "1px solid rgb(var(--bureau-border))" }}
        />

        {/* Side of Desk section */}
        <SideOfDesk />

        {/* Section divider */}
        <div
          className="mx-auto max-w-7xl px-6"
          style={{ borderTop: "1px solid rgb(var(--bureau-border))" }}
        />

        {/* Project grid */}
        <div className="mx-auto max-w-7xl px-6 py-16">
          <ProjectGrid onProjectClick={handleProjectClick} />
        </div>

        {/* Footer */}
        <NowPlaying />
      </div>
    )
  }

  /* ── CHAT ─────────────────────────────────────────────────── */
  return (
    <div className="flex h-dvh flex-col" style={{ background: "rgb(var(--bureau-bg))" }}>
      {/* Header */}
      <header
        className="flex h-14 shrink-0 items-center justify-between px-5"
        style={{ borderBottom: "1px solid rgb(var(--bureau-border))" }}
      >
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 transition-colors"
          style={{
            fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "11px", lineHeight: "1",
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: "rgb(var(--bureau-text-secondary))",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgb(var(--bureau-text-primary))"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgb(var(--bureau-text-secondary))"
          }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="flex items-center gap-2">
          <span
            style={{
              fontFamily: "var(--ff-plex-mono)", fontWeight: 700, fontSize: "12px", lineHeight: "1",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgb(var(--bureau-text-primary))",
            }}
          >
            EdwinOS
          </span>
        </div>

        <a
          href="https://www.edwinsocrates.com"
          target="_blank"
          rel="noopener noreferrer"
          className="transition-colors"
          style={{
            fontFamily: "var(--ff-plex-mono)", fontWeight: 600, fontSize: "11px", lineHeight: "1",
            letterSpacing: "1.4px",
            textTransform: "uppercase",
            color: "rgb(var(--bureau-text-secondary))",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = "rgb(var(--bureau-text-primary))"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = "rgb(var(--bureau-text-secondary))"
          }}
        >
          Portfolio
        </a>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5">
        <div
          style={{ ...CHAT_COLUMN, paddingTop: 32, paddingBottom: 8 }}
          className="flex flex-col gap-4"
        >
          {/* Structured messages (scripted) */}
          {structuredMessages.map((message, i) => {
            if (message.role === "user") {
              return (
                <UserBubble
                  key={message.id}
                  content={(message as StructuredMessage & { text: string }).text}
                />
              )
            }
            return (
              <AssistantBubble
                key={message.id}
                message={message}
                onChipPick={handleFollowupChip}
                isLastAssistant={i === lastAssistantIdx}
              />
            )
          })}

          {/* API messages (when scripted doesn't match) - only show NEW messages, not history */}
          {useApiMode &&
            apiMessages.slice(apiHistoryCount).map((message, idx) => {
              if (message.role === "user") {
                return null // Already shown in structured messages
              }
              // Convert API message parts to a flat text bubble
              const textContent = message.parts
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("")

              // Don't render empty messages
              if (!textContent) return null

              const isLast = idx === apiMessages.slice(apiHistoryCount).length - 1

              return (
                <AssistantBubble
                  key={message.id}
                  message={{
                    id: message.id,
                    role: "assistant",
                    kind: "text",
                    text: textContent,
                    firstOfStreak: true,
                  }}
                  isLastAssistant={isLast}
                />
              )
            })}

          {/* Typing indicator */}
          {(isTyping || (useApiMode && isApiLoading)) && (
            <TypingIndicator
              showAvatar={
                structuredMessages.length === 0 ||
                structuredMessages[structuredMessages.length - 1]?.role === "user"
              }
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Bottom input */}
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
            onSubmit={handleSend}
            isLoading={isTyping || isApiLoading}
            placeholder="Ask a follow-up..."
          />
        </div>
      </div>
    </div>
  )
}
