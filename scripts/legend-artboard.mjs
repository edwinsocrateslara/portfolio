// Writes Legend.dc.html — a reference artboard that ships on every canvas.
//
// WHY. The canvas editor has no notion of this project's scale: it will let you
// type any font-size, any gap, any colour. check-artboard.mjs catches what has
// no token home, but only AFTER the edit, when the person is already attached
// to the result. This is the other half — something to copy values OFF while
// editing, on the same canvas, one pan away from the surface being tweaked.
// It is the only intervention that works inside the canvas, because it is not
// a validator: it is just another artboard.
//
// DERIVED FROM app/globals.css, never hand-written. A legend that is a second
// copy of the scale is exactly the duplication that makes a legend dangerous —
// it would keep showing the old value the day a token moved, and it would be
// believed, because a legend looks authoritative. Regenerate it with every
// canvas and it cannot lie.
//
//   node scripts/legend-artboard.mjs --out <dir>

import { readFileSync, writeFileSync } from "fs"

const OUT = (() => { const i = process.argv.indexOf("--out"); return i === -1 ? "." : process.argv[i + 1] })()
// Resolved from THIS FILE, not the cwd. Both of these are run from wherever
// the artboards happen to live — a scratch directory, a canvas folder — and a
// cwd-relative path made them work only when invoked from the repo root.
const ROOT = new URL("..", import.meta.url).pathname
const CSS = readFileSync(ROOT + "app/globals.css", "utf8")
const all = (re) => [...CSS.matchAll(re)]

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// ── Read the scale ────────────────────────────────────────────────────────
const size = new Map(all(/--type-([a-z0-9-]+)-size:\s*(\d+)px/g).map((m) => [m[1], +m[2]]))
const lh = new Map(all(/--type-([a-z0-9-]+)-lh:\s*(\d+)px/g).map((m) => [m[1], +m[2]]))
const steps = [...size.keys()].filter((k) => lh.has(k)).sort((a, b) => size.get(a) - size.get(b))

const spaces = all(/--space-([a-z0-9-]+):\s*(\d+)px/g).map((m) => ({ name: m[1], v: +m[2] }))
const tracks = all(/--track-([a-z0-9-]+):\s*(-?[\d.]+)px/g).map((m) => ({ name: m[1], v: parseFloat(m[2]) }))
const radii = all(/--bureau-radius-([a-z0-9]+):\s*(\d+)(?:px)?/g).map((m) => ({ name: m[1], v: +m[2] }))
const colours = all(/--bureau-([a-z0-9-]+):\s*(\d+) (\d+) (\d+);/g)
  .map((m) => ({ name: m[1], css: `rgb(${m[2]}, ${m[3]}, ${m[4]})` }))
const layers = all(/--(layer-[12]|hairline[a-z-]*):\s*rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/g)
  .map((m) => ({ name: m[1], css: `rgba(${m[2]}, ${m[3]}, ${m[4]}, ${m[5]})` }))

// ── Voices, so a step is shown as it is actually used ─────────────────────
const MONO = `"IBM Plex Mono", ui-monospace, monospace`
const SANS = `Archivo, "Helvetica Neue", Arial, sans-serif`
const BG = "#131313", INK = "rgb(232, 232, 232)", DIM = "rgb(160, 160, 160)"

const label = (t) =>
  `<div style="font-family:${MONO};font-weight:600;font-size:12px;line-height:18px;letter-spacing:1.2px;text-transform:uppercase;color:${DIM}">${esc(t)}</div>`

const rows = []

// TYPE. Every legal pairing, rendered at its own step, with the pair printed
// beside it — the pair is the thing that has twice come back wrong.
rows.push(`<div style="display:flex;flex-direction:column;gap:16px">${label("Type — the only legal pairings")}` +
  steps.map((k) => {
    const s = size.get(k), l = lh.get(k)
    return `<div style="display:flex;align-items:baseline;gap:24px">` +
      `<div style="font-family:${MONO};font-size:12px;line-height:18px;color:${DIM};width:120px;flex:none">${esc(k)} ${s}/${l}</div>` +
      `<div style="font-family:${SANS};font-size:${s}px;line-height:${l}px;color:${INK}">Grid, weight, measure</div></div>`
  }).join("") + `</div>`)

