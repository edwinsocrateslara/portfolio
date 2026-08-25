// Reads an edited canvas artboard and reports every declaration with no home
// in the token layer.
//
// WHY THIS EXISTS. The canvas editor writes flat inline styles: it can set a
// font-size without its leading, a colour that is not in the palette, a 13px
// gap. None of that is wrong in the canvas — it renders fine — and none of it
// can land, because check-design and the token layer refuse it in source. Left
// to landing time, that becomes "I made the change and then told you four
// pieces of it are illegal", after the person is already attached to the
// result. Run this the moment the canvas is pulled and the conversation starts
// with the list instead.
//
// It is NOT check-design. check-design reads .tsx and globals.css — SOURCE,
// where classes and var() still exist. By the time a declaration reaches an
// artboard it has been computed to a literal, so every value looks like a
// literal and the source rules cannot be applied. This checks the one thing
// that survives computation: whether the resolved value is a value the system
// can express.
//
// THE LEGAL SETS ARE READ FROM app/globals.css, NOT HARDCODED. A checker with
// its own copy of the scale is a second place for the scale to live, which is
// the exact duplication this project keeps removing. Add a token and this
// picks it up; a hardcoded table would start lying the day the scale moved.
//
//   node scripts/check-artboard.mjs <artboard.dc.html> [more.dc.html ...]

import { readFileSync } from "fs"

// Resolved from THIS FILE, not the cwd. Both of these are run from wherever
// the artboards happen to live — a scratch directory, a canvas folder — and a
// cwd-relative path made them work only when invoked from the repo root.
const ROOT = new URL("..", import.meta.url).pathname
const CSS = readFileSync(ROOT + "app/globals.css", "utf8")

// ── The legal sets, derived ───────────────────────────────────────────────
const decl = (re) => [...CSS.matchAll(re)]

// Type steps: --type-<name>-size / -lh pairs. A pair is legal only together.
const SIZES = new Map()
const LHS = new Map()
for (const [, n, v] of decl(/--type-([a-z0-9-]+)-size:\s*(\d+)px/g)) SIZES.set(n, +v)
for (const [, n, v] of decl(/--type-([a-z0-9-]+)-lh:\s*(\d+)px/g)) LHS.set(n, +v)
const PAIRS = new Map() // size -> Set(legal leadings)
for (const [n, size] of SIZES) {
  if (!LHS.has(n)) continue
  if (!PAIRS.has(size)) PAIRS.set(size, new Set())
  PAIRS.get(size).add(LHS.get(n))
}

// "Has a token home" is meant LITERALLY: the value equals some token's value.
// Deriving only from --space-* was too narrow and reported the app's own
// layout against itself — --hero-anchor and --rail-width are as much tokens as
// --space-24 is. Any px-valued custom property counts.
const SPACE = new Set(decl(/--[a-z0-9-]+:\s*(-?[\d.]+)px/g).map((m) => Math.abs(+m[1])))
SPACE.add(1) // hairlines and the 1px sr-only clip
const TRACK = new Set(decl(/--track-[a-z0-9-]+:\s*(-?[\d.]+)px/g).map((m) => +m[1]))

const RADIUS = new Set(decl(/--bureau-radius-[a-z0-9]+:\s*(\d+)(?:px)?/g).map((m) => +m[1]))
// A radius nested inside another is the outer minus its border — globals.css
// writes exactly that as calc(var(--bureau-radius-card) - 1px). The inset value
// is as much a token result as the token itself.
for (const r of [...RADIUS]) RADIUS.add(r - 1)

// Palette: every colour any token resolves to, in the form the browser computes.
const PALETTE = new Set()
for (const [, r, g, b] of decl(/--[a-z0-9-]+:\s*(\d+) (\d+) (\d+);/g)) {
  PALETTE.add(`rgb(${r}, ${g}, ${b})`)
  PALETTE.add(`rgba(${r}, ${g}, ${b}, 1)`)
}
for (const [, r, g, b, a] of decl(/--[a-z0-9-]+:\s*rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/g)) {
  PALETTE.add(`rgba(${r}, ${g}, ${b}, ${a})`)
}
// Values that paint nothing, and the UA defaults an SVG carries when it is
// stroke-only. Flagging a black fill on a path that never fills is noise.
for (const v of ["rgba(0, 0, 0, 0)", "transparent", "none", "currentcolor", "rgb(0, 0, 0)"]) {
  PALETTE.add(v)
}

