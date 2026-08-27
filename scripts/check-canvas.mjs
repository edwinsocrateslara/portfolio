// Checks a board directory before it is seeded into a canvas.
//
// WHY THIS FILE AND NOT seed-canvas.mjs. The obvious home for this is the
// seeder, and the seeder is not ours: it ships inside a bundled skill under
// /private/tmp, is replaced whenever the skill version moves, and is not in
// this repo. A guard written there would be gone the next time the skill
// updated, which is the opposite of what a guard is for. So it lives here, in
// the repo, versioned with the thing it protects — and it runs BEFORE seeding
// rather than inside it.
//
// WHAT IT CATCHES. Three failures, all of which have actually happened:
//
//   1. A fresh Main.dc.html seeded next to a Legend.dc.html left out of the
//      artboard list. canvas-artboard.mjs now guarantees the legend on disk is
//      current; it cannot guarantee anyone puts it on the canvas.
//   2. canvas.json's frame not matching the frame the extractor produced. The
//      résumé board carried a height 562px short of its own content while the
//      board beside it was correct, because that number was typed by hand from
//      arithmetic and nothing ever compared it to anything.
//   3. A fold board and a fitted board confused for one another. They look
//      identical in a directory listing and they mean opposite things.
//
//   node scripts/check-canvas.mjs <dir> [<dir> ...]
//
// Exits non-zero on any problem, so it can gate a seed in a shell chain.
import { readFileSync, existsSync } from "fs"
import { join } from "path"

const dirs = process.argv.slice(2)
if (!dirs.length) {
  console.error("usage: node scripts/check-canvas.mjs <board-dir> [...]")
  process.exit(2)
}

let problems = 0
for (const dir of dirs) {
  const say = (m) => { console.error(`  ${m}`); problems++ }
  console.log(`\n${dir}`)

  if (!existsSync(join(dir, "Main.dc.html"))) { say("FAIL — no Main.dc.html"); continue }

  let canvas = null
  try { canvas = JSON.parse(readFileSync(join(dir, "canvas.json"), "utf8")) }
  catch { say("FAIL — canvas.json is missing or does not parse"); continue }
  const listed = new Set((canvas.artboards ?? []).map((a) => a.file))

  // 1 ── the legend is on disk but off the canvas
  if (existsSync(join(dir, "Legend.dc.html")) && !listed.has("Legend.dc.html")) {
    say("FAIL — Legend.dc.html is in the directory but not in canvas.json. The " +
        "extractor regenerates it with every board; leaving it off the canvas " +
        "throws away the only thing that keeps the token values honest.")
  }

  // 2 ── the declared frame against the frame that was actually produced
  if (!existsSync(join(dir, "__frame.json"))) {
    say("WARN — no __frame.json; this board predates the derived frame and its " +
        "canvas.json height cannot be checked. Re-extract it.")
  } else {
    const f = JSON.parse(readFileSync(join(dir, "__frame.json"), "utf8"))
    const entry = (canvas.artboards ?? []).find((a) => a.file === "Main.dc.html")
    if (!entry) say("FAIL — Main.dc.html is not listed in canvas.json")
    else if (entry.w !== f.w || entry.h !== f.h) {
      say(`FAIL — canvas.json declares ${entry.w}x${entry.h} for Main.dc.html, ` +
          `but the extractor produced ${f.w}x${f.h}. The frame is derived, not typed: ` +
          `copy it from __frame.json.`)
    }
    // 3 ── say which kind of board this is, every time, so the two cannot blur
    console.log(`  ${f.fold ? "FOLD" : "FITTED"} board — ${f.w}x${f.h}` +
      (f.fold ? "  (one viewport; content below it is deliberately not covered by verify)"
              : "  (whole pane inside the frame)"))
  }
}

console.log(problems === 0 ? "\nOK — every board is seedable" : `\n${problems} problem(s)`)
process.exit(problems === 0 ? 0 : 1)