// SPACING, drawn to scale — a number in a list is not something you can judge
// a gap against.
rows.push(`<div style="display:flex;flex-direction:column;gap:12px">${label("Spacing")}` +
  `<div style="display:flex;flex-direction:column;gap:8px">` +
  spaces.map((s) =>
    `<div style="display:flex;align-items:center;gap:16px">` +
    `<div style="font-family:${MONO};font-size:12px;line-height:18px;color:${DIM};width:120px;flex:none">--space-${esc(s.name)}</div>` +
    `<div style="height:8px;width:${s.v}px;background:rgb(127, 221, 60)"></div>` +
    `<div style="font-family:${MONO};font-size:12px;line-height:18px;color:${DIM}">${s.v}px</div></div>`
  ).join("") + `</div></div>`)

// PALETTE, as swatches with the resolved value, because the canvas emits the
// resolved value and that is what you will be matching against.
rows.push(`<div style="display:flex;flex-direction:column;gap:12px">${label("Palette")}` +
  `<div style="display:flex;flex-wrap:wrap;gap:16px">` +
  [...colours, ...layers].map((c) =>
    `<div style="display:flex;flex-direction:column;gap:8px;width:200px">` +
    `<div style="height:40px;background:${c.css};border-top-width:1px;border-right-width:1px;border-bottom-width:1px;border-left-width:1px;border-top-color:rgba(255, 255, 255, 0.14);border-right-color:rgba(255, 255, 255, 0.14);border-bottom-color:rgba(255, 255, 255, 0.14);border-left-color:rgba(255, 255, 255, 0.14)"></div>` +
    `<div style="font-family:${MONO};font-size:12px;line-height:18px;color:${INK}">${esc(c.name)}</div>` +
    `<div style="font-family:${MONO};font-size:12px;line-height:18px;color:${DIM}">${esc(c.css)}</div></div>`
  ).join("") + `</div></div>`)

// TRACKING and RADIUS, the two smaller tables. Tracking is shown applied,
// since 1.2 versus 1.4 is not a number anyone can picture.
rows.push(`<div style="display:flex;gap:64px">` +
  `<div style="display:flex;flex-direction:column;gap:12px">${label("Tracking")}` +
  tracks.map((t) =>
    `<div style="display:flex;align-items:baseline;gap:16px">` +
    `<div style="font-family:${MONO};font-size:12px;line-height:18px;color:${DIM};width:160px;flex:none">${esc(t.name)} ${t.v}px</div>` +
    `<div style="font-family:${MONO};font-size:12px;line-height:18px;letter-spacing:${t.v}px;text-transform:uppercase;color:${INK}">Specimen</div></div>`
  ).join("") + `</div>` +
  `<div style="display:flex;flex-direction:column;gap:12px">${label("Radius")}` +
  radii.map((r) =>
    `<div style="display:flex;align-items:center;gap:16px">` +
    `<div style="font-family:${MONO};font-size:12px;line-height:18px;color:${DIM};width:100px;flex:none">${esc(r.name)} ${r.v}px</div>` +
    `<div style="width:40px;height:40px;background:rgba(255, 255, 255, 0.07);border-top-left-radius:${r.v}px;border-top-right-radius:${r.v}px;border-bottom-left-radius:${r.v}px;border-bottom-right-radius:${r.v}px"></div></div>`
  ).join("") + `</div></div>`)

const html = `<!doctype html>
<html>
<head><meta charset="utf-8"><script src="./support.js"></script></head>
<body>
<x-dc>
<helmet>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500;1,600;1,700;1,800&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;display=swap">
  <style>
    *, *::before, *::after { box-sizing: border-box; border-top-width: 0px; border-right-width: 0px; border-bottom-width: 0px; border-left-width: 0px; border-top-style: solid; border-right-style: solid; border-bottom-style: solid; border-left-style: solid; }
    body { margin: 0; background: ${BG}; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  </style>
</helmet>
<div style="background:${BG};padding:64px;display:flex;flex-direction:column;gap:64px;min-height:100%">
  <div style="display:flex;flex-direction:column;gap:8px">
    <div style="font-family:${MONO};font-weight:700;font-size:16px;line-height:24px;letter-spacing:0.8px;text-transform:uppercase;color:${INK}">Legend</div>
    <div style="font-family:${SANS};font-size:14px;line-height:21px;color:${DIM};max-width:640px">Generated from app/globals.css. Copy values off this board while editing — anything not shown here has no token home and will be reported before it lands.</div>
  </div>
  ${rows.join("\n  ")}
</div>
</x-dc>
</body>
</html>
`
writeFileSync(`${OUT}/Legend.dc.html`, html)
console.log(`Legend.dc.html — ${steps.length} type steps, ${spaces.length} spacing, ` +
  `${colours.length + layers.length} colours, ${tracks.length} tracking, ${radii.length} radius`)
