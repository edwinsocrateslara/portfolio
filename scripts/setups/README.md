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
`setTimeout` — the reveal setups do, to reset a scroller after the transcript
has finished streaming.
