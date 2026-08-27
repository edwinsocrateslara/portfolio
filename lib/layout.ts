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
// HERO_MEASURE was originally 1120 to compensate for leading that could not be
// changed: the headline took a 52/78 hero step, and three centred lines at 78px
// stacked to a 234px block that stopped reading as a headline. Widening the
// measure was the only lever available.
//
// CONSIDERED AND DECLINED, rather than an open option. An earlier version of
// this note said narrowing was "a real option"; it was reopened, measured at
// every candidate width, and closed. Keeping it at 1120 is the decision.
//
// The measured cost of narrowing to the reading measure, at 28/42 with today's
// copy:
//
//     cap 1120 (today)   1 line    803px   54 characters   42px tall
//     cap  900           1 line    803px   54 characters   42px tall
//     cap  803 or below  2 lines   441px   30 characters   84px tall
//
// One sentence at 28px with a single return sweep beats a stacked pair of
// 30-character fragments, and the second line adds 42px that pushes the input,
// the chips and the sampler down by the same amount. That trade is worse both
// ways, so the headline keeps its full width.
//
// ⚠ AT 1120 THIS CONSTANT DOES NOTHING. The headline renders at 803px because
// that is the natural width of the copy, and any cap from 804 up is
// indistinguishable — 1120, 900 and 10000 produce identical output. It only
// begins to govern below ~803, where it immediately costs the second line. So
// it is a ceiling with clearance, not a lever with slack: do not read 1120 as
// a number that is doing work, and do not tune it expecting a gradual effect.
//
// Two related facts, both measured rather than assumed. Below a viewport of
// about 1148 the pane's content drops under 803 and the headline wraps to two
// lines regardless of this value, so the one-line version only exists above
// that. And the earlier note here described the headline as "h2 at 32/48
// weight 400" — it is .type-hero at 28/42, which is where the 54 and 30
// character counts above come from.
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
