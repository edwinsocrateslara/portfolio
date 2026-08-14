# Typing indicator — provenance

`source.lottie.json` is the Lottie file the indicator was traced from. It is
kept so the derivation can be checked, and it **does not ship**: nothing
imports it, and `docs/` is not `public/`, so Next never copies or bundles it.
Confirmed by grepping the build output — see "Verifying" below.

## Why it was traced rather than played

Playing it needs `lottie-web`. Measured from the published tarball, not from
memory:

| build | minified | gzipped |
|---|---|---|
| `lottie.min.js` | 299 KB | **74 KB** |
| `lottie_light.min.js` | 164 KB | **45 KB** |
| the JSON itself | 4.0 KB | 0.6 KB |

45 KB gzipped is the floor for a usable build. The inline SVG is ~0.4 KB and
has no dependency.

## What the file actually contains

Three layers, no image assets, no gradients, no text. Every colour is a
**stroke**, and every one is `#ffffff`:

    layers[0..2].shapes[0].it[1]   stroke  rgb(255,255,255)

Every bezier handle is `[0, 0]`, so the path is a plain polygon — eight
vertices alternating between radius 21.219 and 10.609, which draws a
four-pointed sparkle. That is why the trace is **exact** rather than an
approximation: there were no curves to fit.

## How the SVG values were derived

| SVG | from the source |
|---|---|
| `viewBox="0 0 100 100"` | 300×300 canvas, layer scale 500%, position 150,150 — normalised |
| `stroke-width="8.33"` | stroke `w: 5` at 500% scale, normalised to the 100-unit box |
| `pathLength="100"` | so trim percentages survive as themselves |
| track `opacity 0.15` | layer 3 opacity `15` |
| arc `stroke-dasharray "40 60"` | layer 2 trim `e: 40` (40% of the path) |
| dot `stroke-dasharray "3 97"` | layer 1 trim `e: 3` |
| arc `dashoffset -9.72` (static) | layer 2 trim offset `35` degrees; 35/360 = 9.72% |
| dot `dashoffset 0` (static) | layer 1 trim offset `0` |
| `rotate(360deg)` over one cycle | layer 1 and 2 trim offsets sweeping a full turn |
| `1.6667s linear` | 83 frames at 50 fps; keyframe easing sits at 0.167/0.833 on both axes, which is effectively linear |

Verified against real `lottie-web` side by side, both frozen at frame 0:
identical shape, stroke weight, joins, track opacity, arc length, and the
same detached leading dot at the same gap. Only the starting rotation
differs, which is invisible in a loop.

## Why rotation and not the source's trim animation

The source animates trim OFFSET — the dash travels along the path. The
implementation rotates instead. On this shape the two are identical: it is
four-fold symmetric, so moving 25% along the path and turning 90 degrees land
in the same place, and one full dash cycle equals one full turn.

They cost very differently. `stroke-dashoffset` animates an SVG geometry
property, which is not compositor-accelerated, so it forced a style
recalculation every frame — and the brand mark carries this shape too, on
every page, permanently. Measured over 5 seconds of idle, same page state:

| | style recalcs | main-thread task time |
|---|---|---|
| `stroke-dashoffset` | 600 | 0.257s |
| `transform: rotate` | **21** | **0.016s** |
| no animation | 0 | 0.001s |

Two things had to be true to get that. The rotation is on an **HTML-level
`<svg>` element**, not on the paths inside one — rotating a `<path>` measured
*worse* than the dashes (600 recalcs plus 600 layouts). And the mark is split
into **two stacked SVGs**, because the track has to stay still while the arc
turns, so only the moving layer rotates.

## Colour

The source is white. The component does not recolour it — it draws with
`stroke="currentColor"` and lets the wrapper set
`color: rgb(var(--bureau-accent))`. The accent hex appears nowhere, so the
animation follows the token automatically. **Do not paste `#7fdd3c` into this
JSON or into the SVG**; that would put the accent in a second place, and
`check:design` rule 6 cannot see inside a JSON file to catch it (proven — see
DESIGN.md, "What rule 6 cannot see").

## Verifying

    grep -r "62.5 37.5" .next/          # the traced path IS in the bundle
    grep -rl "Layer 7" .next/           # the Lottie file is NOT
