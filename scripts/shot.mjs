// Drive the running dev server through the Chrome DevTools Protocol:
// screenshot a route, measure elements, click things, read back the DOM.
//
// ── What this is for ─────────────────────────────────────────────────────
// RENDERING BUGS AND GEOMETRY. Things that are wrong on screen and correct in
// source. Everything below was found with it and would not have been found by
// reading code:
//
//   - the hero glow drew a hard rectangle where the radial gradient was
//     clipped by its max-w-7xl parent mid-falloff
//   - RESUME rendered entirely off-screen at 380px because the nav could not
//     wrap
//   - the mobile rail sheet covered its own close button
//   - the chat column sat 2px left of the input, because one side had a
//     scrollbar and the other did not
//
// ── What this is NOT for ─────────────────────────────────────────────────
// DESIGN-SYSTEM DRIFT. Use `npm run check:design` for that. `gap-4` and
// `gap-between` compile to the same 16px; `maxWidth: 480` and a named
// constant render identically. A screenshot cannot tell them apart, and a
// pass here says nothing about whether the code is on the system.
//
// Diffing a screenshot against a REFERENCE from another site measures
// nothing. Diffing against this repo's own previous screenshot to catch a
// regression is real, but this page is dark, achromatic, and streams content
// on randomised 400-900ms delays, so it needs masking or it is all false
// positives.
//
// ── Usage ────────────────────────────────────────────────────────────────
//   npm run dev            (must already be running)
//   node scripts/shot.mjs --url http://localhost:3200/ --out /tmp/a.png
//   node scripts/shot.mjs --url ... --width 380 --dpr 2 --out /tmp/m.png
//   node scripts/shot.mjs --url ... --measure '.rail, [data-hero-col="input"]'
//
// Chrome must be running with --remote-debugging-port=9222. No dependencies:
// Node's built-in WebSocket does the whole job.
const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}

const CDP_PORT = arg("port", "9222")
const URL_ = arg("url", "http://localhost:3200/")
const WIDTH = Number(arg("width", "1440"))
const HEIGHT = Number(arg("height", "1000"))
const DPR = Number(arg("dpr", "1"))
const OUT = arg("out", null)
const MEASURE = arg("measure", null)
const WAIT = Number(arg("wait", "2500"))

export async function connect(port = CDP_PORT) {
  const targets = await (await fetch(`http://localhost:${port}/json/list`)).json()
  const page = targets.find((t) => t.type === "page")
  if (!page) throw new Error(`No page target on :${port}. Is Chrome running with --remote-debugging-port=${port}?`)

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
  }
  await new Promise((r) => (ws.onopen = r))

  const send = (method, params = {}) =>
    new Promise((res) => { const i = ++id; pending.set(i, res); ws.send(JSON.stringify({ id: i, method, params })) })

  await send("Runtime.enable")
  await send("Page.enable")

  const evalJS = async (expression) => {
    const r = await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })
    if (r.result?.exceptionDetails)
      throw new Error(r.result.exceptionDetails.exception?.description || "eval error")
    return r.result.result.value
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
  const goto = async (url, settle = WAIT) => { await send("Page.navigate", { url }); await sleep(settle) }

  /**
   * Wait for the scripted stream to finish rather than guessing a duration.
   * A project reveal is 13-15 blocks at 400-900ms each, so a fixed sleep is
   * either slow or racy — this produced false failures repeatedly before it
   * existed. Settles on a stable block count AND a re-enabled input.
   */
  const settleStream = async (max = 40000) => {
    let last = -1, stable = 0, t = 0
    while (t < max) {
      await sleep(800); t += 800
      const n = await evalJS(`document.querySelectorAll('.pane-scroll > div > *').length`)
      const busy = await evalJS(`!!document.querySelector('textarea')?.disabled`)
      if (n === last && !busy && n > 0) { if (++stable >= 4) return n } else { stable = 0; last = n }
    }
    return last
  }

  return { send, evalJS, sleep, goto, settleStream, close: () => ws.close() }
}

// Run directly: screenshot and/or measure, then exit.
if (import.meta.url === `file://${process.argv[1]}`) {
  const { send, evalJS, goto, close } = await connect()
  await send("Emulation.setDeviceMetricsOverride", {
    width: WIDTH, height: HEIGHT, deviceScaleFactor: DPR, mobile: WIDTH < 500,
  })
  await goto(URL_)

  if (MEASURE) {
    const rects = await evalJS(`(() => [...document.querySelectorAll(${JSON.stringify(MEASURE)})].map(e => {
      const b = e.getBoundingClientRect()
      return { sel: e.className?.toString?.().slice(0, 40) || e.tagName,
               l: +b.left.toFixed(1), r: +b.right.toFixed(1), w: +b.width.toFixed(1), h: +b.height.toFixed(1) }
    }))()`)
    console.log(JSON.stringify(rects, null, 2))
    console.log("overflow-x:", await evalJS(`document.documentElement.scrollWidth > innerWidth + 1`))
  }

  if (OUT) {
    const { writeFileSync } = await import("fs")
    const r = await send("Page.captureScreenshot", { format: "png" })
    writeFileSync(OUT, Buffer.from(r.result.data, "base64"))
    console.log(`wrote ${OUT}  (${WIDTH}x${HEIGHT} @${DPR}x)`)
  }

  close()
}
