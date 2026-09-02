// Fails if the chip set and the answer set have drifted apart.
//
// Chips are DERIVED from the answers (lib/chips.ts) rather than listed, so
// there is no second file to forget. This gate closes the two gaps that
// derivation alone cannot:
//
//   1. no-broken-chip   — every chip label, run through the REAL
//                         buildResponse, returns non-null AND lands on the
//                         answer that declared it.
//   2. no-unrouted-answer — every answer either has a chip or says in
//                         writing why it does not.
//
// Rule 1 is not a formality. Two labels that read as obviously correct were
// wrong when this was written: "What design tools do you use?" fell through
// to the API (the trigger is `what tools`, and the word *design* breaks the
// substring), and "How do you work with PMs and engineers?" returned the
// HANDOFF answer, because `engineer` is tested before `pms`. Both would have
// shipped a chip whose label promised one answer and delivered another.
// Neither is visible by reading — only by running the matcher.
//
// Rule 2 is the one that makes the system grow. Writing a new answer in
// voice.md and wiring it into VOICE_ANSWERS is not enough to make it
// reachable; without this rule it would sit there answering only for people
// who guessed the question. Now the build says so.
//
//   node scripts/check-chips.mjs           report, non-zero exit on failure
//   node scripts/check-chips.mjs --list    one finding per line
import { registerHooks } from "node:module"
import { pathToFileURL } from "node:url"

// The answers are TypeScript. Node strips the types with
// --experimental-strip-types (same mechanism build-context.mjs already uses)
// but still needs file extensions and the `@/` alias, which the source does
// not write. Resolve them here rather than adding a bundler.
const ROOT = pathToFileURL(process.cwd() + "/").href
registerHooks({
  resolve(specifier, context, nextResolve) {
    const attempt = (base) => {
      for (const ext of ["", ".ts", ".tsx", "/index.ts"]) {
        try {
          return nextResolve(base + ext, context)
        } catch {}
      }
      return null
    }
    if (specifier.startsWith("@/")) {
      const hit = attempt(ROOT + specifier.slice(2))
      if (hit) return hit
    }
    return attempt(specifier) ?? nextResolve(specifier, context)
  },
})

const { buildResponse, SCRIPTED_TOPICS } = await import("../lib/scripted-responses.ts")
const { VOICE_ANSWERS } = await import("../lib/voice-answers.ts")
const { frontDoorChips, rotationPool, routable } = await import("../lib/chips.ts")

// ── Identifying what a response actually IS ──────────────────────────────
// Voice answers identify themselves: the first block is the entry's own
// first paragraph, and check-voice.mjs already asserts that paragraph is
// verbatim from voice.md. Scripted branches have no id at runtime, so each
// is fingerprinted by calling buildResponse with a bare trigger the branch
// itself declares — comparing against a copy of the expected prose here
// would duplicate content this repo deliberately keeps in one place.
//
// `stakeholder` was here and is not any more. That branch was retired: the
// triggers `stakeholder` and `pushback` now reach the difficult-stakeholders
// VOICE_ANSWERS entry, which is Edwin's own wording and is checked against
// voice.md. Leaving the probe behind made the self-test fail correctly —
// probing "stakeholder" classified as voice:difficult-stakeholders, which is
// the new truth — so the probe had to go with the branch it fingerprinted.
// `walk-through` was here too, and went the same way as `stakeholder`: the
// branch it fingerprinted no longer exists, so the probe would classify
// "walk me through" as an API fallthrough and fail the self-test correctly.
const SCRIPTED_PROBES = {
  downtime: "downtime",
  resume: "resume",
  deck: "the deck",
  location: "where are you based",
}

const firstText = (blocks) => (blocks?.find((b) => b.kind === "text")?.text ?? "").slice(0, 400)

function classify(question) {
  const { response, projectSlug } = buildResponse(question)
  if (!response) return { kind: "api", label: "falls through to the API" }
  if (projectSlug) return { kind: "project", id: projectSlug, label: `project:${projectSlug}` }
  const head = firstText(response)
  const voice = VOICE_ANSWERS.find((a) => head.startsWith(a.paragraphs[0].slice(0, 120)))
  if (voice) return { kind: "voice", id: voice.id, label: `voice:${voice.id}` }
  for (const [id, probe] of Object.entries(SCRIPTED_PROBES)) {
    if (firstText(buildResponse(probe).response) === head) {
      return { kind: "scripted", id, label: `scripted:${id}` }
    }
  }
  return { kind: "unknown", label: "unrecognised response" }
}

