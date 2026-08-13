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
- the `Live` chip (`.chip-solid`)

**Where it is forbidden.** It is never a surface, never a large painted
area, never a gradient. The accent marks an edge or a state; the moment it
paints a region it stops being a signal and becomes a theme.

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
that element is a control. Three entries today: `.chip-solid`, the SEND fill,
and the 8px IMPACT marker — the same three listed above.

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

**What marks the boundary now is the input itself, plus the dock's `--space-20`
padding, and nothing else.** There is no line. That is a real change and worth
knowing before it is "fixed" back:

- Content does **not** scroll under the input. `.pane-scroll` clips at its own
  box, and its bottom edge is exactly the dock's top edge — measured, both at
  y=810 in a 900px viewport. So text never touches or overlaps the field.
- `.pane-scroll` has `padding-bottom: 0`, so a line **can** be cut mid-glyph at
  that clip. With the rule, the cut read as content passing under an edge;
  without it, the cut has no explanation.

The gap is 20px, so the cut happens well clear of the field rather than against
it, and the pill's own border still says "a different kind of thing starts
here". If the bare cut ever reads badly, the fix is a short scrim at the bottom
of `.pane-scroll` — not the rule back, which is what was wrong.

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

**`hero` is the exception: 52 / 60, not 52 / 78.** Display type tightens as
it scales — the larger the size, the less relative leading it needs, because
the eye tracks a line return by its horizontal distance, not its vertical
one. At 78px a three-line hero reads as three separate lines instead of one
headline. 60px is 1.15×, and still a multiple of 4. The ratio holds at every
other step, and this is the only place it is allowed not to.

Other exceptions, all deliberate: **1px** borders and hairlines, the
**2px** radii below, and **9999px** for fully-round pills. Letter-spacing
is optical tracking rather than layout, is sub-pixel by nature, and is
also exempt.

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
+ 2×1px border. Prompt chips and the rail's document rows are 42; rail project
rows are 56 because they carry a thumbnail. **This used to be derived from the
chat input's 66px height, and no longer is** — the field is 50px now, and a
claim that one number explains both would be false.

WCAG **2.5.8 (AA)** requires 24×24 and every control clears it. **2.5.5 (AAA)**
asks for 44×44, and this system takes the AA floor plus the density in exchange
— a portfolio read on a laptop is not a phone keypad.

**Three exceptions at `--space-44`.** Two are on mobile and are navigation: the
menu toggle and the brand mark. On a phone the rail is hidden behind the sheet,
so these are the only way *out* of a view and the only way *home*. A control
that is the sole route somewhere does not get to be 18px because the rest of
the system likes 42.

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

One UI/prose family (**Archivo**, weights 400–800) plus a mono "system
voice" (**IBM Plex Mono**, weights 400–700) for nav, eyebrows, tags,
indices, badges, captions, and the SEND button. Loaded via
`next/font/google` in `app/layout.tsx` as `--font-archivo` /
`--font-plex-mono`; `tailwind.config.ts` maps `font-sans` → Archivo and
`font-mono` → IBM Plex Mono. No serif anywhere in this system.

**Six sizes, every one a multiple of 4. Line-height is 1.5× at every step
except `hero` — see the exception under The 4px rule above.**
**12px is the floor** — there is no step below it, so nothing on the site
renders below a reasonable legibility threshold. The size/line-height
pairs are tokens (`--type-*-size` / `--type-*-lh`) so the two cannot drift
apart.

| Step | Size / line-height |
|---|---|
| `label` | 12 / 18 |
| `body` | 16 / 24 |
| `title` | 20 / 30 |
| `subhead` | 24 / 36 |
| `h2` | 32 / 48 |
| `hero` | 52 / 60 — the one non-1.5× step |

There are more classes than sizes: several share a size and differ only in
voice. Size is the scale; family, weight, and case are the voice.

| Class | Family | Weight | Step |
|---|---|---|---|
| `.type-hero` | Archivo | 800 | hero |
| `.type-h2` | Archivo | 700 | h2 |
| `.type-subhead` | Archivo | 700 | subhead |
| `.type-title` | Archivo | 700 | title |
| `.type-card-h3` | Archivo | 600 | body |
| `.type-body` | Archivo | 400 | body |
| `.type-caption` | Archivo | 400 | label — supporting prose |
| `.type-badge` | Plex Mono | 700 | label, uppercase |
| `.type-label` | Plex Mono | 600 | label, uppercase |
| `.type-nav` | Plex Mono | 500 | label, uppercase |
| `.type-meta` | Plex Mono | 400 | label |

At ≤640px the two largest steps move **down the ramp rather than off it**:
`hero` takes the `h2` step (32/48), `h2` takes `subhead` (24/36). No
mobile-only sizes exist.

The classes live in `@layer components`, so Tailwind utilities — which
come later in the cascade — can override a single property without an
inline style. A state-driven weight change is `font-bold`, not
`style={{ fontWeight }}`.

**These classes are the only way to set type.** Components must not
re-declare `font-family`, `font-weight`, `font-size`, `line-height`, or
`letter-spacing` inline. Seventeen distinct font sizes accumulated in this
codebase precisely because inline re-declaration was available and easier
than picking a role.

Mono carries the "system voice"; Archivo carries all human-readable prose
and headings. That split is what keeps an achromatic palette legible
without color.

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

- **Nav** — `.type-nav`, `text-secondary`; hover → `text-primary` +
  1px underline. Availability dot `text-primary`, 8px.
- **Card** — `surface` fill or none, 1px `border`, `radius-card`. Image
  **1:1** (matches the source preview images — all 7 are square), unfiltered.
  Index bottom-right, mono. Hover: border → `border-strong`, lift 1px.
- **Grid gutter** (Selected Work) — `group` (32px).
- **Chip / tag** — see **Chips** below; one primitive, pill radius. Tag text
  `text-muted` `.type-meta`; prompt-chip `text-secondary` `.type-body` with a
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

One primitive, two sizes, three fills. Before this there were three separate
inline-styled implementations — the prompt chips, `In Progress`, and `Live` —
each re-deriving its own padding and hover.

**Size is chosen by role, not by taste.**

| Class | Type step | Padding | For |
|---|---|---|---|
| `.chip` | body | `8 / 16` | an action the visitor can take |
| `.chip-sm` | label | `4 / 8` | metadata about something else |

An action needs room to hit and reads at body size; a tag describing a card
does not get to be the same weight as the thing it describes.

**Fill:**

- **default** — `surface` + hairline. The resting state of everything.
- **`.chip-solid`** — inverted. The system's one inversion, reserved for a
  state that is true right now (`Live`).
- **`.chip-quiet`** — no fill, no border, for a tag that must not compete.

Hover lives in CSS, not React state. Three components each held a `useState`
for it, which is both more code and worse: a hover that waits on a re-render
is a hover that can miss.

The `5px 9px` optical padding the status badges carried is gone. It
compensated for uppercase mono tracking against a 2px corner; at pill radius
that asymmetry is not visible, so the exception retires rather than being
inherited.

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
- Use mono (`type-badge` / `type-label` / `type-nav` / `type-meta`) for
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
3. **Status badges (In Progress / Live) used to both read as blue** — now
   default = outline, Live = filled/inverted, the system's one inversion.
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
