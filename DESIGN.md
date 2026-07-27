# EdwinOS Visual Identity — Direction 1D "Bureau"

Source of truth for this repo's visual system. Supersedes all prior design
documentation. Origin: Claude Design handoff bundle (`EdwinOS 1D.dc.html`),
direction "1D — Bureau."

Achromatic dark, near-square edges, one type family (Archivo) with a mono
label voice (IBM Plex Mono). Same content, IA, and component set as before —
this is an identity layer only.

## Color tokens

All colors are CSS custom properties on `:root` in `app/globals.css`, stored
as space-separated RGB triplets so `rgb(var(--x) / <alpha>)` works with
Tailwind's opacity modifiers. Tailwind's `theme.colors` in
`tailwind.config.ts` references these variables directly — it never
duplicates a literal value.

| Token | Value | Tailwind class prefix |
|---|---|---|
| `--bureau-bg` | `#131313` | `bg`, `text-bg` |
| `--bureau-surface` | `#1c1c1c` | `surface` |
| `--bureau-elevated` | `#242424` | `elevated` |
| `--bureau-border` | `#343434` | `border` |
| `--bureau-border-strong` | `#4a4a4a` | `border-strong` |
| `--bureau-text-primary` | `#e8e8e8` | `text-primary` |
| `--bureau-text-secondary` | `#a0a0a0` | `text-secondary` |
| `--bureau-text-muted` | `#8f8f8f` | `text-muted` |
| `--bureau-accent` | `#ffffff` | `accent` |
| `--bureau-on-accent` | `#131313` | `on-accent` |

**`--bureau-text-muted` deviates from the locked palette.** The direction's
literal value is `#767676`, which only reaches 3.4–4.1:1 contrast on these
surfaces — below the WCAG AA floor of 4.5:1 — and it carries real small text
(tags, captions, meta lines). Raised to `#8f8f8f` (4.8–6.1:1, passes AA).
Confirmed with the project owner.

There is no hue anywhere in this palette. The old blue accent (`#1e96fc`)
and its dependents (a "Sunshine" amber scale, a warm-accent orange, a
blue-tinted "golden shadow" glow system) are gone, not deprecated. Emphasis
that used to be color-coded now lives in **value and form**: mono
`text-secondary` for eyebrows/indices, a filled white square + 2px left rule
for the IMPACT marker, underlines for links and hero emphasis, and outline
vs. filled for badge states (see Components below).

## Radius

Flat **2px** everywhere — cards, buttons, chips. Kept as three distinct
named tokens (`--bureau-radius-card`, `--bureau-radius-btn`,
`--bureau-radius-chip`) since the source spec names them separately, even
though all three currently resolve to the same value.

## The 4px rule

Every spacing value, every element dimension, and every font size is a
multiple of 4.

**Line-height is the one derived value, and it is exempt.** It is always
exactly 1.5× the font size, which means it lands off the grid at most
steps — 12px type gets 18px leading, 20px type gets 30px. That is correct
and intentional. Forcing line-height onto multiples of 4 would either
break the 1.5 ratio or constrain the type scale to sizes divisible by 8.
The ratio matters more than the grid here, because leading is a
relationship between two numbers rather than a measurement in space.

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

Available as Tailwind utilities too: `p-within`, `gap-between`,
`mb-group`, `py-section`.

The level is the meaning; the pixel value is an implementation detail. If
two levels both seem plausible, that is a signal to reconsider the
grouping rather than to invent a value in between.

### Raw scale

For element **dimensions** — widths, heights, control sizes — which
express size rather than relatedness, and for the rare spacing case no
level fits:

`--space-4` `8` `12` `16` `20` `24` `32` `40` `48` `56` `64` `80`

`--space-4` (4px) doubles as the documented tight half-step inside
`within`, for optical cases where 8px is visibly too loose.

Grid: 3 columns desktop → 2 at 860px → 1 at 560px.

## Typography

One UI/prose family (**Archivo**, weights 400–800) plus a mono "system
voice" (**IBM Plex Mono**, weights 400–700) for nav, eyebrows, tags,
indices, badges, captions, and the SEND button. Loaded via
`next/font/google` in `app/layout.tsx` as `--font-archivo` /
`--font-plex-mono`; `tailwind.config.ts` maps `font-sans` → Archivo and
`font-mono` → IBM Plex Mono. No serif anywhere in this system.