// ── Rules ────────────────────────────────────────────────────────────────
function check() {
  const problems = []
  const seen = new Set()

  // 1 — every chip resolves, and to its OWN answer.
  const chips = [
    ...frontDoorChips().map((c) => ({ ...c, where: "front door" })),
    ...rotationPool().map((c) => ({ ...c, where: "rotation pool" })),
  ]
  for (const c of chips) {
    seen.add(c.id)
    const got = classify(c.label)
    if (got.kind === "api") {
      problems.push({
        rule: "no-broken-chip",
        detail: `"${c.label}" (${c.where}) falls through to the API`,
        why: "A chip must resolve to a scripted response or a VOICE_ANSWERS entry. The API answers from the reference doc or hedges about what is missing; neither is something a chip may promise.",
      })
    } else if (got.id !== c.id) {
      problems.push({
        rule: "no-broken-chip",
        detail: `"${c.label}" is declared on "${c.id}" but resolves to ${got.label}`,
        why: "The label matches an earlier trigger than its own. Reword it, or move the entry ahead of the one intercepting it.",
      })
    }
  }

  // 2 — every answer is routed or explicitly excluded.
  for (const r of routable()) {
    if (r.chip) {
      if (!r.placement) {
        problems.push({
          rule: "no-unrouted-answer",
          detail: `"${r.id}" declares a chip but no placement`,
          why: 'Set placement to "front-door" (with chipOrder) or "rotation".',
        })
      }
      continue
    }
    if (!r.noChip || !r.noChip.trim()) {
      problems.push({
        rule: "no-unrouted-answer",
        detail: `"${r.id}" has no chip and no noChip reason`,
        why: "An answer nobody can reach by clicking is reachable only by guessing the question. Give it `chip` + `placement`, or state in `noChip` why it does not need one.",
      })
    }
  }

  // Front-door ordering must be total, or the layout is non-deterministic.
  const orders = frontDoorChips().map((c) => routable().find((r) => r.id === c.id)?.chipOrder)
  if (new Set(orders).size !== orders.length || orders.some((o) => o == null)) {
    problems.push({
      rule: "no-unrouted-answer",
      detail: `front-door chipOrder values are not unique and complete: [${orders.join(", ")}]`,
      why: "Front-door chips sort by chipOrder; a duplicate or missing value makes the order depend on array position.",
    })
  }
  return problems
}

// ── Positive control ─────────────────────────────────────────────────────
// A clean pass means nothing if the matcher silently broke, so both rules
// are run against inputs that MUST trip them.
function selfTest() {
  const bad = []
  // Rule 1: a label known to hit the wrong entry, and one known to miss.
  const intercepted = classify("How do you work with PMs and engineers?")
  if (intercepted.id !== "engineers")
    bad.push(`control: expected "PMs and engineers" to be intercepted by voice:engineers, got ${intercepted.label}`)
  const missed = classify("What design tools do you use?")
  if (missed.kind !== "api")
    bad.push(`control: expected "What design tools do you use?" to fall through, got ${missed.label}`)
  // Rule 1 must also confirm a GOOD label lands correctly.
  const good = classify("What tools do you use?")
  if (good.id !== "tools")
    bad.push(`control: expected "What tools do you use?" to be voice:tools, got ${good.label}`)
  // Classifier must tell scripted branches apart rather than lumping them.
  for (const id of Object.keys(SCRIPTED_PROBES)) {
    const got = classify(SCRIPTED_PROBES[id])
    if (got.id !== id) bad.push(`control: probe for scripted:${id} classified as ${got.label}`)
  }
  return bad
}

const controlProblems = selfTest()
if (controlProblems.length) {
  console.error("SELF-TEST FAILED — refusing to report a result:\n")
  for (const p of controlProblems) console.error("  " + p)
  process.exit(2)
}

const problems = check()
const RULES = {
  "no-broken-chip": "Chip does not resolve to the answer that declared it",
  "no-unrouted-answer": "Answer has neither a chip nor a stated reason for not having one",
}

if (process.argv.includes("--list")) {
  for (const p of problems) console.log(`${p.rule}\t${p.detail}`)
} else {
  const fd = frontDoorChips()
  console.log("self-test PASS — both rules fire on known-bad input, and land correctly on known-good")
  console.log(
    `${routable().length} answer(s): ${fd.length} on the front door, ` +
      `${rotationPool().length} in rotation, ` +
      `${routable().filter((r) => r.noChip).length} deliberately unrouted\n`
  )
  for (const [rule, label] of Object.entries(RULES)) {
    const hits = problems.filter((p) => p.rule === rule)
    console.log(`── ${rule} — ${label}: ${hits.length}`)
    for (const h of hits) console.log(`   ${h.detail}\n       ${h.why}`)
    if (!hits.length) console.log("   (none)")
    console.log()
  }
  console.log(`TOTAL: ${problems.length} problem(s)`)
}
process.exit(problems.length ? 1 : 0)
