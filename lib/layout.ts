export const CONTENT_WIDTH = 720 // chat column, inputs, welcome screen
export const PAGE_WIDTH = 1280   // landing page max-width

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
