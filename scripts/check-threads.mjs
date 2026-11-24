// Does a project URL's server-rendered thread survive hydration unchanged?
//
//   npm run dev -- -p 3200            (or ORIGIN=http://localhost:3300 against
//   node scripts/check-threads.mjs     `next start`, which is what was proved)
//
// ── WHY THIS EXISTS ───────────────────────────────────────────────────────
//
// /work/<slug> renders the project's reveal FINISHED on the server, so the case
// study is in the HTML (PRODUCT.md, "A URL addresses a thread, never a page").
// The client builds the same thread during hydration. If the two ever differ —
// a stray Math.random, a Date in a block, an id from generateMessageId — React
// throws away the server's markup and re-renders, and what a crawler indexed is
// not what a visitor sees.
//
// ⚠ AND THE ABSENCE OF A WARNING DOES NOT SHOW THAT THEY MATCH. React's
// recoverable hydration errors are easy to miss and not every difference
// produces one. So this COMPARES: for each project it loads the URL with
// JavaScript disabled — the DOM is then exactly the server's HTML — serialises
// the transcript, loads it again with JavaScript, lets it hydrate and settle,
// and serialises the same transcript. Same browser, same serialiser: any
// difference is real.
//
// It compares the TRANSCRIPT (.pane-scroll), not the whole pane. Two things
// outside it legitimately change after mount: the dock's ResizeObserver writes
// --dock-h onto the pane, and the composer's auto-grow effect re-writes the
// textarea's inline style, which the browser then re-serialises with spaces.
// Neither is a mismatch, and both were the first "differences" this found.
//
// It also checks the other promise: arriving by URL shows the same thread as a
// click. It opens "/", clicks the project's rail row, waits for the stream to
// finish — the follow-up chips present AND no change for 4s, because the image
// groups pause long enough to fool a shorter wait (they did, on the first run)
// — and compares the text with the server's.
//
// PROVED BY BREAKING, 24 November: in a scratch copy where the client built one
// block fewer than the server, both cases failed (transcript differs, and
// React error #418). Motion is ALLOWED during the run: under reduced motion
// the motion hook corrects classes after mount, which would be noise.
//
// ── STATUS: A TOOL, LIKE check-paint.mjs ──────────────────────────────────
// It needs a running server and a browser, so it is not a build gate. Run it
// after changing anything on the reveal path: lib/scripted-responses.ts,
// lib/chips.ts, lib/project-flow.ts, the message components, finishedReveal in
// app-shell.tsx. The projects it checks are read off the rail, so a new
// project is covered the day it is listed.
import { mkdtempSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { spawn } from "child_process"

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3200"
const PORT = 9572
const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = mkdtempSync(join(tmpdir(), "check-threads-"))
const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, "--no-first-run", "--disable-gpu", "--hide-scrollbars", "about:blank"], { stdio: "ignore" })
async function done(code, message) {
  if (message) console[code ? "error" : "log"](message)
  chrome.kill("SIGKILL")
  for (let i = 0; i < 20; i++) { try { rmSync(profile, { recursive: true, force: true }); break } catch { await sleep(100) } }
  process.exit(code)
}

let target = null
for (let i = 0; i < 100 && !target; i++) {
  try { target = (await (await fetch(`http://127.0.0.1:${PORT}/json/list`, { signal: AbortSignal.timeout(500) })).json()).find((t) => t.type === "page") } catch {}
  await sleep(200)
}
if (!target) await done(1, `\ncheck:threads — Chrome did not come up on :${PORT}. Set CHROME= if it is installed elsewhere.`)

const ws = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((r) => ws.addEventListener("open", r, { once: true }))
let id = 0
const pending = new Map()
let errors = []
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data)
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  else if (m.method === "Runtime.exceptionThrown") errors.push((m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text).split("\n")[0].slice(0, 160))
  else if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") errors.push(m.params.args.map((a) => a.value ?? a.description).join(" ").split("\n")[0].slice(0, 160))
})
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })) })
const ev = async (x) => (await send("Runtime.evaluate", { expression: x, returnByValue: true, awaitPromise: true })).result?.result?.value

// The transcript, comments stripped (React's text-boundary markers are not
// content), plus its text and its follow-up chip count.
const SNAP = `(()=>{ const main = document.querySelector('main.pane'); const tx = main && main.querySelector('.pane-scroll'); if (!tx) return null
  const c = tx.cloneNode(true); const walk = (n) => { for (const k of [...n.childNodes]) { if (k.nodeType === 8) k.remove(); else if (k.nodeType === 1) walk(k) } }; walk(c)
  return { html: c.outerHTML, text: tx.innerText.replace(/\\s+/g, ' ').trim(), chips: tx.querySelectorAll('.chip').length } })()`
const vis = `(e) => e.getBoundingClientRect().width > 0`

await send("Runtime.enable"); await send("Page.enable")
await send("Emulation.setDeviceMetricsOverride", { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false })
await send("Page.navigate", { url: ORIGIN + "/" }); await sleep(2500)
const slugs = await ev(`[...new Set([...document.querySelectorAll('.rail-item[data-project-slug]')].map((e) => e.getAttribute('data-project-slug')))]`)
if (!slugs?.length) await done(1, `\ncheck:threads — no project rows found at ${ORIGIN}/. Is the server running?`)

const problems = []
for (const slug of slugs) {
  await send("Emulation.setScriptExecutionDisabled", { value: true })
  await send("Page.navigate", { url: `${ORIGIN}/work/${slug}` }); await sleep(1500)
  const server = await ev(SNAP)
  await send("Emulation.setScriptExecutionDisabled", { value: false }); errors = []
  await send("Page.navigate", { url: `${ORIGIN}/work/${slug}` }); await sleep(3500)
  const hydrated = await ev(SNAP)
  const hydrationErrors = [...errors]
  await send("Page.navigate", { url: ORIGIN + "/" }); await sleep(2500)
  await ev(`[...document.querySelectorAll('.rail-item[data-project-slug="${slug}"]')].find(${vis})?.click()`)
  let clicked = null, last = "", stable = 0
  for (let i = 0; i < 240; i++) { await sleep(500); clicked = await ev(SNAP); if (clicked && clicked.text === last && clicked.chips > 0) { if (++stable >= 8) break } else { stable = 0; last = clicked?.text ?? "" } }

  const out = []
  if (!server) out.push("the server HTML has no transcript")
  else if (!hydrated || server.html !== hydrated.html) out.push(`server and hydrated transcripts DIFFER (${server.html.length} vs ${hydrated?.html.length ?? 0} chars)`)
  if (hydrationErrors.length) out.push(`errors during hydration: ${hydrationErrors[0]}`)
  if (server && clicked && server.text !== clicked.text) out.push(`URL arrival and click show different text (${server.text.length} vs ${clicked.text.length} chars)`)
  console.log(`  ${slug.padEnd(28)} ${out.length ? "FAIL" : "ok  "}  ${server ? server.text.split(" ").length + " words, " + server.chips + " chips" : ""}`)
  for (const o of out) problems.push(`${slug}: ${o}`)
}

if (problems.length) await done(1, `\ncheck:threads — ${problems.length} problem(s)\n` + problems.map((p) => `  x ${p}`).join("\n"))
await done(0, `\ncheck:threads — PASS, ${slugs.length} project URLs: server transcript identical after hydration, and the same as arriving by a click`)
