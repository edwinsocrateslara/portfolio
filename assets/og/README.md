# Open Graph card — the font

`archivo-400-name-subset.ttf` is Archivo 400, subset by the Google Fonts API to
the letters of "Edwin Socrates Lara" and nothing else (3.5KB). It is read at
build time by `app/opengraph-image.tsx`; it is not served.

**Why a file at all:** `next/og` renders with satori, which reads TTF, OTF or
WOFF — not the woff2 that `next/font` downloads for the page. Fetching it during
the build would add a network dependency for one image.

**If the name on the card changes, regenerate it.** A letter missing from the
subset does not fail the build: satori draws it in the Noto Sans that `next/og`
bundles, beside Archivo letters, with no warning. Checked by rendering "Edwin
Quayle 7" against this file — Q, u, y and 7 came out in Noto. To regenerate:

    curl -s "https://fonts.googleapis.com/css2?family=Archivo:wght@400&text=<URL-encoded text>"

and download the `truetype` URL that comes back (no browser user agent, so the
API answers with TTF).

Archivo is licensed under the SIL Open Font License 1.1, with no Reserved Font
Name; the licence is `OFL.txt` beside this file.
