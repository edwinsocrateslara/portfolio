// Fails if the content layer has changed relative to a baseline ref.
//
// ⚠ NOT WIRED INTO THE BUILD ON main, DELIBERATELY. Compared against main FROM
// main it is self-referential and passes trivially, and a gate that always
// passes is worse than no gate: it reads as protection and is not. This is a
// TOOL. It becomes meaningful only when pointed at a fixed baseline:
//
//     node scripts/check-content-frozen.mjs --base <ref>
//
// Use it when work runs on a branch that must not touch the content layer —
// a visual experiment, a dependency bump, an agent-driven refactor — by
// pointing it at the commit that branch started from, and wire it into that
// branch's build chain rather than this one's.
//
// It was written for the experiment/impeccable branch. A visual experiment is
// allowed to rewrite presentation; it is not allowed to touch the files that
// encode where copy comes from. Those carry a sourcing contract — project copy
// authored in lib/projects.ts and corrected there, one role field following
// resume.txt, alt text written for screen readers, a generated system-prompt
// section — and none of that survives being "improved" by a tool reasoning
// about visual quality.
//
// Why this and not the tool's own ignore config: `detector.ignoreFiles` in
// .impeccable/config.json suppresses FINDINGS. It does not restrict WRITES.
// The refine commands are agent-driven, not a linter, and there is no
// documented write-scope setting — so configuring ignores would give the
// feeling of a boundary without the boundary.
//
// Why this and not check:sources alone: check:sources catches DRIFT between
// projects.ts and the generated prompt. It cannot catch a SELF-CONSISTENT
// rewrite — edit projects.ts, regenerate edwin-context.md, both agree, the
// check passes and the copy is silently different. Comparing bytes against a
// fixed baseline closes that.
//
//   node scripts/check-content-frozen.mjs              compare against main
//   node scripts/check-content-frozen.mjs --base <ref> compare against <ref>
import { execFileSync } from "child_process"
import { readFileSync, existsSync } from "fs"

const BASE = (() => {
  const i = process.argv.indexOf("--base")
  return i === -1 ? "main" : process.argv[i + 1]
})()

// Every path here is content, not presentation. Adding one is a deliberate
// widening of the boundary; removing one is a deliberate narrowing.
const FROZEN = [
  "lib/projects.ts",
  "lib/edwin-context.md",
  "lib/scripted-responses.ts",
  "lib/voice-answers.ts",
  "scripts/build-context.mjs",
  "scripts/check-voice.mjs",
  // WIDENED when the skills list became six labelled bands in resume.txt.
  //
  // lib/sources/ was already frozen, so the résumé's BYTES were safe. Its
  // STRUCTURE was not: resume.txt now carries a format — "Label:" then a
  // comma-separated run, commas inside brackets not being separators — and
  // lib/resume.ts is the only thing that knows it. Rewrite the parser and the
  // page renders different content from a byte-identical source. That is the
  // same hole the note above describes for check:sources, one layer down: a
  // self-consistent change on both sides of a contract that no byte comparison
  // sees.
  //
  // This is the parser only. Nothing here is presentation — the Resume pane,
  // its CSS and its animation are all outside the boundary, so a visual
  // experiment still has everything it needs.
  "lib/resume.ts",
]
// Whole directories, frozen recursively.
const FROZEN_DIRS = ["lib/sources"]

function git(...args) {
  return execFileSync("git", args, { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 })
}

// Same, but a non-zero exit is an expected answer ("not in the baseline")
// rather than an error, so git's own stderr must not leak into the report.
function gitQuiet(...args) {
  return execFileSync("git", args, {
    encoding: "buffer", maxBuffer: 64 * 1024 * 1024, stdio: ["ignore", "pipe", "ignore"],
  })
}

function baseBlob(path) {
  try {
    return gitQuiet("show", `${BASE}:${path}`)
  } catch {
    return null // absent in the baseline
  }
}

function filesInBaseDir(dir) {
  try {
    return gitQuiet("ls-tree", "-r", "--name-only", BASE, "--", dir)
      .toString("utf8").split("\n").filter(Boolean)
  } catch {
    return []
  }
}

// Resolve the baseline once, so a missing ref fails loudly rather than
// silently comparing against nothing.
try {
  git("rev-parse", "--verify", `${BASE}^{commit}`)
} catch {
  console.error(`Baseline ref "${BASE}" does not resolve. Pass --base <ref>.`)
  process.exit(2)
}

const targets = [...FROZEN]
for (const dir of FROZEN_DIRS) {
  const inBase = filesInBaseDir(dir)
  const inWork = existsSync(dir)
    ? git("ls-files", "--others", "--cached", "--exclude-standard", "--", dir)
        .toString("utf8").split("\n").filter(Boolean)
    : []
  for (const f of new Set([...inBase, ...inWork])) targets.push(f)
}

const problems = []
for (const path of targets) {
  const base = baseBlob(path)
  const here = existsSync(path) ? readFileSync(path) : null

  if (base === null && here === null) continue
  if (base === null) { problems.push([path, `added — not present in ${BASE}`]); continue }
  if (here === null) { problems.push([path, `DELETED — present in ${BASE}`]); continue }
  if (!base.equals(here)) {
    problems.push([path, `MODIFIED — ${base.length} bytes in ${BASE}, ${here.length} here`])
  }
}

console.log(`content freeze: ${targets.length} path(s) compared against ${BASE}`)
if (problems.length === 0) {
  console.log("PASS — the content layer is byte-identical to the baseline")
  process.exit(0)
}

console.error(`\nFAIL — ${problems.length} frozen path(s) changed:\n`)
for (const [p, why] of problems) console.error(`  ${p}\n      ${why}`)
console.error(
  `\nThese files encode the content-sourcing contract and are frozen for the\n` +
    `duration of this experiment. If a change here is genuinely intended, make\n` +
    `it on main and rebase, or remove the path from FROZEN in this script —\n` +
    `deliberately, in a commit somebody reviews.`
)
process.exit(1)
