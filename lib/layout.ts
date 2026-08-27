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
// THE HEADLINE'S MEASURE, AND NOW IT CHOOSES THE BREAK. It used to decide
// one line versus two, back when the headline was 28/42 and 803px wide; at
// 50/58 the string is ~1434px and two lines are a given, so this number does
// a different job than it did and the reasoning that used to be here is gone
// rather than edited — it described a headline that no longer exists.
//
// WHAT IT DOES NOW: it puts the break after "making".
//
//   I'm Edwin, AI designer & builder making
//   useful products and workflows.
//
// Measured by reading the rendered line boxes back out with a Range, not by
// counting characters. That break holds from 810px to 940px — below 810 the
// line count goes to three, above 940 "useful" is pulled up onto line one.
// 880 is the middle of that window with about 70px of clearance either side,
// which is what makes it safe against a font-loading difference or a tracking
// change; it is NOT a value to nudge, because the two failure modes are 130px
// apart and both are one word wide.
//
// Paired with `text-wrap: pretty` on the element, not `balance`: balance
// equalises line lengths, which is what put "making" on line two.
//
// Below a viewport of about 1225 the pane's own content width drops under 880
// and governs instead; below about 1155 it drops under 810 and the headline
// goes to three lines. Both are expected and neither is this constant's job.
export const HERO_MEASURE = 880

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
