// THE READING MEASURE LIVES IN CSS, as --prose-measure in app/globals.css.
// This is the one place that still needs it as a NUMBER: next/image's `sizes`
// attribute is parsed by the optimizer at build time and cannot resolve a
// custom property, so a var() there produces no candidate at all.
//
// A MIRROR THAT IS ALLOWED TO DRIFT, which is the only reason it is tolerable
// to have two homes for 720 again. `sizes` picks which pre-rendered candidate
// to download; being twenty pixels stale costs a slightly larger file and
// nothing else. A stale LAYOUT value would be a visible bug, which is why the
// layout half moved to the token and this half is documented as a hint rather
// than left looking like a second source of truth.
//
// It used to be the layout value too, applied as an inline maxWidth on the
// chat column, the input, the chips and the sampler. Those now read
// var(--prose-measure) directly.
export const IMAGE_SIZES_MEASURE = 720

// Landing hero measures. Not spacing — these are line-length limits, so they
// are not on the 4px scale any more than the reading measure is.
//
// HERO_MEASURE keeps the headline to TWO lines at desktop.
//
// It was originally 1120 to compensate for leading that could not be changed:
// the headline took a 52/78 hero step, and three centred lines at 78px stacked
// to a 234px block that stopped reading as a headline. Widening the measure was
// the only lever available.
//
// That constraint is long gone. The hero step no longer exists at all — the
// headline is h2 at 32/48 weight 400 — so three lines would be 144px. 1120 is
// kept because two lines still reads better than three at this copy length,
// not because anything forces it. If the copy grows, narrowing this is a real
// option rather than a regression.
export const HERO_MEASURE = 1120

// Bordered blocks inside the chat column, capped so they read as objects
// sitting in the column rather than as the column itself.
//
// CARD and CALLOUT are deliberately NOT merged. CARD is the thumbnail-plus-text
// card shape — project header, doc link, deck download. CALLOUT is the impact
// box: a bordered list with a 2px accent rule, no thumbnail, and longer lines
// that want the extra 40px. Collapsing them would be a 40px rendering change
// disguised as a refactor.
export const CARD_WIDTH = 480
export const CALLOUT_WIDTH = 520
