// Derive a Claude Design artboard (.dc.html) FROM the running app, and refuse
// to hand one over that does not look like the app.
//
// ── Why this exists ──────────────────────────────────────────────────────
// A design canvas that reproduces this UI is a second copy of every visual
// decision in globals.css. Hand-maintaining it is the exact duplication this
// repo removes everywhere else: resume.txt is parsed rather than retyped,
// edwin-context.md is generated rather than written, voice.md is verbatim-
// checked rather than trusted. The canvas has to work the same way.
//
// So the artboard is not authored. It is EXTRACTED from the rendered page:
// walk the real DOM, read the real computed styles, emit them inline.
//
// ── THE BASE-LAYER TRAP, and why the probe is built the way it is ────────
// Emitting "every property that differs from the default" needs a definition
// of default, and the obvious one is wrong. A probe element mounted inside the
// running app inherits everything the app's base layer has already
// normalised — so a property the reset SET is identical on the probe and on
// the real element, gets diffed away as unchanged, and then falls back in the
// artboard to the UA value the reset existed to remove.
//
// That fault shipped four separate times: <p> margins (UA 1em, preflight 0),
// button fonts (UA 13.33px Arial, preflight inherit), border styles (UA none,
// preflight solid) and heading weights (UA bold, preflight inherit). Each was
// invisible to a geometry check, each was obvious on sight, and each was
// "fixed" by adding one more rule to the artboard's base layer — which is a
// note-shaped fix for a design-shaped problem. A comment saying "remember the
// base layer" would have been the fifth.
//
// THE PROBE NOW READS FROM A PRISTINE DOCUMENT — a blank same-origin iframe
// with no stylesheet at all — so the reference is the UA's own defaults and
// nothing the app normalises can hide inside them. Exactly two categories opt
// out, both of them explicit tables below rather than assumptions:
//
//   WRAPPER_INHERITED — inherited properties, referenced against the app's
//   <body> and emitted once on the artboard's root, so 200 elements do not
//   each carry a font stack.
//
//   GLOBAL_RESET — the handful of properties the app sets on *. The SAME
//   table is written into the artboard's base layer and used as the diff
//   reference, so the two cannot disagree; that coupling is the point.
//
// Anything outside those two tables is compared against a document with no
// rules in it, which is the only reference that cannot lie.
//
// ── What it does NOT capture ─────────────────────────────────────────────
// One rendered state of one route at one viewport. Hover, focus, active,
// disabled, loading and error states are not in the DOM at capture time.
// Neither is anything behind another pane. Widen the capture by taking more
// artboards, never by hand-editing one.
//
// ── Usage ────────────────────────────────────────────────────────────────
//   npm run dev                                   (must be on :3200)
//   chrome --remote-debugging-port=9222           (see shot.mjs)
//   node scripts/canvas-artboard.mjs --out <dir> [--w 1440] [--h 1000] [--fold]
//
// --h IS A FLOOR, NOT A HEIGHT. The frame is measured from the deepest thing
// that scrolls, so a pane taller than --h grows the capture until the whole
// pane is inside it. --fold opts out: the frame stays at --h and the height
// guard is waived, which is how the two reveals keep a board that still shows
// the composer overlapping the transcript.
//
// Writes <dir>/Main.dc.html, one file per <img>, AND <dir>/Legend.dc.html —
// the legend is regenerated here rather than separately so it cannot be a
// version behind the board it sits next to (see the block that spawns it).
// THEN screenshot-diffs the result against the running app and exits non-zero
// if they do not match — so a failing artboard cannot be seeded or published,
// because it never gets that far. --no-verify skips the check and is for
// debugging only.
//
//   node scripts/canvas-artboard.mjs --selftest   proves the check catches all
//                                                 four historical faults
import { connect } from "./shot.mjs"
import { FREEZE, verify } from "./verify-artboard.mjs"
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from "fs"
import { join } from "path"
import { spawnSync } from "child_process"
import { rmSync, mkdtempSync } from "fs"
import { tmpdir } from "os"

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`)
  return i === -1 ? d : process.argv[i + 1]
}
const OUT = arg("out", ".canvas")
const W = Number(arg("w", 1440))
const H = Number(arg("h", 1000))
const ROUTE = arg("route", "http://localhost:3200/")
const ROOT = arg("root", ".shell")
// A surface that is not a route. Most of this app's surfaces are pane state
// inside one shell — About and Resume have no URL at all — so navigating is
// not enough to reach them. --setup names a file whose contents run IN THE
// PAGE after navigation and before anything is read.
//
// IT MUST RUN ON THE VERIFY PATH TOO, and that is the whole reason this is a
// flag rather than something done by hand before calling the script. verify()
// screenshots the app and the artboard and diffs them; if setup ran only for
// the extraction, verify would photograph the front door, compare it to an
// About artboard, and fail every single time. Worse, the obvious "fix" for
// that failure is to loosen the threshold, which would silently retire the
// only thing standing between a wrong artboard and a publish.
const SETUP_FILE = arg("setup", null)
const SETUP = SETUP_FILE
  ? `(async () => { ${readFileSync(SETUP_FILE, "utf8")} })()`
  : null
// How long to let the app settle after setup — a pane swap re-renders, images
// decode, and the dock re-measures. Deliberately separate from the post-load
// settle: reaching a surface costs more than loading one.
// A CEILING, NOT A WAIT. See the settle loop below: the script polls for a
// settled transcript and stops early when it finds one. 40s covers the slow end
// of a 38-block reveal at 900ms a block; a surface with no stream returns in
// well under a second.
const SETUP_SETTLE = Number(arg("setup-settle", 40_000))
// FOLD BOARDS. Default is to grow the capture to the whole pane; --fold keeps
// it at exactly --h and waives the height guard. It exists for one reason: at
// full height the composer sits after the transcript and stops overlapping it,
// and that overlap is a real condition with decisions attached. A fold board
// is the only place it can still be seen, so the two reveals get one each.
const FOLD = process.argv.includes("--fold")
// A project reveal is a scripted stream: it arrives in blocks behind 400-900ms
// typing pauses, so at any given instant there is no such thing as "the"
// reveal. Under prefers-reduced-motion the hook skips every delay and the
// whole transcript lands at once — which is the settled END STATE, the only
// state a static board can honestly represent.
//
// It is also a real rendering of the app rather than a trick: this is exactly
// what a reduced-motion visitor sees. Verified to move no layout — the app's
// only @media (prefers-reduced-motion) block turns off two animations on the
// typing indicator and changes nothing else.
const REDUCED = process.argv.includes("--reduced-motion")
const MEDIA = REDUCED
  ? { features: [{ name: "prefers-reduced-motion", value: "reduce" }] }
  : null
const VERIFY = !process.argv.includes("--no-verify")
const SELFTEST = process.argv.includes("--selftest")
// Proof harness only: reintroduces one historical fault by suppressing the
// properties whose loss caused it. Named for the bug, not the property.
const FAULTS = {
  "p-margins":      { props: ["marginTop","marginRight","marginBottom","marginLeft"], tags: null },
  "button-font":    { props: ["fontFamily","fontSize","fontWeight","lineHeight"], tags: ["button","input","textarea","select"] },
  "border-style":   { props: ["borderTopStyle","borderRightStyle","borderBottomStyle","borderLeftStyle"], tags: null,
                      unreset: ["borderTopStyle","borderRightStyle","borderBottomStyle","borderLeftStyle"] },
  "heading-weight": { props: ["fontWeight"], tags: ["h1","h2","h3","h4","h5","h6"] },
}
const INJECT = arg("inject", null)
if (INJECT && !FAULTS[INJECT]) {
  console.error(`unknown --inject "${INJECT}". Known: ${Object.keys(FAULTS).join(", ")}`)
  process.exit(2)
}

// The properties the app sets on *. Written into the artboard's base layer AND
// used as the diff reference — one table, so the emitted CSS and the thing it
// is compared against cannot drift apart.
// ── Positive control ─────────────────────────────────────────────────────
// A check that has never been seen to fail is a check nobody should trust, so
// each of the four faults this extractor actually shipped is reintroduced and
// the verifier has to catch it. Same standard as check-design's rule proofs,
// and the same reason: these all passed a geometry check while being obvious
// on sight.
if (SELFTEST) {
  const self = new URL(import.meta.url).pathname
  const run = (args) => {
    const dir = mkdtempSync(join(tmpdir(), "dc-selftest-"))
    const r = spawnSync(process.execPath, [self, "--out", dir, ...args],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 120000 })
    const out = (r.stdout || "") + (r.stderr || "")
    rmSync(dir, { recursive: true, force: true })
    return { code: r.status, out }
  }
  const problems = []
  console.log("self-test: the clean artboard must PASS, and each known fault must FAIL\n")

  const clean = run([])
  const cleanLine = clean.out.split("\n").find((l) => l.startsWith("verify:")) ?? "(no verdict)"
  console.log(`  clean            ${(clean.code === 0 ? "PASS" : "FAIL (exit " + clean.code + ")").padEnd(22)} ${cleanLine.trim()}`)
  if (clean.code !== 0) problems.push("the clean artboard FAILED verification — nothing below means anything")

  for (const fault of Object.keys(FAULTS)) {
    const r = run(["--inject", fault])
    const line = r.out.split("\n").find((l) => l.includes("verify")) ?? "(no verdict)"
    // Exactly 1 means the verifier rejected the artboard. null means the run
    // was killed and 2 means it errored — neither is evidence of anything.
    // Treating "not zero" as success let a hung run report CAUGHT while its
    // own verdict line said PASS.
    const caught = r.code === 1
    const how = caught ? "CAUGHT" : r.code === 0 ? "MISSED" : "INCONCLUSIVE (exit " + r.code + ")"
    console.log(`  ${fault.padEnd(16)} ${how.padEnd(22)} ${line.trim()}`)
    if (r.code === 0) problems.push(`fault "${fault}" was NOT caught — the check cannot see it`)
    else if (!caught) problems.push(`fault "${fault}" did not complete (exit ${r.code}) — no evidence either way`)
  }

  if (problems.length) {
    console.error("\nSELF-TEST FAILED:")
    for (const p of problems) console.error("  " + p)
    process.exit(2)
  }
  console.log("\nself-test PASS — the clean artboard verifies, and all four historical faults are caught")
  process.exit(0)
}


let GLOBAL_RESET = {
  boxSizing: "border-box",
  borderTopWidth: "0px", borderRightWidth: "0px",
  borderBottomWidth: "0px", borderLeftWidth: "0px",
  borderTopStyle: "solid", borderRightStyle: "solid",
  borderBottomStyle: "solid", borderLeftStyle: "solid",
}
// border-style is covered by GLOBAL_RESET now, so suppressing the per-element
// declaration alone proves nothing — the safety net catches it, which is the
// fix working. To show the CHECK still sees the fault, the injection removes
// the net too, reproducing the state the bug actually shipped in.
if (INJECT && FAULTS[INJECT].unreset) {
  for (const k of FAULTS[INJECT].unreset) delete GLOBAL_RESET[k]
}
// Inherited properties: referenced against the app's <body> and emitted once
// on the artboard root rather than on every element.
const INHERITED = ["fontFamily","fontSize","fontWeight","fontStyle","lineHeight",
  "letterSpacing","color","textAlign","textTransform","whiteSpace","textWrap",
  "listStyleType","textIndent","visibility","fill","stroke","strokeWidth"]

mkdirSync(OUT, { recursive: true })
const { send, evalJS, sleep, goto, close } = await connect()
await send("Emulation.setDeviceMetricsOverride", {
  width: W, height: H, deviceScaleFactor: 1, mobile: false,
})
if (MEDIA) await send("Emulation.setEmulatedMedia", MEDIA)
await goto(ROUTE)
await sleep(2500)
if (SETUP) {
  await evalJS(SETUP)
  // ── WAIT FOR THE STREAM, THEN FALL BACK TO THE TIMER ────────────────────
  // The default settle was 1800ms, and a project reveal is a scripted stream:
  // 38 body blocks behind 400-900ms pauses is 15-34 SECONDS. The board was
  // captured mid-stream and the answer it showed depended on how the machine
  // felt that morning, which is the opposite of what a static artboard is for.
  // The vibe setup even scheduled a scroll reset at 20s, long after the capture
  // it was meant to precede.
  //
  // So this polls for a settled transcript rather than trusting a number: no
  // typing indicator, and the block count unchanged across 3 consecutive
  // samples. --setup-settle is now the CEILING on that wait rather than the
  // wait itself, which is why its default moved from 1800 to 40000.
  //
  // The timer remains as a floor for surfaces that stream nothing — the front
  // door has no transcript to settle, and polling for one would return
  // immediately and correctly.
  const settleStart = Date.now()
  let last = -1
  let stable = 0
  while (Date.now() - settleStart < SETUP_SETTLE) {
    await sleep(400)
    const state = JSON.parse(
      await evalJS(`JSON.stringify({
        blocks: document.querySelectorAll('.pane-scroll [class*="type-"]').length,
        typing: !!document.querySelector('.typing-indicator, [class*="typing-"]'),
      })`)
    )
    if (state.typing) { stable = 0; last = state.blocks; continue }
    stable = state.blocks === last ? stable + 1 : 0
    last = state.blocks
    if (stable >= 3) break
  }
  const waited = Date.now() - settleStart
  console.log(
    `setup: ${SETUP_FILE} (settled after ${waited}ms, ${last} blocks` +
      `${stable >= 3 ? "" : " — CEILING HIT, the board may be mid-stream"})`
  )
}

// ── The capture height is MEASURED, not typed ────────────────────────────
// --h used to be the whole story, and its default of 1000 is a viewport, so
// every board was one screenful of a pane that might be three. The content
// below simply never entered the picture — not the board's, and not the
// verifier's, because verify photographs the app through the same window and
// both sides were cut identically. A board missing 70% of its content passed
// at 0.0000%.
//
// So the frame is now taken from the deepest thing that scrolls. --h is the
// FLOOR, not the height: a pane that fits keeps it, a pane that overflows
// grows the viewport until the whole pane is inside the frame and there is no
// below-the-fold left for the check to miss.
const CONTENT_PROBE = `(() => {
  let deep = 0
  for (const e of document.querySelectorAll("*")) {
    if (e.scrollHeight > e.clientHeight + 1) deep = Math.max(deep, e.scrollHeight)
  }
  return Math.max(deep, document.documentElement.scrollHeight)
})()`
const contentH = Number(await evalJS(CONTENT_PROBE))
let capH = H
if (FOLD) {
  console.log(`fold board: held at ${W}x${H}; pane is ${contentH}px — the height guard is waived`)
} else if (contentH > H) {
  capH = contentH
  await send("Emulation.setDeviceMetricsOverride", {
    width: W, height: capH, deviceScaleFactor: 1, mobile: false,
  })
  // The pane relaying out is not instant, and the reveals all cross the
  // threshold at once when the viewport swallows them.
  await sleep(1800)
  console.log(`fit: pane is ${contentH}px, grew the frame ${H} -> ${capH}`)

  // ── DOES IT CONVERGE? ───────────────────────────────────────────────────
  // Fitting assumes content height is independent of viewport height. That is
  // true of a transcript and false of a pane built to fill the window: the
  // front door's hero band is viewport-sized with the sampler cards below it,
  // so growing the frame grows the content and the two never meet — measured
  // 1132 at a 1000px viewport, 1198 at 1132, 1284 at 1300.
  //
  // Left undetected this failed downstream, in verify, as "the frame is
  // shorter than the content" — true, but silent about why and impossible to
  // fix by re-running. So it is caught here, where the cause is visible, and
  // named: a pane like this cannot be fitted and wants --fold.
  const after = Number(await evalJS(CONTENT_PROBE))
  if (after > capH + 1) {
    console.error(`fit: FAILED TO CONVERGE — the frame grew to ${capH} and the content`)
    console.error(`    grew with it, to ${after}. This pane is sized to the viewport, so`)
    console.error(`    there is no height at which the whole of it is inside the frame.`)
    console.error(`    Capture it with --fold, which is what a one-viewport board is for.`)
    process.exit(1)
  }
}

// Everything below runs IN THE PAGE. It returns a JSON string, so it has to
// build the markup itself rather than hand back live nodes.
const EXTRACT = `(() => {
  const GLOBAL_RESET = ${JSON.stringify(GLOBAL_RESET)};
  const INHERITED = new Set(${JSON.stringify(INHERITED)});
  const FAULT = ${JSON.stringify(INJECT ? FAULTS[INJECT] : null)};
  // Only properties that can change how a box looks. A full computed style is
  // ~340 declarations per element and would bury the output; this list is the
  // visual surface, and each value is emitted only when it differs from a
  // fresh default element of the same tag, so nothing carries UA noise.
  const PROPS = [
    "display","position","top","right","bottom","left","zIndex","boxSizing",
    "width","height","minWidth","minHeight","maxWidth","maxHeight",
    "marginTop","marginRight","marginBottom","marginLeft",
    "paddingTop","paddingRight","paddingBottom","paddingLeft",
    "borderTopWidth","borderRightWidth","borderBottomWidth","borderLeftWidth",
    "borderTopStyle","borderRightStyle","borderBottomStyle","borderLeftStyle",
    "borderTopColor","borderRightColor","borderBottomColor","borderLeftColor",
    "borderTopLeftRadius","borderTopRightRadius","borderBottomRightRadius","borderBottomLeftRadius",
    "backgroundColor","backgroundImage","backgroundSize","backgroundPosition","backgroundRepeat",
    // backgroundClip and webkitTextFillColor are what make a gradient paint
    // THROUGH glyphs instead of behind them. Without them the front-door
    // aurora serialised as ordinary text sitting on a coloured box, and the
    // pixel diff caught it at 2.76% — which is the check doing exactly its
    // job, and the reason the property list is a list rather than a guess.
    "backgroundClip","webkitBackgroundClip","webkitTextFillColor",
    // mask-image, for the dot field. A masked background that serialises
    // without its mask is a full-bleed field of dots.
    "maskImage","webkitMaskImage","maskSize","maskRepeat",
    "color","opacity","boxShadow","overflow","overflowX","overflowY",
    "fontFamily","fontSize","fontWeight","fontStyle","lineHeight","letterSpacing",
    "textTransform","textAlign","textDecorationLine","textOverflow","whiteSpace","textWrap",
    "flexDirection","flexWrap","justifyContent","alignItems","alignSelf","alignContent",
    "flexGrow","flexShrink","flexBasis","gap","rowGap","columnGap","order",
    "gridTemplateColumns","gridTemplateRows","gridTemplateAreas","gridColumn","gridRow",
    "objectFit","aspectRatio","verticalAlign","listStyleType","transform",
    "isolation","pointerEvents","fill","stroke","strokeWidth","backdropFilter",
    "resize","content","textIndent","boxShadow",
  ]
  const KEBAB = p => p.replace(/[A-Z]/g, m => "-" + m.toLowerCase())
  const SVG_NS = "http://www.w3.org/2000/svg"
  // A blank same-origin iframe: no stylesheet, no reset, nothing the app has
  // done. This is the whole fix for the base-layer trap — see the header.
  const pristine = (() => {
    const f = document.createElement("iframe")
    f.id = "__dcprobe"
    f.style.cssText = "position:absolute;left:-99999px;top:0;width:1200px;height:800px;border:0;visibility:hidden"
    document.body.appendChild(f)
    return f.contentDocument
  })()
  // Values no UA sheet would ever produce, so "did this reach the probe?" has
  // an unambiguous answer.
  const SENTINEL = {
    color: "rgb(1, 2, 3)", fontFamily: "DcSentinelFamily", fontSize: "13px",
    fontWeight: "350", fontStyle: "italic", lineHeight: "31px",
    letterSpacing: "7px", textAlign: "right", textTransform: "capitalize",
    whiteSpace: "pre-line", textWrap: "balance", listStyleType: "square",
    textIndent: "9px", fill: "rgb(4, 5, 6)", stroke: "rgb(7, 8, 9)",
    strokeWidth: "3px",
  }
  for (const [k, v] of Object.entries(SENTINEL)) {
    pristine.body.style.setProperty(KEBAB(k), v)
  }

  const defaults = new Map()
  const defaultsFor = (tag, ns) => {
    const key = ns + "|" + tag
    if (defaults.has(key)) return defaults.get(key)
    const probe = ns === SVG_NS
      ? pristine.createElementNS(SVG_NS, tag)
      : pristine.createElement(tag)
    if (ns === SVG_NS) {
      const svg = pristine.createElementNS(SVG_NS, "svg")
      svg.appendChild(probe); pristine.body.appendChild(svg)
    } else pristine.body.appendChild(probe)
    const cs = pristine.defaultView.getComputedStyle(probe)
    const snap = {}
    PROPS.forEach(p => { snap[p] = cs[p] })
    defaults.set(key, snap)
    return snap
  }
  // The two explicit opt-outs. Everything else answers to the probe.
  const bodyCS = getComputedStyle(document.body)
  const inheritedRef = {}
  INHERITED.forEach(p => { inheritedRef[p] = bodyCS[p] })
  const pristineBodyCS = pristine.defaultView.getComputedStyle(pristine.body)
  const pristineBodyRef = {}
  INHERITED.forEach(p => { pristineBodyRef[p] = pristineBodyCS[p] })

  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  const escAttr = s => esc(s).replace(/"/g,"&quot;")
  const images = []
  // Rules that cannot be expressed as an inline style, emitted as a small
  // stylesheet beside the markup.
  const pseudoRules = []

  // <img> becomes a data URI so the artboard carries no network dependency.
  // Same-origin, so the canvas is untainted and toDataURL works.
  const dataUri = img => {
    try {
      const b = img.getBoundingClientRect()
      const w = Math.max(1, Math.round(b.width)), h = Math.max(1, Math.round(b.height))
      const nw = img.naturalWidth, nh = img.naturalHeight
      if (!nw || !nh) return null
      const c = document.createElement("canvas")
      c.width = w; c.height = h
      const ctx = c.getContext("2d")
      const fit = getComputedStyle(img).objectFit
      // Same crop the browser is showing, baked in, so the artboard scales
      // nothing and the pixels are the app's own.
      let s = 1
      if (fit === "cover") s = Math.max(w / nw, h / nh)
      else if (fit === "contain") s = Math.min(w / nw, h / nh)
      if (fit === "cover" || fit === "contain") {
        const dw = nw * s, dh = nh * s
        ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
      } else {
        ctx.drawImage(img, 0, 0, w, h)
      }
      return c.toDataURL("image/png")
    } catch (e) { return null }
  }

  // Emitted in full rather than diffed — see the note in the header.
  const ALWAYS_FULL = new Set(["button","input","select","textarea","a","label"])
  const VOID = new Set(["img","br","hr","input","source","track","use","path","circle","rect","line","polyline","polygon","ellipse"])

  // A pseudo-element re-emitted as a real one. Its computed style is read the
  // same way as any element's, but there is no probe to diff against — a
  // pseudo has no default box — so everything visual is emitted outright and
  // the layout properties do the rest.
  const PSEUDO_SKIP = new Set(["content","display","position"])
  function pseudo(el, which) {
    const cs = getComputedStyle(el, which)
    const content = cs.content
    if (!content || content === "none" || content === "normal") return ""
    const decls = []
    for (const p of PROPS) {
      if (PSEUDO_SKIP.has(p)) continue
      const v = cs[p]
      if (v == null || v === "" || v === "auto" || v === "none" || v === "normal") continue
      if (v === "0px" || v === "rgba(0, 0, 0, 0)") continue
      decls.push(KEBAB(p) + ":" + v)
    }
    decls.push("display:" + (cs.display === "none" ? "block" : cs.display))
    decls.push("position:" + cs.position)
    // A quoted string literal is real text; counter()/attr() are not
    // reproducible here and become empty boxes, which is what they already are
    // for everything this page uses them for.
    let text = ""
    const m = /^"([\s\S]*)"$/.exec(content)
    if (m) text = esc(m[1])
    return "<span" + (decls.length ? ' style="' + escAttr(decls.join(";")) + '"' : "") + ">" + text + "</span>"
  }

  function walk(el, parentCS) {
    const tag = el.tagName.toLowerCase()
    if (tag === "script" || tag === "style" || tag === "noscript") return ""
    if (el.id === "__dcdefaults") return ""
    const cs = getComputedStyle(el)
    if (cs.display === "none" || cs.visibility === "hidden") return ""

    const ns = el.namespaceURI === SVG_NS ? SVG_NS : "html"
    const def = defaultsFor(tag, ns)
    const full = ALWAYS_FULL.has(tag)
    const forceDecls = []

    // ── Text boxes are described, not pinned ──────────────────────────────
    // A used height copied onto an element that holds text is a trap: if the
    // text rewraps for ANY reason in the destination — a font that resolves a
    // hair wider, a different rasteriser, a scaled preview frame — the extra
    // line has nowhere to go and paints straight over whatever sits below.
    // That is exactly how the headline came to overlap the chat input: 42px
    // pinned, two lines rendered.
    //
    // So a text-bearing element gets its type, its constraints and its
    // padding, and sizes itself from those — which is what the app does too.
    // And where the app put the text on ONE line with room to spare, that is
    // locked with nowrap rather than left to be re-decided by whatever font
    // metrics the destination happens to have.
    const textish = el.children.length === 0 && el.textContent.trim().length > 0
    let oneLine = false
    if (textish && ns !== SVG_NS) {
      // A RANGE over the contents, not el.getClientRects(). On a BLOCK element
      // getClientRects() returns one rect for the whole border box however many
      // lines are inside it — per-line rects come back only for inline
      // elements. So the old test read "one line" for every paragraph in the
      // app, and pinned nowrap onto a four-line block: the resume's skills
      // list, 30 comma-separated terms under a 588px max-width, came out of the
      // extractor as a single unwrapped line. --verify caught it on the first
      // surface that had one. A range gives real line boxes for both cases.
      const range = el.ownerDocument.createRange()
      range.selectNodeContents(el)
      const rects = range.getClientRects()
      const parent = el.parentElement
      const room = parent ? parent.getBoundingClientRect().width : Infinity
      // ⚠ THIS NO LONGER FIRES ON ORDINARY TEXT, and the reason is editing.
      // Locking a measured single line with nowrap protects the artboard from
      // being re-wrapped by different font metrics at the destination — but it
      // also makes the text UNEDITABLE in any way that changes its width. Type
      // a longer word, or set the headline bold, and it overflows its box
      // instead of reflowing, because nowrap says it may not wrap.
      //
      // The fault this was written for was PINNED HEIGHT, not free wrapping:
      // a two-line headline in a 42px box painted over the chat input. Height
      // is no longer pinned on text elements, so a rewrap now pushes content
      // down rather than overlapping it — which --verify still catches.
      //
      // So nowrap is emitted only where the APP itself asks for it. Where the
      // app lets text wrap, the artboard lets it wrap too.
      oneLine = rects.length === 1 &&
        cs.whiteSpace === "nowrap" &&
        rects[0].width < room - 1
    }

    // ── Auto margins ──────────────────────────────────────────────────────
    // Chrome's getComputedStyle reports margin-left and margin-right as "0px"
    // when the specified value is auto. So a block centred the ordinary way,
    // with margin 0 auto, serialises as flush-left and the whole column jumps by
    // half the leftover width: the transcript's 720px chat column landed at
    // x=305 instead of x=491 — 186px, carrying every image and every line of
    // the reveal with it.
    //
    // There is nothing to read, so it is MEASURED: the gap between the
    // parent's content edge and the element's own left edge is the used
    // margin, whatever produced it. Block-level children of a block-level
    // parent only — under flex or grid that gap is the work of justify-content
    // or align-self, which are copied directly and would then apply twice.
    if (ns !== SVG_NS && el.parentElement && parentCS &&
        !/flex|grid/.test(parentCS.display) &&
        cs.marginLeft === "0px" && !cs.display.startsWith("inline")) {
      const pr = el.parentElement.getBoundingClientRect()
      const edge = pr.left + (parseFloat(parentCS.borderLeftWidth) || 0) +
                             (parseFloat(parentCS.paddingLeft) || 0)
      const used = el.getBoundingClientRect().left - edge
      if (used > 0.5) forceDecls.push("margin-left:" + Math.round(used * 100) / 100 + "px")
    }

    const decls = []
    for (const p of PROPS) {
      const v = cs[p]
      if (v == null || v === "") continue
      // HEIGHT only. Dropping width as well was overcautious and lost real
      // constraints: the impact card's "01" marker is a 20px flex item in the
      // app and 16.81px of natural text width without it, which pushed the
      // sentence beside it 3px left and 3px wider — every line of every impact
      // list, on every reveal.
      //
      // The trap was only ever height. A pinned height has nowhere to put a
      // line that rewraps, so the overflow paints over whatever sits below —
      // that is how the headline came to sit on the chat input. A pinned WIDTH
      // fails the other way: the text wraps exactly as the app wrapped it, and
      // if the destination font is a hair wider the element simply grows
      // downward, which is visible and harmless rather than silent and wrong.
      if (textish && p === "height") continue
      // Proof harness: drop the properties whose loss caused a known fault.
      if (FAULT && FAULT.props.includes(p) && (!FAULT.tags || FAULT.tags.includes(tag))) continue
      // Inherited: the artboard root carries the app's baseline, so a value
      // that merely matches it needs no repeating.
      // FONT-FAMILY IS ALWAYS EMITTED ON TEXT. Inherited properties are
      // normally skipped when they match the parent, which is right for
      // rendering and wrong for editing: an element with no font-family of
      // its own gives the canvas editor nothing to hang a weight picker on,
      // so the family's other weights are not offerable. The front door's
      // headline was the case that surfaced it — it is an <h1>, so the UA's
      // bold forces font-WEIGHT to be emitted outright, while font-FAMILY
      // matched its parent and was skipped. Weight declared, family absent,
      // no bold available.
      //
      // Emitting it costs one declaration per text element and cannot change
      // what renders: the value written is the one that was being inherited.
      if (p === "fontFamily" && textish) { decls.push(KEBAB(p) + ":" + v); continue }
      if (INHERITED.has(p)) {
        // Did the sentinel reach this tag's probe? If not, the UA sets the
        // property itself and inheritance never happens here — so emit it
        // outright rather than predicting what the UA will do. That is a few
        // extra declarations on buttons and headings, and it is the difference
        // between a rail label rendering #e8e8e8 and rendering black.
        if (def[p] !== pristineBodyRef[p]) { decls.push(KEBAB(p) + ":" + v); continue }
        // It does inherit: the reference is what the PARENT computes, not the
        // document baseline — .rail-item-client is primary inside a row the
        // app paints secondary.
        const ref = parentCS ? parentCS[p] : inheritedRef[p]
        if (v !== ref) decls.push(KEBAB(p) + ":" + v)
        continue
      }
      // Set globally by the app, and written into the artboard's base layer
      // from this same table.
      if (p in GLOBAL_RESET) { if (v !== GLOBAL_RESET[p]) decls.push(KEBAB(p) + ":" + v); continue }
      if (!full && v === def[p]) continue
      // A resolved zero-width border still carries a colour; skip the noise.
      if (/^border(Top|Right|Bottom|Left)Color$/.test(p) &&
          cs[p.replace("Color","Width")] === "0px") continue
      decls.push(KEBAB(p) + ":" + v)
    }

    // SVG geometry lives in attributes, not style — carry them verbatim.
    let attrs = ""
    if (ns === SVG_NS) {
      for (const a of el.attributes) {
        if (a.name === "style" || a.name === "class") continue
        attrs += " " + a.name + '="' + escAttr(a.value) + '"'
      }
    } else if (tag === "textarea" || tag === "input") {
      for (const a of ["placeholder","value","type"]) {
        const v = el.getAttribute(a)
        if (v !== null) attrs += " " + a + '="' + escAttr(v) + '"'
      }
      if (tag === "textarea") attrs += ' rows="1"'
      // ::placeholder is a pseudo-element with its own colour, and an inline
      // style cannot reach it — the field's grey came out as the UA's instead.
      if (el.getAttribute("placeholder") !== null) {
        const pc = getComputedStyle(el, "::placeholder")
        const phId = pseudoRules.length
        pseudoRules.push('[data-dc-ph="' + phId + '"]::placeholder{color:' + pc.color + ';opacity:1}')
        attrs += ' data-dc-ph="' + phId + '"' 
      }
    } else if (tag === "img") {
      const uri = dataUri(el)
      // object-fit is already applied to the bitmap; leaving it on would crop
      // an image that is exactly the right shape.
      forceDecls.push("object-fit:fill")
      const name = "img-" + images.length + ".png"
      if (uri) { images.push({ name, uri }); attrs += ' src="' + name + '"' }
      attrs += ' alt=""'
    }
    if (el.getAttribute && el.getAttribute("aria-hidden")) attrs += ' aria-hidden="true"'

    if (oneLine) decls.push("white-space:nowrap")
    for (const d of forceDecls) decls.push(d)
    const style = decls.length ? ' style="' + escAttr(decls.join(";")) + '"' : ""
    const open = "<" + tag + attrs + style + ">"
    if (ns === SVG_NS && !el.childNodes.length) {
      return "<" + tag + attrs + style + "/>"
    }
    if (VOID.has(tag) && !el.childNodes.length) return open
    let inner = pseudo(el, "::before")
    for (const n of el.childNodes) {
      if (n.nodeType === 3) {
        const t = n.textContent
        if (t.trim()) { inner += esc(t); continue }
        // A whitespace-only text node is dropped unless it actually separates
        // two inline boxes. Kept blindly it becomes an anonymous line box at
        // the parent's own font-size — which is how the artboard grew by an
        // uneven 16-43px in three different places while every x stayed exact.
        const pd = cs.display
        if (pd.includes("flex") || pd.includes("grid")) continue
        // A TEXT SIBLING COUNTS, and missing that lost a real space. JSX like
        //   {a} · {b} ·{" "}
        //   {n} slides
        // renders as adjacent TEXT nodes with a whitespace-only node between
        // them — the explicit {" "} React inserts to survive the line break.
        // Testing only for element siblings dropped it, and the deck's meta
        // line came out "· 21 slides" in the app and "·21 slides" on the
        // board. --verify caught it as an 88x16 region and nothing else would
        // have: it is one space, in one line, on one surface.
        const prev = n.previousSibling, next = n.nextSibling
        const inlineish = e => e && (
          (e.nodeType === 1 && /inline|contents/.test(getComputedStyle(e).display)) ||
          (e.nodeType === 3 && e.textContent.trim().length > 0))
        if (inlineish(prev) && inlineish(next)) inner += " "
      } else if (n.nodeType === 1) inner += walk(n, cs)
    }
    inner += pseudo(el, "::after")
    return open + inner + "</" + tag + ">"
  }

  const root = document.querySelector(${JSON.stringify(ROOT)})
  const html = walk(root, getComputedStyle(root.parentElement || document.body))
  // The inherited baseline every emitted element is measured against.
  const b = getComputedStyle(document.body)
  const inherited = escAttr(["fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","color"]
    .map(p => KEBAB(p) + ":" + b[p]).join(";"))
  const host = document.getElementById("__dcprobe"); if (host) host.remove()
  return JSON.stringify({ html, images, inherited, pseudoRules, w: innerWidth, h: innerHeight })
})()`

const globalResetCSS = Object.entries(GLOBAL_RESET)
  .map(([k, v]) => k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase()) + ": " + v + ";")
  .join(" ")

await evalJS(FREEZE)
await sleep(150)
const raw = await evalJS(EXTRACT)
const { html, images, inherited, pseudoRules, w, h } = JSON.parse(raw)

for (const im of images) {
  writeFileSync(join(OUT, im.name), Buffer.from(im.uri.split(",")[1], "base64"))
}

// The helmet reproduces only what cannot be an inline style: the font links,
// the base reset, and the space-consuming scrollbar the rail depends on for
// its own width.
const file = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
  <!-- ital,wght rather than wght. The upright-only request looked complete
       because nothing errors when a page asks for italic and has no italic
       face: the browser SHEARS the roman and renders a passable slant. The app
       loads a real Archivo italic, so the two disagreed by a whole typeface on
       the reveal's opening line and --verify caught it as an 704x56 block. An
       artboard that quietly counterfeits a face is exactly what this extractor
       exists to prevent. -->
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;display=swap">
  <style>
    /* GLOBAL_RESET, written from the same table the diff uses as its
       reference — see the header. Nothing else belongs here: every other
       property is compared against a pristine document and emitted per
       element, which is what stops a base-layer rule from hiding one. */
    *, *::before, *::after { ${globalResetCSS} }
    body { margin: 0; background: #131313;
           -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    a { color: inherit; text-decoration: none; }
${pseudoRules.map((r) => "    " + r).join("\n")}
    /* ── The app's base layer, mirrored ───────────────────────────────
       THIS IS NOT OPTIONAL DECORATION. The defaults probe is mounted inside
       the running page, so it inherits everything Tailwind's preflight has
       already normalised — which makes every preflight-zeroed property
       invisible to the diff: the real element and the probe agree, so
       nothing is emitted, and the artboard then falls back to the UA value
       preflight existed to remove. That is one bug, not several. It showed
       up as <p> margins (UA 1em) pushing each rail section down 16px, and
       would have shown up next as inline <img> baseline gaps.

       So: reproduce preflight's subset that affects layout. Anything the app
       sets to a NON-preflight value still differs from the probe and is
       emitted inline, which outranks everything here. */
</style>
</helmet>
<div style="width:${w}px;height:${h}px;overflow:hidden;background:#131313;${inherited}">${html}</div>
</x-dc>
<script data-dc-script data-props='{"$preview":{"width":${w},"height":${h}}}'>
class Component extends DCLogic {
  renderVals() {
    return {};
  }
}
</script>
</body>
</html>
`
writeFileSync(join(OUT, "Main.dc.html"), file)
// THE FRAME, WRITTEN DOWN. canvas.json's w/h used to be a number a person
// typed from arithmetic, and the résumé board carried one that was 562px stale
// while the board beside it was current. Nothing derived it and nothing checked
// it. Now the extractor states the frame it actually produced and the seeding
// step reads it, so the two cannot disagree.
writeFileSync(join(OUT, "__frame.json"), JSON.stringify({ file: "Main.dc.html", w, h, fold: FOLD }, null, 1) + "\n")
console.log(`captured ${ROUTE} at ${w}x${h} -> ${OUT}/Main.dc.html (${(file.length/1024).toFixed(1)} KB, ${images.length} images)`)

// ── The legend rides along ────────────────────────────────────────────────
// IT IS WRITTEN HERE, NOT BY THE PERSON SEEDING THE CANVAS, and that is the
// whole point. The legend is derived from app/globals.css so that it cannot go
// stale — but only if something regenerates it. On 2026-08-26 a republish
// re-extracted Main and carried the previous Legend across by hand, and five
// published boards spent a day showing --space-48, a token retired that
// morning. The board was current and the legend beside it was not, which is
// worse than having no legend at all: a legend looks authoritative.
//
// So the two are now written by the same command. There is no sequence of
// steps that produces a fresh Main next to a stale Legend, because producing
// Main IS producing Legend. A seeder can still leave the legend out of the
// canvas, but they can no longer include an old one.
//
// Spawned rather than imported: legend-artboard.mjs does its work at module
// scope and writes on load, so importing it would run on import and bind this
// script to that shape forever. A subprocess keeps the CLI the one interface,
// which means the standalone `node scripts/legend-artboard.mjs` invocation and
// this one cannot drift apart.
const legendScript = new URL("./legend-artboard.mjs", import.meta.url).pathname
const legend = spawnSync(process.execPath, [legendScript, "--out", OUT],
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], timeout: 30000 })
if (legend.status !== 0) {
  // Hard stop, matching --verify's standard: an artboard does not leave this
  // script in a state nobody has checked. A missing legend is recoverable; a
  // silently-skipped regeneration is the bug this block exists to prevent.
  console.error((legend.stdout || "") + (legend.stderr || ""))
  console.error(`legend: FAILED (exit ${legend.status}) — Main.dc.html was written but its legend was not regenerated`)
  process.exit(1)
}
process.stdout.write(legend.stdout)

await close()

if (VERIFY && !SELFTEST) {
  const { ok } = await verify({
    dir: OUT, route: ROUTE, w: W, h: capH, fold: FOLD,
    setup: (SETUP || MEDIA) ? { script: SETUP, settle: SETUP_SETTLE, media: MEDIA } : null,
  })
  if (!ok) {
    console.error(`\nthe artboard does NOT match the app — not handing it over.`)
    process.exit(1)
  }
  process.exit(0)
}
