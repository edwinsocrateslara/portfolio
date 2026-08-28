# Code Audit

Audit date: 2026-08-28  
Scope: `/Users/edwinlara/portfolio`

## Architecture context

This is a Next.js 16 App Router portfolio with two page entry points, one `/api/chat` route, and a mostly statically prerendered UI. Thin server page boundaries parse file-backed content and pass it into a persistent client-side `AppShell`, which owns pane navigation, per-project chat threads, scripted responses, and API fallback state. Presentation is divided by feature under `components/`, with small shared hooks and UI primitives. The data layer is source-controlled rather than database-backed: typed modules under `lib/` derive content from canonical files in `lib/sources/`, while the chat route reads a generated context document and calls Anthropic. Repository-specific scripts enforce content provenance, design-token rules, and chip routing during the build.

There is no root README, CONTRIBUTING file, or standalone architecture document; I reviewed `PRODUCT.md`, `DESIGN.md`, `package.json`, `tsconfig.json`, both available README files, the route/component/hook/data layers, and the project scripts. `tsc --noEmit --incremental false`, `check:sources`, `check:design`, and `check:chips` pass. `npm run lint` does not run a linter; that is finding M4 below. No test files, test script, test runner configuration, or CI workflow were found.

## Critical

### C1 — Every résumé download serves a placeholder

- **Location:** `lib/constants.ts:2`
- **Relevant snippet:**

  ```ts
  // ⚠ THE FILE AT THIS PATH IS A PLACEHOLDER, not the résumé. It is one page
  // reading "PLACEHOLDER - NOT A RESUME"
  resume: {
    label: "Edwin Socrates Lara — Resume 2026",
    url: "/edwin-lara-resume-2026.pdf",
  },
  ```

- **What's wrong:** The referenced file exists, but extracting its text confirms that it says `PLACEHOLDER - NOT A RESUME` and “The real resume has not been added yet.” Both the résumé pane and the chat document card read this shared URL, so all résumé download paths are affected.
- **Why it matters:** Recruiters are a primary audience according to `PRODUCT.md`; the most important document in their common path is currently false and unusable.
- **Suggested fix:** Replace `public/edwin-lara-resume-2026.pdf` with the real résumé before deployment. Add a build/smoke assertion that rejects the placeholder marker (and ideally verifies expected PDF metadata or text) so this cannot ship again.

## High

### H1 — A singleton scripted queue loses project reveals during thread switches

- **Location:** `hooks/use-scripted-stream.ts:58` and `components/shell/app-shell.tsx:214`
- **Relevant snippet:**

  ```ts
  const [pending, setPending] = useState<{ thread: string; blocks: MessageBlock[] } | null>(null)

  await new Promise((r) => setTimeout(r, getTypingDelay()))
  const [next, ...rest] = blocks
  setPending(rest.length ? { thread, blocks: rest } : null)

  const enqueue = useCallback((blocks: MessageBlock[], thread = HOME_THREAD) => {
    setPending({ thread, blocks })
  }, [])
  ```

  ```ts
  if (revealedRef.current.has(slug)) return
  revealedRef.current.add(slug)
  if (response) queueScriptedMessages(response, slug)
  ```

- **What's wrong:** Although queued blocks carry a thread ID, there is only one `pending` slot. If project A is sleeping between blocks and the visitor opens project B, B replaces `pending`; when A's stale async closure wakes, it writes A's remainder back over B. B has already been added to `revealedRef`, so revisiting it will not enqueue the reveal again. The same uncancelled closure can also repopulate a thread after `reset()` clears it.
- **Why it matters:** Normal rail navigation can leave a project permanently blank for the rest of the session or resurrect a conversation the visitor explicitly cleared.
- **Suggested fix:** Store pending work and cancellation state per thread, and cancel/ignore stale timers with a request token or effect cleanup. Mark a thread revealed only after its reveal is safely registered, not before enqueueing into a lossy singleton.

### H2 — One `useChat` instance is shared across independently interactive threads

- **Location:** `components/shell/app-shell.tsx:101`
- **Relevant snippet:**

  ```ts
  const { messages: apiMessages, sendMessage, status, setMessages: setApiMessages } = useChat({
    transport: createTransport(),
  })

  // Only the thread that asked is busy. Another thread stays interactive.
  const activeBusy = isTypingIn(activeThread) ||
    (isApiLoading && apiThread === activeThread)
  ```

  ```ts
  setApiThread(from)
  setUseApiMode(true)
  const history = buildApiHistory(from)
  setApiHistoryCount(history.length + 1)
  setApiMessages(history)
  setTimeout(() => {
    sendMessage({ text })
  }, 0)

  appendImmediate(
    { id: m.id, role: "assistant", kind: "text", text } as StructuredMessage,
    apiThread
  )
  ```

