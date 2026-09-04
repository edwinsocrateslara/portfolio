// Does the pane actually have anything on it?
//
// ── THE BUG THIS EXISTS FOR ───────────────────────────────────────────────
//
// Commit 0a98e7b moved the résumé behind /api/resume. The Resume pane's
// entrance effect — the one that flips [data-resolved] from "false" to "true",
// and until it does CSS holds those elements at opacity 0 and scale 0 — had
// deps of []. It ran once, on mount, which after that commit is the LOADING
// frame. The real résumé rendered a moment later with every row still
// data-resolved="false" and nothing left running to flip them.
//
// The pane shipped fully present in the DOM and completely invisible.
//
// ── AND WHY IT MEASURES PIXELS, WHICH LOOKS CRUDE ─────────────────────────
//
// Two finer instruments were tried against the broken build first, because the
// obvious objection to a pixel count is that something more precise would do:
//
//   document.querySelectorAll('.resume-row').length  →  9      (of 9)
//   .resume-row-body with computed opacity > 0.05    →  9      (of 9)
//
// Both PASS on a pane a person can see is empty. The first counts DOM nodes,
// which is not the question. The second looked like the fix for the first, and
// is still wrong: the opacity that hides the text is set further down the tree
// than .resume-row-body, so the container measures visible while its contents
// do not. Every element-level probe has this failure mode — it can only see
// the property it was told to read, on the node it was told to read it on, and
// the entrance system in this app can hide content through any of a dozen.
//
// Painted pixels have no such blind spot. A person looking at the screen is
// asking "is there ink here", so that is what this asks. It is not precise and
// does not need to be: the failures worth catching are catastrophic, not
// subtle, and a subtle one belongs in check:geometry.
//
// ── STATUS: A TOOL, LIKE check-geometry.mjs ───────────────────────────────
//
// Same reasoning as that file's header — it needs a dev server, so it must not
// become a build gate that goes flaky and gets commented out. It differs in
// one way on purpose: it LAUNCHES ITS OWN Chrome rather than needing one
// already on :9222, because 0a98e7b shipped broken partly on the strength of
// browser tools being enough of a nuisance to set up that verification became
// a hand-driven look at one page instead.
//
//   npm run dev -- -p 3200
//   node scripts/check-paint.mjs
import { mkdtempSync, rmSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"
import { spawn } from "child_process"

const ORIGIN = process.env.ORIGIN ?? "http://localhost:3200"
const PORT = 9571
const CHROME =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

// ── THE CASES ─────────────────────────────────────────────────────────────
// One row per surface: how to open it, and the floor of painted content it
// must clear. These catch "empty"; they do not police layout.
//
// THE FLOORS ARE SET FROM MEASUREMENT, INCLUDING A MEASUREMENT OF THE BUG.
// Resume was run both ways at 1440x1200 before the number was chosen:
//
//   with the fix   5.46% painted
//   with []        0.74% painted     ← the pane in the screenshot, empty
//
// 3% sits in the gap with 4x clearance below and 1.8x above. Resume is the
// tightest case in the file because it is the one pane that is nothing but
// small text on a dark ground; About and Case Study paint 27.6% and 76.9%,
// so their floors are nominal. Every run prints its measurement, so a floor
// drifting towards its surface is visible rather than discovered by a failure.
const CASES = [
  { name: "resume", open: `.rail-doc[data-pane="resume"]`, minInk: 3.0 },
  { name: "about", open: `.rail-doc[data-pane="about"]`, minInk: 2.0 },
  { name: "case-study", open: `.rail-doc[data-pane="deck"]`, minInk: 2.0 },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const profile = mkdtempSync(join(tmpdir(), "check-paint-"))
const chrome = spawn(
  CHROME,
  [
    "--headless=new",
    `--remote-debugging-port=${PORT}`,
    `--user-data-dir=${profile}`,
    "--no-first-run",
    "--disable-gpu",
    "--hide-scrollbars",
    "about:blank",
  ],
  { stdio: "ignore" }
)

/** Chrome flushes its profile asynchronously after SIGKILL, so an immediate
 *  rm races it and throws ENOTEMPTY. Retried, and never fatal: a temp
 *  directory left behind is not a reason to fail a check about the UI. */
async function cleanup() {
  for (let i = 0; i < 20; i++) {
    try {
      rmSync(profile, { recursive: true, force: true })
      return
    } catch {
      await sleep(100)
    }
  }
}

async function bail(message) {
  console.error(`\ncheck:paint — ${message}\n`)
  chrome.kill("SIGKILL")
  await cleanup()
  process.exit(1)
}

let target = null
for (let i = 0; i < 100; i++) {
  try {
    const r = await fetch(`http://127.0.0.1:${PORT}/json/list`, { signal: AbortSignal.timeout(500) })
    const pages = (await r.json()).filter((t) => t.type === "page")
    if (pages.length) { target = pages[0]; break }
  } catch {}
  await sleep(200)
}
if (!target) await bail(`Chrome did not come up on :${PORT}. Set CHROME= if it is installed elsewhere.`)

const ws = new WebSocket(target.webSocketDebuggerUrl)
const pending = new Map()
let nextId = 0
await new Promise((r) => ws.addEventListener("open", r, { once: true }))
ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data)
  const p = pending.get(m.id)
  if (!p) return
  pending.delete(m.id)
  m.error ? p.reject(new Error(m.error.message)) : p.resolve(m.result)
})
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const id = ++nextId
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
const js = async (expression) => {
  const r = await send("Runtime.evaluate", { expression, returnByValue: true, awaitPromise: true })
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text)
  return r.result.value
}

