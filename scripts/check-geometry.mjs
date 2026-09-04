// Two boxes that must not overlap. A tool, not a gate.
//
// ── WHY THIS IS NOT IN THE BUILD, AND MUST NOT BE WIRED INTO ONE ──────────
//
// Every other check in this repo is STATIC and OFFLINE: check:design reads
// source, check:docs reads a file, check:render and check:intent import a pure
// function. They run anywhere, in any order, with nothing else on.
//
// This one needs a dev server on :3200 and Chrome on :9222. That is a
// different kind of dependency, and an environment-dependent gate in a build
// chain has one predictable ending: it goes flaky on someone's machine or in
// CI, and it gets commented out. Then the repo has a check that nobody runs
// AND nobody notices is gone — worse than not having it, because the name
// still appears in package.json and implies coverage.
//
// So it has the same status as check-content-frozen.mjs: a tool you run
// deliberately, when you have changed layout and want to know. Its absence
// from check:sources / check:design / npm run build is a DECISION, not an
// oversight. Please do not wire it in.
//
//   npm run dev -- -p 3200
//   chrome --remote-debugging-port=9222          (see shot.mjs)
//   node scripts/check-geometry.mjs
//
// ── WHAT IT ASSERTS ───────────────────────────────────────────────────────
//
// One row per pair: (surface, selectorA, selectorB, relation). Adding a case
// costs a row. `no-overlap` is the only relation implemented; the shape is
// there so `contains` or `above` can join it without restructuring.
//
// SCROLL POSITION IS NOT A FAILURE, and this is the subtlety that would
// otherwise make the tool cry wolf. A scroller reserves room for the dock with
// bottom padding; content is *reachable*, not *never underneath*. Measured on
// a grown composer: 44px of chips sit under the dock as-is and 0px after
// scrolling to the bottom — the reservation is correct in both. So each row
// scrolls its scroller to the end before measuring, which is the state the
// reservation actually promises.
import { connect } from "./shot.mjs"

// ── SELECTED BY IDENTITY, NOT BY POSITION ────────────────────────────────
// These were `RAILS[1]` for Meridian, `RAILS[7]` for the vibe project and
// `DOCS[2]` for About — array indices into whatever order the rail happens to
// render. Inserting or reordering a project would have pointed a case named
// "meridian-reveal" at a different surface and still gone green, which is the
// worst kind of pass: a reassuring name over an unverified assertion.
//
// sidebar.tsx now carries data-project-slug and data-pane. The helpers below
// resolve by those, and every surface ASSERTS what it landed on after clicking
// rather than trusting that the click did what it said.
const bySlug = (slug) =>
  `document.querySelector('.rail-item[data-project-slug=${JSON.stringify(slug)}]')`
const byPane = (pane) => `document.querySelector('.rail-doc[data-pane=${JSON.stringify(pane)}]')`
const CHIPS = `[...document.querySelectorAll('.chip')].filter(e=>e.getBoundingClientRect().width>0)`

/** Surfaces: how to get there from a fresh load, and how long to settle. */
const SURFACES = {
  "front-door": { open: null, settle: 0 },
  "home-after-asking": { open: `${CHIPS}[0].click()`, settle: 6500 },
  "meridian-reveal": {
    open: `${bySlug("retail-banking")}.click()`,
    settle: 4200,
    // Asserted AFTER the click. A selector that found nothing would otherwise
    // throw, and a selector that found the wrong row would not.
    expect: `${bySlug("retail-banking")}.dataset.active === "true"`,
  },
  "vibe-reveal": {
    open: `${bySlug("futurefit-ideas-dashboard")}.click()`,
    settle: 4200,
    expect: `${bySlug("futurefit-ideas-dashboard")}.dataset.active === "true"`,
  },
  about: {
    open: `${byPane("about")}.click()`,
    settle: 2600,
    expect: `!!document.querySelector('.about')`,
  },
}

/** (surface, a, b, relation). `a` and `b` are CSS selectors; the LAST match of
 *  `a` and the first of `b` are compared, which is what "the last chip must
 *  clear the dock" means. `skipIfMissing` keeps a row from failing on a
 *  surface that legitimately has no such element. */
const CASES = [
  { surface: "front-door", a: ".chip", b: ".pane-dock", rel: "no-overlap", skipIfMissing: true },
  { surface: "home-after-asking", a: ".chip", b: ".pane-dock", rel: "no-overlap" },
  { surface: "meridian-reveal", a: ".chip", b: ".pane-dock", rel: "no-overlap" },
  { surface: "vibe-reveal", a: ".chip", b: ".pane-dock", rel: "no-overlap" },
  { surface: "about", a: ".chip", b: ".pane-dock", rel: "no-overlap", skipIfMissing: true },
]

