// Screenshot verification for extracted artboards.
//
// SPLIT OUT OF canvas-artboard.mjs, and the reason is the same failure this
// module exists to catch. canvas-artboard.mjs does its work at module scope, so
// `import { verify }` ran a whole extraction as a side effect — twice, while
// proving the guard below, the imported extraction's own output buried the
// result being measured. A checking tool you cannot invoke without also running
// the thing it checks is not a checking tool.
//
// Nothing here is new. It is the same code, in a file that can be imported.
import { connect } from "./shot.mjs"
import { diffPNG } from "./pixel-diff.mjs"
import { writeFileSync, readFileSync } from "fs"
import { createServer } from "http"
import { join, extname } from "path"

// Animations are frozen BEFORE the styles are read. The brand mark's arc is a
// running CSS animation, and getComputedStyle during one returns the value of
// whatever frame is on screen — so without this the artboard captures a random
// point in a 1.6667s loop and can never match a later screenshot.
export const FREEZE = `(() => {
  const s = document.createElement("style");
  s.id = "__dcfreeze";
  s.textContent = "*,*::before,*::after{animation:none !important;transition:none !important;caret-color:transparent !important}";
  document.head.appendChild(s);
  return 1;
})()`

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

// Every element that is actually scrolling, and the gutter strip its thumb
// occupies. offsetWidth - clientWidth IS the reserved gutter, measured rather
// than assumed — it is 0 on a pane that does not overflow and does not depend
// on knowing --chat-scrollbar. Only vertical gutters: nothing on this site
// scrolls horizontally, and a horizontal strip would mask a real edge.
const SCROLLER_PROBE = `JSON.stringify([...document.querySelectorAll("*")].filter((e) => {
  const gut = e.offsetWidth - e.clientWidth;
  return gut > 0 && e.scrollHeight > e.clientHeight + 1;
}).map((e) => {
  const b = e.getBoundingClientRect();
  const gut = e.offsetWidth - e.clientWidth;
  const bw = parseFloat(getComputedStyle(e).borderRightWidth) || 0;
  return { x: b.right - gut - bw, y: b.y, w: gut, h: b.height };
}))`

async function shoot(cdp, url, setup) {
  // Page.navigate rather than shot.mjs's goto: goto preflights that the origin
  // is a live `next dev`, which is right for the app and wrong for the static
  // server holding the artboard. The app's own liveness is already proven —
  // the extraction just read it.
  await cdp.send("Page.navigate", { url })
  await cdp.sleep(1600)
  // The app side only. The artboard is a static reproduction that already has
  // the surface baked into its markup — running a pane-swap click against it
  // would find no handler and, if it somehow found one, would change the very
  // thing being compared.
  if (setup?.script) {
    await cdp.evalJS(setup.script)
    await cdp.sleep(setup.settle)
  }
  // Settle rather than tolerate: wait for the fonts, then stop every animation
  // and hide the caret, so nothing time-dependent is in either frame.
  await cdp.evalJS(`document.fonts.ready.then(() => 1)`)
  await cdp.evalJS(FREEZE)
  await cdp.sleep(400)
  const imgs = JSON.parse(await cdp.evalJS(IMG_PROBE))
  const scrollers = JSON.parse(await cdp.evalJS(SCROLLER_PROBE))
  // How tall the thing being photographed actually is. A screenshot cannot
  // report what it failed to include, so this is measured separately and
  // checked against the frame before the pixels are ever compared.
  const contentH = Number(await cdp.evalJS(`(() => {
    let d = 0
    for (const e of document.querySelectorAll("*")) {
      if (e.scrollHeight > e.clientHeight + 1) d = Math.max(d, e.scrollHeight)
    }
    return Math.max(d, document.documentElement.scrollHeight)
  })()`))
  const r = await cdp.send("Page.captureScreenshot", { format: "png" })
  return { png: Buffer.from(r.result.data, "base64"), imgs, scrollers, contentH }
}

export async function verify({ dir, route, w, h, masks: masksIn = [], label = "", setup = null, fold = false }) {
  let masks = masksIn
  const { srv, port } = await serve(dir)
  writeFileSync(join(dir, "__preview.html"), previewHTML(readFileSync(join(dir, "Main.dc.html"), "utf8")))
  const cdp = await connect()
  await cdp.send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: false })
  // Same media as the extraction, for the same reason --setup runs here: a
  // board captured under reduced motion has to be diffed against an app under
  // reduced motion, or the stream is still mid-flight on one side only.
  if (setup?.media) await cdp.send("Emulation.setEmulatedMedia", setup.media)
  const app = await shoot(cdp, route, setup)
  const art = await shoot(cdp, `http://127.0.0.1:${port}/__preview.html`)
  await cdp.close()
  // close() stops accepting; Chrome's keep-alive sockets would hold the handle
  // and the process open long after the verdict was printed. The failing path
  // exited explicitly and hid this — the passing path just hung.
  srv.closeAllConnections?.()
  srv.close()
  srv.unref?.()
  const appPng = app.png, artPng = art.png

  // ── The height guard ─────────────────────────────────────────────────────
  // BEFORE ANY PIXELS ARE COMPARED, because this is the failure a pixel
  // comparison structurally cannot see. Both sides are photographed through
  // one window; anything below it is absent from both images and therefore
  // agrees perfectly. The vibe board passed at 0.0000% with nine of sixteen
  // blocks deleted, and it would have passed with all sixteen gone.
  //
  // So the frame is asserted against the content before the diff is trusted.
  // A fold board waives this deliberately and says so in its own output.
  const headroom = Math.max(app.contentH, art.contentH) - h
  const gname = label ? `verify (${label})` : "verify"
  if (fold) {
    console.log(`${gname}: fold board — frame ${w}x${h}, pane ${app.contentH}px, ` +
      `${Math.max(0, headroom)}px below the fold is NOT covered by this check`)
  } else if (headroom > 1) {
    console.error(`${gname}: FAIL — the frame is shorter than the content.`)
    console.error(`    frame ${w}x${h}, app pane ${app.contentH}px, artboard ${art.contentH}px`)
    console.error(`    ${headroom}px would sit below the frame, where a pixel diff cannot see it.`)
    console.error(`    Re-run without --h pinned (the frame is derived), or pass --fold to`)
    console.error(`    declare this a deliberate one-viewport board.`)
    return { ok: false, d: null }
  }

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

  // ── Scrollbar gutters: the same argument as image interiors ──────────────
  // A scrolling pane in the app paints a thumb. The artboard is a static box
  // with explicit widths and nothing to scroll, so it never can — and the
  // strip where the app's thumb sits reads as a solid column of difference.
  // On the deck that was 8x624 of the 2523 differing pixels, the whole failure.
  //
  // This is destination chrome, not content. The app draws the thumb; a
  // canvas, a PDF export or a print will each draw their own or none. What
  // masking could hide is the gutter's WIDTH and POSITION, and those are
  // asserted from the app's own geometry rather than assumed — the mask is
  // exactly the reserved gutter of each scroller, measured, and nothing wider.
  const gutters = app.scrollers || []
  for (const g of gutters) {
    masks = masks.concat([[Math.round(g.x), Math.round(g.y),
                           Math.round(g.w), Math.round(g.h)]])
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
  console.log(`  ${art.imgs.length} image interior(s) + ${gutters.length} scrollbar gutter(s) masked, ` +
    `${d.maskedPixels} px excluded — presence, load state, position and size asserted instead; ` +
    `1px edges still compared`)
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