// ── Reading the artboard ──────────────────────────────────────────────────
// Every element is one style="..." run. Parse per element so a report can name
// which element carried the value, not just that the file contains it.
function elements(html) {
  const out = []
  const re = /<([a-z0-9]+)\b([^>]*?)style="([^"]*)"([^>]*)>/gi
  let m
  while ((m = re.exec(html))) {
    const [, tag, pre, style, post] = m
    const attrs = pre + post
    const cls = /class="([^"]*)"/.exec(attrs)?.[1] || ""
    // A short label so a finding is locatable by eye in the canvas.
    const after = html.slice(m.index + m[0].length, m.index + m[0].length + 60)
    const text = after.replace(/<[^>]*>/g, "").trim().slice(0, 28)
    const props = new Map()
    for (const d of style.split(";")) {
      const i = d.indexOf(":")
      if (i === -1) continue
      props.set(d.slice(0, i).trim(), d.slice(i + 1).trim())
    }
    out.push({ tag, cls, text, props, at: m.index })
  }
  return out
}

const px = (v) => (/^-?[\d.]+px$/.test(v) ? parseFloat(v) : null)

// Hex to the rgb() form the palette table is built in. An EXTRACTED artboard
// carries computed styles, which are always rgb(), so this never mattered
// until artboards started being hand-authored — where #e8e8e8 is the natural
// way to write a colour and matched nothing, reporting the whole palette as
// off-system. Compare a normalised value, not a spelling.
const norm = (v) => {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v.trim())
  if (!m) return v.trim().toLowerCase()
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1]
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16))
  return `rgb(${r}, ${g}, ${b})`
}

// Properties whose px value must sit on the spacing scale. Deliberately NOT
// every px property: width/height/top/left are layout results, not spacing
// decisions, and flagging them would bury the real findings.
const SPACED = [
  "margin-top", "margin-right", "margin-bottom", "margin-left",
  "padding-top", "padding-right", "padding-bottom", "padding-left",
  "gap", "row-gap", "column-gap",
]
const COLORED = ["color", "background-color", "border-top-color", "border-right-color",
  "border-bottom-color", "border-left-color", "outline-color", "fill", "stroke"]

function check(file) {
  const html = readFileSync(file, "utf8")
  const findings = []
  const add = (el, kind, msg) =>
    findings.push({ kind, msg, where: `<${el.tag}${el.cls ? "." + el.cls.split(" ")[0] : ""}>` +
      (el.text ? ` "${el.text}"` : "") })

  for (const el of elements(html)) {
    const p = el.props

    // 1. Type pairing. The failure that has actually happened twice.
    const fs = px(p.get("font-size") || "")
    const lh = px(p.get("line-height") || "")
    if (fs !== null) {
      if (!PAIRS.has(fs)) {
        add(el, "type-size", `font-size ${fs}px is not a step (${[...PAIRS.keys()].sort((a, b) => a - b).join(", ")})`)
      } else if (lh !== null && !PAIRS.get(fs).has(lh)) {
        add(el, "type-pair", `${fs}/${lh} — ${fs}px takes ${[...PAIRS.get(fs)].join(" or ")}`)
      }
    }

    // 2. Tracking.
    const ls = px(p.get("letter-spacing") || "")
    if (ls !== null && ls !== 0 && !TRACK.has(ls)) {
      add(el, "tracking", `letter-spacing ${ls}px has no token (${[...TRACK].sort((a, b) => a - b).join(", ")})`)
    }

    // 3. Spacing.
    for (const prop of SPACED) {
      const v = px(p.get(prop) || "")
      if (v !== null && v !== 0 && !SPACE.has(Math.abs(v))) {
        add(el, "spacing", `${prop}: ${v}px is off the scale`)
      }
    }

    // 4. Colour. A border colour on a zero-width border paints nothing — the
    //    UA supplies one for every element and reporting it would drown the
    //    real findings in Tailwind's default grey.
    for (const prop of COLORED) {
      const v = norm(p.get(prop) || "")
      if (!v) continue
      // Absent width means the extractor diffed it away as equal to the base,
      // and the base is border-width:0 — so absent is zero, not unknown. A
      // border that actually paints always carries its width here, because
      // that is what makes it differ from the base.
      const w = prop.startsWith("border-") ? px(p.get(prop.replace("-color", "-width")) || "") : null
      if (prop.startsWith("border-") && (w === 0 || w === null)) continue
      if (!PALETTE.has(v)) add(el, "colour", `${prop}: ${v} is not in the palette`)
    }

    // 5. Radius.
    for (const prop of ["border-top-left-radius", "border-top-right-radius",
      "border-bottom-left-radius", "border-bottom-right-radius"]) {
      const v = px(p.get(prop) || "")
      if (v !== null && v !== 0 && !RADIUS.has(v)) {
        add(el, "radius", `${prop}: ${v}px has no token (${[...RADIUS].sort((a, b) => a - b).join(", ")})`)
      }
    }
  }
  return findings
}

