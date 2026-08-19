# Sources

Everything in `lib/edwin-context.md` (the `/api/chat` system prompt) and
`lib/scripted-responses.ts` must be traceable to one of the files in
this directory. Anything that isn't has no basis and should be removed
rather than reworded.

| File | Covers |
|---|---|
| `framer-export.json` | Case-study copy for the seven portfolio projects |
| `resume.txt` | Biography — roles, dates, employers, education, skills |
| `voice.md` | Edwin's own writing for anything the others don't cover |
| `meridian-case-study.txt` | Verbatim text of the 21-slide Meridian case study deck |

## What `framer-export.json` does *not* cover

**It is an export of the "Portfolio Projects" CMS collection only — not
the Framer site's complete copy.**

Framer's static page content lives outside the CMS and no export can
reach it. At minimum the live site also has an **About section** with a
hero line, a personal paragraph, and two photos, none of which appear in
this file.

So the absence of a line from `framer-export.json` does **not** prove it
was invented. A future audit should treat this file as authoritative for
project case-study copy and silent about everything else. Static page
copy belongs in `voice.md`, transcribed from the live site.

## What is generated, and what is checked

`lib/edwin-context.md` is the `/api/chat` system prompt. Two of its
sections are no longer hand-written:

- **Projects** is generated from `lib/projects.ts` by
  `scripts/build-context.mjs`. Do not edit it by hand; the markers in the
  file delimit the generated region. `npm run check:context` fails if it
  is out of date.
- **Case Study Deck** is generated from `meridian-case-study.txt` by the
  same script, into its own pair of markers. `npm run check:context` fails
  if it is out of date.
- **In His Own Words** is copied from `voice.md`, and the scripted answers
  in `lib/voice-answers.ts` are asserted character-for-character against
  it by `npm run check:voice`.

`npm run check:sources` runs both. Add it to CI.

The Projects section was hand-written prose until it drifted: it
re-attributed the Meridian app's userbase to the institution's totals,
merged Coinley's decision text into its challenge, and reintroduced an
"App Store" specificity that had already been removed from
`lib/projects.ts` once. Generating it removes the possibility.

## Titles: the résumé and LinkedIn are the authority, not the export

`lib/projects.ts` deviates from `framer-export.json` in exactly two ways, both
documented: **role titles** (below) and **source typos** (the section after).
Nothing else differs — verified by checking every string in `projects.ts` for
verbatim containment in the export.

`framer-export.json` says **"Lead product designer" on every row**. It is
wrong for two of the seven, and it is wrong in two different directions,
so this is not a single find-and-replace.

`lib/projects.ts` sources `role` from `resume.txt`, which is kept in
agreement with LinkedIn. Where the two disagree with the export, they win:

| Project | Export says | Actual | Why |
|---|---|---|---|
| Meridian (`retail-banking`) | Lead product designer | **Senior Product Designer** | Résumé and LinkedIn agree |
| Volkswagen (`car-comparison`) | Lead product designer | **Product Designer** | Falls in the Dec 2015–May 2019 contracting period, which LinkedIn lists as Product Designer |

The Volkswagen case is the subtle one: the work sits inside the
contracting block, so its title follows that period rather than the
seniority of the surrounding permanent roles. `resume.txt` lists that
block as Product Designer for the same reason.

**Two fields carry a title, and both had to be corrected.** `role` is the
structured field; `roleDescription` is export prose that *opens* with a
title ("Lead product designer. I created…"). Fixing only `role` left the
two contradicting each other a few blocks apart in the same conversation —
the card said Senior, the body said Lead. Both are now overridden, and
both carry a comment at the field so an audit does not revert them to the
export.

## Typo corrections against the export

`framer-export.json` remains the source for case-study copy. It is also the
CMS's raw output, defects included, and `lib/projects.ts` now carries
documented corrections for six of them. Each is commented at the field, the
same way the title overrides are, so an audit finds them accounted for rather
than flagging them as invented — and so nobody "restores" them from the
export.

| Project | Export says | Corrected to |
|---|---|---|
| Meridian | "**Users** reviews for the Meridian app" | "**User** reviews" |
| Meridian | "poor user experience, **and** UI, and lack of key features" | "poor user experience, UI, and lack of key features" |
| Volkswagen | "Since **it's** launch" | "Since **its** launch" |
| Volkswagen | "these design **decision**" | "these design **decisions**" |
| Complex NTWRK (seller dashboard) | "and **S**ellers were expected" | "and **s**ellers were expected" (mid-sentence) |
| Complex NTWRK (e-commerce) | "not **on on** Complex.com's homepage", and the "When users clicked through from Instagram or TikTok," clause repeated twice | both fixed |

