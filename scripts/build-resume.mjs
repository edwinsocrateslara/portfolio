// Generate the three downloadable résumés from lib/sources/resume.txt.
//
//   npm run build:resume
//
// Writes public/edwin-lara-resume-2026.{pdf,md,docx}. All three are committed.
//
// ── WHY THIS IS A SCRIPT AND NOT PART OF `npm run build` ──────────────────
//
// The PDF is printed by a real headless Chrome, which this script launches. A
// browser is not available on Vercel, and a build step that needs one fails
// there and gets commented out on somebody's machine — scripts/check-geometry
// .mjs wrote that argument down first and it applies unchanged here.
//
// So generation is deliberate and the GATE carries the guarantee instead. Each
// file is stamped with a hash of resume.txt, and scripts/check-docs.mjs fails
// the build when a stamp does not match the source. Edit a bullet and forget
// to regenerate, and `npm run build` stops and tells you to run this.
//
// That is a stronger property than generating at build time, which is worth
// being precise about. Build-time generation makes the file FRESH. This makes
// staleness IMPOSSIBLE TO SHIP — and it holds on a platform with no browser.
//
// ── THE THREE FORMATS ARE THREE JOBS, NOT ONE RENDERER ────────────────────
//
// Tempting to write one intermediate representation and three serialisers. It
// would be worse. A PDF is a fixed page that has to survive a printer; a
// DOCX is a document somebody else edits in their own Word; Markdown is text
// a recruiter pastes into a tracking system. They disagree about typography,
// about what a bullet is, and about how much structure to keep. Three small
// builders that each know their format beat one abstraction that knows none.
// What they share is the PARSE, which is the part that must not drift.
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "fs"
import { createHash } from "crypto"
import { join } from "path"
import { tmpdir } from "os"
import { spawn } from "child_process"
import { resume } from "../lib/resume.ts"
import { buildDocx } from "./resume-docx.mjs"
import { buildPrintHtml } from "./resume-print-html.mjs"

const ROOT = process.cwd()
const SOURCE = "lib/sources/resume.txt"
const BASE = "edwin-lara-resume-2026"

// ── THE STAMP ─────────────────────────────────────────────────────────────
// A hash of the SOURCE BYTES, not of the parsed object. Hashing the parse
// would let a comment change slip through unstamped — which is fine — but it
// would also mean the stamp depended on lib/resume.ts, so a parser change
// with no source change would invalidate every file. The source is the thing
// the documents are supposed to track.
//
// 16 hex characters. This is a staleness marker between two files in one
// repository, not a security boundary; 64 characters of it would be noise in
// a document property somebody might read.
export const sourceHash = () =>
  createHash("sha256").update(readFileSync(join(ROOT, SOURCE))).digest("hex").slice(0, 16)

// ── MARKDOWN ──────────────────────────────────────────────────────────────
// The format someone pastes into a form, so it is deliberately plain: no
// tables, no HTML, no reference links. The stamp is an HTML comment, which
// every Markdown renderer drops and every text editor shows.
//
// THE ROLE HEADER IS NOT CHANGING WHEN THE OTHER TWO DO, and that is not an
// omission. The PDF and the DOCX moved to two rows of two columns — employer
// over title on the left, location over dates on the right. Markdown has no
// columns and inventing one would mean a table, which is exactly what "no
// tables" above rules out and which pastes badly into the forms this format
// exists for.
//
// It does not need one: the PAIRING is already right, expressed with
// separators instead of alignment.
//
//     ### FutureFit AI — Toronto, Ontario        <- employer + location
//     **Designer & AI Builder** · Oct 2025 – Present   <- title + dates
//
// Two lines, the same two pairs, in the same order. Right-alignment is a
// property of a page, and this format does not have one.
function buildMarkdown(r, hash) {
  const out = []
  out.push(`<!-- resume-source-hash:${hash} -->`)
  out.push(`<!-- Generated from ${SOURCE} by scripts/build-resume.mjs. Do not edit. -->`)
  out.push("")
  out.push(`# ${r.name}`)
  out.push("")
  out.push(r.contact.join(" · "))
  out.push("")
  out.push(r.summary)
  out.push("")
  out.push("## Experience")
  for (const role of r.roles) {
    out.push("")
    out.push(`### ${role.employer} — ${role.location}`)
    out.push(`**${role.title}** · ${role.dates}`)
    for (const g of role.groups) {
      out.push("")
      if (g.label) out.push(`**${g.label}**`)
      // A labelled bullet keeps its label, and Markdown's bold is the closest
      // thing it has to the print document's weight change.
      for (const b of g.bullets) {
        const m = b.match(/^([A-Z][A-Za-z0-9 &/]{1,28}):\s+(.*)$/s)
        out.push(m ? `- **${m[1]}:** ${m[2]}` : `- ${b}`)
      }
    }
  }
  out.push("")
  out.push("## Skills & Methodologies")
  out.push("")
  for (const band of r.skills) out.push(`- **${band.label}:** ${band.items.join(", ")}`)
  out.push("")
  out.push("## Education")
  out.push("")
  for (const e of r.education) out.push(`- **${e.qualification}** — ${e.institution}`)
  out.push("")
  return out.join("\n")
}

