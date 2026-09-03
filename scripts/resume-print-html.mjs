// The résumé as a printable document. Chrome renders this and prints it to
// public/edwin-lara-resume-2026.pdf; nothing serves it and no route points at
// it.
//
// ── WHY THIS IS NOT THE RÉSUMÉ PANE ───────────────────────────────────────
//
// The obvious move is to print components/resume/resume-pane.tsx and get the
// site's typography for free. It is the wrong move, and not for a technical
// reason: THE PANE AND THE PDF ARE DIFFERENT MEDIA. The pane is 15px type,
// light-on-dark, in a scrolling column beside a rail that already carries the
// name, the email and the LinkedIn. A résumé PDF is ~9.5pt, ink on paper, has
// no rail beside it, and has to survive a printer. Printing the pane would
// produce a dark rectangle with no contact details on it.
//
// What carries over is the TYPE, which is the part that was actually meant by
// "the site's typography": Archivo and IBM Plex Mono, the same families, the
// same weights, the real faces rather than a synthesised bold. Those are what
// make this recognisably the same document as the site. The sizes, the colour
// and the grid are print's own.
//
// ── FONTS COME OVER THE NETWORK, ONCE, AND ARE CHECKED ────────────────────
//
// next/font caches Archivo under .next/static/media with a content-hashed
// filename, and .next is gitignored and rebuilt — pointing at it would break
// the first time somebody cleaned. So this links the same faces from Google
// Fonts, which is where next/font gets them.
//
// That means build:resume needs the network, and a missed fetch would silently
// produce a Helvetica résumé that looks nearly right. So it is not trusted:
// build-resume.mjs waits on document.fonts.ready and then asserts the faces
// actually loaded, and refuses to write a PDF if they did not. A wrong
// artefact is worse than no artefact — the whole reason the placeholder PDF
// was a gate rather than a comment.
const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

const CSS = `
  /* PAGE GEOMETRY IN THE STYLESHEET, NOT IN THE PRINT CALL. printToPDF takes
     margins as inches and would put half the layout in a JS object and half
     here. @page keeps the whole document description in one place, and
     printToPDF is told preferCSSPageSize. */
  @page { size: Letter; margin: 0.55in 0.62in; }

  :root {
    --ink:        #131313;
    --ink-soft:   #3a3a3a;
    --ink-quiet:  #6b6b6b;
    --rule:       #d8d8d8;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  html {
    font-family: Archivo, "Helvetica Neue", Arial, sans-serif;
    /* 9.6pt. Below about 9 a résumé stops being read and starts being
       skimmed for keywords; above 10.5 this one runs to three pages. */
    font-size: 9.6pt;
    line-height: 1.42;
    color: var(--ink);
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* ── head ───────────────────────────────────────────────────────────── */
  .name {
    font-size: 20pt;
    font-weight: 700;
    letter-spacing: -0.015em;
    line-height: 1.05;
  }
  .contact {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 7.6pt;
    letter-spacing: 0.01em;
    color: var(--ink-quiet);
    margin-top: 5pt;
    padding-bottom: 7pt;
    border-bottom: 0.6pt solid var(--rule);
  }
  .summary { margin-top: 9pt; color: var(--ink-soft); }

  /* ── sections ───────────────────────────────────────────────────────── */
  h2 {
    font-size: 7.8pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.14em;
    color: var(--ink-quiet);
    margin-top: 15pt;
    padding-bottom: 3.5pt;
    border-bottom: 0.6pt solid var(--rule);
  }

  /* A ROLE MUST NOT SPLIT. An employer line orphaned at the foot of page one
     with its bullets on page two is the single most common defect in a
     generated résumé, and it is one property. "avoid" is a request rather
     than a guarantee — a role taller than a page still breaks — which is why
     the bullets carry "orphans" / "widows" as well. */
  .role { break-inside: avoid; page-break-inside: avoid; margin-top: 10pt; }
  .role:first-of-type { margin-top: 7pt; }

  /* TWO ROWS, TWO COLUMNS. Employer over title on the left, location over
     dates on the right — the pairing a reader scans, which is WHO and WHEN in
     one glance rather than employer-and-place run together.

     It used to be one row of "employer location …… dates" with the title
     orphaned on a line of its own below. The title is the more important of
     the two left-hand strings and it had no right-hand partner; the location
     was glued to the employer with a space and read as part of the company
     name. */
  .role-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 12pt;
  }
  .employer { font-size: 10.6pt; font-weight: 700; letter-spacing: -0.005em; }
  .title { font-style: italic; color: var(--ink-soft); }

  /* THE RIGHT COLUMN IS ONE COLUMN, so it is set in one face. Location was
     8.4pt sans while dates were 7.8pt mono, which was invisible when they sat
     on different lines with different neighbours and is not now that they are
     stacked against the same edge. Both are data — a place and a span — and
     the mono is what this system sets data in. */
  .location,
  .dates {
    font-family: "IBM Plex Mono", ui-monospace, monospace;
    font-size: 7.8pt;
    color: var(--ink-quiet);
    white-space: nowrap;
  }

  .group-label { font-weight: 600; margin-top: 5pt; }

  ul { list-style: none; margin-top: 3.5pt; }
  li {
    position: relative;
    padding-left: 10pt;
    margin-top: 2.6pt;
    color: var(--ink-soft);
    orphans: 2;
    widows: 2;
  }
  /* An en dash, not a bullet glyph: the site sets lists the same way, and a
     round bullet at this size prints as a smudge on a laser printer. */
  li::before { content: "–"; position: absolute; left: 0; color: var(--ink-quiet); }
  /* A LABELLED BULLET KEEPS ITS LABEL BOLD. resume.txt writes these as
     "- Miles: Designed and shipped…" and the label is the scannable half. */
  li b { font-weight: 700; color: var(--ink); }

  /* ── skills ─────────────────────────────────────────────────────────── */
  .band { margin-top: 3.5pt; color: var(--ink-soft); break-inside: avoid; }
  .band b { font-weight: 700; color: var(--ink); }

  /* ── education ──────────────────────────────────────────────────────── */
  .edu {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10pt;
    margin-top: 3pt;
    break-inside: avoid;
  }
  .edu-q { font-weight: 600; }
  .edu-i { color: var(--ink-quiet); font-size: 8.6pt; }
`