These are spelling, grammar and duplication only. No claim, number or
emphasis is changed by any of them.

`projectTitle` is the other declared gap: the seven values are
repo-authored and trace to nothing in this directory. They are listed in
`REPO_AUTHORED_FIELDS` in `lib/projects.ts`, which the generator reads and
notes in its output, so an audit finds them already accounted for rather
than flagging them as invented.

## `meridian-case-study.txt`, and the motusbank / Meridian split

The deck was extracted from `public/meridian-case-study.pdf` with
`pdftotext -layout`, page-delimited and otherwise untouched. It is the
source for `lib/case-study-deck.ts` and for the generated Case Study Deck
section of `edwin-context.md`.

**The deck names the product motusbank. The site names the client
Meridian.** Both are correct: motusbank was Meridian Credit Union's
digital-only bank, and the deck is a real document that says so. The
difference is preserved rather than harmonised, because rewriting the
source to match the site is exactly the drift this directory exists to
prevent.

The one line that reconciles them is Edwin's, and lives in `voice.md`
under "motusbank and Meridian". `lib/voice-answers.ts` reads it by id, so
`npm run check:voice` asserts it against the source like every other
scripted string.

`alt` on the 21 slides is repo-authored, like `alt` on project images: the
PDF carries none. It was written from viewing each rendered slide, and is
noted as a gap at the top of `lib/case-study-deck.ts`.

## `check-content-frozen.mjs` is for branches that must NOT touch this
## directory — not for branches whose purpose is touching it

**Running it against a content branch is a category error.** It was written
for `experiment/impeccable`, where an agent was allowed to rewrite
presentation and forbidden from touching the files that encode where copy
comes from. Pointed at that kind of branch it is exactly right. Pointed at a
branch whose job is editing `voice.md` or `resume.txt`, every finding is a
false positive, and the report reads like six problems when it is six
intended edits.

Two things make this easy to get wrong, and both are worth knowing before
running it:

- **It is not one of the four gates.** `npm run build` runs `check:sources`,
  `check:design` and `check:chips`. This script is in neither the build chain
  nor CI. Its own header says so and says why: compared against `main` from
  `main` it is self-referential and passes trivially, and a gate that always
  passes is worse than no gate.
- **There is no stored baseline to update.** `--base` is a runtime argument
  defaulting to `main`. Nothing persists, so "resolving" a failure by revising
  a baseline is not a thing that can be done. After a content branch merges,
  the tool passes because the comparison target moved — not because anything
  was reconciled.

So a source-layer edit is not made legitimate by a gate. It is made
legitimate by being written down. That is what the section below is for.

## Source-layer edits on `feature/about-page`

Six frozen paths changed on that branch. Each was deliberate and reviewed;
the list is here so the change is a record rather than something a merge
absorbed silently.

| Path | Commits | Why |
|---|---|---|
| `voice.md` | `0abd941`, `33bfb11` | Two currently-reading books added for the About page. Downtime line rewritten — Edwin's own words, replacing the previous sentence rather than adding to it. |
| `resume.txt` | `0d01aca` | Bullets restored. The file had flattened the source document's bullets into prose and the structure did not survive: sentence counts disagreed with the document on three of six roles. Titles unchanged — the contracting period stays Product Designer, per the table above. |
| `edwin-context.md` | `33bfb11` | The § Outside Work quote follows `voice.md`. Hand-maintained: it sits outside both generated blocks, so `build:context` does not touch it. |
| `scripted-responses.ts` | `8104dc2`, `33bfb11` | Vibe-project slug resolution; the downtime answer follows `voice.md`. |
| `voice-answers.ts` | `0abd941` | Currently-reading entries, so the About page and the chat cannot disagree about what Edwin is reading. |
| `check-voice.mjs` | `0abd941`, `fa3b40d` | Book fields added, then the About page's lede. The comparison is now whitespace-normalised on both sides — `voice.md` hard-wraps and JSX wraps differently, so the raw substring test returned false for a correct sentence. |

**Still unguarded, and named here so it is not mistaken for covered:**
`lib/scripted-responses.ts` holds the downtime paragraph as an inline literal.
`check-voice.mjs` reads `voice-answers.ts`, not that file, so the two can
drift. The repo has the right pattern for it — the deck response uses
`voiceAnswerById()` precisely so the gate catches it — but moving the
downtime answer into `VOICE_ANSWERS` changes its chip routing, so it is a
separate decision rather than a silent fix.