// ── CHROME ────────────────────────────────────────────────────────────────
// This script OWNS the browser, unlike scripts/shot.mjs, which attaches to one
// the user is already running. Different job: shot.mjs is for looking at the
// dev server while you work on it, this needs a clean, disposable, headless
// instance whose lifetime is one PDF.
const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
]

function findChrome() {
  const explicit = process.env.CHROME_PATH
  if (explicit) {
    if (!existsSync(explicit)) throw new Error(`CHROME_PATH is set to ${explicit}, which does not exist`)
    return explicit
  }
  const found = CHROME_CANDIDATES.find((p) => existsSync(p))
  if (!found) {
    throw new Error(
      "No Chrome found. Looked in:\n  " +
        CHROME_CANDIDATES.join("\n  ") +
        "\nSet CHROME_PATH to point at one.\n" +
        "The PDF is printed by a real browser on purpose — see the note at the\n" +
        "top of scripts/resume-print-html.mjs."
    )
  }
  return found
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/** Chrome, headless, on an ephemeral profile. Returns { ws, kill }. */
async function launchChrome(port) {
  const profile = mkdtempSync(join(tmpdir(), "resume-pdf-"))
  const child = spawn(
    findChrome(),
    [
      "--headless=new",
      `--remote-debugging-port=${port}`,
      `--user-data-dir=${profile}`,
      "--no-first-run",
      "--no-default-browser-check",
      "--disable-gpu",
      "--disable-extensions",
      "--hide-scrollbars",
      "about:blank",
    ],
    { stdio: "ignore" }
  )

  // Poll for the DevTools endpoint rather than sleeping a guessed interval —
  // cold start is a second on a warm machine and eight on a cold one.
  let target = null
  for (let i = 0; i < 100; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(500) })
      const pages = (await res.json()).filter((t) => t.type === "page")
      if (pages.length) { target = pages[0]; break }
    } catch {
      // Not up yet.
    }
    await sleep(200)
  }
  const kill = () => {
    try { child.kill("SIGKILL") } catch {}
    try { rmSync(profile, { recursive: true, force: true }) } catch {}
  }
  if (!target) { kill(); throw new Error(`Chrome did not open a debugging port on ${port} within 20s`) }
  return { target, kill }
}

/** A CDP session over Node's built-in WebSocket. No dependency. */
function session(url) {
  const ws = new WebSocket(url)
  const pending = new Map()
  let id = 0
  const ready = new Promise((res, rej) => {
    ws.addEventListener("open", res, { once: true })
    ws.addEventListener("error", rej, { once: true })
  })
  ws.addEventListener("message", (e) => {
    const msg = JSON.parse(e.data)
    const p = pending.get(msg.id)
    if (!p) return
    pending.delete(msg.id)
    msg.error ? p.reject(new Error(`${msg.error.message} (${JSON.stringify(msg.error)})`)) : p.resolve(msg.result)
  })
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const n = ++id
      pending.set(n, { resolve, reject })
      ws.send(JSON.stringify({ id: n, method, params }))
    })
  const evalJS = async (expr) => {
    const r = await send("Runtime.evaluate", { expression: expr, awaitPromise: true, returnByValue: true })
    if (r.exceptionDetails) throw new Error(`page threw: ${r.exceptionDetails.text}`)
    return r.result.value
  }
  return { ready, send, evalJS, close: () => ws.close() }
}

async function buildPdf(html) {
  const port = 9333 + (process.pid % 400)
  const { target, kill } = await launchChrome(port)
  try {
    const cdp = session(target.webSocketDebuggerUrl)
    await cdp.ready
    await cdp.send("Page.enable")

    // data: URL rather than a temp file — no path to clean up, and no chance
    // of a stale file from a previous run being printed.
    await cdp.send("Page.navigate", {
      url: "data:text/html;charset=utf-8," + encodeURIComponent(html),
    })
    await sleep(400)

    // ── THE FONT ASSERTION ────────────────────────────────────────────────
    // See the note in resume-print-html.mjs. A failed webfont fetch does not
    // throw — it falls back, and the PDF comes out looking nearly right in
    // Helvetica. Nearly right is the worst outcome for a document nobody
    // re-opens after generating, so this refuses to write one.
    await cdp.evalJS("document.fonts.ready.then(() => 1)")
    const fonts = await cdp.evalJS(`JSON.stringify({
      archivo: document.fonts.check('700 20pt Archivo'),
      archivoItalic: document.fonts.check('italic 400 10pt Archivo'),
      mono: document.fonts.check('400 8pt "IBM Plex Mono"'),
    })`)
    const loaded = JSON.parse(fonts)
    const missing = Object.entries(loaded).filter(([, ok]) => !ok).map(([k]) => k)
    if (missing.length) {
      throw new Error(
        `webfonts did not load: ${missing.join(", ")}\n` +
          "  The faces come from Google Fonts and this needs the network. A PDF\n" +
          "  printed without them falls back to Helvetica and looks almost right,\n" +
          "  which is why it is refused rather than written."
      )
    }

    const { data } = await cdp.send("Page.printToPDF", {
      printBackground: true,
      preferCSSPageSize: true, // @page in the stylesheet owns the geometry
      displayHeaderFooter: false,
      generateDocumentOutline: false,
    })
    cdp.close()
    return { pdf: Buffer.from(data, "base64"), pages: null }
  } finally {
    kill()
  }
}