/** "Miles: Designed and shipped…" → the label in bold, the rest plain. */
function bullet(text) {
  const m = text.match(/^([A-Z][A-Za-z0-9 &/]{1,28}):\s+(.*)$/s)
  return m ? `<b>${esc(m[1])}:</b> ${esc(m[2])}` : esc(text)
}

/**
 * @param resume  the parsed lib/resume.ts shape
 * @param hash    stamped into a meta tag; Chrome copies it into the PDF's
 *                document metadata, which is where check:docs reads it from.
 */
export function buildPrintHtml(resume, hash) {
  const roles = resume.roles
    .map(
      (r) => `
    <div class="role">
      <div class="role-row">
        <span class="employer">${esc(r.employer)}</span>
        <span class="location">${esc(r.location)}</span>
      </div>
      <div class="role-row">
        <span class="title">${esc(r.title)}</span>
        <span class="dates">${esc(r.dates)}</span>
      </div>
      ${r.groups
        .map(
          (g) =>
            (g.label ? `<div class="group-label">${esc(g.label)}</div>` : "") +
            `<ul>${g.bullets.map((b) => `<li>${bullet(b)}</li>`).join("")}</ul>`
        )
        .join("")}
    </div>`
    )
    .join("")

  const bands = resume.skills
    .map((b) => `<div class="band"><b>${esc(b.label)}:</b> ${esc(b.items.join(", "))}</div>`)
    .join("")

  const education = resume.education
    .map(
      (e) =>
        `<div class="edu"><span class="edu-q">${esc(e.qualification)}</span><span class="edu-i">${esc(e.institution)}</span></div>`
    )
    .join("")

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${esc(resume.name)} — Resume</title>
<meta name="author" content="${esc(resume.name)}">
<!-- The stamp. Chrome carries <meta name="subject"> into the PDF's /Subject,
     which is where scripts/check-docs.mjs reads it back from. -->
<meta name="subject" content="resume-source-hash:${esc(hash)}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:ital,wght@0,400;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=block" rel="stylesheet">
<style>${CSS}</style>
</head>
<body>
  <div class="name">${esc(resume.name)}</div>
  <div class="contact">${esc(resume.contact.join("  ·  "))}</div>
  <div class="summary">${esc(resume.summary)}</div>

  <h2>Experience</h2>
  ${roles}

  <h2>Skills &amp; Methodologies</h2>
  ${bands}

  <h2>Education</h2>
  ${education}
</body>
</html>`
}
