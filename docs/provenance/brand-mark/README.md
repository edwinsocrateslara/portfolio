# Brand mark — provenance

`source.svg` is the file the mark came from (`pattern_04_white.svg`, from the
designer's carpa pattern assets), byte for byte. It is kept so the derivation
can be checked, and it **does not ship**: nothing imports it, and `docs/` is not
`public/`.

## What it contains

One `<path>`, `viewBox="0 0 260 260"`, no width or height, no stroke. Its fill
was hardcoded white by an embedded `<style>` on a class: `.cls-1{fill:#fff}`,
plus two layer ids. No script, no external reference, no image.

## What was taken, and what was not

Only the path's `d`, verbatim, into `MARK_PATH` in
`components/ui/brand-mark.tsx`. The `<style>`, the class and the ids were
dropped; the component sets `fill="currentColor"` and the colour comes from a
token at the call site, as the sparkle's stroke does.

## The geometry that sets its sizes

The drawing sits on a 10-unit module: bars are 20 units, the narrowest gaps 10.
In a 260-unit box a 10-unit gap is one device pixel at 26px on a 1× screen.
That is why the rail draws it at 32 and why there is no 16px favicon —
DESIGN.md § Icons, "The brand mark: a fill, outside the ramp".
