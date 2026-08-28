# Edwin Socrates Lara — Visual Identity, Direction 1D "Bureau"

Source of truth for this repo's visual system. Supersedes all prior design
documentation. Origin: Claude Design handoff bundle (`EdwinOS 1D.dc.html`),
direction "1D — Bureau."

Near-neutral dark with a single accent hue, four radius steps, one type
family (Archivo) with a mono label voice (IBM Plex Mono). Same content, IA,
and component set as before — this is an identity layer only.

## Color tokens

All colors are CSS custom properties on `:root` in `app/globals.css`.
**Ground and ink are fixed values; surfaces and hairlines are not.**

**Ground and ink** — RGB triplets, so `rgb(var(--x) / <alpha>)` works:

| Token | Value |
|---|---|
| `--bureau-bg` | `#131313` |
| `--bureau-text-primary` | `#e8e8e8` |
| `--bureau-text-secondary` | `#a0a0a0` |
| `--bureau-text-muted` | `#8f8f8f` |
| `--bureau-accent` | `#7fdd3c` |
| `--bureau-on-accent` | `#131313` |

**Layers** — white at an alpha, composited over whatever is behind:

| Token | Value | Over `#131313` |
|---|---|---|
| `--layer-1` | `white / 4%` | `#1c1c1c` |
| `--layer-2` | `white / 7%` | `#242424` |
| `--hairline` | `white / 14%` | `#343434` |
| `--hairline-strong` | `white / 23%` | `#4a4a4a` |

The alphas are solved so they composite to the exact greys this system used
to hard-code. On flat ground nothing moves — verified by sampling the
rendered pixel, not by arithmetic: a chip interior reads `28` before and
after.

The point is what happens when the ground is **not** flat. Over a project
screenshot, a fixed grey stays stubbornly grey and announces itself as a
panel bolted on top; an alpha layer takes the light behind it. Elevation becomes compositional — a layer inside a layer is
automatically lighter, with no second token and no decision to make.

`--layer-blur` (`20px`) is applied **deliberately, never as a default**:
`backdrop-filter` forces a new compositing layer, and on a surface with
nothing behind it that is pure cost. Today it is on the sampler cards only.

*Outstanding:* those cards were blurred because the hero glow sat behind
them, and that glow has since been deleted as dead code. Nothing is behind
them now, so the blur is currently unpaid-for by this rule's own terms.
Flagged in the code, awaiting a decision rather than removed in passing.

Write the prefixed `-webkit-backdrop-filter` **first** and the standard
property **last**. Next 16's CSS minifier dedupes the pair and keeps whichever
comes last; with the standard one written first it was dropped from the
bundle entirely, leaving Firefox — which honours only the unprefixed form —
with no blur. Confirmed by reading the served CSS.

Tailwind's `theme.colors` no longer carries `surface` / `elevated` / `border`
/ `border-strong`. They are not RGB triplets any more so they cannot take
Tailwind's `<alpha-value>` slot, and all four had **zero** usages as
utilities.

**`--bureau-text-muted` deviates from the locked palette.** The direction's
literal value is `#767676`, which only reaches 3.4–4.1:1 contrast on these
surfaces — below the WCAG AA floor of 4.5:1 — and it carries real small text
(tags, captions, meta lines). Raised to `#8f8f8f` (4.8–6.1:1, passes AA).
Confirmed with the project owner.

**The palette carries exactly one hue: the accent.** Everything else — ground,
ink, layers, hairlines — is neutral, and the accent is restricted to
structural marks rather than surfaces. See **Accent** below for how the hue
was chosen and where it is allowed to appear.

The old blue accent (`#1e96fc`) and its dependents (a "Sunshine" amber scale,
a warm-accent orange, a blue-tinted "golden shadow" glow system) are still
gone, and were not reinstated by adding an accent back. Emphasis that used to
be color-coded still lives mostly in **value and form**: mono
`text-secondary` for eyebrows/indices, underlines for links and hero
emphasis, and outline vs. filled for badge states (see Components below). The
accent supplements that; it did not replace it.

## Accent

`--bureau-accent` is `#7fdd3c`, hue 95°. It is the only hue in the system.

**It was chosen by measurement, not taste.** The site's chrome sits next to 32
real project screenshots, so the accent's job is to stay legible against them.
All 32 were decoded in-browser, downsampled to 96×96, converted to HSL and
binned into 24 × 15° buckets weighted by `saturation × (1 − |L−0.5| × 1.4)`,
discarding greys (`s < 0.18`), voids (`L < 0.10`) and blowouts (`L > 0.93`) so
that UI chrome inside the screenshots would not dominate the result.

Reproduce with `node scripts/sample-hues.mjs` (needs the dev server and Chrome
on `--remote-debugging-port=9222`).

The corpus came out as two masses with a void between them:

| Band | Share of chromatic pixels |
|---|---|
| Warm `0–45°` | **43.4%** |
| Cool `165–240°` | **47.0%** |
| Magenta `315–345°` | 5.1% |
| Everything else | under 5% |

Per project, the dominant bin: Coinley `210°`, FutureFit `240°/150°`,
Volkswagen `195°`, E-commerce `30°`, Complex Ntwrk `15°`, Product Management
`225°`, Meridian `30°` with teal at `165°`.

**What this ruled out.** Cyan-teal was the intuitive choice and is wrong:
`195–210°` is the second-largest bin in the corpus and the *dominant* hue in
three separate projects, so a cyan accent would vanish against the rail
thumbnails that carry it and fight Meridian directly. Amber is worse — `30–45°`
is the single biggest bin. Magenta-pink is both occupied and the reference
product's signature.

**What was rejected on judgment rather than data.** Violet `278°` scored
just as clean on collision. The AI-default gradient ends at `#764ba2`, hue
272° — six degrees away — and this repo names that gradient as the tell for
generated design work (`PRODUCT.md`, impeccable appendix). A portfolio arguing
for AI-native craft cannot wear it.

`95°` carries **0.3% of corpus mass within 45°** — the lowest of any candidate
— and reaches **10.9:1** on the ground, which is why it works as text and as a
1px hairline and not only as a fill.
`--bureau-on-accent` (`#131313`) sits on it at the same 10.9:1.

**Where the accent is allowed** — structural marks only:

- the active rail bar (2px left border)
- the input focus ring and the `:focus-visible` outline
- the textarea caret
- the SEND fill, once there is something to send
- the IMPACT left rule and its square marker
- ~~the shimmer's rim on a chip or download pill~~ — **dormant, see below**

### The masked rim — dormant, and admitted on a bad number

**The shimmer is white now, so `--accent-rim` has zero consumers and rule 6's
second exception guards nothing.** That is the same state the top-of-view wash's
exception is in, and it is recorded the same way: dormant pending a decision,
not an oversight. The token, the narrowing and its four near-miss fixtures all
stay — they cost nothing and deleting them would lose the proof that the
narrowing is a narrowing.

**But it should not be reactivated on the argument that admitted it, because
that argument was measuring the wrong thing.** The case made below was "the
visible rim is about 0.7px, narrower than the 2px rail bar this rule already
permits". 0.7px is the *geometric* rim — the strip of gradient the backdrop
does not cover. The layer also carries `filter: blur(2px)`, and a 0.7px strip
blurred by 2px paints about **4.69px**. Measured:

| blur | inset | geometric | apparent |
|---|---|---|---|
| 2px | 0.05em | 0.69px | **4.69px** |
| 2px | 0.02em | 0.27px | 4.27px |
| 0 | 0.05em | 0.69px | 0.69px |

So the rim that shipped was **more than twice the width of the rail bar**, not
half of it. The exception may still be defensible — a soft moving highlight is
not the same object as a 2px static bar — but it has to be argued on apparent
width, and it was not. If anything ever wants this exception again, that is the
number to argue from.

### The narrowing itself, kept for whenever it is wanted

The shimmer paints a conic gradient in the accent and then covers all but a rim
of it with an opaque backdrop inset by `0.05em`. **The visible result is about
0.7px wide — narrower than the 2px rail bar the rule already permits.** The
declaration is a background; the render is an edge.

Rule 6 now recognises that structurally, never by class name, on three
conditions — each a property of what a masked rim *is*:

1. CSS, not JSX. A component cannot mint one inline.
2. The value is a gradient using **`--accent-rim`**, never `--bureau-accent`
   directly. Same mechanism as `--hero-glow`: naming the token is a declaration
   of intent that a grep can check, and tuning a rim can never move the accent
   that marks controls.
3. The same block carries a **negative z-index**. A rim sits behind the thing
   that masks it; a surface does not.

`check-design.mjs` proves this is a narrowing rather than a hole the same way it
proves the wash's: four near-miss fixtures, each dropping one condition, all of
which must still fire.

**What it still lets through, said plainly rather than discovered later:** a
grep cannot measure how much of the gradient the backdrop actually covers. Any
negative-z-index gradient declared through `--accent-rim` passes — including one
nothing masks. The rule narrows *who* may paint an accent, not *how much* shows.
That is the same limitation the wash exception carries, and the same answer: the
token makes it a reviewed decision rather than an available one.

### The inset highlight needed no rule change

`box-shadow: inset 0 -8px 10px` on a shimmer control was raw hex — `#ffffff1f`
and `#ffffff3f`. That is not a rule problem, it is a missing token. Two more
rungs on the white-alpha family (`--layer-1` 0.04, `--layer-2` 0.07, `--hairline`
0.14, `--hairline-strong` 0.23) now carry it:

| token | value |
|---|---|
| `--highlight-inset` | `rgb(255 255 255 / 0.12)` |
| `--highlight-inset-strong` | `rgb(255 255 255 / 0.25)` |

0.25 is close to `--hairline-strong`'s 0.23 and is **not** it. A hairline is an
edge; this is a wash inside a box. Pointing one at the other would rebuild the
coincidence this system keeps removing.

**It is a surface treatment nothing else on the site has.** Chips and download
pills now carry an inset highlight and no other control does. That is a real
inconsistency and it is the price of the effect, recorded here rather than
found later.

### Four chromatic colours arrived

The aurora on the front-door headline is the only chromatic thing in an
otherwise achromatic system: `--aurora-1` through `--aurora-4`
(`#ff0080`, `#7928ca`, `#0070f3`, `#38bdf8`). They are tokenised rather than
inlined precisely so a later audit sees them in the palette instead of buried in
a keyframe.

