/* THE SHEEN on a chip or download pill: a soft band of light that sweeps
 * across the pill's FACE, on a loop (25 November). It replaced the shimmer —
 * a rotating conic gradient masked down to a ~0.7px travelling rim — and keeps
 * that port's construction: Magic UI's IDEA (here, Shiny Button's sweep), none
 * of its code. CSS keyframes, no Motion, no dependency. See app/globals.css,
 * "The sheen on chips and download pills", for what each layer is and what the
 * stock component got wrong.
 *
 * Two layers, behind the label:
 *   .sheen-backdrop   the pill's face, OPAQUE (--layer-1-flat)
 *   .sheen-band       the moving light, white at --sheen-ink, never the accent
 * and the inset highlight on top, unchanged from the shimmer.
 *
 * LOOPING, NOT HOVER, so it runs on touch too: a 1.65s sweep in a 6s cycle.
 * Reduced motion stops it. */
export function Sheen() {
  return (
    <>
      <span className="sheen-backdrop" aria-hidden="true" />
      <span className="sheen-band" aria-hidden="true" />
      <span className="sheen-highlight" aria-hidden="true" />
    </>
  )
}
