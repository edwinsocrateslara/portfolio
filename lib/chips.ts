import { VOICE_ANSWERS } from "./voice-answers"
import { SCRIPTED_TOPICS } from "./scripted-responses"

// The chip set, DERIVED from the answers rather than listed separately.
//
// There is no file anywhere that enumerates chip labels. A label exists
// because an answer declared one, next to itself, and it disappears when
// that answer does. The alternative — a labels array in one file and the
// answers in another — drifts silently: nothing in a build can tell that a
// newly written answer was never routed, or that a chip points at an answer
// somebody deleted. `npm run check:chips` closes both directions.
//
// Growth is the design goal here. Adding an answer to voice.md and giving it
// `placement: "rotation"` puts it in circulation with no edit to this file
// and no edit to any component.

export interface ChipRoute {
  /** The VOICE_ANSWERS or SCRIPTED_TOPICS id this chip resolves to. */
  id: string
  /** The visitor-facing label. Matches its own matcher when typed. */
  label: string
}

interface Routable {
  id: string
  chip?: string
  placement?: "front-door" | "rotation"
  chipOrder?: number
  noChip?: string
}

/** Both tables, as one list. Order is scripted-then-voice, by declaration. */
export function routable(): Routable[] {
  return [...SCRIPTED_TOPICS, ...VOICE_ANSWERS]
}

// Derived lazily, not as module-level consts. scripted-responses.ts imports
// rotationFor() from here and this module imports SCRIPTED_TOPICS from there,
// which is a cycle — legal in ESM, but a top-level `const` evaluated during
// the cycle can read a binding that is still in its temporal dead zone.
// Computing on first call moves the read to after both modules have finished
// loading, where it is always safe. Cached so it stays one pass.
let frontDoorCache: ChipRoute[] | null = null
let rotationCache: ChipRoute[] | null = null

/**
 * The front door. Ordered by the explicit `chipOrder` each answer declares —
 * NOT by declaration order, because VOICE_ANSWERS is sequenced by trigger
 * precedence ("narrower topics come before broader ones") and reordering it
 * to arrange chips would change which answer a question matches.
 */
export function frontDoorChips(): ChipRoute[] {
  if (!frontDoorCache) {
    frontDoorCache = routable()
      .filter((r) => r.placement === "front-door" && r.chip)
      .sort((a, b) => (a.chipOrder ?? 99) - (b.chipOrder ?? 99))
      .map((r) => ({ id: r.id, label: r.chip! }))
  }
  return frontDoorCache
}

/** The pool every non-front-door surface draws from, in declaration order. */
export function rotationPool(): ChipRoute[] {
  if (!rotationCache) {
    rotationCache = routable()
      .filter((r) => r.placement === "rotation" && r.chip)
      .map((r) => ({ id: r.id, label: r.chip! }))
  }
  return rotationCache
}

/**
 * `count` chips for surface number `index`, wrapping the pool.
 *
 * Deterministic on purpose. `/` is statically prerendered, so a random pick
 * would produce a hydration mismatch, and it would make every chip assertion
 * untestable. Keying on the surface index instead means a visitor sees
 * different questions as they move through the site, while any one surface
 * always offers the same three — variety across a session, stability within
 * a page. Stride `count` so consecutive surfaces share nothing until the pool
 * wraps; once the pool passes `surfaces * count` entries, nothing repeats.
 */
export function rotationFor(
  index: number,
  count = 3,
  exclude: readonly string[] = []
): ChipRoute[] {
  // `exclude` is what an answer has already said. Without it a follow-up can
  // offer the question the visitor just asked: the voice surface and one
  // project reveal both landed on pool slots 4-5, so reading the strengths
  // answer ended with a chip offering the strengths answer. Filtering before
  // slicing also keeps the stride meaningful — dropping entries afterwards
  // would silently return fewer chips than asked for.
  const pool = rotationPool().filter((c) => !exclude.includes(c.id))
  if (pool.length === 0) return []
  return Array.from({ length: Math.min(count, pool.length) }, (_, k) =>
    pool[(index * count + k) % pool.length]
  )
}
