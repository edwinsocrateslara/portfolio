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

## Spacing

No dedicated spacing tokens — Tailwind's default scale already matches the
spec's 8px-derived scale exactly at these keys: `1`=4px, `2`=8px, `3`=12px,
`4`=16px, `6`=24px, `8`=32px, `14`=56px, `16`=64px. Use those directly (as
Tailwind classes or as the literal px numbers in inline styles, matching
this codebase's existing convention).

Named spacing concepts from the spec, used as literals:
- Section gap: `64px` desktop, `40px` mobile
- Grid gutter (Selected Work grid): `26px`
- Grid: 3 columns desktop → 1 column mobile

## Typography

One UI/prose family (**Archivo**, weights 400–800) plus a mono "system
voice" (**IBM Plex Mono**, weights 400–600) for nav, eyebrows, tags,
indices, badges, captions, and the SEND button. Loaded via
`next/font/google` in `app/layout.tsx` as `--font-archivo` /
`--font-plex-mono`; `tailwind.config.ts` maps `font-sans` → Archivo and
`font-mono` → IBM Plex Mono. No serif anywhere in this system.

Type scale — implemented both as CSS utility classes in `globals.css`
(`.type-*`) and as Tailwind `fontSize` entries (`text-*`) referencing the
same literal values, for use wherever fits the surrounding code:

| Role | Spec | Mobile |
|---|---|---|
| `hero` | Archivo 800, 52px/1.04, -1.6px | 30px/1.06, -1px |
| `h2` | Archivo 700, 34px/1.10, -1px | 26px/1.12, -0.6px |
| `card-h3` | Archivo 600, 17px/1.25 | — |
| `prose` | Archivo 400, 16px/1.7 (chat body) | — |
| `prose-2` | Archivo 400, 15px/1.55 (landing body) | — |
| `label` | Plex Mono 600, 10px/1, +1.4px, uppercase | — |
| `nav` | Plex Mono 500, 11px/1, +1.4px, uppercase | — |
| `meta` | Plex Mono 400/500, 11px/1 (captions) | — |

Mono carries the "system voice"; Archivo carries all human-readable prose
and headings. That split is what keeps an achromatic palette legible
without color.

## Components

- **Nav** — mono 11 uppercase, `text-secondary`; hover → `text-primary` +
  1px underline. Availability dot `text-primary`, 6px.
- **Card** — `surface` fill or none, 1px `border`, radius 2. Image **1:1**
  (matches the source preview images — all 7 are square), `grayscale(.15)`.
  Index bottom-right, mono. Hover: border → `border-strong`, image
  `grayscale(0)`, lift 1px.
- **Chip / tag** — 1px `border`, `surface`, radius 2. Tag text `text-muted`
  mono 9; prompt-chip `text-secondary` UI 13 with a mono `→` prefix.
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
- Keep spacing to the documented scale.
- Use mono (`type-label` / `type-nav` / `type-meta`) for anything that is
  system chrome (nav, tags, indices, badges, captions) and Archivo for
  anything a human reads as prose.
- Reserve the accent-filled/inverted treatment for "this is live / on."

## Don't

- Don't introduce a second hue. If something needs to stand out, reach for
  weight, size, underline, or the outline→filled badge inversion — not
  color.
- Don't add a new border-radius value. Everything is 2px.
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
