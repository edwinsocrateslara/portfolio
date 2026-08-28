/** Icon stroke weights, in the 24-unit viewBox every Lucide glyph uses.
 *
 * ── WHY STROKES LIVE IN TS AND SIZES LIVE IN CSS ──────────────────────────
 * Lucide takes strokeWidth as a NUMBER PROP. A CSS custom property cannot
 * reach it, so a token layer for weight has to be JavaScript. Sizes can be —
 * and are — set by CSS classes reading --icon-* tokens. Two homes, each with
 * one job, and the split is mechanical rather than a preference.
 *
 * ── WHAT THE NUMBERS MEAN, AND THE MEASUREMENT BEHIND THEM ────────────────
 * strokeWidth is in USER UNITS of the viewBox, not pixels. A Lucide icon is
 * 24 units wide, so rendering it at 16px scales everything by 16/24 — the
 * stroke included. `strokeWidth={2}` therefore paints 1.00px at 12, 1.33px at
 * 16, 1.50px at 18, 1.67px at 20 and 2.00px at 24.
 *
 * Measured from a screenshot, not derived: ink at those five cases came back
 * 1.00 / 1.33 / 1.67 / 2.00 / 1.25 against predictions of exactly the same,
 * so a CONSTANT strokeWidth already holds relative weight constant at 1:12.
 *
 * ── WHERE THE TARGET CHANGES, AND WHY ─────────────────────────────────────
 * Relative weight is the right target while an icon is competing with
 * letterforms. Above 16px it stops being: the marks up there — the lightbox
 * controls, the rail's glyphs — are large because of the box they sit in, not
 * because they matter more, and a 2.00px stroke would make the heaviest ink on
 * the site belong to the least important mark. So above 16 the target switches
 * to ABSOLUTE ink, held at 1.5px.
 *
 * The whole scale, against the four sizes in globals.css:
 *
 *   12  stroke 2     ink 1.00   ratio 1:12
 *   16  stroke 2     ink 1.33   ratio 1:12
 *   20  stroke 1.8   ink 1.50   ← ink target takes over
 *   24  stroke 1.5   ink 1.50
 */

/** Marks that sit beside type: 12 and 16. 1:12 relative weight — 1.00px ink
 *  at 12, 1.33px at 16, so the mark keeps the same density as the letters
 *  whichever of the two sizes it is at. */
export const ICON_STROKE = 2

/** Standalone controls at 20 — the lightbox's close and chevrons, the rail's
 *  contact links. 1.8 × 20/24 = 1.50px ink, rather than the 1.67px a constant
 *  2 would give, which would be the heaviest ink on the site.
 *
 *  It was ICON_STROKE_CONTACT, for the rail pair only. The lightbox controls
 *  joined them when they moved 18 → 20 and needed the same correction, so the
 *  name now says the job — a standalone control — instead of one of its two
 *  call sites. */
export const ICON_STROKE_CONTROL = 1.8

/** 24px rail glyphs. 1.5 × 24/24 = 1.50px ink.
 *
 *  This replaces 1.25, which was a one-off with a note asking for it to be
 *  re-picked by eye. It now lands on a rule instead: 1.25 painted 1.25px,
 *  LIGHTER than the 1.33px of a 16px mark beside it, which made the largest
 *  glyph on the site also the faintest. 1.5 puts it level with the 20px
 *  controls and no heavier.
 *
 *  ── THE ONE THING OFF THIS SCALE ──────────────────────────────────────────
 *  The sparkle. Its size is on the ramp at both call sites (16 for the brand
 *  mark, 24 for the typing indicator) and its stroke is 8.33 in a 100-unit
 *  viewBox, which is the same 1:12 ratio ICON_STROKE expresses in 24 — so at
 *  16 it paints 1.33px and agrees. At 24 it paints 2.00px, where this rule
 *  asks for 1.50. It is left alone deliberately: the path and its stroke are
 *  a trace of a Lottie source, documented in docs/provenance, and re-picking
 *  the stroke would make it no longer a trace. Recorded as an exception rather
 *  than assumed to be fine. */
export const ICON_STROKE_RAIL = 1.5
