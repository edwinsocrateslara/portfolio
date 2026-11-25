# Brand mark — provenance

`source.svg` is the file the CURRENT mark came from, byte for byte (Edwin's
`logo.svg`, 25 November). `source-2026-10-21.svg` is the file the PREVIOUS mark
came from, also byte for byte, kept so that mark's record below can still be
checked. Neither ships: nothing imports them, and `docs/` is not `public/`.

## The current mark (25 November): a ten-arm asterisk

### What it contains

One closed `<path>`, `viewBox="0 0 549 550"`, with `width="549"` and
`height="550"` on the root, `fill="none"` on the root and `fill="white"` on the
path. No stroke, no `<style>`, no ids, classes, transforms or scripts, no
external reference, no image.

It is an AUTO-TRACE, not a constructed drawing: straight edges are runs of
curve segments, and edges that should be one line wander by up to 0.44 units
(about 0.03px at 40 — invisible). Kept verbatim anyway, so the derivation stays
checkable against this file.

### What was taken, and what was not

Only the path's `d`, verbatim, into `MARK_PATH` in
`components/ui/brand-mark.tsx`. Dropped: `width` and `height` (the size is a
token at the call site), and both fills (the component sets
`fill="currentColor"`; the favicon has its own colour-scheme style).

The box is 549 × 550 — not square. `MARK_VIEWBOX` is `-0.5 0 550 550`: square,
and centred on the hub at (274.5, 275), so the mark sits in the middle of a
square slot instead of 0.5 units left of it.

### The geometry that sets its sizes

Ten arms, each about 50 units wide in a 550 box: seven above the horizontal,
30° apart, and three below, 45° apart. The gaps between arms are WEDGES that
narrow to nothing at the hub, as in any star, so there is no single "narrowest
gap" the way the previous mark had one. What was measured instead, on a 1×
raster: how many arms separate in the outer ring, and how close to the ground
the most-closed gap gets.

| size | arm | arms separate (outer ring) | closest gap |
|---|---|---|---|
| 14 | 1.27px | 10 | 19% grey |
| 16 | 1.45px | 10 | 8% grey |
| 18+ | ≥1.6px | 10 | clean |
| 40 | 3.6px | 10 | clean |

**The floor is about 16, so a 16px tab icon reads** — rendered at true 16 on a
light and a dark tab bar. That supersedes "no 16" (DESIGN.md § "The favicon").

## The previous mark (21 October – 25 November) — HISTORY

Kept as written, because it was correct for the mark it describes.

`source-2026-10-21.svg` (`pattern_04_white.svg`, from the designer's carpa
pattern assets). One `<path>`, `viewBox="0 0 260 260"`, no width or height, no
stroke. Its fill was hardcoded white by an embedded `<style>` on a class:
`.cls-1{fill:#fff}`, plus two layer ids. No script, no external reference, no
image. Only the path's `d` was taken; the `<style>`, the class and the ids were
dropped.

The drawing sat on a 10-unit module: bars 20 units, the narrowest gaps 10. In a
260-unit box a 10-unit gap is one device pixel at 26px on a 1× screen. That
floor is why there was no 16px favicon, and why the rail could not go below
32; the rail drew it at 40, a legibility call above the floor made on the 1×
render.