// ── DETERMINISM ───────────────────────────────────────────────────────────
// Chrome writes a /CreationDate into the PDF trailer. Left alone, every run
// would produce a different file and `git status` would show a change after a
// no-op regeneration — which teaches you to discard generated files without
// reading them, and that is how a real edit gets thrown away.
//
// The date is replaced with a fixed one rather than deleted: a PDF with no
// creation date is unusual enough that some readers complain, and the field is
// meaningless for a generated artefact anyway. Byte-for-byte reproducibility
// is worth more here than a timestamp nobody reads.
const FIXED_DATE = "D:20260101000000Z"
function stripTimestamps(pdf) {
  const s = pdf.toString("latin1")
  const out = s
    .replace(/\/CreationDate\s*\(D:[^)]*\)/g, `/CreationDate (${FIXED_DATE})`)
    .replace(/\/ModDate\s*\(D:[^)]*\)/g, `/ModDate (${FIXED_DATE})`)
  return Buffer.from(out, "latin1")
}

// ── STAMPING THE PDF ──────────────────────────────────────────────────────
// The other two formats carry the hash in a metadata field the format
// provides — an HTML comment, a custom document property. A PDF has one too,
// /Subject in the Info dictionary, and printToPDF will not write it: Chrome
// fills /Title, /Author, /Creator and /Producer from the page and ignores
// <meta name="subject">. That was tried first, and the file came out with no
// /Subject at all.
//
// Writing one afterwards means editing the Info dictionary, which changes byte
// offsets, which invalidates the xref table — so it means either an
// incremental update section or rewriting the xref. Both are real work and
// both can produce a subtly broken PDF, on the file whose entire job is to be
// opened by a stranger.
//
// A TRAILING COMMENT COSTS NOTHING AND BREAKS NOTHING. Everything after the
// final %%EOF is outside the document by specification; readers stop there.
// It cannot shift an offset because every offset precedes it. `%` is the PDF
// comment token, so even a reader that keeps scanning sees a comment.
const stamp = (pdf, hash) =>
  Buffer.concat([pdf, Buffer.from(`\n%resume-source-hash:${hash}\n`, "latin1")])

// ── main ──────────────────────────────────────────────────────────────────
// ── ALL THREE, OR NONE ────────────────────────────────────────────────────
// Every buffer is built before anything is written. This used to write the
// Markdown and the DOCX first and then go and print the PDF, which is by far
// the most failure-prone stage: it launches Chrome, speaks CDP, waits on
// webfonts over the network, and refuses outright if those fonts did not load.
//
// So the common failure left 2 of 3 public artefacts replaced and the third
// stale — a set that disagrees with itself, in a working tree that now looks
// like a legitimate edit. check:docs would have caught the stale PDF, but only
// after somebody committed the other two.
//
// Buffers first, then a single write pass. There is no temp-file dance: the
// writes are the last 3 statements in the process and nothing can fail between
// them that would not also have taken the process down.
const hash = sourceHash()
const md = Buffer.from(buildMarkdown(resume, hash), "utf8")
const docx = buildDocx(resume, hash)
const { pdf } = await buildPdf(buildPrintHtml(resume, hash))
const stamped = stamp(stripTimestamps(pdf), hash)

// A LAST CHECK BEFORE ANYTHING IS REPLACED. An empty or absurdly small buffer
// means a builder returned something it should not have; writing it would
// destroy a good artefact and pass check:docs as long as the stamp was there.
const built = [
  [`${BASE}.md`, md, 1_000],
  [`${BASE}.docx`, docx, 2_000],
  [`${BASE}.pdf`, stamped, 20_000],
]
for (const [name, buf, floor] of built) {
  if (!buf || buf.length < floor) {
    throw new Error(
      `${name} came out at ${buf?.length ?? 0} bytes, under the ${floor}-byte floor.\n` +
        `Nothing was written — the previous files are untouched.`
    )
  }
}

const targets = []
for (const [name, buf] of built) {
  writeFileSync(join(ROOT, "public", name), buf)
  targets.push([name, buf.length])
}

const kb = (n) => `${(n / 1024).toFixed(1)} KB`
console.log(`build:resume — 3 file(s) from ${SOURCE}, stamped ${hash}`)
for (const [name, size] of targets) console.log(`  public/${name.padEnd(28)} ${kb(size).padStart(9)}`)
console.log(
  `  ${resume.roles.length} roles, ` +
    `${resume.roles.reduce((n, r) => n + r.groups.reduce((m, g) => m + g.bullets.length, 0), 0)} bullets, ` +
    `${resume.skills.length} skill bands, ${resume.education.length} education entries`
)
