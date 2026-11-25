# Surface setups

Each file is a snippet **evaluated in the page** to drive the app to one
surface before a tool measures or captures it. They are arguments to
`canvas-artboard.mjs --setup` and to `check-geometry.mjs`.

They lived in a scratch directory outside the repo, which meant the artboard
extractor's documented workflow could not be run by anyone who did not already
have them — and `check-geometry.mjs` could not reference them at all. They are
here because a tool that depends on a file cannot depend on a file nobody else
has.

A setup gets the page after load and returns nothing. It may schedule work with
`setTimeout` — the reveal setups do, to hold the scroller at the top (a
safety net since 24 November, when reveals stopped streaming and began landing
at the top).

## Changing the rail means running these

These setups, check:paint, check:threads and check:geometry drive the rail by
hand and need a browser, so none is a build gate. **After changing the rail or
the document links, run them — at 1440 and at 380.**

Why, in one incident (24 November): three changes broke four tools in one day,
with every build gate green. Piece 1 took the Ideas Dashboard off the rail and
broke `vibe.js` and check:geometry's vibe surface. Item 3 moved the documents
into a header and broke check:geometry at 380. `meridian.js` already failed at
380, and the item-4 rewrite kept the flaw. `npm run check:tools` (in the build)
was written after the first two and catches their class — slugs, panes, and
the `data-*` handles. It does not catch the 380 class, and those two breaks
were made by the gate's own author, in the same session, and found only by
running these. The gate covers what has been seen; running the tools is how
the next thing gets seen.

**The same day, the same pattern again:** check:routes passed on this machine
and failed every Vercel deploy, because Vercel's adapter writes the build
output somewhere else. Both were gates that passed where they were written
and failed where they ran. Before a gate ships, ask **where does this actually
run?** — and prove it there (DESIGN.md § The rail has both incidents). And a
push is not the deliverable; the deploy is.

**And when a sample disagrees with a conclusion, classify every member of
it.** On 25 November a scroll sampler found lit pixels in the header's gap in
up to 25 of 30 frames; one frame was inspected, found torn, and that
explanation was applied to all thirty. Inspecting one explains one. Count the
classes (DESIGN.md § The rail has the incident, and what layout measurements
and settled captures cannot see).

Select by those handles, never by position, and take the VISIBLE copy of a
document link with a fallback to the first: at 900px and below the only copy
is in the closed mobile sheet, hidden, and a click on it still navigates.
