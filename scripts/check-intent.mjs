// Regression cases for the location branch, and for the ordering that keeps
// it from doing damage.
//
// WHY THIS EXISTS. The location test is the LAST branch before the API
// fallback, and it used to fire on a bare `t.includes("where")`. That claimed
// every un-triggered question containing the word: "Where did you study?"
// answered "Toronto, Ontario, Canada." — confidently, and about the wrong
// thing.
//
// It was never as bad as it looked, and that is the other half of what this
// file pins down. matchVoiceAnswer runs BEFORE the location branch, so the
// shipped chip "Where do you see yourself in five years?" resolves on its own
// triggers and never reaches the location test. That ordering is load-bearing
// and undocumented by anything a program can check — until this.
//
// TWO ASSERTIONS: the predicate is tested directly, and the ordering is
// asserted against the source. The ordering half has to be a source assertion
// either way — it is a fact about the SHAPE of the branch chain, not about
// what any one call returns, so no amount of calling the matcher would catch
// a reorder.
//
// The predicate half was originally split out for a worse reason: the matcher
// could not be imported at all, because its transitive imports are
// extensionless and Node's resolver requires a file extension. That is fixed
// — see scripts/ts-extensionless.mjs — so importing matchVoiceAnswer here is
// now possible. It is left as-is because the predicate is the branch that
// caused the damage and testing it directly says so; if this file grows a
// third assertion, the matcher end-to-end is the one to add.
//
//   node --import ./scripts/ts-extensionless.mjs scripts/check-intent.mjs
import { readFileSync } from "fs"
import { asksLocation } from "../lib/location-intent.ts"

const problems = []

// ── 1. the predicate ──────────────────────────────────────────────────────
const CASES = [
  // must be treated as a location question
  ["Where are you based?", true],
  ["where do you live", true],
  ["What is your location?", true],
  ["Are you based in Toronto?", true],
  ["What city are you in?", true],
  ["what timezone are you in", true],
  ["where are you from", true],

  // must not be
  ["Where do you see yourself in five years?", false],
  ["Where did you study?", false],
  ["Where did you work at Super.com?", false],
  ["Where does the design system live?", false],
  ["Which projects were based on research?", false],
  ["Where should I start?", false],
]
for (const [q, want] of CASES) {
  const got = asksLocation(q.toLowerCase())
  if (got !== want) {
    problems.push(
      `asksLocation(${JSON.stringify(q)}) returned ${got}, expected ${want}` +
      (want ? "" : " — the location branch would swallow this question")
    )
  }
}

// ── 2. the ordering ───────────────────────────────────────────────────────
// The chip "Where do you see yourself in five years?" only works because
// matchVoiceAnswer runs first. Reordering these two would break it silently,
// and no unit test of either half would notice.
const src = readFileSync("lib/scripted-responses.ts", "utf8")
const voiceAt = src.indexOf("matchVoiceAnswer(t)")
const locationAt = src.indexOf("asksLocation(t)")
if (voiceAt === -1) problems.push("could not find the matchVoiceAnswer call — has it been renamed?")
if (locationAt === -1) problems.push("could not find the asksLocation call — has it been renamed?")
if (voiceAt !== -1 && locationAt !== -1 && voiceAt > locationAt) {
  problems.push(
    "ORDERING BROKEN: the location branch now runs BEFORE matchVoiceAnswer. " +
    'The shipped chip "Where do you see yourself in five years?" will answer ' +
    "with the location. Move matchVoiceAnswer back above it."
  )
}

if (problems.length) {
  console.error(`\ncheck:intent — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error("")
  process.exit(1)
}
console.log(`check:intent — PASS, ${CASES.length} predicate cases + the voice/location ordering`)
