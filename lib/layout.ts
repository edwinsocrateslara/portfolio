export const CONTENT_WIDTH = 720 // chat column, inputs, welcome screen

// Landing hero measures. Not spacing — these are line-length limits, so they
// are not on the 4px scale any more than CONTENT_WIDTH is.
//
// HERO_MEASURE keeps the headline to TWO lines at desktop.
//
// It was originally 1120 to compensate for leading that could not be changed:
// .type-hero was 52/78 under the 1.5x rule, and three centred lines at 78px
// stacked to a 234px block that stopped reading as a headline. Widening the
// measure was the only lever available.
//
// The hero step is now 52/60, so that constraint is gone — three lines would
// be 180px, which the Claude Design handoff calls acceptable. 1120 is kept
// because two lines still reads better than three at this copy length, not
// because it is forced. If the headline copy grows, narrowing this is now a
// real option rather than a regression.
export const HERO_MEASURE = 1120

// Bordered blocks inside the 720px chat column, capped so they read as objects
// sitting in the column rather than as the column itself.
//
// CARD and CALLOUT are deliberately NOT merged. CARD is the thumbnail-plus-text
// card shape — project header, doc link, deck download. CALLOUT is the impact
// box: a bordered list with a 2px accent rule, no thumbnail, and longer lines
// that want the extra 40px. Collapsing them would be a 40px rendering change
// disguised as a refactor.
export const CARD_WIDTH = 480
export const CALLOUT_WIDTH = 520