- **What's wrong:** The UI deliberately enables thread B while thread A has an API request in flight, but both calls mutate one `useChat` message list, one status, one `apiHistoryCount`, and one mutable `apiThread`. A request from B can replace A's history while A is still streaming; whichever request updates or finishes next is then interpreted using the latest thread/count values.
- **Why it matters:** Answers and histories can be mixed, truncated, or committed into the wrong project's transcript—the exact cross-thread leak the surrounding comments say the design prevents.
- **Suggested fix:** Give each thread its own chat/request state, including its own transport lifecycle and immutable request ID. If per-thread clients are unnecessary, globally serialize API fallback and disable every composer until the one shared request completes or is explicitly cancelled.

### H3 — Model output is inserted as unsanitized HTML

- **Location:** `components/chat/message-bubbles.tsx:157`
- **Relevant snippet:**

  ```ts
  dangerouslySetInnerHTML={{
    __html: p
      .replace(/\*\*(.+?)\*\*/g, '<strong style="font-weight:700">$1</strong>')
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:rgb(var(--bureau-text-primary));text-decoration:underline;text-underline-offset:3px">$1' +
          '<svg class="link-ext" aria-hidden="true" viewBox="0 0 24 24" fill="none"' +
          ' stroke="currentColor" stroke-width="2" stroke-linecap="round"' +
          ' stroke-linejoin="round"><path d="M7 7h10v10"/><path d="M7 17 17 7"/></svg>' +
          '<span class="sr-only"> (opens in a new tab)</span></a>'
      ),
  }}
  ```

- **What's wrong:** The transformation never escapes the original string and does not restrict link protocols. API response text is passed through this renderer while streaming and after it is committed, so HTML event attributes such as `<img onerror=...>` or a generated `javascript:` link reach the DOM unchanged.
- **Why it matters:** A prompt-induced or otherwise malformed model response can execute script in the portfolio's origin or present an executable link. There is also no Content Security Policy in the repository to provide a secondary containment layer.
- **Suggested fix:** Render formatting as React nodes or use the already-installed Markdown renderer with raw HTML disabled. Apply an explicit URL protocol allow-list (`https`, `http`, `mailto` as intended) and add a restrictive CSP as defense in depth.

### H4 — Needs verification: the public Anthropic proxy accepts unchecked, unbounded histories

- **Location:** `app/api/chat/route.ts:93`
- **Relevant snippet:**

  ```ts
  export async function POST(req: Request) {
    const { messages }: { messages: UIMessage[] } = await req.json()

    const result = streamText({
      model: anthropic("claude-sonnet-4-6"),
      system: SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      temperature: 0,
      abortSignal: req.signal,
    })

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
    })
  }
  ```

- **What's wrong:** The TypeScript annotation does not validate runtime JSON, roles, part types, message count, or total characters. The route also contains no rate limit or caller quota, so anyone who can reach it can repeatedly submit their own valid histories and cause server-side Anthropic calls.
- **Why it matters:** Malformed bodies become avoidable 500s; valid oversized or repeated requests can consume model quota and create unexpected spend. `maxDuration = 30` caps wall-clock time, not input tokens or request frequency.
- **Suggested fix:** Validate the body with a runtime schema, allow only the message/part shapes the UI emits, and cap message count, per-message length, total input, and output tokens. Add an IP/session rate limit and spend alert; verify whether the production host already supplies equivalent WAF/rate controls before treating the exposure as confirmed in deployment.

### H5 — API failures are silent, and partial failures are committed as complete answers

- **Location:** `components/shell/app-shell.tsx:101` and `components/shell/app-shell.tsx:275`
- **Relevant snippet:**

  ```ts
  const { messages: apiMessages, sendMessage, status, setMessages: setApiMessages } = useChat({
    transport: createTransport(),
  })
  const isApiLoading = status === "streaming" || status === "submitted"

  if (isApiLoading || !useApiMode) return
  const answers = apiMessages.slice(apiHistoryCount).filter((m) => m.role === "assistant")
  if (answers.length === 0) return
  ```