### Why a stroke passes rule 6

The typing indicator draws the accent as an SVG `stroke`, and rule 6 does not
flag it. That is correct by the rule's own logic, not an oversight.

Rule 6 covers `background`, `background-color`, `background-image` and `fill`
— the properties that paint an area. It deliberately excludes `border-color`,
`outline`, `caret-color` and `color`, because those mark an edge or a glyph,
which is what the accent is *for*. **A stroke is that same category**: it is a
line with a width, not a region. A 24px indicator drawn in 8.33-unit strokes
paints less area than the 2px rail bar the rule already permits.

The indicator does not name the accent at all. It draws with
`stroke="currentColor"` and its wrapper sets `color: rgb(var(--bureau-accent))`,
so the token is the only source and there is no hex to drift.

### What rule 6 cannot see

**Rule 6 walks `.tsx` under `app/` and `components/`, plus `app/globals.css`.
Nothing else.** A colour written into any other file type is invisible to it.

This was proven, not assumed: a JSON file placed in `lib/` containing both an
accent-coloured Lottie fill layer and the literal string
`background: rgb(var(--bureau-accent))` produced **zero findings**.

It matters here because the indicator was traced from a Lottie file. Had we
shipped the animation as JSON and recoloured it by pasting the accent hex in,
the gate could not have caught the duplication — the one place the accent was
hardcoded would have been the one place the rule cannot look. That is a reason
the SVG trace is safer than the JSON, independent of the 45 KB.

If a future change puts colour in JSON, YAML, or an `.svg` file on disk, rule
6 must be extended to scan it or it is not covering that colour.

**Where it is forbidden.** It marks an edge or a state; the moment it paints a
region it stops being a signal and becomes a theme. So: not a surface, not a
large painted area, not a gradient — **with exactly one documented exception,
which is currently switched off.**

**Every place the accent paints today**, measured on the rendered pages across
all six surfaces rather than read from source:

| where | property | size |
|---|---|---|
| active rail row — `.rail-item[data-active]` | `border-left-color` | 2px |
| active document row — `.rail-doc[data-active]` | `border-left-color` | 2px |
| the résumé timeline node | `background` | 8px |
| the IMPACT callout's rule | `border-left-color` | 2px |
| the IMPACT marker | `background` | 8px |
| the chat caret | `caret-color` | 1px |
| SEND, once there is something to send | `background` + `border` | 34px |
| the input's focus ring | `box-shadow` at 11% | 2px |
| the lightbox's focus ring | `outline` | 2px |

Nine uses, none wider than 34px. With the wash off the accent is **purely
structural**: active state, focus, caret, send, and two marks.

### The top-of-view wash — OFF, for now

**The wash paints nowhere.** One rule turns all five off:

```css
.hero-band::before, .deck-glow::before, .about-glow::before,
.resume-glow::before, .reveal-glow::before { content: none; }
```

`content: none` stops the pseudo-element being generated, so there is no box
and no compositing layer — unlike `display: none` or `opacity: 0`, which keep
painting nothing at a cost. **Delete that one rule and the wash comes back.**
Nothing else was touched: the five selectors, the `--hero-glow-*` tokens, the
gradient recipe and rule 6's structural exception are all intact, including the
0.13 → 0.20 alpha work solved against the contrast floor.

Why it went: on a real capture at 1440 the wash composites to `rgb(41,59,27)`
over the ground — an olive that reads as a stain rather than a decision, and
the largest chromatic gesture on a site whose every other accent use is 8px or
smaller.

**Rule 6's exception is DORMANT, PENDING A DECISION THAT HAS NOT BEEN MADE.**
Not dead, and not an oversight. The gradients are still in the file, so
`isTopOfViewWash` still recognises and permits them and `check-design` still
reports zero — the exception currently guards five rules that paint nothing.

⚠ **Do not tidy this away.** A reader finding an exception with no visible
consumer will reasonably want to delete it, and that would be deciding
something nobody decided. The wash is off *for now*. Removing it for good is a
four-step sequence, and all four steps happen together or none do:

1. delete the five `::before` blocks
2. delete the `--hero-glow-*` tokens
3. remove the exception from rule 6 in `check-design.mjs`
4. retire its four near-miss fixtures from the self-test

Doing step 3 alone would fail the build on gradients that are still declared.
Doing 1 and 2 without 3 and 4 would leave the exception genuinely dead, which
is the state this note exists to prevent being reached by accident.

Until that decision is taken, the off-switch is the whole change and everything
else stands ready.

**The allowlist was never where the wash lived.** Rule 6's three
`no-accent-surface` entries are the SEND fill, the IMPACT marker and the
résumé's timeline node — all three still painting. The wash was permitted by
rule, not by entry, which is why turning it off leaves the allowlist untouched.

What follows is the reasoning as it stood while the wash was on. Kept, because
it is what would have to be re-argued.

### Why it was on five surfaces

The wash was on **five** surfaces — the front door,
the deck, About, Résumé, and the reveals — which is every pane a visitor can
open. At that point it is not an exception to "the accent is never a surface";
it is the house style, and the rule was what had gone stale.

So rule 6 states it directly: the accent may not be a surface, EXCEPT as the
top-of-view wash. The three allowlist entries are gone. The wash is recognised
**structurally, never by class name** — a `::before`, using `--hero-glow` and
not the control accent, at `z-index: -1` with `pointer-events: none`. Drop any
one of those four and the gate fires as it always did; `check-design`'s
self-test carries a fixture for each near-miss, so the narrowing is proven to
be a narrowing rather than a hole.

What follows is the original argument for allowing it once.

### The original one exception: the front-door glow

`.hero-band` carries a lime radial — an ellipse from top centre at 13% alpha
fading out by 64%. That is the accent as a surface, and it is the largest
painted area on the site. It was taken deliberately, with the tradeoff
understood, because the front door has one job.

Three things keep it from becoming a precedent:

1. **It uses `--hero-glow`, its own token**, defaulting to the accent's value
   but separately tunable. The wash can be re-hued or removed without moving
   the accent that marks controls.
2. **Rule 6 watches `--hero-glow` too.** Renaming a colour is not a way past
   the check — that would make the rule trivially defeatable.
3. **The site is allowlisted by name, with its reason in the entry.** The rule
   is unchanged everywhere else; a second accent surface anywhere still fails
   the build.

Gradients were previously **not** allowlistable at all, on the reasoning that a
gradient is never a control. That absolutism is relaxed to accommodate this
one decision — but the finding still reads `(GRADIENT)` in the detail string,
so an entry waiving one is visibly waiving a painted area and cannot be
mistaken for waiving a control. The default is still failure.

**If a second site ever needs an entry, the rule has stopped meaning anything**
and the exception should be reconsidered rather than extended.

This is enforced, not just documented — **`check:design` rule 6** fails the
build on `--bureau-accent` inside a `background`, `background-color`,
`background-image` or `fill`. `border-color`, `outline`, `caret-color` and
`color` are deliberately out of scope: those mark an edge or a glyph, which
is what the accent is *for*.

Rule 6 is the only rule that reads `app/globals.css` as well as the
components. The token layer is where an accent surface would actually get
written — the hero wash lived there — so a checker walking only `.tsx` would
have been blind to the case it exists to catch.

A grep cannot measure rendered size, so **"larger than a control" is not
decided by the rule**. Every accent fill is flagged, and the judgment is
recorded in the checker's `ALLOW` map where somebody has to write down why
that element is a control. Two entries today: the SEND fill and the 8px
IMPACT marker — the same two listed above. There was a third, `.chip-solid`,
which went when the Side of Desk pane was deleted and took its only callers
with it.

**A gradient is the exception and cannot be allowlisted at all.** A gradient
is never a control, and an accent gradient is precisely how the hero wash
would have turned green the moment the accent gained hue. Verified by writing
that gradient back in: the build exits 1 naming the rule, and adding an
`ALLOW` entry for it does not silence it.

## Radius

**Four steps, not one.** The system opened at a flat 2px everywhere, on the
theory that near-square edges read as precise. In practice 2px reads as
*unstyled*: at that radius a card and a bare `div` are the same object, and
the surface has to work harder to say what is a thing.

| Token | Value | Use for |
|---|---|---|
| `--bureau-radius-media` | `8px` | image tiles, thumbnails, previews |
| `--bureau-radius-card` | `12px` | panels, cards, bubbles, the chat input once it grows |
| `--bureau-radius-btn` | `8px` | buttons that are not pills |
| `--bureau-radius-chip` | `9999px` | chips, badges, circular icon controls, the chat input at rest |

`media` and `btn` share a value and are kept apart because they answer
different questions; a future change to one should not silently move the
other.

**Icon-only controls are circles, not rounded squares.** Anything whose whole
job is one glyph — the lightbox's close and arrows, the chat's SEND — takes
`chip` and equal width and height. A rounded square reads as a small panel
that happens to contain an icon; a circle reads as a control. The rule is the
label: if it has one, it is a button and takes `btn`; if it has only a glyph,
it is a control and takes `chip`.

Every value is a multiple of 4 except the pill, which is the documented
`9999px` exception already named under The 4px rule.

**Where an image meets a card edge, round the outer corners only.** The
sampler's preview sits flush against its footer block, so it rounds its top
two corners at `calc(card - 1px)` — the border's width — and leaves the
bottom square. Rounding all four would leave two crescents of card visible
under the image.

### The dock has no rule

The input dock had a `border-top` hairline separating it from the scrolling
pane. It is gone. The input is a fully-round, hairlined, filled object with its
own edge on all four sides, and a rule a few pixels above its curve read as a
seam rather than as structure — two horizontal lines saying the same thing.

**What marks the boundary is the dock itself: a translucent fill over a blur,
with the transcript scrolling underneath it.** No line, and no hard clip.

This is the scrim the earlier version of this section predicted would be
needed. It said the fix, if the bare cut read badly, was "a short scrim at the
bottom of `.pane-scroll`". It was built as a dock treatment instead, which does
the same job from the other side and does one thing the gradient could not:
it gives the input a surface to sit on, which it had lacked since the rule came
off.

