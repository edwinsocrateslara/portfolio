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

## `role` is the one deliberate override

`lib/projects.ts` sources `role` from `resume.txt`, not from the export.
The export says "Lead product designer" on every row, including Meridian
and Volkswagen, where the résumé says Senior. The résumé wins. That
exception is commented at the field itself so it doesn't get "corrected"
back.
