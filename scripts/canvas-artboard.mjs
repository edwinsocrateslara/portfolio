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
//   node scripts/canvas-artboard.mjs --out <dir> [--w 1440] [--h 1000]
//
// Writes <dir>/Main.dc.html plus one file per <img>, THEN screenshot-diffs the
// result against the running app and exits non-zero if they do not match — so
// a failing artboard cannot be seeded or published, because it never gets that
// far. --no-verify skips the check and is for debugging only.
//
//   node scripts/canvas-artboard.mjs --selftest   proves the check catches all
//                                                 four historical faults
import { connect } from "./shot.mjs"
import { diffPNG } from "./pixel-diff.mjs"
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from "fs"
import { join, extname } from "path"
import { createServer } from "http"
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
await goto(ROUTE)
await sleep(2500)

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
    "color","opacity","boxShadow","overflow","overflowX","overflowY",
    "fontFamily","fontSize","fontWeight","fontStyle","lineHeight","letterSpacing",
    "textTransform","textAlign","textDecorationLine","textOverflow","whiteSpace","textWrap",
    "flexDirection","flexWrap","justifyContent","alignItems","alignSelf","alignContent",
    "flexGrow","flexShrink","flexBasis","gap","rowGap","columnGap","order",
    "gridTemplateColumns","gridTemplateRows","gridColumn","gridRow",
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
      const rects = el.getClientRects()
      const parent = el.parentElement
      const room = parent ? parent.getBoundingClientRect().width : Infinity
      oneLine = rects.length === 1 &&
        cs.whiteSpace === "normal" &&
        rects[0].width < room - 1
    }

    const decls = []
    for (const p of PROPS) {
      const v = cs[p]
      if (v == null || v === "") continue
      if (textish && (p === "height" || p === "width")) continue
      // Proof harness: drop the properties whose loss caused a known fault.
      if (FAULT && FAULT.props.includes(p) && (!FAULT.tags || FAULT.tags.includes(tag))) continue
      // Inherited: the artboard root carries the app's baseline, so a value
      // that merely matches it needs no repeating.
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
        const prev = n.previousSibling, next = n.nextSibling
        const inlineish = e => e && e.nodeType === 1 &&
          /inline|contents/.test(getComputedStyle(e).display)
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

// Animations are frozen BEFORE the styles are read. The brand mark's arc is a
// running CSS animation, and getComputedStyle during one returns the value of
// whatever frame is on screen — so without this the artboard captures a random
// point in a 1.6667s loop and can never match a later screenshot.
const FREEZE = `(() => {
  const s = document.createElement("style");
  s.id = "__dcfreeze";
  s.textContent = "*,*::before,*::after{animation:none !important;transition:none !important;caret-color:transparent !important}";
  document.head.appendChild(s);
  return 1;
})()`
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
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;display=swap">
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
console.log(`captured ${ROUTE} at ${w}x${h} -> ${OUT}/Main.dc.html (${(file.length/1024).toFixed(1)} KB, ${images.length} images)`)

// ── Verify ───────────────────────────────────────────────────────────────
// A geometry check compares the boxes it knows to look at. Every fault this
// script has shipped was outside that set: a missing glow, a dropped border, a
// bold heading, an empty placeholder. So the check is a picture of the app
// against a picture of the artboard, and the artboard does not leave this
// script unless they match.
const MIME = { ".html": "text/html", ".jpg": "image/jpeg", ".png": "image/png", ".json": "application/json" }

function serve(dir) {
  const srv = createServer((req, res) => {
    const name = decodeURIComponent(req.url.split("?")[0].replace(/^\//, "")) || "index.html"
    try {
      const body = readFileSync(join(dir, name))
      res.writeHead(200, { "content-type": MIME[extname(name)] ?? "application/octet-stream" })
      res.end(body)
    } catch { res.writeHead(404); res.end("no") }
  })
  return new Promise((r) => srv.listen(0, "127.0.0.1", () => r({ srv, port: srv.address().port })))
}

// The artboard as a plain page: the same helmet and the same markup the canvas
// will render, without the editor around it.
function previewHTML(dcHtml) {
  const helmet = dcHtml.match(/<helmet>([\s\S]*?)<\/helmet>/)[1]
  const body = dcHtml.split("</helmet>")[1].split("</x-dc>")[0]
  return `<!doctype html><html><head><meta charset="utf-8">${helmet}</head><body>${body}</body></html>`
}

// Every <img>, with enough about it to assert on. Collected while the page is
// still loaded, because the screenshot is the last thing that happens on it.
const IMG_PROBE = `JSON.stringify([...document.querySelectorAll("img")].map((i) => {
  const b = i.getBoundingClientRect();
  return { x: b.x, y: b.y, w: b.width, h: b.height, loaded: i.complete && i.naturalWidth > 0 };
}))`

async function shoot(cdp, url) {
  // Page.navigate rather than shot.mjs's goto: goto preflights that the origin
  // is a live `next dev`, which is right for the app and wrong for the static
  // server holding the artboard. The app's own liveness is already proven —
  // the extraction just read it.
  await cdp.send("Page.navigate", { url })
  await cdp.sleep(1600)
  // Settle rather than tolerate: wait for the fonts, then stop every animation
  // and hide the caret, so nothing time-dependent is in either frame.
  await cdp.evalJS(`document.fonts.ready.then(() => 1)`)
  await cdp.evalJS(FREEZE)
  await cdp.sleep(400)
  const imgs = JSON.parse(await cdp.evalJS(IMG_PROBE))
  const r = await cdp.send("Page.captureScreenshot", { format: "png" })
  return { png: Buffer.from(r.result.data, "base64"), imgs }
}

export async function verify({ dir, route, w, h, masks: masksIn = [], label = "" }) {
  let masks = masksIn
  const { srv, port } = await serve(dir)
  writeFileSync(join(dir, "__preview.html"), previewHTML(readFileSync(join(dir, "Main.dc.html"), "utf8")))
  const cdp = await connect()
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false })
  const app = await shoot(cdp, route)
  const art = await shoot(cdp, `http://127.0.0.1:${port}/__preview.html`)
  await cdp.close()
  // close() stops accepting; Chrome's keep-alive sockets would hold the handle
  // and the process open long after the verdict was printed. The failing path
  // exited explicitly and hid this — the passing path just hung.
  srv.closeAllConnections?.()
  srv.close()
  srv.unref?.()
  const appPng = app.png, artPng = art.png

  // ── Images: asserted, then excluded ──────────────────────────────────────
  // A bitmap cannot be compared pixel-for-pixel here and it is not the
  // check's fault. The app draws a 239px source into a 227.328px box; the
  // artboard can only carry whole pixels, so one of the two resamples
  // differently and photographic detail disagrees. That is a real limit of
  // the medium, so the interiors are masked — and everything masking could
  // hide is asserted instead: every image present, loaded, and in the same
  // place at the same size. The 1px edge of each is left IN the comparison,
  // so a shifted or missing image still fails on its own outline.
  const imgProblems = []
  if (app.imgs.length !== art.imgs.length) {
    imgProblems.push(`image count: app has ${app.imgs.length}, artboard has ${art.imgs.length}`)
  }
  const n = Math.min(app.imgs.length, art.imgs.length)
  for (let i = 0; i < n; i++) {
    const p = app.imgs[i], q = art.imgs[i]
    if (!q.loaded) { imgProblems.push(`image ${i} did not load in the artboard`); continue }
    for (const k of ["x", "y", "w", "h"]) {
      if (Math.abs(p[k] - q[k]) > 1) {
        imgProblems.push(`image ${i} ${k}: app ${p[k].toFixed(2)}, artboard ${q[k].toFixed(2)}`)
      }
    }
  }
  for (const box of art.imgs) {
    masks = masks.concat([[Math.round(box.x) + 1, Math.round(box.y) + 1,
                           Math.max(0, Math.round(box.w) - 2), Math.max(0, Math.round(box.h) - 2)]])
  }
  writeFileSync(join(dir, "__app.png"), appPng)
  writeFileSync(join(dir, "__artboard.png"), artPng)
  const d = diffPNG(appPng, artPng, { masks })

  const pct = (d.ratio * 100).toFixed(4)
  const head = label ? `verify (${label})` : "verify"
  if (imgProblems.length) {
    console.error(`${head}: FAIL — image assertions:`)
    for (const m of imgProblems) console.error(`    ${m}`)
    return { ok: false, d }
  }
  if (d.sizeMismatch) {
    console.error(`${head}: FAIL — sizes differ, app ${d.a.join("x")} vs artboard ${d.b.join("x")}`)
    return { ok: false, d }
  }
  // The threshold is for subpixel text rasterisation and nothing else. It is
  // not a dial: a real difference is orders of magnitude past it, which is why
  // the report leads with WHERE rather than with the number.
  const LIMIT = 0.0015
  const ok = d.ratio <= LIMIT
  console.log(`${head}: ${ok ? "PASS" : "FAIL"} — ${d.differing} px differ (${pct}% of ${d.w}x${d.h}), limit ${(LIMIT*100).toFixed(4)}%`)
  console.log(`  ${masks.length} image interior(s) masked, ${d.maskedPixels} px excluded — ` +
    `presence, load state, position and size asserted instead; 1px edges still compared`)
  if (!ok) {
    console.error(`  differing regions, largest first (x, y, w, h):`)
    for (const r of d.regions.slice(0, 8)) {
      console.error(`    ${String(r.x).padStart(5)},${String(r.y).padStart(5)}  ${r.w}x${r.h}`)
    }
    if (d.regions.length > 8) console.error(`    ... and ${d.regions.length - 8} more`)
    console.error(`  images written: ${dir}/__app.png and ${dir}/__artboard.png`)
  }
  return { ok, d }
}

await close()

if (VERIFY && !SELFTEST) {
  const { ok } = await verify({ dir: OUT, route: ROUTE, w: W, h: H })
  if (!ok) {
    console.error(`\nthe artboard does NOT match the app — not handing it over.`)
    process.exit(1)
  }
  process.exit(0)
}