**The fill does the work; the blur softens what the fill does not fully hide.**
Verified with real text parked underneath — blur alone leaves a legible grey
smear competing with the placeholder, and shows a seam where blurring starts.
`rgb(var(--bureau-bg) / 0.72)` plus `blur(var(--layer-blur))` together suppress
it. Unlike the sampler's blur, **this one has something behind it** and is
doing visible work by the rule at the top of this document.

### The dock is out of flow, and why not sticky

`.pane-dock` is `position: absolute` against `.pane`, and `.pane-scroll` fills
the whole pane so content passes beneath it.

Sticky inside the scroller is the tidier-looking option and it is wrong here.
`.pane-scroll` reserves a 4px scrollbar gutter, so a sticky child is laid out
in the content box — 4px narrower than the pane — and its fill stops short of
the right edge. Measured at 1440: a 1172px dock in a 1176px pane. It also
needs a negative margin matched to the scroller's horizontal padding, which
differs by breakpoint; at 380 the desktop value overshot by 36px. Positioning
against `.pane` sidesteps the gutter entirely and leaves the column-alignment
fix above untouched.

**The scroller reserves the dock's height as `--dock-h`,** published by a
`ResizeObserver` in `app-shell`. Without it the last message sits permanently
underneath the dock. It cannot be a constant: the dock is 90px at rest and
220px with the input grown to its 180px ceiling, so a fixed value would either
strand the last message early or leave it half-covered. A `ResizeObserver`
rather than an effect keyed to the input's value, because the dock also
changes height on viewport rewraps and font load, which a value-keyed effect
cannot see.

Verified at both widths, scrolled fully to the bottom: the last message clears
the dock by 8px, and with the input at its ceiling the reserve tracks it —
1440: dock 90 → 220, reserve follows; 380: dock 82 → 212, reserve follows.

Two ways this reserve goes wrong, both found by measuring rather than reading:

- The mobile breakpoint overrides `.pane-scroll`'s padding, and **must keep the
  bottom reserve**. Writing `0` there silently undid `--dock-h` at mobile only,
  while desktop still looked correct.
- The deck and vibe-coding panes share `.pane-scroll` and have **no composer**,
  so they must reserve nothing. Left to the fallback they carried 80px of dead
  space at the bottom — invisible on a scrolling pane until you reach the end
  of it. `--dock-h` is set to `0px` explicitly when no dock is mounted.

### The chat input is the one radius that moves

It is fully round (`radius-chip`) at rest and steps to `radius-card` once it
grows past one line. No new value — both tokens already exist, and the scale
is unchanged.

This is geometry, not taste. The SEND button is bottom-anchored 12px in from
the right edge, and a fully round container's corner radius is half its
height — so as the field auto-grows toward its 180px ceiling, the curve eats
that 12px inset. Measured clearance between the two painted edges:

| Height | Fully round | `radius-card` |
|---|---|---|
| 1 line, 50px | 8.0px clear | 8.0px clear |
| 2 lines, 74px | 3.0px clear | 8.0px clear |
| 3 lines, 98px | **1.9px outside** | 8.0px clear |
| 4 lines, 122px | **6.9px outside** | 8.0px clear |
| 6 lines, 180px | **18.9px outside** | 8.0px clear |

So it is not a tall-field edge case: clearance decays from the second line on
and crosses zero between two and three, degrading exactly when the visitor is
composing their longest message. That crossing used to sit between three and
four, at the older 66px field with a 12px inset — a smaller inset has less
margin before the curve reaches it, which is the kind of thing that moves
silently when padding changes and is why none of these numbers are written
into the code. At the 180px ceiling the field also scrolls,
and a 4px scrollbar thumb inside a 90px corner is clipped at both ends. Card
radius is flat because its geometry does not depend on height.

The step also carries meaning rather than only avoiding a collision: round
reads as "one line, ready", squared as "you are drafting".

**The threshold is derived, never written down** — `lineHeight + paddingTop +
paddingBottom + border`, read from computed style. A literal `66` would be a
fourth place that number lives and would go silently wrong the next time the
type step or the padding moves.

The focus ring needs no handling: it is a `box-shadow`, so it follows
`border-radius` in both states on its own.

## The 4px rule

Every spacing value, every element dimension, and every font size is a
multiple of 4.

**Line-height is the one derived value, and it is exempt.** It is 1.5× the
font size at every step but one, which means it lands off the grid at most
of them — 12px type gets 18px leading, 20px type gets 30px. That is correct
and intentional. Forcing line-height onto multiples of 4 would either
break the ratio or constrain the type scale to sizes divisible by 8.
The ratio matters more than the grid here, because leading is a
relationship between two numbers rather than a measurement in space.

**There is no exception. The ratio holds at every step.**

There used to be one: a `hero` step at 52 / 60 rather than 52 / 78, on the
argument that display type tightens as it scales. That step existed to carry
the front-door headline and nothing else, and when the headline moved to `h2`
at weight 400 it had zero users. Both the step and its exception were deleted
rather than left in the scale — an exception that exists to justify one value
stops being a rule about type and becomes a note about history.

A `hero` step exists again, at 28/42, and the distinction matters: the old one
was removed when its last user left, not because one user is too few. This one
has a user, is exactly 1.5x, and carries no exception. It replaced a 28/48
that would have been the first leading exception since the deletion above.

**One type size is off the 4px grid: `control`, at 14/21.** It is the only
one, and it is deliberate — a chip label wants to sit between the 12px label
voice and the 16px body voice, because 12 reads small on a 44px target and 16
reads like prose inside a pill. The leading is still the derived 1.5x; 21 is
off-grid too, and line-height has never been asked to be on it.

Other exceptions to the 4px grid, all deliberate: **1px** hairlines — as a
border, and equally as a `width` or a `height` where the hairline is drawn as
a box rather than an edge — the **2px** left border on the active rail row and
the focus ring that matches it, and **9999px** for fully-round pills.
Letter-spacing is optical tracking rather than layout, is sub-pixel by nature,
and is also exempt.

The hairline clause used to say "1px borders". It was written when every
hairline in the system was a `border`, and the résumé's timeline is the case
that broke it: the spine's rule is a `height: 1px` box and its line is a
`width: 1px` box, because a border cannot be animated from one end. Same
value, same reason, different property — so the exception is about the
HAIRLINE, not about the property it happens to be spelled with.

This line used to name **2px radii** as an exception too. It no longer exists:
the radius scale opened flat at 2px and was replaced by the four steps below,
every one of them a multiple of 4 except the pill. The exception outlived the
values it was written for — an exception with no consumer is a permission
nobody asked for, so it retires rather than waiting for a use. `check-design`
allowed `border-radius: 2px` on the strength of this sentence; it no longer
does.

**Type may be set in a `.type-*` rule, or once on `body` from the ramp's own
tokens, and nowhere else.** The second clause is the document default, and it
is narrow on purpose: `body { font-size: var(--type-body-size) }` is permitted,
`body { font-size: 16px }` is not, even though the two render the same today.
The default exists so it cannot drift from the step it mirrors, and a literal
can. `check-design`'s `css-inline-type` enforces exactly that shape.

It was made explicit late. Before, `body` set only the family, and the default
resolved to 16/24/400 Archivo out of three unrelated sources — the browser's
own `font: medium`, Tailwind preflight's `line-height: 1.5`, and that one
declaration. That happens to be exactly `.type-body`, which is why a missing
`.type-*` class has never produced a visible symptom on this site: an unclassed
element renders identically to a classed one. An audit across all six surfaces
found seven unclassed text nodes, every one `.sr-only` and none of them
visible. The discipline held. It was held by habit, not by the stylesheet.

Exempt from the grid is not exempt from the token layer. Tracking lives in
`--track-*`, named by the voice or the step it corrects and never by the
element that uses it:

| Token | Value | Corrects |
|---|---|---|
| `--track-display-hero` | -1px | Archivo at 28 |
| `--track-display-h2` | -1px | Archivo at 32 |
| `--track-display-sub` | -0.6px | Archivo at 24 |
| `--track-display-title` | -0.4px | Archivo at 20 |
| `--track-caption` | 0.4px | Archivo at 12, the floor |
| `--track-badge` | 0.8px | Plex Mono caps, 700 |
| `--track-caps-body` | 1.4px | Plex Mono caps at 16 |
| `--track-caps-label` | 1.2px | Plex Mono caps at 12 |
| `--track-caps-sans` | 0.05em | Archivo caps, both rail steps |

**Nine values.** The budget in `check-design` was raised from 8 when the rail
moved to Archivo, and the raise is the review — a row here plus a paragraph at
`TRACK_BUDGET`. The ask started at three values and came down to one: the brand
stayed mono so needed nothing, and the rail's two caps steps collapse into a
single correction when it is written in **em** rather than px. `0.05em` is
0.6px at 12 and 0.8px at 16.

That 0.8px equals `--track-badge` and is **not** the same value — badge is mono
caps at 700, solved from a different face. Pointing one at the other would
rebuild the kind of coincidence this document keeps deleting.

The ramp runs monotonically with optical size — large sans
tightens, small sans opens, mono caps open furthest. Read the mono pair in
**em**, not px, or it looks like it runs backwards: 1.4/16 is 0.088em and
1.2/12 is 0.100em, so the smaller caps do open further. The absolute pixel
value falling as the type shrinks is what makes that confusing written down.

`--track-display-hero` deliberately repeats h2's -1px. 28 and 32 are close
enough that a different correction would be false precision; it has its own
name so the two can diverge if either step moves.

**A ninth value has to earn a row in this table**, and `check-design`'s
`tracking-budget` rule is what makes that true rather than aspirational — it
fails the build at nine. Its sibling `tracking-literal` fails on any
`letter-spacing` px value outside this block, which is how the `-0.6px` left
behind in the mobile `@media` block was eventually found. Two values for one
role is a nudge, not a step: if a label needs different tracking in one place
than the same label gets everywhere else, move the whole role or leave it
alone. Splitting mono caps into `-body` and `-label` was NOT that — it is one
role at two steps, which is what the display rows have always been.

## Spacing

Spacing encodes **relatedness**. Before reaching for a pixel value, decide
how related the two things are, then use the level that expresses it. Each
level is double the one before, so the jumps read as distinct rather than
as noise.

| Token | Value | Use for |
|---|---|---|
| `--space-within` | `8px` | Parts of one thing — a label and its value, an icon and its text |
| `--space-between` | `16px` | Things in a group — cards in a list, stacked images |
| `--space-group` | `32px` | Between groups — a list and the block after it |
| `--space-section` | `64px` | Major regions — the bands of the landing page |