await send("Page.enable")
await send("Emulation.setDeviceMetricsOverride", {
  width: 1440, height: 1200, deviceScaleFactor: 1, mobile: false,
})

/**
 * The share of pixels in the pane that differ from the page background.
 *
 * Sampled on a grid rather than read per-pixel: this is a yes/no question
 * about whether a surface has content, and a 4px lattice answers it in a
 * fraction of the time while still landing inside every glyph stem at this
 * viewport. Alpha is ignored — the canvas is opaque.
 */
/**
 * The share of pixels in the pane region that differ from the page background.
 *
 * Sampled on a 4px lattice rather than every pixel: this is a yes/no question
 * about whether a surface carries content, and the lattice answers it in a
 * fraction of the time while still landing inside glyph stems at this
 * viewport.
 */
async function inkOf(rect) {
  // Captured through CDP rather than drawn in the page: html2canvas-style
  // approaches re-render from the DOM, which would reintroduce exactly the
  // blind spot this check exists to avoid. This is the compositor's output.
  const { data } = await send("Page.captureScreenshot", {
    format: "png",
    clip: { ...rect, scale: 1 },
    captureBeyondViewport: false,
  })
  const png = Buffer.from(data, "base64")
  const bitmap = await decode(png)
  let ink = 0
  let seen = 0
  // The background is whatever the corner pixel is, read from the shot itself
  // rather than hard-coded, so a theme change does not silently zero this out.
  const bg = [bitmap.get(2, 2, 0), bitmap.get(2, 2, 1), bitmap.get(2, 2, 2)]
  for (let y = 0; y < bitmap.height; y += 4) {
    for (let x = 0; x < bitmap.width; x += 4) {
      seen++
      const d =
        Math.abs(bitmap.get(x, y, 0) - bg[0]) +
        Math.abs(bitmap.get(x, y, 1) - bg[1]) +
        Math.abs(bitmap.get(x, y, 2) - bg[2])
      // 24 across three channels: past PNG/compositor noise, under any glyph.
      if (d > 24) ink++
    }
  }
  return (ink / seen) * 100
}

