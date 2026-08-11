export const CONTENT_WIDTH = 720 // chat column, inputs, welcome screen

// Landing hero measures. Not spacing — these are line-length limits, so they
// are not on the 4px scale any more than CONTENT_WIDTH is.
//
// HERO_MEASURE is set so the headline breaks to TWO lines at desktop. That is
// load-bearing: .type-hero is 52px on 78px leading (the system's 1.5x rule),
// which the Claude Design handoff notes is "a one- or two-line setting" —
// three centred lines at 78px stack to a 234px block that stops reading as a
// headline. The mock solved it by dropping leading to 60px; this repo cannot,
// because 1.5x is invariant. Widening the measure gets the same two-line
// result without touching the type scale.
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