Always written as `var(--space-*)` — in a style object or in a component
class in `globals.css`. They were briefly also exposed as Tailwind
utilities (`p-within`, `gap-between`); those reached zero usages and are
gone, because a utility cannot be used inside a CSS rule and keeping both
split the vocabulary by file type.

The level is the meaning; the pixel value is an implementation detail. If
two levels both seem plausible, that is a signal to reconsider the
grouping rather than to invent a value in between.

### Raw scale

For element **dimensions** — widths, heights, control sizes — which
express size rather than relatedness, and for the rare spacing case no
level fits:

`--space-4` `8` `12` `16` `20` `24` `32` `40` `48` `56` `64` `80`

`--space-4` (4px) doubles as the documented tight half-step inside
`within`, for optical cases where 8px is visibly too loose. `--space-44`
exists for one reason — the touch-target floor below.

### Touch targets

Most controls in this system are **42px tall**, not 44. That is deliberate and
it is not an oversight to be "fixed" by a later audit.

42 is the chip's own arithmetic: 8px padding + 24px line-height + 8px padding
+ 2×1px border. Prompt chips are 42. **Every row in the rail is 56** — project
rows because they carry a 32px thumbnail, document rows because their icon is
also 32px, which is what puts every row label on the same 62px left edge. Doc
rows were 42 while their icon was 16. **This used to be derived from the chat
input's 66px height, and no longer is** — the field is 50px now, and a claim
that one number explains both would be false.

WCAG **2.5.8 (AA)** requires 24×24 and every control clears it. **2.5.5 (AAA)**
asks for 44×44, and this system takes the AA floor plus the density in exchange
— a portfolio read on a laptop is not a phone keypad.

**Three exceptions at `--space-44`.** Two are on mobile and are navigation: the
menu toggle and the brand mark. On a phone the rail is hidden behind the sheet,
so these are the only way *out* of a view and the only way *home*. A control
that is the sole route somewhere does not get to be 18px because the rest of
the system likes 42.

**Prompt chips are 47px** — `--space-12` above and below a 14/21 control
label, plus the 2px border. Not 44: no `--space-*` token lands on 44 with a
21px line box (it wants 10.5) or on this system's usual 42 (9.5), and an
off-grid spacing token invented to hit a round number is a worse trade than
three pixels. `--space-8` would give 39 — below both 42 and 2.5.5's 44, a
smaller target for a larger label.

The number moves with the label and the arithmetic has been stale twice, so it
belongs in one place: **12/18 + 12 = 44 · 14/21 + 12 = 47 · 16/24 + 12 = 50.**
The earlier claim that chips "were 42 at body type" described a state with
`--space-8` padding that had already been replaced when it was written.

**The rail's contact links are 26px** — `--space-4` above and below a 12px
label on 18px leading. That clears 2.5.8's 24×24 AA floor and does not reach
2.5.5's 44. They were 18px before the CONTACT block was built, which failed AA
outright, on the one row a recruiter on a phone is actually trying to hit.

The third `--space-44` exception is **SEND**, which is 34×34 painted and 44×44
to the pointer. It is
icon-only, so the visible circle is sized to the glyph rather than to the hand,
and the target is restored with a centred `::after` rather than by inflating
the button. 2.5.5 is about the target, not the paint. Centred rather than
anchored, so the extra area is symmetric around the glyph instead of hanging
off one edge and swallowing clicks meant for the field.

Grid: 3 columns desktop → 2 at 860px → 1 at 560px.

## Typography

One UI/prose family (**Archivo**, weights 400–800) plus a mono voice
(**IBM Plex Mono**, weights 400–700). Which one speaks where is decided by
Product/Data below, not by a list of component names. Loaded via
`next/font/google` in `app/layout.tsx` as `--font-archivo` /
`--font-plex-mono`; `tailwind.config.ts` maps `font-sans` → Archivo and
`font-mono` → IBM Plex Mono. No serif anywhere in this system.

### Size ranks. Weight sorts.

**The governing sentence, and the one to read before adding anything to the
ramp.** SIZE says which level a thing is on. WEIGHT says what kind of thing it
is at that level. The two axes never encode the same information, which is what
stops them contradicting each other — note that the largest step is the
lightest: `.type-display` is 400 and `.type-name` is 700. If weight tracked rank
that would be backwards. It does not, so it is not.

**The ceiling: at most three weights may share one rank.** Mono at 12 currently
uses all three — 400 values, 500 attributes, 600 labels. A fourth kind arriving
at a rank is not a weight problem to be solved with a fourth weight. **It is
evidence that the level is overloaded and needs a size of its own.** The file
type chip on a doc-link card was the first thing to test this: it was mono 12 at
700, and it became `.type-label` rather than a fourth weight.

### The ramp

**Six steps, a 1.25 ladder, every rung populated.**

| step | size / lh | ratio | voice |
|---|---|---|---|
| data | 12 / 18 | floor | Data |
| control | 14 / 21 | *off-ladder* | Product |
| body | 16 / 24 | ×1.33 | Product |
| section | 20 / 30 | ×1.25 | Data |
| name | 26 / 39 | ×1.30 | Product |
| page | 32 / 48 | ×1.23 | Product |
| display | 50 / 58 | ×1.56 | Product |

The ramp this replaced added a constant, so each step was a smaller
*proportion* of the one below it — 16→20 is +25%, 28→32 is +14% — and the top
could never separate from the bottom however many steps were added. A geometric
ladder makes every jump the same perceptual size, so distance compounds.

**Every rung is populated, and that is a rule rather than an observation.** The
previous ramp defined 24/36 and rendered it nowhere above 640px. A step with no
consumer is a step someone will eventually use for the wrong reason. The 40 rung
is deliberately unbuilt: nothing on this site sits between a page title and the
front door, which is why display jumps ×1.56 instead of ×1.25 twice.

**Type sizes are not bound to the 4px grid and never have been** — 14/21 and
20/30 both predate this ramp. Binding a geometric ladder to a 4px lattice would
force it back into the arithmetic ramp it replaced. Spacing is still on the grid.

**12px is the floor.** There is no step below it.

#### The 14/21 step is off the ladder, and kept on purpose

**It is not a rung.** 12→14 is ×1.167 and 14→16 is ×1.143; neither is 1.25 and
neither is trying to be. It sits between the floor and the body step, and its
**only consumer is the prompt chip.**

That is a deliberate exception to the rule two paragraphs up — every rung
populated, no step without a reason. This step inverts it: **one component is
the reason.** It is recorded here rather than left to be inferred, because it
has already been deleted once by someone reasoning from the count.

**The history, in order:**

| | size | what happened |
|---|---|---|
| 1 | **14 / 21** | where chips started, as `.type-control` |
| 2 | **16 / 24** | the step was retired as a single-consumer leftover and chips merged up into `.type-body` — **an error.** They landed on exactly the composer's type: same family, size, leading, weight and tracking, separated only by colour. A suggestion and the thing you act with read as peers. |
| 3 | **12 / 18** | dropped to `.type-caption`, which is where `.chip`'s padding had always pointed (12 + 18 + 12 + 2 = 44). Correct arithmetic, and too small for something you tap. |
| 4 | **14 / 21** | back, as a step held for one component. |

**So: if you are reading this because you found a step with one consumer and
wondered whether it is a leftover — it is not.** It was that once, it was
deleted for that reason, and the two sizes either side of it were both tried
and both wrong. The ladder governs ranks; this is a control label, and 14 is
the size it wants.

**No tracking on `.type-control`,** and that is a decision rather than an
omission. `.type-caption`'s 0.4px exists to open up 12px counters; carrying it
to 14 would be inheriting a value tuned for a different size, which is the
mistake the four display-tracking tokens were making before they collapsed into
one em value. At 14 the counters do not need the help.

### Line-height: 1.5×, with one bounded exception

**Line-height is 1.5× at every step. Steps of 40px and above may tighten to no
lower than 1.15×. Nothing below 40px may tighten at all.**

This is a bound on a range, not a licence per step. Only `display` qualifies,
at 50/58 — 1.16×.

The reason is measurable rather than aesthetic. Archivo's cap height is ~0.72em,
so at 50px the ink band is ~36px and 1.5× leading would put 39px of air between
two baselines: **more space than letter.** A two-line headline stops reading as
one object and starts reading as two sentences. Leading exists to help the eye
find the start of the next line, and a two-line block barely asks that of it.
Material Design tightens to 1.12× at Display Large and 1.25× at Headline for the
same reason, against a strict 1.5× at Body.

The counter-argument, recorded because it nearly won: an exception-free rule is
worth something a ratio cannot price, and by block area the strict version is
actually *larger* — 50/75 would occupy more of the viewport than 50/58. It gets
there through air rather than letterforms, which is why the exception was taken.

### Mobile steps down the ladder, not off it

At ≤640px each rung moves down by one, so the ratio survives the breakpoint:
**display 50→32, page 32→26, name 26→20.** Leading returns to a strict 1.5×,
because the tightening bound does not reach below 40.

The rule this replaced sent both 28 and 32 to 24, which made two levels the
desktop distinguishes identical on a phone.

`.type-wordmark` also steps, 16→12: one role at two sizes, the rail's brand and
the mobile top bar's. That used to be a second class, `.type-badge`, which an
audit measuring only 1440 reported as having zero instances.

### The thirteen classes

| class | family | size | wt | tracking | voice |
|---|---|---|---|---|---|
| `.type-display` | Archivo | 50/58 | 400 | −0.03em | Product |
| `.type-page` | Archivo | 32/48 | 700 | −0.03em | Product |
| `.type-name` | Archivo | 26/39 | 700 | −0.03em | Product |
| `.type-body` | Archivo | 16/24 | 400 | — | Product |
| `.type-body-strong` | Archivo | 16/24 | 600 | — | Product |
| `.type-rail-section` | Archivo | 16/24 | 600 | 0.05em ᴜᴘ | Product |
| `.type-action` | Archivo | 12/18 | 600 | 0.05em ᴜᴘ | Product |
| `.type-caption` | Archivo | 12/18 | 400 | 0.4px | Product |
| `.type-section` | Mono | 20/30 | 600 | 1.4px ᴜᴘ | Data |
| `.type-wordmark` | Mono | 16/24 | 700 | 0.8px ᴜᴘ | *exception* |
| `.type-label` | Mono | 12/18 | 600 | 1.2px ᴜᴘ | Data |
| `.type-attribute` | Mono | 12/18 | 500 | — | Data |
| `.type-value` | Mono | 12/18 | 400 | — | Data |

