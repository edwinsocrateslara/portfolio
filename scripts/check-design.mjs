// Fails if a component drifts from the Bureau 1D system documented in
// DESIGN.md. Same shape as check-voice.mjs and build-context.mjs --check:
// grep-level assertions, one process, non-zero exit on failure.
//
// This catches the drift a screenshot cannot. `gap-4` and `gap-between`
// compile to the same 16px; `maxWidth: 480` and a named constant render
// identically. The failure mode in this repo is which vocabulary a value is
// written in, which is invisible in a rendered page and obvious in source.
//
//   node scripts/check-design.mjs            report and exit non-zero on any
//   node scripts/check-design.mjs --list     machine-readable, one per line
//   node scripts/check-design.mjs --bare     rule 5, report-only
//
// Five enforced rules plus one report-only. Rules 1-5 read .tsx under app/
// and components/; rule 6 also reads app/globals.css, because the token layer
// is where an accent surface would actually be written.
import { readFileSync, readdirSync, statSync } from "fs"
import { join, relative } from "path"

const ROOTS = ["app", "components"]
const CSS_FILES = ["app/globals.css"]
const ROOT_DIR = process.cwd()

// ── Allowlist ────────────────────────────────────────────────────────────
// Deliberately empty. Entries are `"<file>::<rule>::<detail>"` with a reason,
// so adding one is an edit somebody reviews rather than a comment anyone can
// write. A documented exception in a code comment does NOT exempt a value —
// three separate `marginTop: 5` comments is how a missing token hides.
const ALLOW = {
  "app/layout.tsx::no-raw-color::hex #131313":
    "PWA themeColor - read by browser chrome before CSS loads, so it cannot be a CSS var.",

  // Rule 6. Each of these is a CONTROL or a MARK, which is what the accent is
  // for; the rule cannot measure rendered size, so the judgment is recorded
  // here instead of guessed. DESIGN.md lists the same three under "Where the
  // accent is allowed".
  "components/chat/chat-input.tsx::no-accent-surface::background":
    "The SEND button fill, 42px tall, and only once there is something to send.",
  "components/chat/message-bubbles.tsx::no-accent-surface::background":
    "The 8px square IMPACT marker. A glyph, not a surface.",
  "app/globals.css::no-accent-surface::.resume-row-node background":
    "The 8px round node on the resume timeline. Same judgment as the IMPACT marker one line up: it marks a point on a hairline, and the hairline is 1px wide. Education's node is the ring variant and is not accent at all.",

  // ── Rules 1-5, CSS dialect ─────────────────────────────────────────────
  // Every entry below is a value that was ALREADY documented somewhere — in
  // DESIGN.md, or in a comment at its own definition — before this checker
  // could see it. Recording them here is not silencing them: it is moving a
  // reason a person had written into a place a program can check, so the next
  // off-grid value in this file is the only thing the report shows.
  //
  // These were ruled on ONE AT A TIME, before any were added, precisely so the
  // list could not become the place findings go to stop being findings.
  "app/globals.css::css-off-grid:::root — --bureau-radius-chip: 9999px":
    "The fully-round pill. DESIGN.md names 9999px as a grid exception and the radius table gives it a row.",
  "app/globals.css::css-off-grid:::root — --track-display-hero: -1px":
    "Optical tracking, not layout. DESIGN.md: \"Letter-spacing is optical tracking rather than layout, is sub-pixel by nature, and is also exempt.\" Rule 7 governs these properly - it caps the ramp at 8 tokens and refuses a literal outside the block. This entry stops rule 2's CSS dialect double-reporting them.",
  "app/globals.css::css-off-grid:::root — --track-display-h2: -1px":
    "Optical tracking, not layout. DESIGN.md: \"Letter-spacing is optical tracking rather than layout, is sub-pixel by nature, and is also exempt.\" Rule 7 governs these properly - it caps the ramp at 8 tokens and refuses a literal outside the block. This entry stops rule 2's CSS dialect double-reporting them.",
  "app/globals.css::css-off-grid:::root — --track-display-sub: -0.6px":
    "Optical tracking, not layout. DESIGN.md: \"Letter-spacing is optical tracking rather than layout, is sub-pixel by nature, and is also exempt.\" Rule 7 governs these properly - it caps the ramp at 8 tokens and refuses a literal outside the block. This entry stops rule 2's CSS dialect double-reporting them.",
  "app/globals.css::css-off-grid:::root — --track-display-title: -0.4px":
    "Optical tracking, not layout. DESIGN.md: \"Letter-spacing is optical tracking rather than layout, is sub-pixel by nature, and is also exempt.\" Rule 7 governs these properly - it caps the ramp at 8 tokens and refuses a literal outside the block. This entry stops rule 2's CSS dialect double-reporting them.",
  "app/globals.css::css-off-grid:::root — --track-caption: 0.4px":
    "Optical tracking, not layout. DESIGN.md: \"Letter-spacing is optical tracking rather than layout, is sub-pixel by nature, and is also exempt.\" Rule 7 governs these properly - it caps the ramp at 8 tokens and refuses a literal outside the block. This entry stops rule 2's CSS dialect double-reporting them.",
  "app/globals.css::css-off-grid:::root — --track-badge: 0.8px":
    "Optical tracking, not layout. DESIGN.md: \"Letter-spacing is optical tracking rather than layout, is sub-pixel by nature, and is also exempt.\" Rule 7 governs these properly - it caps the ramp at 8 tokens and refuses a literal outside the block. This entry stops rule 2's CSS dialect double-reporting them.",
  "app/globals.css::css-off-grid:::root — --track-caps-body: 1.4px":
    "Optical tracking, not layout. DESIGN.md: \"Letter-spacing is optical tracking rather than layout, is sub-pixel by nature, and is also exempt.\" Rule 7 governs these properly - it caps the ramp at 8 tokens and refuses a literal outside the block. This entry stops rule 2's CSS dialect double-reporting them.",
  "app/globals.css::css-off-grid:::root — --track-caps-label: 1.2px":
    "Optical tracking, not layout. DESIGN.md: \"Letter-spacing is optical tracking rather than layout, is sub-pixel by nature, and is also exempt.\" Rule 7 governs these properly - it caps the ramp at 8 tokens and refuses a literal outside the block. This entry stops rule 2's CSS dialect double-reporting them.",
  "app/globals.css::css-off-grid:::root — --type-label-lh: 18px":
    "Derived leading, 1.5x the step. DESIGN.md: \"line-height has never been asked to be on\" the 4px grid, and the ratio holds at every step with no exception.",
  "app/globals.css::css-off-grid:::root — --type-control-lh: 21px":
    "Derived leading, 1.5x the step. DESIGN.md: \"line-height has never been asked to be on\" the 4px grid, and the ratio holds at every step with no exception.",
  "app/globals.css::css-off-grid:::root — --type-title-lh: 30px":
    "Derived leading, 1.5x the step. DESIGN.md: \"line-height has never been asked to be on\" the 4px grid, and the ratio holds at every step with no exception.",
  "app/globals.css::css-off-grid:::root — --type-hero-lh: 42px":
    "Derived leading, 1.5x the step. DESIGN.md: \"line-height has never been asked to be on\" the 4px grid, and the ratio holds at every step with no exception.",
  "app/globals.css::css-off-grid:::root — --type-control-size: 14px":
    "DESIGN.md: \"One type size is off the 4px grid: control, at 14/21. It is the only one, and it is deliberate\" - a chip label wants to sit between the 12px label voice and the 16px body voice.",
  "app/globals.css::css-off-grid:::root — --space-optical-meta: 5px":
    "The title-to-meta optical gap. Documented at its definition: the meta line's own leading already separates the two, so `within` (8px) reads as a break rather than a pairing. It was written out as three separate documented exceptions before becoming one token, which is the whole argument for it having a name.",
  "app/globals.css::css-off-grid:::root — --input-border: 1px":
    "The hairline, named so the chat input's height arithmetic can reference it rather than repeating the 1.",
  "app/globals.css::css-off-grid:::root — --rail-inset: calc(var(--space-8) + 2px + var(--space-12))":
    "22px, and deliberately written as its composition: the list's padding, the 2px active bar, and the row's own padding. The 2px is the rail bar DESIGN.md names as an exception. Writing it as the sum is what keeps the section headers aligned with the rows under them - they sat at 24 and 22 when it was a number.",
  "app/globals.css::css-off-grid:::root — --bureau-focus-ring: 0 0 0 2px rgb(var(--bureau-accent) / 0.11)":
    "A glow, not the focus indicator. The indicator is the border: hairline -> text-secondary, measured on the running page at 4.76:1 between states and 7.11:1 against the ground, which is what satisfies 1.4.11. This ring reads 1.23:1 and cannot count as indicator area under 1.4.11 or 2.4.13, so its size is a visual decision. 2px matches the active rail row's border, the width DESIGN.md already names. 4px would need no entry at all; it was not taken because a 4px glow at 11% reads as a halo rather than an edge.",
  "app/globals.css::css-off-grid::.resume-rule — height: 1px":
    "The 1px hairline, drawn as a box rather than as an edge. DESIGN.md's exception is about the HAIRLINE, not the property it is spelled with - a border cannot be animated from one end, and the timeline draws this line downward.",
  "app/globals.css::css-off-grid::.resume-row-line — width: 1px":
    "The 1px hairline, drawn as a box rather than as an edge. DESIGN.md's exception is about the HAIRLINE, not the property it is spelled with - a border cannot be animated from one end, and the timeline draws this line downward.",
  "app/globals.css::css-off-grid::.resume-row-node — left: calc((1px - var(--space-8)) / 2)":
    "Centres the 8px timeline node on the 1px hairline: (1 - 8) / 2. Derived from the hairline it straddles rather than measured, so it stays correct if the node size moves. -3.5px is the only sub-pixel value on the pane.",
}