- **What's wrong:** `useChat` exposes an error state, but it is not read and `status === "error"` has no branch. A failure before tokens leaves the user's message with no response and `useApiMode` stuck true; a failure after some tokens causes the effect to commit the partial assistant fragment as though the turn completed successfully.
- **Why it matters:** Network, provider, quota, and configuration failures look like Edwin gave no answer or an abruptly truncated answer, with no explanation or retry affordance.
- **Suggested fix:** Handle `status === "error"` before the completion path, preserve the originating thread, clear the live channel deterministically, and append a visible retryable error state. Do not commit partial output as a successful answer unless it is explicitly labelled incomplete.

### H6 — `npm run clean` terminates unrelated Next.js development servers

- **Location:** `scripts/clean.mjs:10`
- **Relevant snippet:**

  ```js
  const running = execSync("pgrep -f 'next dev' || true", { encoding: "utf8" }).trim()
  if (running) {
    execSync("pkill -f 'next dev' || true")
  }
  ```

- **What's wrong:** The process match is machine-wide and is not scoped to this repository, its port, or a PID owned by this script.
- **Why it matters:** Cleaning this portfolio can kill every `next dev` process the developer is running, interrupting unrelated projects and potentially discarding in-memory development state.
- **Suggested fix:** Track this project's dev PID, or resolve and terminate only the process serving this checkout/known port after verifying its command and working directory. Leave unrelated matches untouched.

## Medium

### M1 — The location matcher captures any unmatched question containing “where”

- **Location:** `lib/scripted-responses.ts:376`
- **Relevant snippet:**

  ```ts
  if (t.includes("based") || t.includes("where") || t.includes("location")) {
    return {
      response: [
        {
          kind: "text",
          text: "Toronto, Ontario, Canada.",
        },
      ],
      projectSlug: null,
    }
  }
  ```

- **What's wrong:** `where` is treated as a location intent regardless of context. For example, “Where did you study?” or “Where did you work at Super.com?” reaches this late fallback and returns “Toronto, Ontario, Canada” instead of the relevant sourced/API answer.
- **Why it matters:** Valid portfolio questions receive a confident but unrelated answer, undermining the chat's stated strict-Q&A behavior.
- **Suggested fix:** Match explicit location phrases such as “where are you based,” “where do you live,” and “your location,” or use tokenized intent rules with regression cases for non-location `where` questions.

### M2 — Conversation scroll state is lost when returning from a document pane

- **Location:** `components/shell/app-shell.tsx:117` and `components/shell/app-shell.tsx:362`
- **Relevant snippet:**

  ```ts
  useLayoutEffect(() => {
    const el = paneScrollRef.current
    if (!el) return
    el.scrollTop = scrollPosRef.current[activeThread] ?? el.scrollHeight
  }, [activeThread])

  const handleResume = useCallback(() => {
    setPane("resume")
    setSheetOpen(false)
  }, [])
  ```

- **What's wrong:** Scroll is saved only inside `switchThread`, and restoration runs only when `activeThread` changes. Opening Resume/About/Deck unmounts the conversation scroller without saving it; selecting the same project again keeps the same `activeThread`, so the restoration effect does not rerun and the new scroller starts at the top.
- **Why it matters:** A reader who leaves a long case study to inspect a document loses their place despite the component explicitly promising per-thread scroll memory.
- **Suggested fix:** Save the active chat scroll before every pane transition and restore when the chat pane remounts, with `pane` (or scroller mount identity) included in the restoration trigger.

### M3 — Eight meaningful images are hidden from assistive technology

- **Location:** `components/about/about-pane.tsx:31`, `lib/projects.ts:96`, and `lib/vibe-projects.ts:123`
- **Relevant snippet:**

  ```ts
  portrait: { src: "/about/malamute.webp", alt: "" },
  race: { src: "/about/race-day.webp", alt: "", position: "50% 100%" },
  ```

  ```ts
  images: [
    { url: "/framer/ai-workforce-development/career-paths-graph.webp", alt: "" },
    { url: "/framer/ai-workforce-development/role-detail.webp", alt: "" },
  ]

  images: [
    { url: "/framer/futurefit-ideas-dashboard/dashboard.webp", alt: "" },
    { url: "/framer/futurefit-ideas-dashboard/canny-board-post.webp", alt: "" },
    { url: "/framer/futurefit-ideas-dashboard/clarify-meeting-notes.webp", alt: "" },
    { url: "/framer/futurefit-ideas-dashboard/system-architecture.webp", alt: "" },
  ]
  ```