**`.type-attribute` and `.type-value` are the split.** `.type-meta` was 40
elements doing five jobs in one style — dates, role lines, client groups,
institutions and the six tools bands, all indistinguishable. Weight now
separates *a thing* from *an attribute of a thing*, at the same rank, with no
new size.

The 500 was measured before it was adopted, at 12px on `#131313` at 1×:
**+28.9% ink over 400**, which is 2.4× the signal of the secondary→muted colour
step this site already relies on, and 62% of the 400→600 step used for labels.
If it ever fails on a display, the fallback is +0.2px tracking on
`.type-attribute` — **not** colour, which is already carrying the
primary/secondary/muted hierarchy.

**`.type-body-strong` is the Product-side equivalent.** A doc-link card title is
not a rank above body; it is a different kind of thing at the same rank. It also
could not be `.type-name`: the card is 58px tall and 26/39 does not fit in it.

### Tracking: six tokens

There were nine, four of which were display tracking at one value per size —
and they were not consistent with each other: −1px at 28 is −0.036em, −1px at 32
is −0.031em, −0.6 at 24 is −0.025em, −0.4 at 20 is −0.020em. Four tokens
encoding one intention, badly. `--track-display: -0.03em` states it once and
scales to rungs that do not exist yet. This was a normalisation, not an
identity: 20px tightened −0.4→−0.6 and 32px loosened −1→−0.96.


**These classes are the only way to set type.** Components must not
re-declare `font-family`, `font-weight`, `font-size`, `line-height`, or
`letter-spacing` inline. Seventeen distinct font sizes accumulated in this
codebase precisely because inline re-declaration was available and easier
than picking a role.

### Two voices: Product and Data

The type system has exactly two voices, and the question that assigns them is
**is the interface speaking, or reporting?**

**PRODUCT VOICE — Archivo.** The interface speaking to the reader. Prose, page
titles, navigation, buttons, links, prompts, and the primary scan anchor of an
entry.

**DATA VOICE — IBM Plex Mono.** The interface reporting about something. Dates,
counts, statuses, categories, technical inventories, structural labels,
indices, locations, run figures, secondary role information, captions.

The gut-check, when a case is genuinely unclear: **would it sound natural said
aloud?** Then it is Product. **Would it make sense in a table, a log, a tag or
a spec sheet?** Then it is Data.

Call them Product and Data. Not "editorial", not "system", not "meta" — those
were earlier names for overlapping ideas, and carrying two names for one
concept is how a system drifts.

#### What "scan anchor" means, exactly

The scan-anchor clause is the one that hands `Backbase` to Product voice while
the role and dates beside it stay Data. It is narrow on purpose, because read
loosely it justifies anything — a date is also something a reader scans for.

**The scan anchor is the ONE element per entry that NAMES the entry.** Not the
most prominent element, not whatever the eye lands on first, not "the important
bit". The test is substitution: if you replaced this element with a blank, could
you still say which entry you were looking at? If no, it is the anchor. If yes,
it is one of the entry's attributes and belongs to Data voice.

An entry gets exactly one. `Backbase` names the role; `Senior Product Designer`
and `Nov 2020` describe it. `Graduate Diploma, Interactive Design` names the
credential; `CFC Media Lab` says where it came from. A list of nine attributes
does not get nine anchors.

#### What this replaced, and why

The previous rule was *"mono for meta — machine-generated or recorded fact, and
labels the site applies to its own content"*. It was an improvement on what came
before it and it still produced contradictions that a full audit found:

- **Page titles.** `Resume`, `About`, `Case Study` are headings, and the old
  rule sent headings to mono. They are Archivo and always looked right. Under
  Product/Data they are the product introducing a page — correct as built.
- **Employer and qualification names.** The old rule made these a coin-flip:
  arguably recorded fact, arguably not. The scan-anchor clause settles it.
- **Headings were one category and they are not.** `Resume` is the product
  introducing a page. `Experience` is a structural label on a list. Both are
  headings; they do different jobs and take different voices.

The reframing costs no code. Everything above is already built the way the new
rule describes.

#### What is Data voice today

| what | where | clause |
|---|---|---|
| dates | résumé | dates |
| role lines — `Senior Product Designer` | résumé | secondary role information |
| institutions — `CFC Media Lab, Toronto…` | résumé | secondary role information |
| client groups — `Fintech`, `Viafoura` | résumé | categories |
| `STACK` / `CADENCE` / `CORPUS` / `OUTPUT` / `SHIPPED` / `BUILT` and their values | vibe reveal | run figures |
| `Tools` / `Experience` / `Education` | résumé | structural labels |
| band labels — `AI & LLM work`, `Design` | résumé | structural labels |
| `The challenge` / `My role` / `Key impacts` | reveals | structural labels |
| photo captions, book attributions | About | captions |
| `Toronto, Canada` | résumé, About | locations |
| `Meridian · Mobile Banking · 21 slides` | deck | counts |
| `01` / `02` | reveals | indices |
| the six tools bands — 55 terms | résumé | technical inventories |

#### The one exception

`.type-wordmark` — the brand — stays IBM Plex Mono at 16/24 weight 700. By the
rule it is Product voice: it is the product naming itself, and it is the most
"said aloud" string on the site. It stays Data-voiced because a brand mark is
allowed to be its own thing, and because with the rail in Archivo it is the only
place the mono voice appears on every surface. Alone at the top it reads as a
mark; two sizes of it in the rail read as a texture.

#### One boundary that needs a reading

The rail's `Work` and `Vibe Coding` are structural labels, which the rule sends
to Data — and they are Archivo. They label groups of things you click. They are
navigation furniture, not a report about content, so Product wins. For any
future heading on that boundary the question is the same one: does it describe
content, or does it organise targets?

#### The audit reads zero

Every typeset element on every surface is on the side the rule assigns it.
Measured on the rendered pages, not the source: 319 instances, 151 distinct
strings, six surfaces, nothing unclassifiable and nothing on the wrong side.

The last thing to move was the résumé's six tools bands — 55 terms,
`Claude API · OpenAI API · TypeScript · React · Figma · …`. A technical
inventory is the interface reporting, so it is Data voice; they had been
Archivo at 16/24. Both this rule and the one it replaced gave the same answer
from different directions, which is what made it a decision rather than a
preference. They are now `.type-value`, mono 12/18, and the section is **48px
shorter** at the same thirteen lines — the one case where the rule-correct
answer was also the better-looking one.

**What separates a label from its contents once they share a size and a
family.** The band label is `.type-label` and the terms are `.type-value`, both
mono 12/18. Four things carry the hierarchy and none of them is size: **case**
(caps against sentence case), weight (600 against 400), tracking (1.2px against
none) and colour (muted against primary). Case does most of the work.

That is the vibe reveal's `STACK` block's arrangement rather than the résumé
dates'. The dates are both sentence case and lean on colour alone, which works
because they sit in a narrow column with nothing else in it. A label sitting
directly above its own contents needs more than colour, and caps is what
provides it.

Both voices are load-bearing. That split is what keeps an achromatic palette
legible without color.

### The panes already share a top rung — the difference is half-leading

**Do not "fix" this.** Someone will measure the deck, About and a project
reveal, see the first line of the reveal sitting higher, and add a few pixels
to close it. Those pixels would be wrong.

All three scrolling panes are `.pane-scroll` and share its
`padding-top: var(--space-group)`. Measured from the pane's content top:

| view | box top | ink top | first element |
|---|---|---|---|
| deck | **32** | 38 | `.type-h2` 32/48 |
| About | **32** | 38 | `.type-h2` 32/48 |
| project reveal | **32** | 36 | `.type-title` 20/30 |
| front door | 225 | 231 | `.type-h2`, `--hero-anchor: 25dvh` |

#### The front door is exempt from the top rung, on purpose

`.pane-front` sets `padding: 0 var(--space-40) var(--space-64)` — **zero top**,
against the 32 every other pane takes from `.pane-scroll`. That is an exemption,
not a miss, and it is worth stating because a padding audit will find it and
want to close it.

The band below it is **top-anchored, not centred**: both `.pane-front` and
`.hero-band` are `justify-content: flex-start`, and the offset lives on the band
as `padding-top: var(--hero-anchor)` — 25dvh at desktop, `--space-80` below
900px. Centring was tried and rejected; the note on `.hero-band` records why, in
short that it made the space below the chips a remainder and pulled the sampler
back up into the viewport.

The reason the offset has to live on the BAND rather than on the scroller is the
wash. `.hero-band::before` is the top-of-view glow, `inset: 0 0 auto 0` on the
band. Give the scroller 32px of top padding and the band starts 32px down, so
the glow starts 32px down, and the front door opens with a flat strip above it.
Measured at 1440: the band's box top is 0 and the headline's is 225, so the
25dvh is doing exactly the job the 32 does elsewhere — it is the same rung,
expressed on the element that also has to carry the glow.

The BOTTOM padding is not an exemption. The front door's `--space-64` is the
only real bottom value on a dockless pane, and the deck, About and Résumé
reserve nothing on purpose — see the dock-reserve note above, where `--dock-h`
is set to `0px` explicitly rather than left to a fallback.

**The box tops are identical.** What differs is where the glyphs start inside
their own line box: a 32px face in a 48px box begins 6px down, a 20px face in a
30px box begins 4px. That is the same rule already stated for the rail — optical
distances are paddings plus a fixed, known offset, and the offset is a property
of the type step, not a spacing decision. Closing a 2px gap here would put a
non-rung value into the one layer that cannot carry rungs.

The reveal's ink moved 35 → 36 when its opening line went from `.type-body` to
`.type-title`. That was a consequence of the type change, not the goal of it.

The front door is the only real difference, and it is deliberate:
`--hero-anchor` anchors the hero rather than padding it.

### A project reveal opens at one step up

The first line of a reveal is `.type-title` (20/700); every paragraph under it
is `.type-body` (16/400). It earns the step because it is the opening
statement of the case study, and the same class does the same job on the About
page's lede — one rule, not two.

