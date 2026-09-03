# Sources

**A file in this directory is read by code.** `resume.txt` is parsed into the
Résumé pane by `lib/resume.ts`. `voice.md` is asserted character-for-character
by `npm run check:voice`. `meridian-case-study.txt` is generated into the
system prompt by `scripts/build-context.mjs`. Editing one changes the site or
fails a build; that is what makes it a source.

Anything the chat says about Edwin's biography, his own words, or the deck must
be traceable to one of them. Project case-study copy is NOT sourced here — it
is authored in `lib/projects.ts`, which is its source of truth.

| File | Covers | Read by |
|---|---|---|
| `resume.txt` | Biography — roles, dates, employers, education, skills | `lib/resume.ts` |
| `voice.md` | Edwin's own writing for anything the others don't cover | `scripts/check-voice.mjs` |
| `meridian-case-study.txt` | Verbatim text of the 21-slide Meridian deck | `scripts/build-context.mjs` |

`framer-export.json` used to sit here. It was a snapshot of the Framer CMS at
migration and nothing ever read it; the copy was authored and corrected in
`lib/projects.ts`, which outranks it. It has been deleted — git history holds
it. The corrections it once justified are not indexed anywhere, deliberately:
a list of deviations from a file that no longer exists has nothing to be a
deviation from.

## Numbers are written as digits

**A count is a numeral, never a word.** "3 votes", not "three votes". "14
weeks", not "fourteen weeks". "10 things at the top of the list", not "ten".

THE REASON IS SCANNING, NOT STYLE. A portfolio is read the way a resume is
read — swept for the thing the reader came for. A numeral survives that sweep
and a word does not: "63%" and "457" catch an eye moving down a page, and
"sixty-three percent" reads as prose to be skipped. It is the same argument as
the type ramp's, one layer down.

It also makes a figure CHECKABLE. `check:numbers` finds figures by pattern; a
spelled-out number is invisible to it, so a word is a claim no gate can see.

### What the rule does NOT cover

A rule that does not name its own boundaries gets applied wrongly by whoever
reads it next. Three exclusions, all deliberate:

**Ordinals stay words.** "the first year", "its first month", "my first step".
"1st year" is worse to read and no easier to scan, and most of the "first"s in
this repo are not numbers at all — `mobile-first`, `code-first`, `AI-first`,
`first-click testing`. Converting those produces nonsense.

**"One" as a pronoun stays a word.** "one of my strengths", "one thing I
uncovered", "one with navigation labels and one without", "3 votes can outrank
30 if one maps to a live commitment", "the tool reads 4, one per product area".
None of these is a count; "1 of my strengths" is wrong rather than ugly. The
test: if it could be replaced by "a" or "the one", it is not a number.

**Units stay words.** "$26 billion in managed assets". `billion` is a unit like
`%` or `M`, and expanding it gives "$26,000,000,000", which nobody wants to
read. The digits before it are what the rule is about, and they already are
digits.

### Where it applies

Everything a visitor can read: `voice.md`, `resume.txt`, and the content fields
of `lib/projects.ts`, `lib/vibe-projects.ts`, `lib/case-study-deck.ts` and
`lib/scripted-responses.ts` — including `alt` text, which is content a screen
reader reads out.

NOT code comments. Those are prose for whoever is editing the file, and this
document has no opinion about how they are written.

Applied across the content layer in one pass: 38 conversions, 11 pronouns and
24 ordinals left alone, and one compound — "ten-year-old" — which became
"10-year-old" because the digits scan and the hyphen already carries the
grammar.

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

### `resume.txt` has three generated artefacts, and they are NOT built by `npm run build`

`public/edwin-lara-resume-2026.pdf`, `.docx` and `.md` are written from
`resume.txt` by `npm run build:resume`. All three are committed.

**After editing `resume.txt`, run `npm run build:resume`.** If you forget,
`npm run check:docs` fails and names the file — every generated document
carries a hash of the source it was built from, and the gate compares it
against `resume.txt` on disk.

It is a script rather than a build step because the PDF is printed by a
real headless Chrome, and there is no browser on Vercel. That trade is
argued in full at the top of `scripts/build-resume.mjs`; the short version
is that generating at build time would make the files *fresh*, and the
hash gate makes staleness *impossible to ship*, which is the stronger of
the two and works on a machine with no Chrome.

The PDF also needs the network, once, for the Archivo and IBM Plex Mono
faces. A run without it fails loudly rather than writing a Helvetica
résumé that looks nearly right.

The Projects section was hand-written prose until it drifted: it
re-attributed the Meridian app's userbase to the institution's totals,
merged Coinley's decision text into its challenge, and reintroduced an
"App Store" specificity that had already been removed from
`lib/projects.ts` once. Generating it removes the possibility.

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
| `resume.txt` | `0d01aca` | Bullets restored. The file had flattened the source document's bullets into prose and the structure did not survive: sentence counts disagreed with the document on three of six roles. Titles unchanged. |
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

## Source-layer edit: removing the export

`voice.md` changed when `framer-export.json` was deleted. Its opening rule
named the export as one of three permitted sources, and its editor notes
pointed at it for the static-page gap. Both now name `resume.txt` only.

It is recorded here for the same reason the table above exists: `voice.md` is
frozen, so an edit to it is a decision rather than something a merge absorbs.
No sentence Edwin wrote was touched — only the two operational notes about
where copy may come from.