- **What's wrong:** Empty alt text declares an image decorative. The About photos are described in the code as the site's only human presence, and the six project images include product detail and an architecture diagram that carry case-study information; all are omitted from the accessibility tree, including in the lightbox.
- **Why it matters:** Screen-reader users cannot access evidence that sighted users receive, and generic button names such as “Open image full-screen” do not convey the missing content.
- **Suggested fix:** Add authored alt text at the data source for the two existing About photos, the two FutureFit workforce images, and the four vibe-project images. Keep empty alt only on preview thumbnails already named by adjacent visible text.

### M4 — The lint script is incompatible with the installed Next.js version

- **Location:** `package.json:9`
- **Relevant snippet:**

  ```json
  "scripts": {
    "lint": "next lint"
  },
  "dependencies": {
    "next": "16.1.6"
  }
  ```

- **What's wrong:** Running `npm run lint` exits with `Invalid project directory provided, no such directory: .../portfolio/lint`; Next 16 interprets `lint` as a directory because the `next lint` command is no longer available. There is no standalone ESLint dependency/configuration to replace it.
- **Why it matters:** Contributors and automation can believe a lint gate exists when it executes no lint rules at all, leaving issues such as hook dependency mistakes unguarded.
- **Suggested fix:** Install/configure ESLint explicitly and point the script at the ESLint CLI, then include it in the verified build/CI path.

### M5 — The wordmark requests a font weight that was never loaded

- **Location:** `app/layout.tsx:18` and `app/globals.css:856`
- **Relevant snippet:**

  ```ts
  const ibmPlexMono = IBM_Plex_Mono({
    weight: ["400", "500", "600"],
  })
  ```

  ```css
  .type-wordmark {
    font-family: var(--ff-plex-mono);
    font-weight: 700;
  }
  ```

- **What's wrong:** IBM Plex Mono 700 is not among the loaded faces, so the browser selects the nearest available face and may synthesize the requested weight. This contradicts the repository's explicit `next/font` convention of loading real faces rather than accepting synthesized ones.
- **Why it matters:** The brand mark can render with platform-dependent stroke weight, so the most persistent text on the site is not using the type treatment the CSS specifies.
- **Suggested fix:** Either load IBM Plex Mono 700 or make `.type-wordmark` use an intentionally selected loaded weight such as 600.

### M6 — The dock `ResizeObserver` is recreated after every render

- **Location:** `components/shell/app-shell.tsx:323`
- **Relevant snippet:**

  ```ts
  useEffect(() => {
    const ro = new ResizeObserver(() => {
      pane.style.setProperty("--dock-h", `${Math.ceil(dock.getBoundingClientRect().height)}px`)
    })
    ro.observe(dock)
    return () => ro.disconnect()
  })
  ```

- **What's wrong:** The effect has no dependency array, so every AppShell render disconnects the observer and creates a new one. API streaming updates `apiMessages` repeatedly, making this lifecycle churn occur throughout each streamed answer even though the dock element has not changed.
- **Why it matters:** Repeated observer allocation/subscription and initial layout measurement add avoidable main-thread work on the interaction most sensitive to rendering jank.
- **Suggested fix:** Bind the observer only when the pane/dock mount state changes, using a focused dependency list or callback ref, and let the observer handle height changes thereafter.

### M7 — The visual comparison script is tied to one developer's checkout

- **Location:** `scripts/capture-compare.mjs:14`
- **Relevant snippet:**

  ```js
  import { connect } from "/Users/edwinlara/portfolio/scripts/shot.mjs"
  ```

- **What's wrong:** The script fails immediately anywhere the repository is not checked out at that exact absolute path. Other scripts already use relative imports or `import.meta.url`, which is the established portable pattern.
- **Why it matters:** A collaborator, CI job, renamed folder, or worktree cannot run the documented visual comparison workflow.
- **Suggested fix:** Import `./shot.mjs` relatively, matching `scripts/sample-hues.mjs`, or resolve from `import.meta.url` where a filesystem path is required.

## Low

### L1 — Two message variants and their renderers have no producers

- **Location:** `components/chat/message-bubbles.tsx:19` and `components/chat/message-bubbles.tsx:765`
- **Relevant snippet:**

  ```ts
  export type MessageKind =
    | "project-header"
    | "image-row"

  {kind === "project-header" && (
    <ProjectHeaderBubble
      project={(message as ProjectHeaderMessage).project}
    />
  )}
  {kind === "image-row" && (
    <ImageRowBubble
      images={(message as ImageRowMessage).images}
    />
  )}
  ```