It is deliberately **not** a heading. `.type-h2` is 32/700, and at 20 the line
stays clearly subordinate to it, so a reveal still reads as a conversation
rather than as a page with a title. Weight alone at body size was tried and
rejected: at 16/600 it read as bold prose inside a paragraph, not as a first
line.

The flag lives on the block, set in `buildProjectBodyBlocks` — so the chat
reveal and `/case-study/[slug]` cannot disagree about which line is the
opening one, the same reason the block ORDER lives there. A project with no
tagline emits no block at all, so nothing renders an empty bubble.

**One consequence, on the standalone route only.** That page has its own
project-header card, whose title is also `.type-title`, so two equal-rank lines
now sit near the top. It reads because the header is inside a bordered card
with a thumbnail and a mono eyebrow and the tagline is loose body text below
it — but they are the same type step, and if that card is ever restyled this is
the pairing to check.

## Chat column alignment

The messages pane scrolls and the input does not, so the scrollbar takes
width from one and not the other. Left unhandled, the content column sat
2px left of the input at desktop and 4px narrow on mobile.

Both sides now reserve a scrollbar gutter:

- the messages pane gets `scrollbar-gutter: stable`, so the space is
  reserved whether or not it is currently overflowing;
- the input wrapper gets `overflow: hidden` + `scrollbar-gutter: stable`,
  which reserves the identical gutter without ever showing a scrollbar.

Reserving a gutter is deliberate rather than padding by
`--chat-scrollbar`. That token is the WebKit thumb width; Firefox ignores
`::-webkit-scrollbar` and takes `scrollbar-width: thin`, whose rendered
width is browser- and platform-defined and cannot be set to a length. A
fixed padding would therefore be wrong in Firefox, while a reserved
gutter matches whatever that browser actually uses.

`scrollbar-width` is scoped behind `@supports not
selector(::-webkit-scrollbar)`. Chrome 121+ also honours it, and setting
it there disables `::-webkit-scrollbar` entirely — collapsing the 4px
thumb to a zero-width overlay scrollbar.

Verified by measuring `getBoundingClientRect` at 1440px and 480px, in
both the overflowing and non-overflowing states: text bubble, image,
impact card and follow-up chips all share the input's left and right
edges. The impact card is narrower on the right by design
(`max-width: 520px`).

## Components

- **Nav** — `.type-label`, `text-secondary`; hover → `text-primary` +
  1px underline. Availability dot `text-primary`, 8px.
- **Card** — `surface` fill or none, 1px `border`, `radius-card`. Image
  **1:1** (matches the source preview images — all 7 are square), unfiltered.
  Index bottom-right, mono. Hover: border → `border-strong`, lift 1px.
- **Grid gutter** (Selected Work) — `group` (32px).
- **Chip / tag** — see **Chips** below; one primitive, pill radius. Tag text
  `text-muted` `.type-attribute`; prompt-chip `text-secondary` `.type-body` with a
  mono `→` prefix.
- **Badge** — default = 1px `border-strong` + mono `text-secondary`.
  **Live/active = filled `accent` on `on-accent`** — the one deliberate
  inversion in the system, reserved for "this is on."
- **Input** — rest: `layer-1`/`hairline`, `radius-chip`. Focus: border →
  `text-secondary` + a 3px `accent`-at-11% ring (`--bureau-focus-ring`). Steps
  to `radius-card` once it grows past one line — see **The chat input is the
  one radius that moves**. SEND is an **icon-only circle**, muted at rest and
  filled `accent` with `on-accent` ink once there is something to send; 34×34
  painted, 44×44 to the pointer. Its size, inset and the field's right gutter
  are all `calc()`d from `--input-rest-h`, so none of them is a number anyone
  has to keep in step. Sending: opacity `.55`, mono
  "SENDING" + pulse (`.animate-bureau-pulse`).
- **External link** — `<NewTabMark />`: trailing `↗` in `text-muted`, plus
  visually-hidden "(opens in a new tab)" text so the warning is announced
  rather than only drawn. The glyph is `aria-hidden`, or a screen reader
  would say it twice. **On every `target="_blank"` in the app** — the rail's
  RESUME and LINKEDIN rows, the doc-link card, the case-study header's
  Portfolio link, and inline markdown links in chat prose. Before this, four
  external links carried no signal at all, visible or announced.
  `glyph={false}` is for links that already have their own mark: the doc-link
  card has a download `↓`, and two arrows on one control read as two
  different actions, so it takes the announcement without a second glyph.
- **Callout / doc link** — `surface`, 1px `border`, 2px `accent` left rule
  for emphasis blocks (e.g. IMPACT). Doc link = square "PDF" glyph + UI
  title + mono meta line + `↓`.

## Chips

**One primitive, one size, one fill.** Before this there were three separate
inline-styled implementations — the prompt chips, `In Progress`, and `Live` —
each re-deriving its own padding and hover.

It briefly had three variants for the badges — `.chip-sm`, `.chip-solid` and
`.chip-quiet`. All three died with the Side of Desk pane, which held their only
callers, and were deleted rather than left as CSS with a documentation entry
and nothing rendering them.

**Size is chosen by role, not by taste.**

| Class | Type step | Padding | Target | For |
|---|---|---|---|---|
| `.chip` | caption | `12 / 16` | **44px** | an action the visitor can take |

**`.chip` used to take body type**, on the reasoning that shrinking a tap
target's label works against it. That was reversed deliberately: the label
dropped to 12 and the padding rose to `--space-12`, so the text reads small
while the target is **44px** — `12 + 18 + 12 + 2`. Measured, not assumed. The
argument was right about targets and wrong about the link between them: label
size and hit size are independent, and treating them as one cost the chips
more weight than an action of that scale earns.

**`caption`, not `label`, and the difference matters.** Both are 12 / 18. But
`label` is mono, uppercase and tracked — the system-chrome voice, for nav,
badges, indices and meta. Chips carry things a person would actually say, so
they take Archivo in sentence case. Setting them in `label` made the front door
shout its own prompts in uppercase mono, and made them ~40% wider: the four
front-door chips measured 1312px on one row at `label` against **885px** at
`caption`.

**Fill:**

- **default** — `surface` + hairline. The resting state of everything.

Hover lives in CSS, not React state. Three components each held a `useState`
for it, which is both more code and worse: a hover that waits on a re-render
is a hover that can miss.

The `5px 9px` optical padding the status badges carried is gone. It
compensated for uppercase mono tracking against a 2px corner; at pill radius
that asymmetry is not visible, so the exception retires rather than being
inherited.

## Loading

**The four-pointed sparkle appears twice**: as the typing indicator at
`--indicator-size` (24), and as the brand mark beside the wordmark at
`--brand-mark-size` (16). One component, `components/ui/sparkle.tsx`, one
traced path — the geometry is not duplicated. Both are a 15%-opacity track, a
40% arc and a 3% leading dot, the last two rotating one full turn every
1.6667s via `stroke-dashoffset`.

It carries **no visible text**. It is `aria-hidden` and purely decorative.

**The announcement lives in a persistent live region in the shell**, not on the
indicator. `role="status" aria-live="polite"`, `sr-only`, permanently mounted
and empty until needed. A live region that appears with its content already
inside is announced inconsistently across screen readers; one already in the
tree whose text changes is announced reliably.

This is new behaviour rather than a port. The previous indicator rendered the
word "Generating" in a plain `div` with no `role` and no `aria-live`, which
announces nothing on its own — a screen reader user got that word only if they
happened to be browsing that subtree. Removing the visible label is what
prompted adding the announcement that had never been there.

**Under `prefers-reduced-motion: reduce` it renders a static frame, not
nothing.** Removing it would leave a silent gap where the response will appear
and reintroduce the shift the size token exists to prevent. Withheld in two
places — the `usePrefersReducedMotion` hook does not apply the animation
classes, and a media query zeroes the animation anyway.

**This path is live and easy to miss.** `activeBusy` is
`isTypingIn(...) || isApiLoading`, and while the scripted stream skips the
indicator entirely under reduce, `isApiLoading` does not consult the motion
preference — a real network call still takes seconds. Verified by driving the
app with reduce emulated: the scripted path shows nothing, the API path renders
at 24×24 with the animation classes absent and zero animations running.

It was traced from a Lottie file rather than played from one. `lottie-web` is
45 KB gzipped at its lightest build against ~0.4 KB of inline SVG, and the
source has no gradients, no image assets and every bezier handle at zero — so
the trace is exact, not an approximation. The file and the full derivation are
kept in `docs/provenance/typing-indicator/`, which does not ship.

### Entrance animations are opacity-only, and that is a constraint

**No entrance animation in this app sets a `transform`.** Not a preference — a
rule with a specific failure behind it.

Every entrance animation runs with `animation-fill-mode: both`, so the final
keyframe persists after the animation ends. A keyframe that ends on
`translateY(0)` therefore leaves `matrix(1,0,0,1,0,0)` on the element, which is
not `none` — and **a non-none transform makes that element the containing block
for every `position: fixed` descendant.**

`.animate-slide-up` used to rise 8px, and it sits on the wrapper around every
chat message. So the image lightbox — `position: fixed; inset: 0` — sized
itself to the message bubble instead of the viewport, leaving the header, the
input and the left of the page uncovered. Raising `z-index` does nothing: the
element is geometrically confined, not painted underneath. The symptom looks
exactly like a stacking bug and is not one.

The class now animates opacity only. Measured after the change: settled
`transform: none`, so nothing downstream is a containing block. `ImageLightbox`
still portals to `document.body`, which is correct on its own merits — an
overlay covering the viewport should not depend on every ancestor staying
transform-free — but it is no longer the thing holding the lightbox together.

**Cost, measured rather than assumed.** A/B across a full seven-block reveal,
identical streaming, animation disabled by CSS only so React re-renders the
same number of times:

| | style recalcs | layouts | CLS |
|---|---|---|---|
| with the animation | 874 | **19** | **0** |
| `animation: none` | 802 | **19** | **0** |

**Zero additional layouts** — opacity composites, so the animation never
reaches layout. ~72 recalcs across seven blocks is ~10 each. The ~800 baseline
is React re-rendering the thread on each append and has nothing to do with the
animation; attributing the total to it would have been wrong.