// ── LISTED, NOT BUILT ─────────────────────────────────────────────────────
// Three cases were considered and are not rows, each for a reason that is
// about the assertion rather than the effort:
//
//   SEND vs the input's text. Written as a row first and it FAILED at 34px on
//   both widths — correctly, and uselessly. The button is DELIBERATELY inside
//   the textarea's box: it is absolutely positioned over the right gutter, and
//   .chat-input-field reserves that gutter with
//   `padding-right: calc(var(--send-size) + var(--send-inset) * 2)`.
//   `no-overlap` between the two BOXES is the wrong question. The right one is
//   whether the button covers the TEXT, and a text run inside a textarea has
//   no box to query — it needs a Range over the value, or a screenshot ink
//   comparison. A different relation, not another row.
//
//   The rail's active bar vs its row text. The bar is a 2px `border-left` on
//   the row, not an element, so there is nothing to select. It would need a
//   relation that reads a computed border width against a padding, which is
//   arithmetic on styles rather than a box intersection.
//
//   The lightbox close button vs the image. This one IS a genuine box-vs-box
//   case and would work as a row — but reaching it needs interaction the
//   SURFACES table cannot currently express: open a reveal, wait for the
//   transcript, click an image, wait for the lightbox transition. That is a
//   multi-step setup, and adding it means giving surfaces a step list rather
//   than one `open` string. Worth doing when a second such case appears.

const WIDTHS = [
  [1440, 1000],
  [380, 800],
]

const MEASURE = (a, b) => `(() => {
  const as = [...document.querySelectorAll(${JSON.stringify(a)})].filter(e => e.getBoundingClientRect().width > 0)
  const bs = [...document.querySelectorAll(${JSON.stringify(b)})].filter(e => e.getBoundingClientRect().width > 0)
  if (!as.length || !bs.length) return JSON.stringify({ missing: !as.length ? ${JSON.stringify(a)} : ${JSON.stringify(b)} })
  const A = as[as.length - 1].getBoundingClientRect(), B = bs[0].getBoundingClientRect()
  const x = Math.min(A.right, B.right) - Math.max(A.left, B.left)
  const y = Math.min(A.bottom, B.bottom) - Math.max(A.top, B.top)
  return JSON.stringify({
    a: [Math.round(A.top), Math.round(A.bottom)],
    b: [Math.round(B.top), Math.round(B.bottom)],
    overlap: x > 0 && y > 0 ? Math.round(y) : 0,
  })
})()`

const { send, evalJS, sleep, close } = await connect()
const problems = []
let ran = 0
let skipped = 0

for (const [W, H] of WIDTHS) {
  for (const c of CASES) {
    const s = SURFACES[c.surface]
    await send("Emulation.setDeviceMetricsOverride", { width: W, height: H, deviceScaleFactor: 1, mobile: W < 500 })
    await send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] })
    await send("Page.navigate", { url: "http://localhost:3200/" })
    await sleep(4600)

    // The mobile rail lives behind a sheet; open it to reach a rail row, then
    // let the selection close it.
    if (W < 500 && s.open && /rail-(item|doc)/.test(s.open)) {
      await evalJS(`(()=>{const o=[...document.querySelectorAll('.rail-sheet-close')].filter(e=>e.getBoundingClientRect().width>0)
        ;if(o.length&&o[0].getAttribute('aria-expanded')!=='true')o[0].click();return 1})()`)
      await sleep(800)
    }
    if (s.open) {
      await evalJS(`(()=>{${s.open};return 1})()`)
      await sleep(s.settle)
    }

    // THE SURFACE IS THE ONE THE CASE NAMES, checked rather than assumed. A
    // geometry result is only worth reading if it came from the screen the row
    // claims to be about.
    if (s.expect) {
      const landed = await evalJS(`(()=>{ try { return !!(${s.expect}) } catch { return false } })()`)
      if (!landed) {
        problems.push(`${String(W).padStart(4)} ${c.surface} — did not open: ${s.expect}`)
        continue
      }
    }

    // Reachability, not visibility: see the note at the top.
    await evalJS(`(()=>{const sc=document.querySelector('.pane-scroll');if(sc)sc.scrollTop=sc.scrollHeight;return 1})()`)
    await sleep(600)

    const res = JSON.parse(await evalJS(MEASURE(c.a, c.b)))
    const label = `${String(W).padStart(4)} ${c.surface.padEnd(18)} ${c.a} vs ${c.b}`

    if (res.missing) {
      if (c.skipIfMissing) { skipped++; console.log(`  skip  ${label}  (no ${res.missing})`); continue }
      problems.push(`${label} — ${res.missing} not found`)
      continue
    }
    ran++
    if (res.overlap > 0) {
      problems.push(`${label} — OVERLAP ${res.overlap}px  (a ${res.a.join("–")}, b ${res.b.join("–")})`)
      console.log(`  FAIL  ${label}  overlap ${res.overlap}px`)
    } else {
      console.log(`  ok    ${label}`)
    }
  }
}

await close()
if (problems.length) {
  console.error(`\ncheck:geometry — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error("")
  process.exit(1)
}
console.log(`\ncheck:geometry — PASS, ${ran} assertion(s), ${skipped} skipped`)
process.exit(0)