- **What's wrong:** A repository-wide search finds no code that creates either message kind. The project-header comment explicitly says the producer was removed, and project images are now emitted as individual `image` blocks, leaving both branches, interfaces, and components dormant.
- **Why it matters:** The discriminated union and central renderer advertise supported states that cannot occur, increasing cast-heavy switch code and the surface future changes must reason about.
- **Suggested fix:** Remove the two variants and their renderer components until a real producer exists. Reintroduce them with a consuming path and coverage if the product needs them later.

### L2 — Two installed presentation dependencies have no live consumers

- **Location:** `package.json:27` and `tailwind.config.ts:2`
- **Relevant snippet:**

  ```json
  "react-markdown": "^9.0.3",
  "tailwindcss-animate": "^1.0.7"
  ```

  ```ts
  import animate from "tailwindcss-animate"
  plugins: [animate]
  ```

- **What's wrong:** `react-markdown` is never imported. `tailwindcss-animate` is registered, but no utility supplied by that plugin is used; the repository's animation classes are custom definitions in `globals.css`.
- **Why it matters:** They increase install/update/audit surface and imply capabilities the application does not use. The Tailwind plugin also executes during CSS builds without producing a consumed utility.
- **Suggested fix:** Remove both dependencies and the unused Tailwind plugin registration, unless H3 is fixed by deliberately adopting `react-markdown` with raw HTML disabled.

### L3 — Sampler cards pay for a backdrop blur with no visual input

- **Location:** `app/globals.css:2174`
- **Relevant snippet:**

  ```css
  .sampler-card {
    -webkit-backdrop-filter: blur(var(--layer-blur));
    backdrop-filter: blur(var(--layer-blur));
  }
  ```

- **What's wrong:** The hero glow that justified the blur was removed, so the three landing-page cards blur a flat backdrop and produce no intended visual difference.
- **Why it matters:** `backdrop-filter` can force extra compositing work on the front door, including mobile devices, for an effect the code comments confirm has nothing to process.
- **Suggested fix:** Remove both declarations from `.sampler-card`; keep the dock blur, whose comment documents a live visual purpose.

## Test coverage

There is no runtime test suite, so every finding above is in untested code. Existing check scripts validate content provenance, design-token syntax, and chip routing, but they do not exercise React state, route failure behavior, rendered HTML safety, assets, or developer-tool side effects.

Prioritize coverage by blast radius:

1. **C1:** Add a deployment smoke test that downloads every `DOCS` local URL, verifies a non-placeholder PDF, and checks the expected content marker.
2. **H1, H2, H5:** Test the chat state machine with fake timers and controllable streams: switch A→B mid-reveal, reset during a delay, start API turns in two threads, fail before the first token, and fail after a partial token sequence.
3. **H3, H4:** Add renderer tests with raw tags, event attributes, and unsafe protocols; add route contract tests for invalid JSON, invalid message parts, excessive histories, and configured limits.
4. **M1, M2, M3:** Add table-driven intent cases, a pane-return scroll test, and automated accessibility checks over every case-study image/lightbox.
5. **H6, M4, M7:** Add a lightweight tooling smoke job that proves lint actually runs, scripts resolve from a temporary checkout path, and clean targets only a fixture process owned by the project.

## Themes

1. **Per-thread behavior is built on singleton in-flight state.** Both `pending` in `useScriptedStream` and the single `useChat` channel carry a thread label but cannot safely hold simultaneous work, which causes H1 and H2 and complicates H5.
2. **Known defects are documented instead of gated.** The résumé placeholder, empty meaningful alt text, and no-op sampler blur are all described accurately in comments, yet all can pass the build; comments preserve intent but do not protect releases.
3. **Source-file boundaries are much stronger than network/rendering boundaries.** The résumé parser fails loudly and content/chip generators self-check, while `/api/chat` trusts asserted JSON, model output reaches `dangerouslySetInnerHTML`, and provider errors have no explicit state.
4. **Custom design/provenance gates are strong, but standard engineering gates are absent.** The project-specific checks pass and contain useful positive controls; the lint command is broken, there is no runtime test suite, and no CI workflow was found.
5. **`AppShell` concentrates too many lifecycle responsibilities.** Thread history, two streaming mechanisms, pane navigation, scroll persistence, request completion, and dock measurement share one component, and the repeated defects cluster at the boundaries between those responsibilities.