The 8px rise was dropped deliberately, not lost. Frozen at matched progress it
travelled 8 → 5 → 2.5 → 0.7 → 0px while opacity ran 0 → 1, so the fade was
already doing the perceptual work and the transform was carrying the hazard for
almost nothing.

**If a transform ever goes back into a `fill-mode: both` keyframe, this
returns.** Check the overlay's `getBoundingClientRect()` first: if it matches
its container rather than the viewport, this is why.

## The rail

**Two project sections, WORK and VIBE CODING**, sharing one `ProjectSection`
component. They are the same thing with different contents; a second copy of
the markup would be a second place for the active treatment, the thumbnail
rules and the truncation to drift.

**VIBE CODING renders only when it has rows.** Its entries are dev-gated, so
in production the section — heading included — is absent. A heading above
nothing is worse than no section. It replaced a single nav row that swapped
the pane to a Side of Desk grid; once the rail lists the projects, that pane
was redundant the way the project grid would be if WORK listed everything, and
it was deleted rather than left orphaned.

**A row with no artwork draws an empty frame**, not a borrowed screenshot from
another project. The rail is where the site asserts what a project looks like.

### The rail's spacing is optical, not box gaps

**An audit measuring margins in the rail will find zeros everywhere and
conclude the relatedness ladder is not applied. It is applied — to padding.**

Exactly one thing in `.rail-scroll` has a margin — `.rail-docs`, 8px on top,
half of the split described under "The document group is divided by a rule".
Everything else sits flush, so every visible gap is the sum of two facing
paddings plus the slack left by centring content optically inside a taller box:

- a 32px thumbnail centred in a 56px row leaves **4px** above and below
- a 16px icon centred on an 18px label line leaves **1px**

So the distance between two painted things is `paddingA + paddingB + slack`,
and the slack is 8px between two rows, 5px between a header icon and a
thumbnail.

**That means the optical distances cannot themselves be ladder rungs, and are
not.** Making them rungs would require the two facing paddings to sum to
`rung − slack` — 8 for a 16px gap, 27 for a 32px gap — and 27 is not reachable
from two rungs. The constraint is real, not a shortcut: with flush boxes and
optically centred content, you can put the ladder on the paddings or on the
gaps, but not both. **The paddings are the rungs**; the gaps are those plus a
fixed, known offset.

What matters is that the ORDER is right, and it was not. Symmetric `8 / 8`
header padding produced this:

| | before | after | from |
|---|---|---|---|
| row → row | 24 | **24** | row padding `8` + `8` |
| header → its first row | 21 | **29** | header `between` + row `8` |
| section → section | 21 | **45** | row `8` + header `group` |

A section boundary was **tighter** than the gap between two rows inside a
section, and identical to the gap between a header and the row it labels — so
nothing marked where one section ended. The header's padding is now asymmetric:
`group` above to separate sections, `between` below to bind the header to the
rows it labels. Applied identically to both sections; the difference in how
WORK and VIBE CODING read is the seven-rows-to-one difference, not spacing.

### Known consequence: the rail now scrolls at 1440×900

Measured before the second section: `.rail-scroll` was **673 / 673 — exactly
full, zero headroom**. It already scrolled at 1440×700 (−159) and 380×820
(−66).

Four changes pushed it past. Adding the section and removing the nav row it
replaced netted **+7px** — 680 against a 673 viewport. Fixing the inverted
spacing hierarchy above cost **+64px** more (32px per header × 2), taking it to
738. Widening the document icons to 32px cost **+42** (three rows, 42 → 56
each) and the document group's hairline **+1**, taking it to **781, or 108px
past the fold**. At 380 it is 215px past.

**Each further project costs 56px**, the row height, and each further *section*
costs 98 — its header at 66 plus one row. Contact stays reachable at any
height: `.rail-scroll` is `overflow-y: auto` and the CONTACT footer sits
outside it, pinned. Verified at both widths.

This is accepted, not an oversight. It is mechanically fine — `.rail-scroll` is
`overflow-y: auto` and the CONTACT footer sits outside it, pinned, so contact
stays reachable at any height. But the rail has moved from "everything visible
at once on a common laptop" to "scrolls", and it will not move back. If that
becomes a problem the answer is fewer sections or shorter rows, not removing
the scroll.

### One icon-to-label gap, and two label edges

Every mark in the rail sits `within` (8px) from the word it labels — headers,
project rows, document rows, the CONTACT square. There is no second value.

Labels land on **three** left edges, and each is a consequence of the mark's
width rather than a decision:

| | mark | gap | label x |
|---|---|---|---|
| WORK, VIBE CODING | 16px icon | 8 | **46** |
| every project and document row | 32px | 8 | **62** |
| CONTACT | 8px square | 8 | **40** |

This replaced an arrangement where the three document rows had a 24px gap —
a `margin-right` that padded a 16px icon out to a 32px column in order to buy
the 62 edge. It bought alignment by breaking the gap ladder on the only three
rows in the rail that had one, and 24 is not a rung. **Widening the icon to 32
gets both**: the gap is `within` because the column *is* the icon.

The alternative was leaving the document icons at 16 and letting their labels
sit at 46. It was rejected for a specific reason, not on taste: document labels
are mono caps, identical in type to WORK and VIBE CODING. At 46 with a 16px
icon they become typographically indistinguishable from section headers, which
would make the unheaded-group problem below strictly worse.

Document icons carry `strokeWidth={1.25}`, not the 2 the 16px icons carry.
Lucide expresses stroke width in viewBox units, so the same number paints twice
as thick at 32px — at 2 a document mark out-weighed the section header above
it, inverting the hierarchy. 1.25 was picked by eye against the rendered rail:
1 goes spindly and falls behind its own 12px label, 1.5 still out-weighs the
header. See `DOC_ICON_STROKE` in `components/shell/sidebar.tsx`.

### The document group is divided by a rule

CASE STUDY / RESUME / ABOUT is the one group in the rail with no header, and it
cannot easily have one — DOCUMENTS is accurate for the first two and wrong for
ABOUT, and MORE is filler. A header that is approximately true is worse than
none.

Measured, the break above the group was **39px optical against a 43px section
boundary** — the same break, to the eye. So the group read as a section whose
label was missing, and an unlabelled section attaches itself to the nearest
labelled one above it: VIBE CODING appeared to contain four things.

**A 1px hairline, not more space.** Widening the gap would have made it read
*more* like a section boundary, not less; space can only say "further apart",
never "different sort of thing". The 16px that was one block of `.rail-docs`
padding is split 8 above / 8 below so the rule sits *between* the two groups
rather than clinging to one — measured 18px above, 21px below, the 3px from the
doc row's icon being taller than its label ink.

The rule costs 1px of rail height. Widening the document icons cost 42 more
(three rows, 42 → 56 each), which is where the numbers below come from.

## The front door

The hero is a **band sized to the viewport**, not a centred block. `.hero-band`
takes `min-height: 100%` of `.pane-front`'s content box, centres the headline,
input and chips within itself, and the three sampler cards follow **after** it
— so they start below the fold and are cut by the viewport edge rather than
tucked inside it. There is something to scroll toward.

**The hero is ANCHORED, not centred, and that is the whole point.** While it
centred inside the band, the band's height and the headline's position were the
same number — so shrinking the band to raise the sampler raised the headline
with it, and the two could not be tuned separately. Worse, the space below the
chips was then a *remainder*: whatever the band had left over, 161px at
1440×900. That is why it was never on the relatedness ladder. Nobody set it.

`--hero-anchor` (`25dvh`) is where the headline sits, measured from the top of
the viewport. It resolves to 225px at 1440×900, exactly where centring put it,
so the hero did not move when the gap below it changed — verified element by
element: headline 225, input 353, chips 419, before and after.

It scales rather than pinning to a fixed 225 because a fixed anchor pushes the
hero off a short viewport: at 500px tall it would start a 290px hero at 225.
**Below 900px it is overridden to `--space-80`**, because the anchor is
measured from the viewport and the pane no longer starts there — the 77px top
bar is above it, so `25dvh` landed the headline 116px lower than it used to.

**The band also owns the top inset rather than the scroller.** `.pane-front`
has no top padding. The band paints the glow, so while that inset lived on the
scroller the glow started 64px late and left a strip of flat background across
the top of the pane — it read as a dark band above the wash. Measured before
the fix: `rgb(19,19,19)` down to y=56, `rgb(25,30,21)` from y=64. After:
`rgb(25,30,21)` from y=0.

**Chips to sampler is `section` (64)** — the last gap on the front door that
used to be emergent. The ladder now runs the whole height of the page:
chip to chip 8, chips to input 16, headline to input 32, chips to sampler 64.

`--hero-peek` is gone. It sized the band to leave a fixed reveal of the sampler
below the fold, which only worked while the band's bottom edge decided where
the cards sat. With the gap explicit, the cards follow the chips and the band's
height decides nothing — the token had stopped doing its job before it was
removed.

**The fold behaviour is viewport-dependent, and that is the decision — not a
bug to fix later.** At 1440×900 the cards sit fully visible at y=579 and the
page scrolls 36px; they do not bleed past the viewport edge. At 1440×500 they
are cut by the edge with 336px of scroll.

The two cannot both hold. The hero content is 290px tall, so in a 900px
viewport a ladder-scale gap beneath it cannot also push a 293px card
off-screen. An earlier version got the bleed by making the gap a remainder —
193px of leftover from centring — which is precisely the emergent value this
section exists to eliminate. **The ladder won, deliberately.** Do not
reintroduce a computed gap to recover the bleed on tall screens: that trades a
chosen value for an accident, and the accident is what made the hero move
whenever anything below it changed.

### The glow has its own height

`--hero-glow-height` is **512px**, on `.hero-band::before` rather than as a
background on the band.

It was a band background, which meant the ellipse was sized from the band's
box — so the wash grew and shrank with whatever the hero content happened to
be. Adding a chip row would have resized it silently. Same fault as the gap,
and it was already visible: the glow faded out at y=445, 359 and 423 at
1440×900, 1440×500 and 380×820, purely because the band was a different height
at each. Nobody chose any of those.

512px reproduces the 1440×900 appearance it had when the band was 515 tall.
Measured after decoupling, the wash now fades at **450 / 443 / 443** — the same
at every viewport, which is the point.

