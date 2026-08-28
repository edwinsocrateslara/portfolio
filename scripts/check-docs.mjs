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
// TWO ASSERTIONS, both narrow:
//
//   1. Every DOCS entry with a local url has a file at that path under public/.
//      A dead link is not a styling problem and should not wait for someone to
//      click it.
//   2. No such file contains a placeholder marker. The marker is deliberately
//      the loudest string in the file rather than a subtle flag, so this check
//      is a substring search and not a heuristic about what a résumé looks like.
//
// It does NOT try to validate that a PDF is a good résumé. It cannot, and a
// check that pretends to would be worse than none.
//
//   node --experimental-strip-types scripts/check-docs.mjs
import { readFileSync, existsSync } from "fs"
import { join } from "path"
import { inflateSync } from "zlib"
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

const problems = []
let checked = 0

for (const [key, doc] of Object.entries(DOCS)) {
  if (!doc.url || !doc.url.startsWith("/")) continue // remote, not ours to assert
  const rel = join("public", doc.url.replace(/^\//, ""))
  const abs = join(ROOT, rel)

  if (!existsSync(abs)) {
    problems.push(`${key}: no file at ${rel} — DOCS points at a download that does not exist`)
    continue
  }
  checked++

  const text = pdfText(readFileSync(abs))
  const hit = MARKERS.find((mk) => text.toLowerCase().includes(mk.toLowerCase()))
  if (hit) {
    problems.push(
      `${key}: ${rel} is still a PLACEHOLDER — it contains ${JSON.stringify(hit)}.\n` +
      `      Replace the FILE at that path with the real document. lib/constants.ts\n` +
      `      does not change: the entry already points at the right place.`
    )
  }
}

if (problems.length) {
  console.error(`\ncheck:docs — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  ✗ ${p}`)
  console.error("")
  process.exit(1)
}
console.log(`check:docs — PASS, ${checked} local document(s) present and none a placeholder`)
