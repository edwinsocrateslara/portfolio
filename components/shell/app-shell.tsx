"use client"

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ChatInput } from "@/components/chat/chat-input"
import { PromptChip } from "@/components/chat/prompt-chip"
import { frontDoorChips } from "@/lib/chips"
import { ProjectSampler } from "@/components/chat/project-sampler"
import { projects } from "@/lib/projects"
import { Sidebar, type Pane } from "@/components/shell/sidebar"
import { DeckPane } from "@/components/case-study/deck-pane"
import { AboutPane } from "@/components/about/about-pane"
import { ResumePane } from "@/components/resume/resume-pane"
import type { Resume } from "@/lib/resume"
import { Sparkle } from "@/components/ui/sparkle"
import { HERO_MEASURE } from "@/lib/layout"
import { buildResponse, allProjects } from "@/lib/scripted-responses"
import {
  AssistantBubble,
  UserBubble,
  TypingIndicator,
  type StructuredMessage,
} from "@/components/chat/message-bubbles"
import { useScriptedStream, generateMessageId, HOME_THREAD } from "@/hooks/use-scripted-stream"
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion"

// The chat column IS the reading measure — that is why it is the width it is,
// and why the input, the chips and the sampler match it rather than having
// widths of their own. One token, in CSS, so a change to how wide a sentence
// runs moves the whole column with it. See --prose-measure.
const CHAT_COLUMN = { maxWidth: "var(--prose-measure)", margin: "0 auto" } as const

// Derived from the answers, never listed here. See lib/chips.ts — adding an
// answer with placement "front-door" changes this with no edit to this file.
const PROMPT_CHIPS = frontDoorChips()

function createTransport() {
  return new DefaultChatTransport({ api: "/api/chat" })
}

