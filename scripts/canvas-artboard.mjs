// Derive a Claude Design artboard (.dc.html) FROM the running app.
//
// ── Why this exists ──────────────────────────────────────────────────────
// A design canvas that reproduces this UI is a second copy of every visual
// decision in globals.css. Hand-maintaining it is the exact duplication this
// repo removes everywhere else: resume.txt is parsed rather than retyped,
// edwin-context.md is generated rather than written, voice.md is verbatim-
// checked rather than trusted. The canvas has to work the same way.
//
// So the artboard is not authored. It is EXTRACTED from the rendered page:
// walk the real DOM, read the real computed styles, emit them inline. The
// code stays the only place a colour or a rung is decided, and the canvas
// becomes a build artifact you can throw away and regenerate.
//
// ── What it does NOT capture ─────────────────────────────────────────────
// One rendered state of one route at one viewport. Hover, focus, active,
// disabled, loading and error states are not in the DOM at capture time and
// are not in the output. Neither is anything behind another pane. Widen the
// capture by taking more artboards, never by hand-editing one.
//
// ── Usage ────────────────────────────────────────────────────────────────
//   npm run dev                                   (must be on :3200)
//   chrome --remote-debugging-port=9222           (see shot.mjs)
//   node scripts/canvas-artboard.mjs --out <dir> [--w 1440] [--h 1000]
//
// Writes <dir>/Main.dc.html plus one file per <img>. Feed the directory to
// the design skill's seed-canvas.mjs.
import { connect } from "./shot.mjs"
import { writeFileSync, mkdirSync } from "fs"
import { join } from "path"

const arg = (n, d) => {
  const i = process.argv.indexOf(`--${n}`)
  return i === -1 ? d : process.argv[i + 1]
}
const OUT = arg("out", ".canvas")
const W = Number(arg("w", 1440))
const H = Number(arg("h", 1000))
const ROUTE = arg("route", "http://localhost:3200/")
const ROOT = arg("root", ".shell")

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
  ]
  const KEBAB = p => p.replace(/[A-Z]/g, m => "-" + m.toLowerCase())
  const SVG_NS = "http://www.w3.org/2000/svg"
  const defaults = new Map()
  const defaultsFor = (tag, ns) => {
    const key = ns + "|" + tag
    if (defaults.has(key)) return defaults.get(key)
    const probe = ns === SVG_NS
      ? document.createElementNS(SVG_NS, tag)
      : document.createElement(tag)
    // In a detached tree getComputedStyle returns nothing, so it has to be
    // mounted — hidden, and inside the same document so it inherits the same
    // font stack the real elements do.
    const host = document.getElementById("__dcdefaults") || (() => {
      const h = document.createElement("div")
      h.id = "__dcdefaults"
      h.style.cssText = "position:absolute;left:-99999px;top:0;visibility:hidden"
      document.body.appendChild(h)
      return h
    })()
    if (ns === SVG_NS) {
      const svg = document.createElementNS(SVG_NS, "svg")
      svg.appendChild(probe); host.appendChild(svg)
    } else host.appendChild(probe)
    const cs = getComputedStyle(probe)
    const snap = {}
    PROPS.forEach(p => { snap[p] = cs[p] })
    defaults.set(key, snap)
    return snap
  }

  const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
  const escAttr = s => esc(s).replace(/"/g,"&quot;")
  const images = []

  // <img> becomes a data URI so the artboard carries no network dependency.
  // Same-origin, so the canvas is untainted and toDataURL works.
  const dataUri = img => {
    try {
      const c = document.createElement("canvas")
      c.width = img.naturalWidth; c.height = img.naturalHeight
      c.getContext("2d").drawImage(img, 0, 0)
      return c.toDataURL("image/jpeg", 0.82)
    } catch (e) { return null }
  }

  // Emitted in full rather than diffed — see the note in the header.
  const ALWAYS_FULL = new Set(["button","input","select","textarea","a","label"])
  const VOID = new Set(["img","br","hr","input","source","track","use","path","circle","rect","line","polyline","polygon","ellipse"])

  function walk(el) {
    const tag = el.tagName.toLowerCase()
    if (tag === "script" || tag === "style" || tag === "noscript") return ""
    if (el.id === "__dcdefaults") return ""
    const cs = getComputedStyle(el)
    if (cs.display === "none" || cs.visibility === "hidden") return ""

    const ns = el.namespaceURI === SVG_NS ? SVG_NS : "html"
    const def = defaultsFor(tag, ns)
    const full = ALWAYS_FULL.has(tag)
    const decls = []
    for (const p of PROPS) {
      const v = cs[p]
      if (v == null || v === "") continue
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
    } else if (tag === "img") {
      const uri = dataUri(el)
      const name = "img-" + images.length + ".jpg"
      if (uri) { images.push({ name, uri }); attrs += ' src="' + name + '"' }
      attrs += ' alt=""'
    }
    if (el.getAttribute && el.getAttribute("aria-hidden")) attrs += ' aria-hidden="true"'

    const style = decls.length ? ' style="' + escAttr(decls.join(";")) + '"' : ""
    const open = "<" + tag + attrs + style + ">"
    if (ns === SVG_NS && !el.childNodes.length) {
      return "<" + tag + attrs + style + "/>"
    }
    if (VOID.has(tag) && !el.childNodes.length) return open
    let inner = ""
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
      } else if (n.nodeType === 1) inner += walk(n)
    }
    return open + inner + "</" + tag + ">"
  }

  const root = document.querySelector(${JSON.stringify(ROOT)})
  const html = walk(root)
  // The inherited baseline every emitted element is measured against.
  const b = getComputedStyle(document.body)
  const inherited = escAttr(["fontFamily","fontSize","fontWeight","lineHeight","letterSpacing","color"]
    .map(p => KEBAB(p) + ":" + b[p]).join(";"))
  const host = document.getElementById("__dcdefaults"); if (host) host.remove()
  return JSON.stringify({ html, images, inherited, w: innerWidth, h: innerHeight })
})()`

const raw = await evalJS(EXTRACT)
const { html, images, inherited, w, h } = JSON.parse(raw)

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
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; background: #131313;
           -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    a { color: inherit; text-decoration: none; }
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
    h1, h2, h3, h4, h5, h6, p, blockquote, figure, pre,
    dl, dd, ol, ul, menu, fieldset, legend { margin: 0; }
    ol, ul, menu { list-style: none; padding: 0; }
    img, svg, video, canvas, audio, iframe, embed, object {
      display: block; vertical-align: middle;
    }
    img, video { max-width: 100%; height: auto; }

    /* No form-control reset, on purpose: buttons and inputs are emitted with
       their FULL computed style rather than diffed, so they carry their own
       font, border and fill. A reset here is what ate the rail rows' 2px
       border-left, which Chrome's UA also happens to set to 2px. */
    /* globals.css gives the app a classic, space-consuming 4px scrollbar.
       The rail's row width is derived from it, so it has to be reproduced. */
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.23); border-radius: 0; }
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
await close()