`isolation: isolate` on the band is load-bearing. The pseudo-element needs
`z-index: -1`, because an absolutely positioned pseudo paints *above* static
siblings and would otherwise sit over the headline. But without a stacking
context, `-1` puts it behind `.shell`'s opaque background and the glow
disappears entirely — which it did on the first attempt, silently: no error,
just a flat page.

`min-height`, not `height`: on a short viewport the content is taller than the
band and the band grows rather than clipping. `.pane-front` scrolls either way,
so the cards are always reachable — verified down to 1440×500.

**The hero input scrolls with the hero; it is not pinned.** `position: static`,
and at 1440×500 it travels from y=192 to y=−51, fully leaving the viewport. At
taller viewports it moves the full scroll range and simply runs out of page.

**The glow does not reach the sampler.** It fades out by y=480 — 64% of a
515px band — and the cards start at 579. The
brightest pixel behind a card is `rgb(19,19,19)`, flat ground. So the cards'
`backdrop-filter` stays inert, exactly as it is on a flat background
elsewhere: it is not doing visible work there and the cards look unchanged.

**The sampler must stay outside the band.** Inside it, it was centred along
with the headline and sat in the middle of the viewport — which is the opposite
of the intent, and looked correct enough to miss.

**Type:** headline at the `h2` step, `32 / 48` at weight **400** — a Tailwind
`font-normal` utility stepping the class's weight, which is what
`@layer components` is for. It was `52 / 60` at weight 800.

**Spacing — the ladder has to be legible**, tightest to loosest:

| | | |
|---|---|---|
| chip to chip | `within` | 8 |
| chips to input | `between` | 16 |
| headline to input | `group` | 32 |

Each step doubles, so a visitor can see that the chips belong to each other
more than they belong to the input, and to the input more than the headline
does. Two earlier arrangements broke this: chips at `within` from the input —
the same distance as from each other — flattened the top two rungs into one;
and headline at `section` (64) pushed the headline out of the group entirely.
A ladder only reads as a ladder when the rungs differ.

**Contrast over the glow**, measured on rendered pixels rather than computed
from the token — the glow is a gradient, so the value under each element
differs. **This table describes the wash while it was ON.** With it off, every
element sits on the flat `#131313` ground and the numbers below are history
that the next person to switch it back on will need:

| | background there | ratio |
|---|---|---|
| headline `#e8e8e8` | `rgb(30,35,27)` | **12.7:1** |
| placeholder `#a0a0a0` | `rgb(34,38,30)` at 1440, `rgb(38,47,32)` at 380 | **5.89 / 5.32** |
| chip text `#a0a0a0` | `rgb(23,26,21)` | **6.6:1** |

**The placeholder was the binding constraint and it broke.** At `0.13` it read
5.47; at `0.20` it read **4.30 at 380px**, under the floor. It moved to
`--bureau-text-secondary`, which read 5.32 there. That was the one string the
alpha rise cost — a single line in one commit — and it is recorded here rather
than in a commit message because anyone raising the alpha again needs to know
the ceiling was already reached once.

**It is back to `--bureau-text-muted` now the wash is off.** Measured against
what it actually sits on, which is the input's `layer-1` fill over the ground
at `rgb(28,28,28)` — not the pane background:

| | on the input fill | on the old wash |
|---|---|---|
| muted `#8f8f8f` | **5.27:1** | 3.74:1 ✗ |
| secondary `#a0a0a0` | 6.52:1 | 4.63:1 |

Muted clears the 4.5 floor with 0.77 to spare. It was muted by design, moved
under duress, and the duress is gone. **If the wash comes back, this string
moves to secondary again** — that is the first thing to check, not the last.

**Measure the placeholder with the placeholder text BLANKED.** Sampling the
field with the glyphs present averages the glyph colour into the background and
returns a number that is wrong in both directions — it read 3.52 before I
noticed, which is neither the real contrast nor a real failure.

## Photography

**The work is the colour.** Project screenshots render at full saturation,
unfiltered, everywhere they appear — rail thumbnails, sampler previews, chat
images, deck slides, the lightbox.

They used to carry `grayscale(.15)` so they would "sit inside the achromatic
system". That was backwards: it spent effort suppressing the only chromatic
material the page actually owns, in service of a rule about the chrome. The
chrome can stay near-neutral without the content having to apologise for
being in colour. 32 real screenshots is the strongest asset here and
desaturating them was a self-inflicted loss.

No hover-reveal either. A filter that lifts on hover implies the resting
state is a preview of the real thing; there is no reason for the resting
state to be worse.

### Replacing an image in place

**Give the new file a new name. Do not overwrite the old one.**

A `next dev` server that has been running since before the swap can go on
serving the OLD bytes for the same URL, and it will do it convincingly:
`.next/cache/images` can be deleted and report empty, `curl` of the raw path
can return the new bytes with a matching checksum, every width of
`/_next/image?url=…&w=…` can return the new dimensions, and a browser with
DevTools "Disable cache" on can still paint the old picture. Every layer you
can inspect agrees, and the screen still disagrees.

That happened here, and it cost four exchanges. The tell is worth writing
down: **when someone says the image is wrong and the file is right, believe
the screen.** The failure is between the file and the paint, and it is not
reachable by checking the file harder. Two specific traps:

- **Checking dimensions is not checking the picture.** A ratio, a byte count
  and a checksum can all be correct while the wrong image is on screen. Open
  the pixels and say what is in them. If the old file has been overwritten,
  recover it — `git show <commit>~1:path > /tmp/old.webp` — and open that too,
  because "what the old one looked like" is what makes a report recognisable
  to the person looking at it.
- **A URL that has never been requested cannot be stale.** Renaming defeats
  every cache in the chain at once — server, optimiser, browser, and any proxy
  between them — without needing to work out which one is holding on. It is
  faster than diagnosing and it cannot half-work.

Restart the dev server after any asset swap regardless. It is free, and this
one had been up for two days.

**The image cache is at `.next/dev/cache/images`, not `.next/cache/images`.**
Deleting the second one succeeds silently, reports nothing, and clears nothing
— it is not where this version of Next keeps optimized images. That cost a long
diagnosis: the same bytes served crisp under a fresh URL and soft under the
real one, reproducibly, which reads like an impossible encoder bug rather than
a cache. It is a cache. Check the entry count before and after clearing, and if
it was already zero, you are deleting the wrong directory.

### Screenshots are lossless

**Ship interface screenshots as lossless WebP and let `next/image` do the only
lossy pass.** It re-encodes everything to WebP at q75 regardless of input, so a
lossy intermediate means the second pass compresses the first pass's artefacts:
small text, thin rules and flat colour are the worst case for that, and it is
visible as softness and colour fringing on type. The tell is fine
high-frequency detail — a background dot-grid disappearing is the first thing
to go.

Measured on the same image at the same output width and quality: a q82 WebP
intermediate produced 51,427 bytes of served data where a lossless one produced
56,256, and the difference is legibility, not file size. `cwebp -lossless` at
source resolution costs roughly half what the PNG does and is pixel-identical.

Do not pre-resize below 3840 either: that is `next/image`'s largest device
size, so it can never request more, and anything smaller throws away detail the
lightbox can use.

Two fixed aspect ratios, set by the actual asset dimensions rather than a
layout choice — do not crop assets to a third ratio:

- **Card / preview imagery** (`previewImage`, used in the project grid) —
  **1:1**. All 7 source previews are square (2048×2048, one at 2160×2160).
- **In-case-study detail imagery** (`images[]`) — **16:9**. All 25 source
  detail images are 3840×2160.

## Do

- Keep all color and radius values as `var()` references to the tokens
  above — never a hardcoded hex, `rgb()`, or `hsl()` literal in a component.
- Set type with a `.type-*` class, always. Pick the role, not the size.
- Choose a spacing **level** by asking how related the two things are.
  Reach for a raw step only for element dimensions.
- Use mono (`type-section` / `type-label` / `type-attribute` / `type-value`) for
  anything that is system chrome (nav, tags, indices, badges, captions) and
  Archivo for anything a human reads as prose.
- Reserve the accent-filled/inverted treatment for "this is live / on."
- Keep the accent structural. If a new use would paint an area rather than
  mark an edge or a state, it belongs in value and form instead.

## Don't

- Don't introduce a **second** hue. The palette has one, and adding another
   costs it its meaning. If something needs to stand out, reach for weight,
   size, underline, or the outline→filled inversion.
- Don't spread the accent onto a surface, a large area, or a gradient. It
  marks structure — an edge, a caret, a state — and stops being a signal the
  moment it becomes a background.
- Don't set `font-family`, `font-weight`, `font-size`, `line-height`, or
  `letter-spacing` inline. Add a `.type-*` class, or a new one if no role
  fits.
- Don't add a font size outside the six steps, and don't set a
  line-height that isn't 1.5× its size.
- Don't use a spacing value that isn't a multiple of 4. If a level feels
  wrong, the grouping is probably wrong.
- Don't add a new border-radius value. Pick one of the four steps —
  `media` 8, `card` 12, `btn` 8, `chip` pill.
- Don't duplicate a token's value directly in a component; reference the
  variable.
- Don't regenerate a component's structure to apply this system — restyle
  the existing markup in place.

## Known judgment calls (from the handoff bundle)

1. **The old blue accent had no achromatic equivalent** — emphasis moved to
   value + form. Partly superseded: an accent exists again at `#7fdd3c`, but
   chosen against the screenshot corpus rather than inherited, and scoped to
   structural marks. Value + form still carry most of the emphasis.
2. **Hero emphasis phrase** ("AI products and workflows") — was blue, now a
   thin `border-strong` underline. Reads as emphasis, not a link.
3. **Status badges (In Progress / Live) used to both read as blue** — they
   became outline and filled/inverted, then were deleted outright with the
   Side of Desk pane. No status badge exists now.
4. **Photography under a neutral palette** — originally `grayscale(.15)`.
   Reversed: the screenshots now run unfiltered and are the page's colour.
5. **Empty/welcome-state copy** — reuses the verbatim hero subtitle; no
   separate welcome copy exists in the source content.

## Non-goals for this pass

Content, copy, links, and metadata are unchanged — this is an identity
layer only. Placeholder content that already existed in the codebase before
this migration (e.g. the "Sample prototype one/two" placeholders in
`side-of-desk.tsx`) is left verbatim; fixing it is a separate, tracked piece
of work.
