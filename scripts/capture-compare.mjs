// Capture the same three surfaces at the same two viewports, for comparing
// two finished visual systems rather than two directions.
//
//   node scripts/capture-compare.mjs .compare/bureau-1d
//   node scripts/capture-compare.mjs .compare/impeccable
//
// Same routes, same states, same order, so the pairs are directly comparable:
//   landing pane · a project conversation (Retail Banking) · the deck
//   desktop 1440x1000 @1x · mobile 380x820 @2x
//
// Uses settleStream from shot.mjs rather than a fixed wait — a project reveal
// is 13-15 blocks at 400-900ms each, so a sleep either races or wastes time.
// Requires the dev server on :3200 and Chrome on :9222.
import { connect } from "./shot.mjs"
import { writeFileSync } from "fs"
const OUT = process.argv[2]
const { send, evalJS, sleep, goto, settleStream, close } = await connect()
const VIEWPORTS = [[1440,1000,1,"desktop"],[380,820,2,"mobile"]]
for (const [w,h,dpr,vp] of VIEWPORTS) {
  await send("Emulation.setDeviceMetricsOverride",{width:w,height:h,deviceScaleFactor:dpr,mobile:w<500})
  // 1 — landing pane
  await goto("http://localhost:3200/")
  let r = await send("Page.captureScreenshot",{format:"png"})
  writeFileSync(`${OUT}/landing-${vp}.png`, Buffer.from(r.result.data,"base64"))
  // 2 — a project conversation (same project, same state)
  if (w >= 500) {
    await evalJS(`[...document.querySelectorAll('.rail-item')].find(x=>x.textContent.includes('Retail Banking')).click()`)
  } else {
    await evalJS(`document.querySelector('.rail-sheet-close').click()`); await sleep(500)
    await evalJS(`[...document.querySelectorAll('.rail-item')].find(x=>x.textContent.includes('Retail Banking')).click()`)
  }
  await settleStream()
  r = await send("Page.captureScreenshot",{format:"png"})
  writeFileSync(`${OUT}/conversation-${vp}.png`, Buffer.from(r.result.data,"base64"))
  // 3 — the deck
  await goto("http://localhost:3200/case-study/meridian-deck", 3000)
  r = await send("Page.captureScreenshot",{format:"png"})
  writeFileSync(`${OUT}/deck-${vp}.png`, Buffer.from(r.result.data,"base64"))
  console.log(`  ${vp}: landing, conversation, deck`)
}
close()
