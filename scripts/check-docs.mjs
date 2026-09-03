// Every document the site offers must actually be the document it claims to be.
//
// WHY THIS EXISTS. The résumé placeholder was accurate, documented and shipping:
// a one-page PDF reading "PLACEHOLDER - NOT A RESUME", described precisely in a
// comment above the entry that points at it. The comment preserved the intent
// and protected nothing — the build passed, and a recruiter following the most
// important link on the site would have downloaded it.
//
// That is the pattern this file exists to break. A known defect that a gate can
// see is a defect that cannot ship; a known defect in a comment is a defect
// waiting for someone to forget.
//
// FOUR ASSERTIONS, each narrow:
//
//   1. Every local url in DOCS has a file at that path under public/ — the
//      entry's own `url`, and every url in its `formats`. A dead link is not a
//      styling problem and should not wait for someone to click it.
//   2. No such file contains a placeholder marker. The marker is deliberately
//      the loudest string in the file rather than a subtle flag, so this check
//      is a substring search and not a heuristic about what a résumé looks like.
//   3. Every GENERATED file carries a stamp matching lib/sources/resume.txt.
//   4. formats[0].url === url, so the default and the first menu item cannot
//      disagree.
//
// ── ASSERTION 3 IS THE ONE THAT EARNS ITS KEEP ────────────────────────────
//
// The three résumé formats are written by `npm run build:resume` from
// lib/sources/resume.txt. That script needs a headless Chrome to print the
// PDF, so it cannot run in `npm run build` — there is no browser on Vercel,
// and scripts/check-geometry.mjs already wrote down what happens to a
// build step that needs an environment.
//
// Generation therefore happens by hand, which would normally mean the files
// drift the first time a bullet is edited and nobody re-runs the script. So
// each file is stamped with a hash of the source, and this refuses the build
// when a stamp is stale. It is a better guarantee than generating at build
// time, not a weaker one: build-time generation makes a file FRESH, this makes
// staleness IMPOSSIBLE TO SHIP, and it holds on a machine with no Chrome.
//
// WHICH FILES ARE GENERATED IS DERIVED, not listed here: anything reachable
// through a `formats` array. public/meridian-case-study.pdf is authored by a
// human and has no stamp, and must not grow one.
//
// EACH FORMAT HIDES ITS STAMP WHERE ITS FORMAT ALLOWS — a trailing PDF
// comment, an HTML comment, a Word custom document property — so the pattern
// is per-extension rather than one regex. See the notes in
// scripts/build-resume.mjs for why each landed where it did.
//
// It still does NOT try to validate that a PDF is a good résumé. It cannot,
// and a check that pretends to would be worse than none.
//
//   node --experimental-strip-types scripts/check-docs.mjs
import { readFileSync, existsSync } from "fs"
import { createHash } from "crypto"
import { join } from "path"
import { inflateSync, inflateRawSync } from "zlib"
import { DOCS } from "../lib/constants.ts"

const ROOT = process.cwd()

// Anything a stand-in file is expected to shout. Case-insensitive, and matched
// against the PDF's text whether or not its streams are compressed.
const MARKERS = [
  "PLACEHOLDER - NOT A RESUME",
  "PLACEHOLDER — NOT A RESUME",
  "not a resume",
  "has not been added yet",
  "something shipped early",
]

/** A PDF's readable text, from raw bytes and from any FlateDecode streams.
 *  Not a parser — enough to find a marker that was written to be found. */
function pdfText(buf) {
  const parts = [buf.toString("latin1")]
  const re = /stream\r?\n/g
  let m
  while ((m = re.exec(parts[0])) !== null) {
    const start = m.index + m[0].length
    const end = parts[0].indexOf("endstream", start)
    if (end === -1) continue
    try {
      parts.push(inflateSync(Buffer.from(parts[0].slice(start, end), "latin1")).toString("latin1"))
    } catch {
      // Not deflate, or not a stream we can read. The raw pass already covered it.
    }
  }
  return parts.join("\n")
}

/** Every part of a ZIP, inflated and concatenated. A .docx is a ZIP, and its
 *  text lives in XML parts that are deflated — a raw byte search finds
 *  nothing. Local file headers only; that is enough to walk the whole file. */
function zipText(buf) {
  const parts = []
  let i = 0
  while ((i = buf.indexOf("PK\x03\x04", i, "latin1")) !== -1) {
    const compressed = buf.readUInt32LE(i + 18)
    const nameLen = buf.readUInt16LE(i + 26)
    const extraLen = buf.readUInt16LE(i + 28)
    const start = i + 30 + nameLen + extraLen
    const body = buf.subarray(start, start + compressed)
    try {
      parts.push(buf.readUInt16LE(i + 8) === 0 ? body.toString("utf8") : inflateRawSync(body).toString("utf8"))
    } catch {
      // Not a part we can read. Nothing else depends on it.
    }
    i = start + compressed
  }
  return parts.join("\n")
}

