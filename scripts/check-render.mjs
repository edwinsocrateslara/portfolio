// Rule: model output is text, never markup.
//
// app-shell commits an API answer as `kind: "text"` and TextBubble renders it
// through dangerouslySetInnerHTML. Before this gate the inline-markdown pass
// transformed **bold** and [link](url) and passed everything else through raw,
// so an <img onerror=...> or a javascript: link in a response executed.
//
// POSITIVE CONTROLS IN BOTH DIRECTIONS. Every hostile input must be neutered
// AND the two things the renderer exists for — bold and a real link — must
// still work. A gate that only proved the first would pass on a renderer that
// escaped everything and rendered nothing, which is the failure mode of most
// hastily-added escaping.
//
//   node --experimental-strip-types scripts/check-render.mjs
import { renderInline, isSafeHref } from "../lib/inline-markdown.ts"

const CASES = [
  // ── hostile ──────────────────────────────────────────────────────────────
  {
    name: "javascript: link",
    input: "[click me](javascript:alert(1))",
    mustNotContain: ["javascript:", "<a "],
    mustContain: ["click me"],
  },
  {
    name: "data: link",
    input: "[open](data:text/html;base64,PHNjcmlwdD4=)",
    mustNotContain: ["data:", "<a "],
    mustContain: ["open"],
  },
  {
    name: "inline script tag",
    input: "<script>alert(1)</script>",
    mustNotContain: ["<script", "</script>"],
    mustContain: ["&lt;script&gt;"],
  },
  {
    name: "img with onerror",
    input: '<img src=x onerror="alert(1)">',
    mustNotContain: ["<img"],
    mustContain: ["&lt;img"],
  },
  {
    name: "vbscript: link",
    input: "[x](vbscript:msgbox)",
    mustNotContain: ["<a ", "vbscript:"],
    mustContain: ["x"],
  },

  // ── must still work ──────────────────────────────────────────────────────
  {
    name: "normal https link",
    input: "see [the deck](https://example.com/a?b=1&c=2)",
    mustContain: [
      '<a href="https://example.com/a?b=1&amp;c=2"',
      'target="_blank"',
      'rel="noopener noreferrer"',
      "the deck",
      "(opens in a new tab)",
    ],
    mustNotContain: [],
  },
  {
    name: "bold still renders",
    input: "a **bold** word",
    mustContain: ["<strong", "bold</strong>"],
    mustNotContain: ["**"],
  },
  {
    name: "mailto link",
    input: "[mail](mailto:a@b.com)",
    mustContain: ['<a href="mailto:a@b.com"'],
    mustNotContain: [],
  },
  {
    name: "relative link",
    input: "[deck](/case-study/meridian-deck)",
    mustContain: ['<a href="/case-study/meridian-deck"'],
    mustNotContain: [],
  },
]

const problems = []
for (const c of CASES) {
  const out = renderInline(c.input)
  for (const bad of c.mustNotContain ?? []) {
    if (out.includes(bad)) {
      problems.push(`${c.name}: output still contains ${JSON.stringify(bad)}\n      ${out}`)
    }
  }
  for (const good of c.mustContain ?? []) {
    if (!out.includes(good)) {
      problems.push(`${c.name}: output is missing ${JSON.stringify(good)}\n      ${out}`)
    }
  }
}

// isSafeHref on its own, including the case-folding and whitespace bypasses.
const HREFS = [
  ["https://a.b", true],
  ["http://a.b", true],
  ["mailto:a@b", true],
  ["/x", true],
  ["#x", true],
  ["./x", true],
  ["javascript:alert(1)", false],
  ["JaVaScRiPt:alert(1)", false],
  ["data:text/html,x", false],
  ["vbscript:x", false],
  ["", false],
  ["   ", false],
]
for (const [href, want] of HREFS) {
  if (isSafeHref(href) !== want) {
    problems.push(`isSafeHref(${JSON.stringify(href)}) returned ${!want}, expected ${want}`)
  }
}

if (problems.length) {
  console.error(`\ncheck:render — ${problems.length} problem(s)\n`)
  for (const p of problems) console.error(`  x ${p}`)
  console.error("")
  process.exit(1)
}
console.log(
  `check:render — PASS, ${CASES.length} render cases + ${HREFS.length} protocol cases`
)