// ── Report ────────────────────────────────────────────────────────────────
//
// BASELINE MODE IS THE PRIMARY ONE. Some of the app's own values cannot be
// matched against the token table by value at all: --hero-anchor is 25dvh, so
// it computes to a different number at every viewport height, and a field's
// padding can be a computed remainder. An exception list for those would grow
// forever and would start hiding real findings.
//
// Comparing against a FRESH extract of the same surface answers the question
// that actually matters — "what did this edit introduce that has no home" —
// and leaves the app's own unmatched values where they belong: reported as
// pre-existing, so they are visible without being confused for new work.
//
//   node scripts/check-artboard.mjs edited.dc.html --baseline fresh.dc.html
const argv = process.argv.slice(2)
const bi = argv.indexOf("--baseline")
const BASELINE = bi === -1 ? null : argv[bi + 1]
const files = argv.filter((a, i) => !a.startsWith("--") && (bi === -1 || i !== bi + 1))
if (!files.length) {
  console.error("usage: node scripts/check-artboard.mjs <artboard.dc.html> [--baseline <fresh.dc.html>]")
  process.exit(2)
}

const baseMsgs = BASELINE ? new Set(check(BASELINE).map((f) => f.kind + "::" + f.msg)) : null

let total = 0
for (const f of files) {
  let findings = check(f)
  if (baseMsgs) {
    const pre = findings.filter((x) => baseMsgs.has(x.kind + "::" + x.msg))
    findings = findings.filter((x) => !baseMsgs.has(x.kind + "::" + x.msg))
    if (pre.length) {
      const kinds = [...new Set(pre.map((x) => x.kind))].join(", ")
      console.log(`\n${f}\n  ${pre.length} pre-existing (already true of the app, not from this edit): ${kinds}`)
    }
  }
  total += findings.length
  if (!baseMsgs) console.log(`\n${f}`)
  if (!findings.length) {
    console.log(baseMsgs
      ? "  nothing introduced by this edit is without a token home"
      : "  every declaration has a token home")
    continue
  }
  // Grouped by kind, and DEDUPED: one bad value applied to twelve rows is one
  // decision to discuss, not twelve findings to read past.
  const byKind = new Map()
  for (const f2 of findings) {
    if (!byKind.has(f2.kind)) byKind.set(f2.kind, new Map())
    const m = byKind.get(f2.kind)
    if (!m.has(f2.msg)) m.set(f2.msg, [])
    m.get(f2.msg).push(f2.where)
  }
  for (const [kind, msgs] of byKind) {
    console.log(`  ${kind}`)
    for (const [msg, wheres] of msgs) {
      const n = wheres.length
      console.log(`    ${msg}${n > 1 ? `  (${n} elements)` : ""}`)
      console.log(`      ${wheres.slice(0, 3).join(", ")}${n > 3 ? `, +${n - 3} more` : ""}`)
    }
  }
}
console.log(`\nTOTAL: ${total} declaration(s) with no token home` + (baseMsgs ? " (introduced by this edit)" : ""))
// Exit 0 always. This is a REPORT, not a gate: the canvas is allowed to hold
// anything mid-edit, and a non-zero exit here would make pulling a canvas feel
// like a failure. check-design is the gate, at landing time.