/** What a human-readable search should look at, per format. */
function readable(abs) {
  const buf = readFileSync(abs)
  if (abs.endsWith(".docx")) return zipText(buf)
  if (abs.endsWith(".pdf")) return pdfText(buf)
  return buf.toString("utf8")
}

// WHERE EACH FORMAT KEEPS ITS STAMP. Three formats, three metadata
// conventions, and no way around that: Chrome's printToPDF will not write an
// Info dictionary field, Markdown has no metadata but comments, and Word has a
// custom-properties part designed for exactly this.
const STAMP = [
  [".pdf", /%resume-source-hash:([0-9a-f]{8,64})/],
  [".md", /<!--\s*resume-source-hash:([0-9a-f]{8,64})\s*-->/],
  [".docx", /name="ResumeSourceHash">\s*<vt:lpwstr>([0-9a-f]{8,64})<\/vt:lpwstr>/],
]

const RESUME_SOURCE = "lib/sources/resume.txt"
const expected = createHash("sha256")
  .update(readFileSync(join(ROOT, RESUME_SOURCE)))
  .digest("hex")
  .slice(0, 16)

const problems = []
let checked = 0
let stamped = 0

for (const [key, doc] of Object.entries(DOCS)) {
  // Assertion 4. Cheap, and it closes the one way this entry can lie to
  // itself: a `url` that no longer names the file the menu opens first.
  const formats = doc.formats ?? null
  if (formats && formats[0].url !== doc.url) {
    problems.push(
      `${key}: url is ${doc.url} but formats[0].url is ${formats[0].url}.\n` +
      `      One click on the pane's pill downloads \`url\`; the first item in its\n` +
      `      menu downloads formats[0]. They are the same offer and must be the\n` +
      `      same file.`
    )
  }

  // The entry's own url, plus every format. A url reachable twice is checked
  // once — `url` and formats[0].url are the same file by assertion 4.
  const urls = [...new Set([doc.url, ...(formats ?? []).map((f) => f.url)])]
  const generated = new Set((formats ?? []).map((f) => f.url))

  for (const url of urls) {
    if (!url || !url.startsWith("/")) continue // remote, not ours to assert
    const rel = join("public", url.replace(/^\//, ""))
    const abs = join(ROOT, rel)

    if (!existsSync(abs)) {
      problems.push(
        `${key}: no file at ${rel} — DOCS points at a download that does not exist` +
        (generated.has(url) ? `\n      It is a generated file. Run \`npm run build:resume\`.` : "")
      )
      continue
    }
    checked++

    const text = readable(abs)
    const hit = MARKERS.find((mk) => text.toLowerCase().includes(mk.toLowerCase()))
    if (hit) {
      problems.push(
        `${key}: ${rel} is still a PLACEHOLDER — it contains ${JSON.stringify(hit)}.\n` +
        `      Replace the FILE at that path with the real document. lib/constants.ts\n` +
        `      does not change: the entry already points at the right place.`
      )
    }

    // Assertion 3, generated files only.
    if (!generated.has(url)) continue
    const pattern = STAMP.find(([ext]) => abs.endsWith(ext))?.[1]
    if (!pattern) {
      problems.push(`${key}: ${rel} is generated but this check has no stamp pattern for its extension`)
      continue
    }
    const found = text.match(pattern)?.[1]
    if (!found) {
      problems.push(
        `${key}: ${rel} carries no source stamp.\n` +
        `      Every generated file records the hash of ${RESUME_SOURCE} it was\n` +
        `      built from. Run \`npm run build:resume\`.`
      )
      continue
    }
    if (found !== expected) {
      problems.push(
        `${key}: ${rel} is STALE.\n` +
        `      It was generated from ${RESUME_SOURCE} at ${found}; the file on disk\n` +
        `      now hashes to ${expected}. The résumé was edited and this document\n` +
        `      still shows the old one. Run \`npm run build:resume\`.`
      )
      continue
    }
    stamped++
  }
}

if (problems.length) {
  console.error(`\ncheck:docs — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error("")
  process.exit(1)
}
console.log(
  `check:docs — PASS, ${checked} local document(s) present, none a placeholder, ` +
  `${stamped} generated from ${RESUME_SOURCE} at ${expected}`
)