// ── Rule 2 config ────────────────────────────────────────────────────────
// Only properties whose bare numbers are LENGTHS. `flex: 1`, `zIndex: 60`,
// `opacity: 0.55`, `flexShrink: 0` are numbers but not measurements, and
// flagging them would train people to ignore this checker.
const LENGTH_PROPS = new Set([
  "width", "height", "minWidth", "maxWidth", "minHeight", "maxHeight",
  "top", "right", "bottom", "left", "inset",
  "margin", "marginTop", "marginBottom", "marginLeft", "marginRight",
  "padding", "paddingTop", "paddingBottom", "paddingLeft", "paddingRight",
  "gap", "rowGap", "columnGap",
  "borderRadius", "borderWidth", "flexBasis",
])

const TYPE_PROPS = ["fontSize", "lineHeight", "fontFamily", "fontWeight", "letterSpacing"]

// DESIGN.md's own numeric exceptions to the 4px rule, quoted: "1px borders and
// hairlines, the 2px radii below, and 9999px for fully-round pills." These are
// system-level and stated in the doc, so they belong in the rule. Per-instance
// exceptions belong in ALLOW, where somebody has to review them.
const PROP_EXCEPTIONS = {
  // 2 is GONE from borderRadius. The system's radius scale is 4/8/12/9999 —
  // the flat 2px it opened with was replaced, DESIGN.md's grid-exception line
  // still named it, and this set still permitted it. Nothing in the repo
  // writes a 2px radius, so the permission was doing no work except being
  // available. borderWidth keeps 2: the active rail row's left border is 2px
  // and is named in DESIGN.md.
  borderRadius: new Set([1, 9999]),
  borderWidth: new Set([1, 2]),
}