// The one layout every destination renders inside. Lifted out of app/page.tsx
// so the deck route can render it too — see the note on `initialPane`.
export function AppShell({
  initialPane = "chat",
  resume,
}: {
  initialPane?: Pane
  /** Parsed from lib/sources/resume.txt by a SERVER component and passed in.
   *  It cannot be imported here: lib/resume.ts reads the file with `fs`, and
   *  everything below this component is a client tree. */
  resume: Resume
}) {
  const [input, setInput] = useState("")
  const prefersReducedMotion = usePrefersReducedMotion()
  // Which destination the pane is showing. "chat" is home; the three document
  // rows (CASE STUDY, RESUME, ABOUT) are what swap it. VIBE CODING does NOT —
  // it is a rail section of projects, and its rows open conversations through
  // the same flow as the seven. An earlier comment here said otherwise; it was
  // describing SideOfDesk, which no longer exists.
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
    reset: resetStream,
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
  // Synchronous, unlike `status`, which does not flip to "submitted" until
  // after sendMessage's microtask. Two dispatches in one tick would both see
  // an idle status and both send.
  const apiInFlightRef = useRef(false)
  // Track current project being discussed (to avoid repeating scripted reveals)
  const [currentProjectSlug, setCurrentProjectSlug] = useState<string | null>(null)

  // Claude API chat (for when scripted responses don't match)
  const { messages: apiMessages, sendMessage, status, setMessages: setApiMessages } = useChat({
    transport: createTransport(),
  })

  const isApiLoading = status === "streaming" || status === "submitted"
  // ONE API TURN AT A TIME, ACROSS EVERY THREAD, and that is a correction
  // rather than a restriction. This used to read
  // `isApiLoading && apiThread === activeThread`, with the comment "Only the
  // thread that asked is busy. Another thread stays interactive." — which
  // invited a second turn into a channel that cannot hold two. There is one
  // useChat list, one status, one apiHistoryCount and one apiThread; a second
  // send replaced the first thread's history, and when the first answer
  // arrived the commit effect sliced it at the SECOND thread's offset and
  // appended it to the SECOND thread's transcript.
  //
  // Scripted reveals are still per-thread and still concurrent — that is what
  // isTypingIn(activeThread) reads, and the queue behind it is keyed by thread
  // now. Only the network turn is serialised, because only the network turn
  // has one channel.
  const apiBusy = isApiLoading
  const activeBusy = isTypingIn(activeThread) || apiBusy

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

      // The project-header card used to carry this line into the API context.
      // With the card gone the identity has to come from the thread itself,
      // or the model loses track of which project is being discussed.
      const subject = thread === HOME_THREAD ? null : projects.find((x) => x.slug === thread)
      if (subject) {
        history.push({
          id: `ctx-${subject.slug}`,
          role: "assistant",
          parts: [
            {
              type: "text",
              text: `[Currently discussing: ${subject.client} — ${subject.projectTitle}. Edwin's role: ${subject.role}]`,
            },
          ],
        })
      }

      for (const m of messagesOf(thread)) {
        let content = ""

        switch (m.kind) {
          case "text":
            content = (m as { text: string }).text
            break
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
      const { response } = buildResponse("", { preloadedSlug: slug })
      // Marked revealed only once the reveal is actually queued. Adding the
      // slug first meant a reveal that was subsequently lost could never be
      // re-enqueued — the thread stayed blank for the rest of the session with
      // nothing left to retry it.
      if (!response) return
      queueScriptedMessages(response, slug)
      revealedRef.current.add(slug)
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
      //
      // GUARDED, because handleSend is not the only way in: a follow-up chip
      // calls dispatch directly, so the composer being disabled is not enough
      // on its own. Refusing here keeps the single channel single.
      if (apiInFlightRef.current) return
      apiInFlightRef.current = true
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
    apiInFlightRef.current = false
  }, [isApiLoading, useApiMode, apiMessages, apiHistoryCount, apiThread, appendImmediate, setApiMessages])

  // The in-flight flag must survive a turn that produces nothing, or the
  // single channel latches shut for the session. The commit effect above
  // releases it on success and cannot release it on failure: it returns early
  // when there are no answers, which is also the shape of the window between
  // setUseApiMode(true) and sendMessage actually firing.
  //
  // NOT a fix for H5 (silent failures) — there is still no visible error state
  // or retry, and that is out of scope here. This only stops the guard added
  // for H2 from turning a failed request into a dead composer.
  useEffect(() => {
    if (status !== "error") return
    apiInFlightRef.current = false
    setUseApiMode(false)
  }, [status])

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

  // The dock is out of flow so content can scroll under its blur, which means
  // the scroller has to reserve its height itself or the last message sits
  // permanently underneath it. CSS cannot read one element's height into
  // another's padding, and the height is not a constant — the dock is 90px at
  // rest and 220px once the input has grown to its 180px ceiling. So it is
  // measured and published as a custom property.
  //
  // ResizeObserver rather than watching `input`: the dock also changes height
  // on viewport width changes that rewrap the field, and on font load. Those
  // are invisible to a value-keyed effect and would leave the reserve stale.
  const paneRef = useRef<HTMLElement>(null)
  const dockRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const pane = paneRef.current
    if (!pane) return
    const dock = dockRef.current
    if (!dock) {
      // The deck and vibe-coding panes share .pane-scroll but have no
      // composer, so they must not reserve room for one. Without this they
      // fell through to the fallback and carried 80px of dead space at the
      // bottom — invisible on a scrolling pane until you reach the end of it.
      pane.style.setProperty("--dock-h", "0px")
      return
    }
    // Border box, not contentRect: contentRect excludes the dock's own padding,
    // which would mean re-stating --space-20 here as a number and keeping two
    // copies in step. The rendered height already knows it.
    const ro = new ResizeObserver(() => {
      pane.style.setProperty("--dock-h", `${Math.ceil(dock.getBoundingClientRect().height)}px`)
    })
    ro.observe(dock)
    return () => ro.disconnect()
    // WHAT ACTUALLY CHANGES THE ANSWER: which pane is mounted, and whether that
    // pane has a composer. Both are decided by `pane`. With no array at all the
    // observer was disconnected and rebuilt on EVERY render — including on
    // every token of a streamed answer, which is the one interaction where
    // rebuilding an observer and forcing a layout read is least welcome.
    // The observer handles height changes after that; it does not need React
    // to re-subscribe it to notice one.
  }, [pane])

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


  // The deck swaps the pane rather than navigating. A route change would
  // remount this component and take every project thread with it, which is
  // the whole conversation model. /case-study/meridian-deck still exists for
  // deep links and renders this same shell with the pane pre-opened.
  const handleDeck = useCallback(() => {
    setPane("deck")
    setSheetOpen(false)
  }, [])

  const handleAbout = useCallback(() => {
    setPane("about")
    setSheetOpen(false)
  }, [])

  const handleResume = useCallback(() => {
    setPane("resume")
    setSheetOpen(false)
  }, [])

  // Brand mark returns to the front door, and CLEARS the home thread to do it.
  //
  // The front door is the home thread when empty, so a populated home thread
  // would sit on top of it permanently — and unlike a project thread, home has
  // no rail row, so that conversation is unreachable from anywhere else the
  // moment you navigate away. Keeping it would preserve something the visitor
  // cannot get back to at the cost of the landing state they can see the way
  // back to. Home is scratch space; the rail's seven threads are the ones
  // worth keeping, and this does not touch them.
  const handleHome = useCallback(() => {
    setPane("chat")
    setCurrentProjectSlug(null)
    switchThread(HOME_THREAD)
    resetStream(HOME_THREAD)
    setSheetOpen(false)
  }, [switchThread, resetStream])

  // Find last assistant message index for followup chip activation
  const lastAssistantIdx = activeMessages.reduce(
    (acc, m, i) => (m.role === "assistant" ? i : acc),
    -1
  )

  // Entrance animation, gated the same way the chat bubbles gate theirs
  // (hooks/use-prefers-reduced-motion). Every entrance animation in this app
  // now animates OPACITY ONLY and sets no transform, so none of them turns
  // its element into a containing block for position:fixed descendants. See
  // the note above @keyframes cursor-blink in globals.css for what that used
  // to cost.
  const fadeIn = prefersReducedMotion ? "" : "animate-fade-in"
  const delay = (ms: number) => (prefersReducedMotion ? undefined : `${ms}ms`)

  /* ── SHELL ────────────────────────────────────────────────────
     One persistent layout for every state. The rail is the site's index and
     the pane is the conversation; there is no longer a scrolling marketing
     page underneath. See the note on REMOVED_SECTIONS below. */
  // Derived, not stored: the front door IS the home thread when it is empty.
  // A stored mode flag would be a second source of truth for the same fact.
  //
  // Everything on the front door — headline, input position, chips, sampler —
  // is replaced the moment a conversation exists, and comes back when the home
  // thread is empty again (the brand mark returns to it). The sampler is not
  // special-cased: it appears and disappears with the state it belongs to.
  // What the mobile top bar names. Only a project thread has an identity worth
  // repeating — the deck pane leads with its own h1, and the front door is
  // self-evident.
  // allProjects, not projects: the seven plus the vibe-coded ones. With
  // `projects` a vibe project resolved to undefined, so the top bar — which
  // the comment on it calls the only thing naming the open project once the
  // rail is behind the sheet — named nothing at all on mobile. That was
  // invisible while the section was dev-only and ships the moment it is not.
  // Reusing scripted-responses' list rather than concatenating a second one
  // here, so the two cannot disagree about what "every project" means.
  const activeProject =
    pane === "chat" && currentProjectSlug
      ? allProjects.find((p) => p.slug === currentProjectSlug)
      : undefined

  const isFrontDoor =
    pane === "chat" && activeThread === HOME_THREAD && activeMessages.length === 0

  return (
    <div className="shell" data-sheet={sheetOpen}>
      {/* Mobile only — the rail collapses behind this. */}
      {/* Same brand as the rail — "Edwin Lara". This used to be "Edwin" while
          the rail said "Edwin Socrates Lara", which gave one person two name
          forms depending on viewport width. One form now, at both widths.
          This row is TIGHT: brand + subject + MENU filled 340 of 340 at
          "Edwin", so the surname comes out of the subject's share —
          .shell-topbar-subject is the element that gives, by ellipsis. */}
      <div className="shell-topbar">
        <button type="button" className="rail-brand" onClick={handleHome} style={{ padding: 0 }}>
          <Sparkle size="var(--brand-mark-size)" />
          <span className="type-wordmark" style={{ color: "rgb(var(--bureau-text-primary))" }}>
            Edwin Lara
          </span>
        </button>
        {/* On mobile the rail is behind the sheet, so with the header card
            gone this is the only thing naming the open project. railSubtitle
            rather than projectTitle: it is unique across the seven and short
            enough to sit between the brand and the menu without truncating. */}
        {activeProject && (
          <span className="type-caption shell-topbar-subject">
            {activeProject.railSubtitle}
          </span>
        )}
        {/* ARCHIVO, with the rest of the rail. This sits in the mobile top bar
            rather than in .rail, but it is the sheet's toggle — the only way
            in and out of the navigation on a phone — so by the rule it is
            something a person navigates by, not a recorded fact. The brand
            beside it keeps .type-wordmark and stays mono, deliberately. */}
        <button
          type="button"
          className="type-action rail-sheet-close"
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
        onSelectAbout={handleAbout}
        onSelectDeck={handleDeck}
        onSelectResume={handleResume}
        onHome={handleHome}
        onNavigate={() => setSheetOpen(false)}
        open={sheetOpen}
      />

      {/* The response announcement, and the ONLY place it happens.
          Permanently mounted and permanently empty until it is needed:
          a live region that appears with its content already inside is
          announced inconsistently across NVDA, JAWS and VoiceOver, while
          one that is already in the tree and whose text CHANGES is
          announced reliably. So this element never unmounts and only its
          content toggles.

          This is new behaviour, not a port of the old label. The previous
          indicator rendered the word "Generating" in a plain div with no
          role and no aria-live, which announces nothing on its own — a
          screen reader user got the visible text only if they happened to
          be browsing that subtree. Dropping the visible label is what
          prompted adding the announcement that was never there. */}
      <div role="status" aria-live="polite" className="sr-only">
        {activeBusy ? "Generating response" : ""}
      </div>

      <main className="pane" ref={paneRef}>
        {pane === "resume" ? (
          <div className="pane-scroll resume-glow">
            <ResumePane resume={resume} />
          </div>
        ) : pane === "about" ? (
          <div className="pane-scroll about-glow">
            <AboutPane />
          </div>
        ) : pane === "deck" ? (
          // Both washes sit on the SCROLLER, not on the pane component's root:
          // they have to cover .pane-scroll's own top padding or they start
          // 32px down and leave a flat band above the heading. Separate
          // classes rather than one shared name so each is its own entry in
          // check-design's rule 6 — see the note there.
          <div className="pane-scroll deck-glow">
            <DeckPane />
          </div>
        ) : isFrontDoor ? (
          <div className="pane-front">
            {/* Four declarations and no DOM nodes; see .dot-field. */}
            <div className="dot-field" aria-hidden="true" />
            <div className="hero-band" data-hero-col="stack">
                  {/* .type-display — the top of the ladder, at 50/58.
                      It was 28/42 and occupied 2.34% of a 1440x1000 viewport
                      as a single 803px line; a critique put Suno's equivalent
                      at 8%. Measured at the 1120 measure this pane already
                      uses, 50/58 wraps to two lines and lands at 9.02%.
                      The 1.16 leading is the ramp's one exception, bounded to
                      steps of 40 and above. */}
                  <h1
                    className={`type-display ${fadeIn}`}
                    style={{
                      margin: 0,
                      maxWidth: HERO_MEASURE,
                      textAlign: "center",
                      // PRETTY, NOT BALANCE. balance equalises the two lines,
                      // which is exactly what pushed "making" onto line two —
                      // it optimises for even lengths and the sentence does not
                      // want even lengths, it wants to break after the verb.
                      // pretty fills the first line naturally (so the break
                      // lands where HERO_MEASURE puts it) while still avoiding
                      // a one-word last line, which plain wrapping leaves at
                      // three lines: measured at 720, `wrap` orphans
                      // "workflows." and `pretty` does not.
                      textWrap: "pretty",
                      color: "rgb(var(--bureau-text-primary))",
                      animationDelay: delay(60),
                    }}
                  >
                    {/* LAB: the aurora spans the PHRASE, not a word. One span
                        across "designer & builder" so the gradient runs the
                        length of it — background-clip:text on a single inline
                        box paints one continuous ramp, and box-decoration-break
                        defaults to `slice`, so even a line break keeps it
                        continuous rather than restarting per fragment.

                        "products and workflows" keeps its "and" on purpose: an
                        ampersand binds a unit, "and" separates a list of two.
                        The different conjunction is doing work.

                        The gradient is continuous along the phrase rather
                        than restarting per word — measured, see .aurora-word. */}
                    {/* The space before the span is INSIDE the text node, not a
                        {" "} expression, and so is the one after it — the whole
                        sentence is one line for that reason. The extractor
                        drops a whitespace-only JSX child, so {" "} serialised
                        as "AIdesigner" and then as "buildermaking". Same fault
                        the deck hit once before. */}
                    I&apos;m Edwin, AI <span className="aurora-word">designer &amp; builder</span> making useful products and workflows.
                  </h1>

                  <div
                    className={fadeIn}
                    data-hero-col="input"
                    style={{
                      width: "100%",
                      maxWidth: "var(--prose-measure)",
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

                  {/* The relatedness ladder, and it has to be VISIBLE: chip to
                      chip is `within` (8), chips to input is `between` (16),
                      headline to input is `group` (32). Each step is double the
                      last, so a visitor can see that the chips belong to each
                      other more than they belong to the input, and to the input
                      more than the headline does. Previously the chips sat at
                      `within` from the input — the same distance as from each
                      other — which flattened the top two rungs into one. */}
                  <div
                    className={fadeIn}
                    data-hero-col="chips"
                    style={{
                      width: "100%",
                      maxWidth: "var(--prose-measure)",
                      marginTop: "var(--space-between)",
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: "var(--space-within)",
                      animationDelay: delay(150),
                    }}
                  >
                    {PROMPT_CHIPS.map((chip) => (
                      <PromptChip
                        key={chip.id}
                        label={chip.label}
                        onClick={() => handleChipSelect(chip.label)}
                        disabled={activeBusy}
                      />
                    ))}
                  </div>

            </div>

            {/* OUTSIDE the band, deliberately. Inside it, the sampler was
                centred along with the headline and sat in the middle of the
                viewport — the band is viewport-height precisely so these
                start below the fold and get cut by the viewport edge, which
                only works if they follow it rather than share it.
                Still part of the landing state: goes when the conversation
                starts, same as the headline. See the note on isFrontDoor. */}
            <ProjectSampler
              className={fadeIn}
              animationDelay={delay(180)}
              onSelect={handleSidebarProject}
            />
          </div>
        ) : (
          <>
            <div className="pane-scroll reveal-glow" ref={paneScrollRef}>
              <div style={{ ...CHAT_COLUMN, paddingBottom: "var(--space-8)", gap: "var(--space-between)" }} className="flex flex-col">
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

              {/* Typing indicator — shown only while a message is streaming
                  in. Decorative and aria-hidden; the live region above does
                  the announcing. */}
              {activeBusy && <TypingIndicator />}


              </div>
            </div>

            {/* Docked composer — the same component, moved to the pane's
                bottom edge the moment a conversation exists. */}
            <div className="pane-dock" ref={dockRef}>
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
