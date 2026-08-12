// Weighted hue histogram over every project screenshot in public/framer/.
//
// This is the evidence behind --bureau-accent. The accent's job is to stay
// legible against 32 real screenshots it has no control over, so the hue was
// picked by measuring where those screenshots already live and choosing a
// band they leave empty — not by taste. Re-run this if the project set or its
// imagery changes; if the empty band moves, the accent is wrong.
//
//   npm run dev            (must already be running on :3200)
//   node scripts/sample-hues.mjs
//
// Chrome must be running with --remote-debugging-port=9222.
//
// Why the browser decodes the images and not this script: public/framer holds
// progressive JPEGs and at least one 8-bit COLORMAP PNG (retail-banking's
// preview). `sips` silently skipped the former and emitted a palette PNG for
// the latter, and a hand-rolled PNG reader that assumes RGB/RGBA bytes-per-
// pixel corrupts colortype-3 data rather than failing loudly. Chrome decodes
// every format the site itself can display, which is exactly the right set.
import { connect } from "./shot.mjs"
import { readdirSync } from "fs"

const BINS = 24 // 15 degrees each
const SIZE = 96 // downsample; we want dominant colour, not detail

const { evalJS, goto, close } = await connect()

const dirs = readdirSync("public/framer").filter((d) => !d.startsWith("."))
const files = {}
for (const d of dirs) {
  files[d] = readdirSync(`public/framer/${d}`).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
}
const total = Object.values(files).reduce((n, l) => n + l.length, 0)

await goto("http://localhost:3200/", 1500)

// Weighting: saturation x a mid-lightness bias. Without it the near-black and
// near-white pixels of the UI *inside* each screenshot swamp the actual brand
// colour, and every project reports the same answer.
const raw = await evalJS(`(async () => {
  const files = ${JSON.stringify(files)}
  const cv = document.createElement('canvas'); cv.width = ${SIZE}; cv.height = ${SIZE}
  const cx = cv.getContext('2d', { willReadFrequently: true })
  function rgb2hsl(r, g, b) {
    r /= 255; g /= 255; b /= 255
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
    if (mx === mn) return [0, 0, l]
    const d = mx - mn
    const s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn)
    let h
    if (mx === r) h = ((g - b) / d + (g < b ? 6 : 0))
    else if (mx === g) h = ((b - r) / d + 2)
    else h = ((r - g) / d + 4)
    return [h * 60, s, l]
  }
  const per = {}, all = new Array(${BINS}).fill(0)
  const skipped = []
  for (const [proj, list] of Object.entries(files)) {
    const bins = new Array(${BINS}).fill(0)
    for (const f of list) {
      const img = new Image()
      img.src = '/framer/' + proj + '/' + f
      await img.decode().catch(() => {})
      if (!img.width) { skipped.push(proj + '/' + f); continue }
      cx.clearRect(0, 0, ${SIZE}, ${SIZE}); cx.drawImage(img, 0, 0, ${SIZE}, ${SIZE})
      const d = cx.getImageData(0, 0, ${SIZE}, ${SIZE}).data
      for (let i = 0; i < d.length; i += 4) {
        const [h, s, l] = rgb2hsl(d[i], d[i + 1], d[i + 2])
        if (s < 0.18 || l < 0.10 || l > 0.93) continue   // grey, void, blowout
        bins[Math.floor(h / 15) % ${BINS}] += s * (1 - Math.abs(l - 0.5) * 1.4)
      }
    }
    per[proj] = bins
    bins.forEach((v, i) => (all[i] += v))
  }
  return JSON.stringify({ per, all, skipped })
})()`)

const { per, all, skipped } = JSON.parse(raw)
const pct = (b) => {
  const t = b.reduce((a, c) => a + c, 0) || 1
  return b.map((v) => (100 * v) / t)
}

console.log(`${total} image(s) across ${dirs.length} project(s)\n`)
console.log("PER PROJECT — dominant hue bins (>=6%)\n")
for (const [p, b] of Object.entries(per)) {
  const top = pct(b)
    .map((v, i) => [i * 15, v])
    .sort((a, c) => c[1] - a[1])
    .filter((x) => x[1] >= 6)
    .slice(0, 4)
  console.log(`  ${p.padEnd(26)}` + top.map(([d, v]) => `${String(d).padStart(4)}° ${v.toFixed(0).padStart(2)}%`).join("  "))
}

const A = pct(all)
console.log("\nALL IMAGES COMBINED\n")
A.forEach((v, i) => {
  if (v >= 1.5) {
    console.log(`  ${String(i * 15).padStart(3)}°–${String(i * 15 + 15).padStart(3)}°  ${"#".repeat(Math.round(v * 1.8)).padEnd(38)} ${v.toFixed(1)}%`)
  }
})

// The answer we actually care about: which hues can an accent occupy without
// competing with the work. "Clear" = under 1.2% locally and no heavy bin
// within 45 degrees.
const near = (h) =>
  A.reduce((sum, v, i) => {
    const c = i * 15 + 7.5
    const d = Math.min(Math.abs(h - c) % 360, 360 - (Math.abs(h - c) % 360))
    return d < 45 ? sum + v * (1 - d / 45) : sum
  }, 0)

console.log("\nCLEAR BANDS — corpus mass within 45° of each candidate hue\n")
for (let h = 0; h < 360; h += 15) {
  const m = near(h)
  if (m < 2) console.log(`  ${String(h).padStart(3)}°   ${m.toFixed(1)}%`)
}

const accent = 95
console.log(`\n  current --bureau-accent is ${accent}° -> ${near(accent).toFixed(1)}% mass within 45°`)
if (near(accent) > 5) {
  console.error("\n  WARNING: the accent now collides with the screenshot corpus. Re-pick it.")
}
if (skipped.length) console.error(`\n  ${skipped.length} image(s) failed to decode:\n   ` + skipped.join("\n   "))

close()