**Six sizes, every one a multiple of 4, every line-height exactly 1.5×.**
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
| `hero` | 52 / 78 |

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
| `.type-badge` | Plex Mono | 700 | label, uppercase |
| `.type-label` | Plex Mono | 600 | label, uppercase |
| `.type-nav` | Plex Mono | 500 | label, uppercase |
| `.type-meta` | Plex Mono | 400 | label |

At ≤640px the two largest steps move **down the ramp rather than off it**:
`hero` takes the `h2` step (32/48), `h2` takes `subhead` (24/36). No
mobile-only sizes exist.

**These classes are the only way to set type.** Components must not
re-declare `font-family`, `font-weight`, `font-size`, `line-height`, or
`letter-spacing` inline. Seventeen distinct font sizes accumulated in this
codebase precisely because inline re-declaration was available and easier
than picking a role.

Mono carries the "system voice"; Archivo carries all human-readable prose
and headings. That split is what keeps an achromatic palette legible
without color.

## Components

- **Nav** — `.type-nav`, `text-secondary`; hover → `text-primary` +
  1px underline. Availability dot `text-primary`, 8px.
- **Card** — `surface` fill or none, 1px `border`, radius 2. Image **1:1**
  (matches the source preview images — all 7 are square), `grayscale(.15)`.
  Index bottom-right, mono. Hover: border → `border-strong`, image
  `grayscale(0)`, lift 1px.
- **Chip / tag** — 1px `border`, `surface`, radius 2. Tag text `text-muted`
  `.type-meta`; prompt-chip `text-secondary` `.type-body` with a mono `→`
  prefix.
- **Badge** — default = 1px `border-strong` + mono `text-secondary`.
  **Live/active = filled `accent` on `on-accent`** — the one deliberate
  inversion in the system, reserved for "this is on."
- **Input** — rest: `surface`/`border`, muted SEND. Focus: border →
  `text-secondary` + a 3px `rgba(255,255,255,.11)` ring
  (`--bureau-focus-ring`), SEND fills `accent`. Sending: opacity `.55`, mono
  "SENDING" + pulse (`.animate-bureau-pulse`).
- **Callout / doc link** — `surface`, 1px `border`, 2px `accent` left rule
  for emphasis blocks (e.g. IMPACT). Doc link = square "PDF" glyph + UI
  title + mono meta line + `↓`.

## Photography

Full-saturation photos are the only color on the page. Apply
`grayscale(.15)` so they sit inside the achromatic system while staying
photographic; drop to `grayscale(0)` on hover.

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

## Don't

- Don't introduce a second hue. If something needs to stand out, reach for
  weight, size, underline, or the outline→filled badge inversion — not
  color.
- Don't set `font-family`, `font-weight`, `font-size`, `line-height`, or
  `letter-spacing` inline. Add a `.type-*` class, or a new one if no role
  fits.
- Don't add a font size outside the six steps, and don't set a
  line-height that isn't 1.5× its size.
- Don't use a spacing value that isn't a multiple of 4. If a level feels
  wrong, the grouping is probably wrong.
- Don't add a new border-radius value. Everything is 2px (or 9999px for
  fully-round pills).
- Don't duplicate a token's value directly in a component; reference the
  variable.
- Don't regenerate a component's structure to apply this system — restyle
  the existing markup in place.

## Known judgment calls (from the handoff bundle)

1. **No achromatic equivalent for the old blue accent existed** — emphasis
   moved to value + form (see Components above).
2. **Hero emphasis phrase** ("AI products and workflows") — was blue, now a
   thin `border-strong` underline. Reads as emphasis, not a link.
3. **Status badges (In Progress / Live) used to both read as blue** — now
   default = outline, Live = filled/inverted, the system's one inversion.
4. **Photography under a neutral palette** — `grayscale(.15)`, adjustable.
5. **Empty/welcome-state copy** — reuses the verbatim hero subtitle; no
   separate welcome copy exists in the source content.

## Non-goals for this pass

Content, copy, links, and metadata are unchanged — this is an identity
layer only. Placeholder content that already existed in the codebase before
this migration (e.g. the "Sample prototype one/two" placeholders in
`side-of-desk.tsx`) is left verbatim; fixing it is a separate, tracked piece
of work.
