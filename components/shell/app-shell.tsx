"use client"

import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ChatInput } from "@/components/chat/chat-input"
import { PromptChip } from "@/components/chat/prompt-chip"
import { SideOfDesk } from "@/components/chat/side-of-desk"
import { Sidebar, type Pane } from "@/components/shell/sidebar"
import { DeckPane } from "@/components/case-study/deck-pane"
import { CONTENT_WIDTH, HERO_MEASURE } from "@/lib/layout"
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
import { useScriptedStream, generateMessageId, HOME_THREAD } from "@/hooks/use-scripted-stream"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

const CHAT_COLUMN = { maxWidth: CONTENT_WIDTH, margin: "0 auto" } as const

const PROMPT_CHIPS = [
  "Walk me through your work",
  "How do you design with AI?",
  "See the Meridian case study",
  "Show me your résumé",
] as const

function createTransport() {
  return new DefaultChatTransport({ api: "/api/chat" })
}

// The one layout every destination renders inside. Lifted out of app/page.tsx
// so the deck route can render it too — see the note on `initialPane`.
export function AppShell({ initialPane = "chat" }: { initialPane?: Pane }) {
  const [input, setInput] = useState("")
  const prefersReducedMotion = usePrefersReducedMotion()
  // Which destination the pane is showing. "chat" is home; VIBE CODING is the
  // one rail row that swaps the pane instead of opening a conversation or a
  // document.
  const [pane, setPane] = useState<Pane>(initialPane)
  const [sheetOpen, setSheetOpen] = useState(false)

  // ── Threads ─────────────────────────────────────────────────────
  // Every project owns an independent transcript, keyed by slug; HOME_THREAD
  // is the front door. Switching rails swaps which one the pane renders — it
  // never appends one conversation onto another.
  //
  // In-memory only, by design: a refresh starts over. There is no persistence
  // layer and nothing here is written to storage.
  const [activeThread, setActiveThread] = useState<string>(HOME_THREAD)
  // Read inside callbacks so they don't have to re-create on every switch.
  const activeThreadRef = useRef(activeThread)
  activeThreadRef.current = activeThread

  // Threads whose scripted reveal has already run. A revisit must show
  // history, not stream the reveal a second time.
  const revealedRef = useRef<Set<string>>(new Set())

  const {
    enqueue: queueScriptedMessages,
    appendImmediate,
    messagesOf,
    isTypingIn,
  } = useScriptedStream()

  const activeMessages = messagesOf(activeThread)

  // Track if we've exhausted scripted responses and should use API
  const [useApiMode, setUseApiMode] = useState(false)
  // Track how many messages in apiMessages are history (shouldn't be rendered)
  const [apiHistoryCount, setApiHistoryCount] = useState(0)
  // Which thread the in-flight API turn belongs to. The live partial renders
  // only in that thread, and the finished answer is committed there.
  const [apiThread, setApiThread] = useState<string>(HOME_THREAD)
  // Track current project being discussed (to avoid repeating scripted reveals)
  const [currentProjectSlug, setCurrentProjectSlug] = useState<string | null>(null)

  // Claude API chat (for when scripted responses don't match)
  const { messages: apiMessages, sendMessage, status, setMessages: setApiMessages } = useChat({
    transport: createTransport(),
  })

  const isApiLoading = status === "streaming" || status === "submitted"
  // Only the thread that asked is busy. Another thread stays interactive.
  const activeBusy = isTypingIn(activeThread) || (isApiLoading && apiThread === activeThread)

  // ── Scroll ──────────────────────────────────────────────────────
  // Each thread remembers where it was left. Restoring is a scrollTop write
  // against one always-mounted element, so it is cheap enough to ship — the
  // alternative was jumping to the bottom on every switch.
  const paneScrollRef = useRef<HTMLDivElement>(null)
  const scrollPosRef = useRef<Record<string, number>>({})
  const seenCountRef = useRef<Record<string, number>>({})

  useLayoutEffect(() => {
    const el = paneScrollRef.current
    if (!el) return
    const saved = scrollPosRef.current[activeThread]
    el.scrollTop = saved ?? el.scrollHeight
  }, [activeThread])

  // Follow new messages down, but only ones that arrive in the thread already
  // on screen — otherwise restoring a scroll position immediately loses to
  // this effect.
  useEffect(() => {
    const el = paneScrollRef.current
    if (!el) return
    const n = activeMessages.length
    const prev = seenCountRef.current[activeThread]
    seenCountRef.current[activeThread] = n
    if (prev !== undefined && n > prev) {
      el.scrollTo({ top: el.scrollHeight, behavior: prefersReducedMotion ? "auto" : "smooth" })
    }
  }, [activeMessages.length, activeThread, prefersReducedMotion])

  const switchThread = useCallback((next: string) => {
    const el = paneScrollRef.current
    if (el) scrollPosRef.current[activeThreadRef.current] = el.scrollTop
    setActiveThread(next)
  }, [])

  // Build conversation history from ONE thread's messages for API context.
  // Convert all message types to text so API understands the project context
  const buildApiHistory = useCallback(
    (thread: string) => {
      const history: { id: string; role: "user" | "assistant"; parts: { type: "text"; text: string }[] }[] = []

      for (const m of messagesOf(thread)) {
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
    },
    [messagesOf]
  )

  // Open a project's thread. Streams its reveal on FIRST open only; a revisit
  // just swaps the pane back to the transcript that is already there.
  //
  // The reveal content comes from buildResponse(preloadedSlug), which returns
  // projectStream — the same single definition the typed and chip paths use.
  // Nothing about a project's reveal is described twice.
  const openProjectThread = useCallback(
    (slug: string) => {
      setPane("chat")
      setCurrentProjectSlug(slug)
      switchThread(slug)
      if (revealedRef.current.has(slug)) return
      revealedRef.current.add(slug)
      const { response } = buildResponse("", { preloadedSlug: slug })
      if (response) queueScriptedMessages(response, slug)
    },
    [switchThread, queueScriptedMessages]
  )

  // Every entry point routes through here: typed input, landing chips,
  // follow-up chips, and the rail. One decision about which thread a turn
  // belongs to, made once.
  const dispatch = useCallback(
    (text: string, opts?: { slug?: string }) => {
      const from = activeThreadRef.current
      const { response, projectSlug } = buildResponse(text, {
        preloadedSlug: opts?.slug,
        currentProjectSlug: from === HOME_THREAD ? null : from,
      })

      // A reveal for a DIFFERENT project belongs in that project's thread, so
      // switch instead of appending here. No user bubble is echoed: the target
      // thread should read as that project's own conversation, not as a reply
      // to something typed somewhere else.
      if (response && projectSlug && projectSlug !== from) {
        openProjectThread(projectSlug)
        return
      }

      const userMessage: StructuredMessage = {
        id: generateMessageId(),
        role: "user",
        kind: "text",
        text,
      } as StructuredMessage & { kind: "text"; text: string }
      appendImmediate(userMessage, from)

      if (response) {
        queueScriptedMessages(response, from)
        if (projectSlug) setCurrentProjectSlug(projectSlug)
        return
      }

      // Fall through to the API (which refuses anything not in its reference
      // document) rather than leaving the turn silently unanswered.
      setApiThread(from)
      setUseApiMode(true)
      const history = buildApiHistory(from)
      // +1 for the user message we're about to send
      setApiHistoryCount(history.length + 1)
      setApiMessages(history)
      // Small delay to ensure state is updated before sending
      setTimeout(() => {
        sendMessage({ text })
      }, 0)
    },
    [openProjectThread, appendImmediate, queueScriptedMessages, buildApiHistory, setApiMessages, sendMessage]
  )

  // Commit a finished API answer into its thread, then clear the live channel.
  // Without this the answer would live only in useChat's list, which is a
  // single shared list and would leak across threads.
  useEffect(() => {
    if (isApiLoading || !useApiMode) return
    const fresh = apiMessages.slice(apiHistoryCount)
    const answers = fresh.filter((m) => m.role === "assistant")
    if (answers.length === 0) return
    for (const m of answers) {
      const text = m.parts
        .filter((p): p is { type: "text"; text: string } => p.type === "text")
        .map((p) => p.text)
        .join("")
      if (!text) continue
      appendImmediate(
        { id: m.id, role: "assistant", kind: "text", text } as StructuredMessage,
        apiThread
      )
    }
    setUseApiMode(false)
    setApiHistoryCount(0)
    setApiMessages([])
  }, [isApiLoading, useApiMode, apiMessages, apiHistoryCount, apiThread, appendImmediate, setApiMessages])

  // Handle user input
  const handleSend = useCallback(() => {
    if (!input.trim() || activeBusy) return
    const userText = input.trim()
    setInput("")
    dispatch(userText)
  }, [input, activeBusy, dispatch])

  // Handle chip selection. `slug` is set when the chip names a specific
  // project (follow-up chips carry one; the landing prompt chips don't).
  const handleChipSelect = useCallback(
    (text: string, slug?: string) => dispatch(text, { slug }),
    [dispatch]
  )

  // Follow-up chips on the case-study route hand off to this page via
  // /?ask=<text>&slug=<slug>, since the chat state lives here. Read it once on
  // mount, fire the same handler the landing chips use, then strip the query so
  // a refresh doesn't replay it. Uses window.location rather than
  // useSearchParams to avoid forcing this page out of static prerendering.
  const handoffFiredRef = useRef(false)
  useEffect(() => {
    if (handoffFiredRef.current) return
    const params = new URLSearchParams(window.location.search)
    const ask = params.get("ask")
    if (!ask) return
    handoffFiredRef.current = true
    const slug = params.get("slug") || undefined
    window.history.replaceState(null, "", window.location.pathname)
    handleChipSelect(ask, slug)
  }, [handleChipSelect])

  // Follow-up chips inside a reveal. A chip naming another project switches to
  // that project's thread (dispatch decides); a general question answers here.
  const handleFollowupChip = useCallback(
    (chip: { text: string; slug?: string }) => dispatch(chip.text, { slug: chip.slug }),
    [dispatch]
  )

  const handleSidebarProject = useCallback(
    (slug: string) => openProjectThread(slug),
    [openProjectThread]
  )

  const handleVibeCoding = useCallback(() => {
    setPane("vibe-coding")
    setSheetOpen(false)
  }, [])

  // The deck swaps the pane rather than navigating. A route change would
  // remount this component and take every project thread with it, which is
  // the whole conversation model. /case-study/meridian-deck still exists for
  // deep links and renders this same shell with the pane pre-opened.
  const handleDeck = useCallback(() => {
    setPane("deck")
    setSheetOpen(false)
  }, [])

  // Brand mark returns to the front-door thread. It does NOT clear it: home is
  // a thread like any other, so anything asked there is still waiting.
  const handleHome = useCallback(() => {
    setPane("chat")
    setCurrentProjectSlug(null)
    switchThread(HOME_THREAD)
    setSheetOpen(false)
  }, [switchThread])

  // Find last assistant message index for followup chip activation
  const lastAssistantIdx = activeMessages.reduce(
    (acc, m, i) => (m.role === "assistant" ? i : acc),
    -1
  )

  // Entrance animation, gated the same way the chat bubbles gate theirs
  // (hooks/use-prefers-reduced-motion). fade-in animates OPACITY ONLY — it
  // never sets a transform — so unlike .animate-slide-up it does not turn its
  // element into a containing block for position:fixed descendants. See the
  // warning at @keyframes slide-up in globals.css.
  const fadeIn = prefersReducedMotion ? "" : "animate-fade-in"
  const delay = (ms: number) => (prefersReducedMotion ? undefined : `${ms}ms`)

  /* ── SHELL ────────────────────────────────────────────────────
     One persistent layout for every state. The rail is the site's index and
     the pane is the conversation; there is no longer a scrolling marketing
     page underneath. See the note on REMOVED_SECTIONS below. */
  // Derived, not stored: the front door IS the home thread when it is empty.
  // A stored mode flag would be a second source of truth for the same fact.
  const isFrontDoor =
    pane === "chat" && activeThread === HOME_THREAD && activeMessages.length === 0

  return (
    <div className="shell" data-sheet={sheetOpen}>
      {/* Mobile only — the rail collapses behind this. */}
      <div className="shell-topbar">
        <button type="button" className="rail-brand" onClick={handleHome} style={{ padding: 0 }}>
          <span className="type-badge" style={{ color: "rgb(var(--bureau-text-primary))" }}>
            EdwinOS
          </span>
        </button>
        <button
          type="button"
          className="type-label rail-sheet-close"
          aria-expanded={sheetOpen}
          aria-label={sheetOpen ? "Close menu" : "Open menu"}
          onClick={() => setSheetOpen((v) => !v)}
          style={{ color: "rgb(var(--bureau-text-secondary))" }}
        >
          {sheetOpen ? "Close" : "Menu"}
        </button>
      </div>

      <Sidebar
        activeSlug={currentProjectSlug}
        activePane={pane}
        onProjectSelect={handleSidebarProject}
        onSelectVibeCoding={handleVibeCoding}
        onSelectDeck={handleDeck}
        onHome={handleHome}
        onNavigate={() => setSheetOpen(false)}
        open={sheetOpen}
      />

      <main className="pane">
        {pane === "vibe-coding" ? (
          <div className="pane-scroll">
            <SideOfDesk />
          </div>
        ) : pane === "deck" ? (
          <div className="pane-scroll">
            <DeckPane />
          </div>
        ) : isFrontDoor ? (
          <div className="pane-front">
            <div
              data-hero-col="stack"
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "100%",
              }}
            >
                  <h1
                    className={`type-hero ${fadeIn}`}
                    style={{
                      margin: 0,
                      maxWidth: HERO_MEASURE,
                      textAlign: "center",
                      textWrap: "balance",
                      color: "rgb(var(--bureau-text-primary))",
                      animationDelay: delay(60),
                    }}
                  >
                    I&apos;m Edwin, a designer &amp; AI builder focused on
                    creating useful products and workflows.
                  </h1>

                  <div
                    className={fadeIn}
                    data-hero-col="input"
                    style={{
                      width: "100%",
                      maxWidth: CONTENT_WIDTH,
                      marginTop: "var(--space-group)",
                      animationDelay: delay(120),
                    }}
                  >
                    <ChatInput
                      value={input}
                      onChange={setInput}
                      onSubmit={handleSend}
                      isLoading={activeBusy}
                      placeholder="Ask anything..."
                    />
                  </div>

                  {/* Prompt chips — one relatedness level tighter than the gap
                      above the input, so they read as belonging to it. */}
                  <div
                    className={fadeIn}
                    data-hero-col="chips"
                    style={{
                      width: "100%",
                      maxWidth: CONTENT_WIDTH,
                      marginTop: "var(--space-within)",
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "var(--space-within)",
                      animationDelay: delay(150),
                    }}
                  >
                    {PROMPT_CHIPS.map((chip) => (
                      <PromptChip
                        key={chip}
                        label={chip}
                        onClick={() => handleChipSelect(chip)}
                        disabled={activeBusy}
                      />
                    ))}
                  </div>
            </div>
          </div>
        ) : (
          <>
            <div className="pane-scroll" ref={paneScrollRef}>
              <div style={{ ...CHAT_COLUMN, paddingBottom: "var(--space-8)" }} className="flex flex-col gap-4">
              {/* Structured messages (scripted) */}
              {activeMessages.map((message, i) => {
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

              {/* The in-flight API turn, streaming live. Rendered only in the
                  thread that asked for it — useChat keeps one shared list, so
                  without this gate a partial answer would appear in whatever
                  thread happened to be open. Once complete it is committed
                  into that thread above and this clears. */}
              {useApiMode && apiThread === activeThread &&
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
                      }}
                      isLastAssistant={isLast}
                    />
                  )
                })}

              {/* Typing indicator — shown only while a message is streaming in */}
              {activeBusy && <TypingIndicator />}


              </div>
            </div>

            {/* Docked composer — the same component, moved to the pane's
                bottom edge the moment a conversation exists. */}
            <div className="pane-dock">
              <div style={CHAT_COLUMN} data-hero-col="input">
                <ChatInput
                  value={input}
                  onChange={setInput}
                  onSubmit={handleSend}
                  isLoading={activeBusy}
                  placeholder="Ask a follow-up..."
                />
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