// A PNG reader, because this repo has no image dependency and adding one to
// count pixels would be the wrong trade. Handles what Chrome emits: 8-bit
// truecolour, optionally with alpha, non-interlaced.
async function decode(buf) {
  const { inflateSync } = await import("zlib")
  let p = 8
  let width = 0, height = 0, channels = 0
  const idat = []
  while (p < buf.length) {
    const len = buf.readUInt32BE(p)
    const type = buf.toString("ascii", p + 4, p + 8)
    const body = buf.subarray(p + 8, p + 8 + len)
    if (type === "IHDR") {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      if (body[8] !== 8) throw new Error(`unexpected bit depth ${body[8]}`)
      channels = body[9] === 2 ? 3 : body[9] === 6 ? 4 : 0
      if (!channels) throw new Error(`unexpected colour type ${body[9]}`)
      if (body[12] !== 0) throw new Error("interlaced PNG")
    } else if (type === "IDAT") idat.push(body)
    else if (type === "IEND") break
    p += 12 + len
  }
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(height * stride)
  // Un-filter, per PNG spec. Each scanline names its own filter in byte 0.
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]
    const line = raw.subarray(y * (stride + 1) + 1, y * (stride + 1) + 1 + stride)
    for (let i = 0; i < stride; i++) {
      const a = i >= channels ? out[y * stride + i - channels] : 0
      const b = y > 0 ? out[(y - 1) * stride + i] : 0
      const c = i >= channels && y > 0 ? out[(y - 1) * stride + i - channels] : 0
      let v = line[i]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) {
        const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c)
        v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      } else if (filter !== 0) throw new Error(`unknown PNG filter ${filter}`)
      out[y * stride + i] = v & 0xff
    }
  }
  return { width, height, get: (x, y, ch) => out[y * stride + x * channels + ch] }
}

const problems = []
const rows = []

for (const c of CASES) {
  await send("Page.navigate", { url: ORIGIN })
  await sleep(6500)
  const opened = await js(`(() => {
    const el = document.querySelector(${JSON.stringify(c.open)})
    if (!el) return "missing"
    el.click()
    return "ok"
  })()`)
  if (opened !== "ok") {
    problems.push(`${c.name}: no rail item matches ${c.open}`)
    continue
  }
  // Long enough for a fetch, a dynamic import and the entrance cadence. The
  // pane under test in 0a98e7b failed at every one of those and this check
  // must not be able to mistake "still arriving" for "arrived empty".
  await sleep(7000)

  const rect = await js(`(() => {
    const el = document.querySelector(".doc-pane, .pane-body, main")
    if (!el) return null
    const b = el.getBoundingClientRect()
    return { x: Math.round(b.x), y: Math.round(b.y),
             width: Math.round(Math.min(b.width, innerWidth - b.x)),
             height: Math.round(Math.min(b.height, innerHeight - b.y)) }
  })()`)
  if (!rect || rect.width < 100 || rect.height < 100) {
    problems.push(`${c.name}: could not measure the pane region`)
    continue
  }

  const ink = await inkOf(rect)
  rows.push({ name: c.name, ink, floor: c.minInk })
  if (ink < c.minInk) {
    problems.push(
      `${c.name}: ${ink.toFixed(2)}% of the pane is painted, floor is ${c.minInk}% — ` +
      `the surface opened and rendered nothing a visitor can see`
    )
  }
}

ws.close()
chrome.kill("SIGKILL")
await cleanup()

for (const r of rows) {
  console.log(`  ${r.name.padEnd(12)} ${r.ink.toFixed(2)}% painted   (floor ${r.floor}%)`)
}
if (problems.length) {
  console.error(`\ncheck:paint — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error(
    `\n  A pane that opens empty is invisible to every check that counts elements\n` +
    `  or reads a computed style. If this fired, look for content that rendered\n` +
    `  but was never revealed — an entrance effect that did not re-run is the\n` +
    `  way it has happened before.\n`
  )
  process.exit(1)
}
console.log(`\ncheck:paint — PASS, ${rows.length} panes carry visible content`)