// Spacing utilities only. Sizing (`h-14`, `w-4`, `max-w-7xl`) expresses a
// dimension, which DESIGN.md routes to the raw scale, not to a relatedness
// level — so it is out of scope for this rule.
//
// The fix for a hit is a --space-* token, NOT necessarily a relatedness level:
// several of these express a dimension (pr-14 reserves the SEND button's
// width) or a gutter, which the raw scale covers and the four levels do not.
const TW_SPACING = /(?:^|[\s"'`])(-?(?:gap|gap-x|gap-y|p|px|py|pt|pb|pl|pr|ps|pe|m|mx|my|mt|mb|ml|mr|ms|me|space-x|space-y)-\d+(?:\.\d+)?)(?=[\s"'`]|$)/g

const HEX = /#[0-9a-fA-F]{3,8}\b/g
const RGBA = /\brgba?\(\s*\d/g

// ── Rule 6 config ────────────────────────────────────────────────────────
// Properties that PAINT AN AREA. `border-color`, `outline`, `caret-color` and
// `color` are deliberately absent: those mark an edge or a glyph, which is
// exactly what the accent is for.
const FILL_PROPS_CSS = ["background", "background-color", "background-image", "fill"]
const FILL_PROPS_JS = ["background", "backgroundColor", "backgroundImage", "fill"]
// Both accent-bearing tokens. --hero-glow is its own name so the hero wash can
// be tuned without moving the accent, but it defaults to the accent's value and
// paints the same colour — so the rule has to watch it too, or giving a colour
// a second name would be all it took to walk past this check.
const ACCENT_TOKENS = ["--bureau-accent", "--hero-glow"]

/** CSS comments only. The JS stripper treats `//` as a comment, which would
 *  eat everything after a `url(https://…)`. */
function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "))
}

/** Nearest selector text preceding an offset — the `{` that opens the block
 *  the match sits in. Gives ALLOW keys a name a human recognises. */
function selectorAt(src, idx) {
  const open = src.lastIndexOf("{", idx)
  if (open === -1) return "?"
  const prev = Math.max(src.lastIndexOf("}", open), src.lastIndexOf(";", open), src.lastIndexOf("{", open - 1))
  return src.slice(prev + 1, open).trim().replace(/\s+/g, " ").slice(0, 60) || "?"
}

/**
 * The four conditions above, read off the source. `idx` points at the value of
 * the flagged declaration; the block is the {...} it sits in.
 */
function isTopOfViewWash(src, idx, token) {
  if (token !== "--hero-glow") return false
  if (!/::before\s*$/.test(selectorAt(src, idx))) return false
  const open = src.lastIndexOf("{", idx)
  const close = src.indexOf("}", idx)
  if (open === -1 || close === -1) return false
  const block = src.slice(open, close)
  return /z-index\s*:\s*-1\b/.test(block) && /pointer-events\s*:\s*none\b/.test(block)
}

/**
 * Rule 6 — the accent may not become a surface.
 *
 * DESIGN.md: "It is never a surface, never a large painted area, never a
 * gradient." Rules 1-5 could not see this: the accent IS a token, so rule 4
 * is right to pass it, and no number is involved so rule 2 never looks.
 *
 * A grep cannot measure rendered size, so "larger than a control" is not
 * decided here — every accent fill is flagged and the judgment is recorded in
 * ALLOW, where somebody has to write down why that element is a control.
 *
 * ── THE TOP-OF-VIEW WASH IS PERMITTED BY THIS RULE, not by the allowlist ───
 *
 * It used to be an allowlist entry, and that entry said: "Nowhere else may do
 * this. If a second site ever needs an entry here, the rule has stopped
 * meaning anything and the exception should be reconsidered rather than
 * extended." It reached three sites. The wash is on every pane a visitor can
 * open, so it is not an exception to the house style — it IS the house style,
 * and a rule with more exceptions than applications is not describing the
 * system any more.
 *
 * So the rule now states the real spec: the accent may not be a surface,
 * EXCEPT as the top-of-view wash. The three entries are gone.
 *
 * RECOGNISED STRUCTURALLY, NEVER BY CLASS NAME. A `.glow-top` allowlisted by
 * selector would let anything take an accent surface by adding a class, which
 * is the objection the deck entry raised against sharing a class in the first
 * place. Four conditions, all of them properties of what the wash IS:
 *
 *   1. CSS, not JSX — a component cannot mint one inline.
 *   2. The selector is a ::before — it is a backdrop, not an element.
 *   3. The value uses --hero-glow, never --bureau-accent directly. That token
 *      exists precisely so tuning the wash cannot move the accent that marks
 *      controls; using it is a declaration of intent.
 *   4. The same block carries z-index:-1 AND pointer-events:none — it sits
 *      behind content and cannot be interacted with.
 *
 * Miss any one and it is flagged as before. An accent gradient on a real
 * element, or one that could take a click, or one reaching for the control
 * accent, is still exactly what this rule exists to stop.
 */
function checkAccentFills(file, raw, { css }) {
  const src = css ? stripCssComments(raw) : stripComments(raw)
  const props = css ? FILL_PROPS_CSS : FILL_PROPS_JS
  const stop = css ? "[^;}]*" : "[^,}\\n]*"
  const out = []
  for (const prop of props) {
    const re = new RegExp(`(?:^|[\\s{;,])${prop}\\s*:\\s*(${stop})`, "g")
    let m
    while ((m = re.exec(src))) {
      const token = ACCENT_TOKENS.find((t) => m[1].includes(t))
      if (!token) continue
      const gradient = /\b(?:linear|radial|conic)-gradient\s*\(/.test(m[1])
      const where = css ? `${selectorAt(src, m.index)} ${prop}` : prop
      if (css && gradient && isTopOfViewWash(src, m.index, token)) continue
      out.push({
        file, rule: "no-accent-surface",
        detail: gradient ? `${where} (GRADIENT)` : where,
        line: lineAt(raw, m.index), gradient, token,
      })
    }
  }
  return out
}

// ── Comment stripping ────────────────────────────────────────────────────
// Naive regex stripping breaks on `https://` inside a string and on `/*`
// inside a template literal. This walks the source tracking string state so
// a comment mentioning fontSize cannot be reported as a declaration, and a
// URL cannot be mistaken for a comment. Replaces with spaces to keep offsets
// (and therefore line numbers) intact.
function stripComments(src) {
  const out = src.split("")
  let i = 0
  const n = src.length
  let mode = null // "'" | '"' | "`" | "//" | "/*"
  while (i < n) {
    const c = src[i], d = src[i + 1]
    if (mode === null) {
      if (c === "/" && d === "/") { mode = "//"; out[i] = out[i + 1] = " "; i += 2; continue }
      if (c === "/" && d === "*") { mode = "/*"; out[i] = out[i + 1] = " "; i += 2; continue }
      if (c === "'" || c === '"' || c === "`") { mode = c; i++; continue }
      i++; continue
    }
    if (mode === "//") {
      if (c === "\n") { mode = null; i++; continue }
      out[i] = " "; i++; continue
    }
    if (mode === "/*") {
      if (c === "*" && d === "/") { mode = null; out[i] = out[i + 1] = " "; i += 2; continue }
      if (c !== "\n") out[i] = " "
      i++; continue
    }
    // inside a string
    if (c === "\\") { i += 2; continue }
    if (c === mode) { mode = null; i++; continue }
    i++
  }
  return out.join("")
}

/** Byte offset -> 1-indexed line. */
function lineAt(src, idx) {
  let line = 1
  for (let i = 0; i < idx; i++) if (src[i] === "\n") line++
  return line
}

/**
 * Extract every className value, with its offset. Handles both
 * className="a b" and className={`a ${x} b`} — the second form is how every
 * conditional class in this repo is written, so missing it would make rule 3
 * blind to most of the file.
 */
function classNameValues(src) {
  const out = []
  const re = /className=(?:"([^"]*)"|\{`([^`]*)`\}|\{"([^"]*)"\})/g
  let m
  while ((m = re.exec(src))) {
    const text = m[1] ?? m[2] ?? m[3] ?? ""
    out.push({ start: m.index + m[0].indexOf(text), text })
  }
  return out
}

/** Extract the bodies of every `style={{ ... }}`, with their offsets. */
function styleBlocks(src) {
  const blocks = []
  const re = /style=\{\{/g
  let m
  while ((m = re.exec(src))) {
    let depth = 2
    let i = m.index + m[0].length
    const start = i
    while (i < src.length && depth > 0) {
      if (src[i] === "{") depth++
      else if (src[i] === "}") depth--
      i++
    }
    blocks.push({ start, text: src.slice(start, i - 2) })
  }
  return blocks
}

// ── The rules ───────────────────────────────────────────────────────────
function checkFile(file, raw) {
  const src = stripComments(raw)
  const found = []
  const add = (rule, detail, idx) =>
    found.push({ file, rule, detail, line: lineAt(raw, idx) })

  // 1 — no inline type declarations, anywhere in the file
  for (const prop of TYPE_PROPS) {
    const re = new RegExp(`\\b${prop}\\s*:`, "g")
    let m
    while ((m = re.exec(src))) add("no-inline-type", prop, m.index)
  }

  // 2 — no off-grid raw numeric lengths inside style={{ }}
  for (const blk of styleBlocks(src)) {
    const re = /([A-Za-z][A-Za-z0-9]*)\s*:\s*(-?\d+(?:\.\d+)?)\s*(?=[,}\n])/g
    let m
    while ((m = re.exec(blk.text))) {
      const [, prop, valStr] = m
      if (!LENGTH_PROPS.has(prop)) continue
      const val = Number(valStr)
      if (Number.isInteger(val) && val % 4 === 0) continue
      if (PROP_EXCEPTIONS[prop]?.has(val)) continue
      add("no-off-grid", `${prop}=${valStr}`, blk.start + m.index)
    }
  }

  // 3 — no raw Tailwind numeric spacing utilities.
  // Scoped to className values. Scanning the whole file flagged "px-5" inside
  // a sentence, which the self-test caught; a class list is the only place the
  // token actually means anything.
  for (const cn of classNameValues(src)) {
    let m
    TW_SPACING.lastIndex = 0
    while ((m = TW_SPACING.exec(cn.text))) add("no-raw-tw-spacing", m[1], cn.start + m.index)
  }

  // 5 (REPORT-ONLY, --bare) — any bare numeric length in a style object,
  // on-grid or not. Rule 2 catches values that are the wrong SIZE; this
  // catches values that are the wrong KIND — a literal where a token or a
  // named constant belongs. `maxWidth: 480` repeated in four files and
  // `width: 8` beside a sibling that uses var(--space-8) are both invisible
  // to rule 2 because 480 and 8 are multiples of 4.
  //
  // 0 is excluded: `margin: 0` / `minWidth: 0` are idiomatic, unitless, and
  // have no token to replace them.
  for (const blk of styleBlocks(src)) {
    const re = /([A-Za-z][A-Za-z0-9]*)\s*:\s*(-?\d+(?:\.\d+)?)\s*(?=[,}\n])/g
    let m
    while ((m = re.exec(blk.text))) {
      const [, prop, valStr] = m
      if (!LENGTH_PROPS.has(prop)) continue
      const val = Number(valStr)
      if (val === 0) continue
      if (PROP_EXCEPTIONS[prop]?.has(val)) continue
      found.push({
        file, rule: "no-bare-length", detail: `${prop}=${valStr}`,
        line: lineAt(raw, blk.start + m.index), reportOnly: true,
      })
    }
  }

  // 4 — no raw hex or rgba() colour literals
  for (const [re, label] of [[HEX, "hex"], [RGBA, "rgba"]]) {
    re.lastIndex = 0
    let m
    while ((m = re.exec(src))) add("no-raw-color", `${label} ${m[0]}`, m.index)
  }

  // 6 — the accent may not become a surface
  found.push(...checkAccentFills(file, raw, { css: false }))

  return found
}

// ── Rules 1-5, CSS dialect ───────────────────────────────────────────────
// Rules 1-5 walked `.tsx` only. That was not a scoping decision anybody made;
// it fell out of `walk()` matching /\.tsx?$/, and it meant the checker was
// blind to roughly nine tenths of this system's layout. This repo styles in
// hand-written CSS and keeps `style={{}}` almost empty — rule 5, which reports
// every bare length in a style object, currently finds ZERO across the whole
// app. A gate returning nothing because it is looking at an empty room reads
// exactly like a gate returning nothing because the room is clean.
//
// Demonstrated rather than argued: `padding-left: 13px` and `margin: 0 0 7px`
// were pasted into globals.css and check:design still printed TOTAL 0.
//
// These are the same five invariants in the other dialect. Rule 3 has no CSS
// form — there are no Tailwind class strings in a stylesheet — so four of the
// five port. They are REPORT-ONLY for now: switching ~90% of the layout from
// unchecked to build-failing in one commit would mean triaging every finding
// under time pressure, which is how real exceptions get silenced with a token
// instead of recorded with a reason. They graduate to failing once each
// finding has been ruled on.
const CSS_TYPE_PROPS = ["font-size", "line-height", "font-family", "font-weight"]

// The ONE shape allowed outside a .type-* rule: `body`, set from the ramp.
// A property missing from this table can never be satisfied, which is how
// font-weight stays out of the document default without a second rule.
const RAMP_SHAPE = {
  "font-size": /^var\(--type-body-size\)$/,
  "line-height": /^var\(--type-body-lh\)$/,
  "font-family": /^var\(--ff-[a-z-]+\)$/,
}

// Same set as LENGTH_PROPS, spelled the way CSS spells it. Kept parallel on
// purpose: a property governed in a style object and ungoverned in a
// stylesheet is the hole this whole section exists to close.
const CSS_LENGTH_PROPS = new Set([
  "width", "height", "min-width", "max-width", "min-height", "max-height",
  "top", "right", "bottom", "left", "inset",
  "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
  "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
  "gap", "row-gap", "column-gap",
  "border-radius", "border-width", "flex-basis",
  "border", "border-top", "border-right", "border-bottom", "border-left",
  "outline", "outline-offset",
])
const CSS_PROP_EXCEPTIONS = Object.fromEntries([
  ["border-radius", PROP_EXCEPTIONS.borderRadius],
  // Every border-ish property takes the same stated exception. Spelled out
  // rather than pattern-matched so adding one is a visible edit.
  ...["border-width", "border", "border-top", "border-right", "border-bottom",
      "border-left", "outline", "outline-offset"].map((k) => [k, PROP_EXCEPTIONS.borderWidth]),
])

/**
 * Every declaration in a stylesheet, with the selector stack it sits under.
 *
 * Written rather than borrowed because the offsets have to survive: every
 * finding reports a line in the ORIGINAL file, so comments are blanked to
 * spaces instead of removed. The stack matters for at-rules — a declaration
 * inside `@media (...) { .type-h2 { ... } }` belongs to `.type-h2`, and a
 * walker that only records preludes at depth 0 labels it `@media`, which is
 * both useless in a report and wrong for the `.type-*` exemption below.
 */
function cssDeclarations(raw) {
  const src = stripCssComments(raw)
  const out = []
  const stack = []
  let buf = "", start = 0
  for (let i = 0; i < src.length; i++) {
    const c = src[i]
    if (c === "{") { stack.push(buf.trim().replace(/\s+/g, " ")); buf = ""; start = i + 1; continue }
    if (c === "}") { stack.pop(); buf = ""; start = i + 1; continue }
    if (c === ";" && !stack.length) { buf = ""; start = i + 1; continue }
    if (c === ";" && stack.length) {
      const text = src.slice(start, i).trim()
      const colon = text.indexOf(":")
      if (colon > 0) {
        out.push({
          prop: text.slice(0, colon).trim(),
          value: text.slice(colon + 1).trim(),
          stack: [...stack],
          sel: stack[stack.length - 1] || "?",
          start,
        })
      }
      buf = ""; start = i + 1; continue
    }
    buf += c
  }
  return out
}

function checkCssLayout(file, raw) {
  const found = []
  const add = (rule, detail, d) =>
    found.push({ file, rule, detail: `${d.sel} — ${detail}`, line: lineAt(raw, d.start), reportOnly: true })

  for (const d of cssDeclarations(raw)) {
    const isToken = d.prop.startsWith("--")
    // `:root` is where the system's values are DEFINED. A rule that flagged
    // the token block would be flagging the token layer for existing.
    const inRoot = d.stack.some((s) => /(^|\s|,):root\b/.test(s) || s.trim() === ":root")

    // 1 — type declared outside the type layer.
    //
    //     "Type may be set in a .type-* rule, or once on `body` from the
    //     ramp's own tokens, and nowhere else." This is that sentence, and the
    //     second clause is deliberately narrow: it permits the SHAPE, not the
    //     selector. `body { font-size: 16px }` is the same value as
    //     `var(--type-body-size)` and fires anyway, because the point of the
    //     document default is that it cannot drift from the step it mirrors —
    //     and a literal can.
    //
    //     font-weight has no ramp token, so nothing satisfies the permitted
    //     shape and any attempt to set it on body fires. That is intended:
    //     the default's weight is the UA's 400, which happens to equal
    //     .type-body's, and the next person to notice should have to argue for
    //     a token rather than type a number.
    if (CSS_TYPE_PROPS.includes(d.prop) && !isToken) {
      const inTypeLayer = d.stack.some((s) => /\.type-[a-z0-9-]+/.test(s))
      const isDocumentDefault =
        d.stack.length === 1 && d.stack[0].trim() === "body" && RAMP_SHAPE[d.prop]?.test(d.value)
      if (!inTypeLayer && !isDocumentDefault) add("css-inline-type", `${d.prop}: ${d.value}`, d)
    }

    // 4 — raw colour literals. Hex anywhere, and a numeric rgb()/rgba() —
    //     `rgb(var(--x))` is the correct form and starts with a letter, so the
    //     digit in the pattern is what separates the two.
    if (!(isToken && inRoot)) {
      for (const [re, label] of [[/#[0-9a-fA-F]{3,8}\b/g, "hex"], [/\brgba?\(\s*[\d.]/g, "rgba"]]) {
        re.lastIndex = 0
        let m
        while ((m = re.exec(d.value))) add("css-raw-color", `${d.prop}: ${label} ${m[0]}`, d)
      }
    }

    // 2 and 5 — px literals in a length property. A custom property whose name
    //     says it is a length counts too: --rail-inset hides a 2px border
    //     inside a calc, and that is exactly the kind of value this looks for.
    const lengthish = CSS_LENGTH_PROPS.has(d.prop) || (isToken && /px/.test(d.value))
    if (!lengthish) continue

    // A :root custom property whose whole value is one bare length IS the
    // scale — `--space-16: 16px` is the definition of 16, and flagging it
    // would be flagging the token layer for holding values. Anything richer
    // than that is a literal smuggled into a composition: --rail-inset hides
    // a 2px border inside a calc of three tokens, and --bureau-focus-ring
    // carries a 3px spread inside a shadow list. Those are exactly the values
    // that end up with no home and no reason.
    //
    // The exemption is for ON-GRID definitions only. An OFF-GRID one is a
    // deliberate exception by definition, and the whole point of this pass is
    // that those get recorded in ALLOW with their reason rather than living
    // wherever somebody happened to type them.
    const isBareDefinition = isToken && inRoot && /^-?[\d.]+px$/.test(d.value)

    const exceptions = CSS_PROP_EXCEPTIONS[d.prop]
    for (const m of d.value.matchAll(/(-?\d*\.?\d+)px/g)) {
      const n = Number(m[1])
      if (n === 0) continue
      if (exceptions?.has(Math.abs(n))) continue
      const offGrid = !Number.isInteger(n) || n % 4 !== 0
      if (isBareDefinition && !offGrid) continue
      add(offGrid ? "css-off-grid" : "css-bare-length", `${d.prop}: ${d.value}`, d)
    }
  }
  return found
}

// ── Rule 7 — the tracking ramp ───────────────────────────────────────────
// Reads globals.css only. Two halves, and they fail for opposite reasons:
//
//   a) a letter-spacing LITERAL anywhere outside the --track-* block. Every
//      tracking value in this system is an optical correction that belongs to
//      a voice or a step, so a raw px here is a value nobody can find later.
//      This is not hypothetical: tokenising the six original values missed the
//      -0.6px in the mobile @media block, and nothing noticed until a step was
//      added beside it.
//
//   b) more --track-* tokens than the ramp is allowed to hold. The count is
//      the point. Two values for one role is a nudge, not a step, and a nudge
//      is exactly what arrives one plausible pixel at a time. Raising this
//      number is a deliberate edit here, with a row added to the table in
//      DESIGN.md — which is the review this rule exists to force.
// RAISED 8 -> 9 when the rail moved from IBM Plex Mono to Archivo. The rail
// sets caps at two steps and neither existing token fits: --track-caption is
// the sans face at 12 but lowercase, and --track-badge's 0.8px is mono caps at
// 700 — the same number solved from a different face, which is the coincidence
// this repo keeps deleting rather than reusing.
//
// The ask was three values and came down to ONE by expressing the correction
// in em: --track-caps-sans: 0.05em is 0.6px at 12 and 0.8px at 16. The brand
// needed nothing because it stays mono.
//
// Raising this is meant to cost something. It costs a row in DESIGN.md's
// tracking table and this paragraph. Nine is the number; the next one has to
// argue for ten.
const TRACK_BUDGET = 9

function checkTracking(file, raw) {
  const found = []
  const src = stripComments(raw)

  // The token block is the one place a literal is correct.
  const declared = [...src.matchAll(/--track-[a-z0-9-]+\s*:/g)].map((m) => m[0])
  if (declared.length > TRACK_BUDGET) {
    found.push({
      file, rule: "tracking-budget",
      detail: `${declared.length} --track-* tokens, budget is ${TRACK_BUDGET}`,
      line: 1,
    })
  }

  const re = /letter-spacing\s*:\s*(-?\d*\.?\d+)(px|em|rem)/g
  let m
  while ((m = re.exec(src))) {
    // A declaration whose own name starts with --track- is the definition.
    const lineStart = src.lastIndexOf("\n", m.index) + 1
    if (/--track-/.test(src.slice(lineStart, m.index))) continue
    found.push({
      file, rule: "tracking-literal",
      detail: `letter-spacing: ${m[1]}${m[2]} (use var(--track-*))`,
      line: lineAt(raw, m.index),
    })
  }
  return found
}

// ── Positive control ─────────────────────────────────────────────────────
// A clean pass is worthless if a matcher silently broke. Each rule is run
// against a fixture that MUST trip it, and against a fixture that must NOT.
// If any expectation fails the checker aborts rather than reporting "clean".
const FIXTURE_BAD = `
export function Bad() {
  return (
    <div className="gap-4 px-5" style={{ fontSize: 13, marginTop: 5, color: "#ff0000", background: "rgba(0,0,0,.5)" }}>
      <span style={{ height: 42, backgroundColor: "rgb(var(--bureau-accent))" }} />
    </div>
  )
}
`
const FIXTURE_GOOD = `
// A comment mentioning fontSize: 13 and https://example.com/gap-4 must not trip.
export function Good() {
  const label = "not a class: px-5 lives in prose"
  return (
    <div className="flex items-center gap-within h-14 max-w-7xl" style={{ margin: 0, gap: "var(--space-between)", maxWidth: 480, zIndex: 60, flex: 1, opacity: 0.55, borderColor: "rgb(var(--bureau-accent))", caretColor: "rgb(var(--bureau-accent))", color: "rgb(var(--bureau-accent))" }}>
      <span className="type-label" style={{ borderRadius: 9999, minWidth: 0 }} />
    </div>
  )
}
`
const FIXTURE_CSS_BAD = `
.some-band { background: radial-gradient(50% 50%, rgb(var(--bureau-accent) / .07), transparent); }
.some-panel { background-color: rgb(var(--bureau-accent)); }
`
const FIXTURE_CSS_GOOD = `
/* background: rgb(var(--bureau-accent)) inside a comment must not trip. */
.some-mark { border-left-color: rgb(var(--bureau-accent)); caret-color: rgb(var(--bureau-accent)); }
.some-panel { background: var(--layer-1); outline: 2px solid rgb(var(--bureau-accent)); }
`
// The top-of-view wash, and four near-misses. The wash is permitted BY RULE
// 6 now rather than by an allowlist entry, so the thing that has to be proven
// is that it is a narrowing and not a hole: each near-miss drops exactly one
// of the four conditions and must still be flagged.
const FIXTURE_WASH_GOOD = `
.pane-glow::before {
  content: ""; position: absolute; inset: 0 0 auto 0;
  height: var(--hero-glow-height); z-index: -1; pointer-events: none;
  background: radial-gradient(ellipse at top center, rgb(var(--hero-glow) / 0.2), rgb(var(--hero-glow) / 0) 64%);
}
`
const FIXTURE_WASH_NEARMISS = `
/* 1. control accent, not the wash's own token */
.a::before { z-index: -1; pointer-events: none;
  background: radial-gradient(ellipse at top center, rgb(var(--bureau-accent) / 0.2), transparent); }
/* 2. a real element, not a backdrop pseudo */
.b { z-index: -1; pointer-events: none;
  background: radial-gradient(ellipse at top center, rgb(var(--hero-glow) / 0.2), transparent); }
/* 3. sits above content */
.c::before { z-index: 1; pointer-events: none;
  background: radial-gradient(ellipse at top center, rgb(var(--hero-glow) / 0.2), transparent); }
/* 4. can take a click */
.d::before { z-index: -1;
  background: radial-gradient(ellipse at top center, rgb(var(--hero-glow) / 0.2), transparent); }
`
const FIXTURE_TRACK_BAD = `
:root { --track-caps-body: 1.4px; }
.type-thing { letter-spacing: 1.2px; }
@media (max-width: 640px) { .type-other { letter-spacing: -0.6px; } }
`
const FIXTURE_TRACK_GOOD = `
/* letter-spacing: 9px inside a comment must not trip. */
:root { --track-caps-body: 1.4px; --track-caps-label: 1.2px; }
.type-thing { letter-spacing: var(--track-caps-label); }
`
// Rules 1-5 in CSS. Every line of BAD must trip exactly the rule named beside
// it; GOOD is the same shapes written correctly, plus the three things that
// most plausibly produce a false positive — the :root token block, a `.type-*`
// rule setting type (which is its job), and a stated 1px/9999px exception.
const FIXTURE_CSS_LAYOUT_BAD = `
.a { padding-left: 13px; }                         /* off-grid */
.b { margin: 0 0 7px; }                            /* off-grid, 0 ignored */
.c { gap: 16px; }                                  /* on-grid literal, rule 5 */
.d { font-size: 15px; line-height: 22px; }         /* type outside .type-* */
.e { color: #ff0000; background: rgba(0,0,0,.5); } /* raw colour */
:root { --thing-inset: calc(var(--space-8) + 3px); } /* off-grid inside a calc */
:root { --odd-step: 5px; }                         /* off-grid DEFINITION still reported */
.i { border: 3px solid var(--hairline); }          /* shorthand, past the stated exception */
body { font-size: 16px; }                          /* the RIGHT value, the wrong kind — still fires */
body { font-weight: 400; }                         /* no ramp token for weight, so nothing permits it */
body { line-height: var(--type-title-lh); }        /* a ramp token, but not the body step */
.j body { font-size: var(--type-body-size); }      /* the shape, but not the document default */
@media (max-width: 900px) { .f { margin-top: 9px; } } /* inside an at-rule */
`
const FIXTURE_CSS_LAYOUT_GOOD = `
/* padding-left: 13px and #ff0000 inside a comment must not trip. */
:root {
  --bureau-bg: 19 19 19;
  --hairline: rgb(255 255 255 / 0.14);
  --space-16: 16px;
  --type-body-size: 16px;
}
.type-body { font-family: var(--ff-archivo); font-size: var(--type-body-size); line-height: var(--type-body-lh); font-weight: 400; }
@media (max-width: 640px) { .type-h2 { font-size: var(--type-subhead-size); } }
body { font-family: var(--ff-archivo); font-size: var(--type-body-size); line-height: var(--type-body-lh); }
.g { padding: var(--space-16); gap: var(--space-within); color: rgb(var(--bureau-text-primary)); }
.h { border-width: 1px; border-radius: 9999px; border: 2px solid var(--hairline); outline-offset: 2px; }
`
function selfTest() {
  const bad = checkFile("<fixture-bad>", FIXTURE_BAD)
  const good = checkFile("<fixture-good>", FIXTURE_GOOD)
  const cssBad = checkAccentFills("<fixture-css-bad>", FIXTURE_CSS_BAD, { css: true })
  const cssGood = checkAccentFills("<fixture-css-good>", FIXTURE_CSS_GOOD, { css: true })
  const problems = []

  // Rule 6 in both dialects. It is the only rule that reads CSS, so a CSS
  // control matters as much as the JSX one.
  if (!bad.some((f) => f.rule === "no-accent-surface"))
    problems.push('control: rule "no-accent-surface" did NOT fire on an accent backgroundColor in JSX')
  if (cssBad.length !== 2)
    problems.push(`control: rule "no-accent-surface" found ${cssBad.length}/2 accent fills in the bad CSS fixture`)
  if (!cssBad.some((f) => f.gradient))
    problems.push('control: rule "no-accent-surface" did not flag the accent GRADIENT')

  // The narrowing, both directions.
  const washOk = checkAccentFills("<fixture-wash-good>", FIXTURE_WASH_GOOD, { css: true })
  if (washOk.length !== 0)
    problems.push(`control: the top-of-view wash was flagged (${washOk.length}) — rule 6's exception is not working`)
  const nearMiss = checkAccentFills("<fixture-wash-nearmiss>", FIXTURE_WASH_NEARMISS, { css: true })
  if (nearMiss.length !== 4)
    problems.push(
      `control: ${nearMiss.length}/4 near-miss washes flagged — rule 6's exception is a HOLE, not a narrowing. ` +
      `Each fixture drops one condition (control accent / real element / above content / clickable) and must still fire.`
    )
  // The second token must be caught too, or giving a colour another name would
  // be all it took to walk past this rule.
  const glowFix = checkAccentFills("<fixture-glow>", ".x { background: rgb(var(--hero-glow) / .13); }", { css: true })
  if (glowFix.length !== 1 || glowFix[0].token !== "--hero-glow")
    problems.push('control: rule "no-accent-surface" did not catch --hero-glow used as a fill')
  for (const f of cssGood)
    problems.push(`control: rule "no-accent-surface" false positive on good CSS — ${f.detail}`)

  // Rule 7, both halves. The literal half must find exactly the two rule
  // bodies and NOT the token declaration beside them — if it counted the
  // definition it would flag the token block itself and be unusable.
  const trackBad = checkTracking("<fixture-track-bad>", FIXTURE_TRACK_BAD)
  const lits = trackBad.filter((f) => f.rule === "tracking-literal")
  if (lits.length !== 2)
    problems.push(`control: rule "tracking-literal" found ${lits.length}/2 literals — it must catch the one inside @media too`)
  for (const f of checkTracking("<fixture-track-good>", FIXTURE_TRACK_GOOD))
    problems.push(`control: rule "tracking-literal" false positive on good CSS — ${f.detail}`)
  // The budget half, proven against a fixture that blows it.
  const overBudget = ":root {" + Array.from({ length: TRACK_BUDGET + 1 },
    (_, i) => `--track-x${i}: ${i}px;`).join("") + "}"
  if (!checkTracking("<fixture-budget>", overBudget).some((f) => f.rule === "tracking-budget"))
    problems.push('control: rule "tracking-budget" did NOT fire on an over-budget token block')

  for (const rule of ["no-inline-type", "no-off-grid", "no-raw-tw-spacing", "no-raw-color"]) {
    if (!bad.some((f) => f.rule === rule))
      problems.push(`control: rule "${rule}" did NOT fire on the bad fixture — matcher is broken`)
  }

  // Rules 1-5 in CSS. This is the control that did not exist, and its absence
  // is why check:design reported TOTAL 0 on a stylesheet with 13px in it.
  const cssLayoutBad = checkCssLayout("<fixture-css-layout-bad>", FIXTURE_CSS_LAYOUT_BAD)
  const cssLayoutGood = checkCssLayout("<fixture-css-layout-good>", FIXTURE_CSS_LAYOUT_GOOD)
  const cssHits = (rule) => cssLayoutBad.filter((f) => f.rule === rule)
  for (const [rule, want] of [["css-off-grid", 6], ["css-bare-length", 1], ["css-inline-type", 6], ["css-raw-color", 2]]) {
    if (cssHits(rule).length !== want)
      problems.push(
        `control: rule "${rule}" found ${cssHits(rule).length}/${want} in the bad CSS fixture — ` +
        `the CSS dialect is broken, and a clean CSS report would mean nothing`
      )
  }
  // The at-rule case specifically: a declaration nested inside @media must be
  // reached, and must be labelled with its own selector rather than the query.
  if (!cssHits("css-off-grid").some((f) => /^\.f — margin-top/.test(f.detail)))
    problems.push('control: rule "css-off-grid" did not reach a declaration nested inside @media')
  // A px hidden inside a calc on a custom property is the --rail-inset shape.
  if (!cssHits("css-off-grid").some((f) => /--thing-inset/.test(f.detail)))
    problems.push('control: rule "css-off-grid" did not look inside a calc() on a custom property')
  // Everything in the CSS layer is report-only for now. If one of these ever
  // lands in `violations` it starts failing builds without anyone deciding to.
  if (cssLayoutBad.some((f) => !f.reportOnly))
    problems.push("control: a CSS-layer finding was not marked reportOnly — it would fail the build")
  for (const f of cssLayoutGood)
    problems.push(`control: false positive on the good CSS fixture — ${f.rule} / ${f.detail}`)

  // Rule 5 must fire on an ON-GRID bare length. That is the whole reason it
  // exists — if it only fired on off-grid values it would just be rule 2.
  // maxWidth: 480 lives in the "good" fixture precisely because rules 1-4 are
  // right to ignore it.
  if (!good.some((f) => f.rule === "no-bare-length" && f.detail === "maxWidth=480"))
    problems.push('control: rule "no-bare-length" did NOT fire on maxWidth=480 — it is not catching on-grid literals')
  if (good.some((f) => f.rule === "no-bare-length" && /=0$/.test(f.detail)))
    problems.push('control: rule "no-bare-length" fired on a 0 value — margin: 0 must stay idiomatic')
  // The good fixture is allowed exactly one hit: maxWidth: 480 is a real
  // off-grid-by-policy case (480 % 4 === 0, so it should NOT fire) — assert
  // the whole fixture is silent.
  for (const f of good.filter((x) => x.rule !== "no-bare-length"))
    problems.push(`control: false positive on the good fixture — ${f.rule} / ${f.detail}`)

  return problems
}

// ── Walk ─────────────────────────────────────────────────────────────────
function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e)
    const st = statSync(p)
    if (st.isDirectory()) walk(p, acc)
    else if (/\.tsx?$/.test(e)) acc.push(p)
  }
  return acc
}

const controlProblems = selfTest()
if (controlProblems.length) {
  console.error("SELF-TEST FAILED — refusing to report a result:\n")
  for (const p of controlProblems) console.error("  " + p)
  process.exit(2)
}

const files = ROOTS.flatMap((r) => walk(join(ROOT_DIR, r))).sort()
const violations = []
const reportOnly = []
const record = (v) => {
  // Gradients WERE non-allowlistable, on the reasoning that a gradient is never
  // a control. The hero glow is a deliberate exception, so they are
  // allowlistable again — but the detail string still carries "(GRADIENT)", so
  // an entry waiving one is obviously waiving a painted area and cannot be
  // mistaken for waiving a control. The default is still failure, and waiving
  // still costs a written reason in a file somebody reviews.
  if (`${v.file}::${v.rule}::${v.detail}` in ALLOW) return
  if (v.reportOnly) reportOnly.push(v)
  else violations.push(v)
}
for (const abs of files) {
  const rel = relative(ROOT_DIR, abs)
  for (const v of checkFile(rel, readFileSync(abs, "utf8"))) record(v)
}

// Rule 6 is the only rule that reads CSS. The token layer is where an accent
// surface is most likely to be written — the hero wash lived here — so a
// checker that only walked .tsx would have been blind to exactly the case it
// exists to catch.
for (const rel of CSS_FILES) {
  const css = readFileSync(join(ROOT_DIR, rel), "utf8")
  for (const v of checkAccentFills(rel, css, { css: true })) record(v)
  for (const v of checkTracking(rel, css)) record(v)
  for (const v of checkCssLayout(rel, css)) record(v)
}

// The CSS layer's rules, and their one-line reasons. Deliberately a SEPARATE
// table from RULES: everything here is report-only, and mixing the two would
// make it read as though these fail the build.
const CSS_RULES = {
  "css-off-grid": "px length not a multiple of 4 (or an off-grid token definition)",
  "css-bare-length": "px literal where a --space-* token belongs",
  "css-inline-type": "type set outside a .type-* rule",
  "css-raw-color": "raw colour literal in a stylesheet",
}

const cssFindings = reportOnly.filter((v) => v.rule in CSS_RULES)

if (process.argv.includes("--css")) {
  console.log("CSS RULES 1-5 (REPORT-ONLY) — these do not fail the build\n")
  for (const [rule, label] of Object.entries(CSS_RULES)) {
    const hits = cssFindings.filter((v) => v.rule === rule)
    console.log(`── ${rule} — ${label}: ${hits.length}`)
    for (const h of hits) console.log(`   :${String(h.line).padStart(4)}  ${h.detail}`)
    if (!hits.length) console.log("   (none)")
    console.log()
  }
  console.log(`TOTAL ${cssFindings.length} report-only CSS finding(s)`)
  process.exit(0)
}

if (process.argv.includes("--bare")) {
  const byFile = {}
  for (const v of reportOnly) (byFile[v.file] ??= []).push(v)
  console.log("RULE 5 (report-only) — bare numeric lengths in style objects, 0 excluded\n")
  for (const [f, hs] of Object.entries(byFile))
    console.log(`  ${f}\n${hs.map((h) => `      :${h.line}  ${h.detail}`).join("\n")}`)
  const vals = reportOnly.map((v) => Number(v.detail.split("=")[1]))
  const offGrid = vals.filter((v) => !Number.isInteger(v) || v % 4 !== 0).length
  console.log(`\n  TOTAL ${reportOnly.length}   (${offGrid} also off-grid = rule 2's set, ${reportOnly.length - offGrid} on-grid and invisible to rule 2)`)
  process.exit(0)
}

if (process.argv.includes("--list")) {
  for (const v of violations) console.log(`${v.file}:${v.line}\t${v.rule}\t${v.detail}`)
} else {
  const RULES = {
    "no-inline-type": "Inline type declarations (use a .type-* class)",
    "no-off-grid": "Raw numeric length not a multiple of 4",
    "no-raw-tw-spacing": "Raw Tailwind numeric spacing (use a --space-* token)",
    "no-raw-color": "Raw colour literal (use rgb(var(--bureau-*)))",
    "no-accent-surface": "Accent used as a fill (it marks structure, never a surface)",
    "tracking-literal": "Letter-spacing literal (use var(--track-*))",
    "tracking-budget": `More than ${TRACK_BUDGET} --track-* tokens — a value has to earn its row`,
  }
  // A rule missing from this table still COUNTS toward the total and still
  // fails the build, but prints under no heading — which reads as "1 violation
  // of nothing". Adding a rule means adding a row here.
  const untitled = violations.filter((v) => !(v.rule in RULES))
  if (untitled.length) {
    console.error(`\nBUG: ${untitled.length} violation(s) of rules missing from the RULES table:`)
    for (const v of untitled) console.error(`  ${v.file}:${v.line}\t${v.rule}\t${v.detail}`)
    process.exit(2)
  }
  console.log(`self-test PASS — all ${Object.keys(RULES).length} build-failing matchers + ${Object.keys(CSS_RULES).length} report-only CSS matchers fire on the bad fixtures, none on the good ones`)
  console.log(`scanned ${files.length} files under ${ROOTS.join(", ")}, plus ${CSS_FILES.join(", ")}\n`)
  for (const [rule, label] of Object.entries(RULES)) {
    const hits = violations.filter((v) => v.rule === rule)
    console.log(`── ${rule} — ${label}: ${hits.length}`)
    const byFile = {}
    for (const h of hits) (byFile[h.file] ??= []).push(h)
    for (const [f, hs] of Object.entries(byFile))
      console.log(`   ${f}\n${hs.map((h) => `      :${h.line}  ${h.detail}`).join("\n")}`)
    if (!hits.length) console.log("   (none)")
    console.log()
  }
  console.log(`TOTAL: ${violations.length} violation(s)`)

  // Report-only, and printed anyway. A layer that is checked but never shown
  // is the same failure as a layer that was never checked — which is the bug
  // this section was added to fix.
  if (cssFindings.length) {
    const byRule = Object.entries(CSS_RULES)
      .map(([r, l]) => [r, l, cssFindings.filter((v) => v.rule === r).length])
      .filter(([, , n]) => n)
    console.log(`\nCSS rules 1-5 (REPORT-ONLY, does not fail the build): ${cssFindings.length} finding(s)`)
    for (const [rule, label, n] of byRule) console.log(`   ${String(n).padStart(4)}  ${rule} — ${label}`)
    console.log("   run `npm run check:design -- --css` for the list")
  }
}

process.exit(violations.length ? 1 : 0)
