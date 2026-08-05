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

## `role` is the one deliberate override

`lib/projects.ts` sources `role` from `resume.txt`, not from the export.
The export says "Lead product designer" on every row, including Meridian
and Volkswagen, where the résumé says Senior. The résumé wins. That
exception is commented at the field itself so it doesn't get "corrected"
back.

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
