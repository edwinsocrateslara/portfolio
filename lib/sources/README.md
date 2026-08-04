# Sources

Everything in `lib/edwin-context.md` (the `/api/chat` system prompt) and
`lib/scripted-responses.ts` must be traceable to one of the three files in
this directory. Anything that isn't has no basis and should be removed
rather than reworded.

| File | Covers |
|---|---|
| `framer-export.json` | Case-study copy for the seven portfolio projects |
| `resume.txt` | Biography — roles, dates, employers, education, skills |
| `voice.md` | Edwin's own writing for anything the other two don't cover |

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
