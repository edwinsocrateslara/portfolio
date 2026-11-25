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
// WHAT IT DOES NOW: it puts the break after "making", so the object of the
// sentence stays together on line two.
//
//   I'm Edwin, product builder making
//   useful tools and workflows.
//
// 765 IS THE MIDDLE OF ITS WINDOW, NOT A ROUND-ISH GUESS. Measured on 25
// November by sweeping max-width in 10px steps on the real page at 1440 and
// reading the rendered line boxes back out with a Range: the break above
// holds from 700px to 830px — a 130px window. Below 700 the line goes to
// three; from 830 "useful" is pulled up onto line one ("…making useful /
// tools and workflows."), and from 940 "tools" follows it. 765 sits 65px
// from each edge, which is what makes it safe against a font-loading
// difference or a tracking change. It is NOT a value to nudge: the two
// failure modes are 130px apart and both are one word wide.
//
// HISTORY: this was 880 — the middle of the same-shaped window (810–940) for
// the line it replaced, "I'm Edwin, AI designer & builder making / useful
// products and workflows." Left at 880, the new line breaks after "useful".
// IF THE LINE CHANGES AGAIN, THIS NUMBER IS STALE: re-sweep, don't reuse.
//
// Paired with `text-wrap: pretty` on the element, not `balance`: balance
// equalises line lengths, which is what put "making" on line two.
//
// Below some viewport the pane's own content width drops under 765 and governs
// instead, and below that the headline goes to three lines — measured at
// 1024, where it is three. Both are expected and neither is this constant's
// job. (The 1225 / 1155 thresholds written here were for 880 and 810.)
export const HERO_MEASURE = 765

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
