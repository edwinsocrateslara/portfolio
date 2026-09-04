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
//   node --import ./scripts/ts-extensionless.mjs scripts/check-render.mjs
import { readFileSync } from "fs"
import { renderInline, isSafeHref, CONTACT_EMAIL } from "../lib/inline-markdown.ts"

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
    // MAILTO IS NOT A NEW TAB. This case asserted only the href, so it passed
    // both before and after the renderer learned the difference — which is the
    // shape of a case that looks like coverage and is not. It now pins the
    // three things that were wrong: the announcement said "in a new tab" on a
    // protocol that opens none, and target/rel were applied to a link that
    // navigates nothing. new-tab-mark.tsx has stated that rule the whole time.
    name: "mailto link — hands off to mail, does not open a tab",
    input: "[mail](mailto:a@b.com)",
    mustContain: [
      '<a href="mailto:a@b.com"',
      "(opens your email app)",
      "mail",
    ],
    mustNotContain: ['target="_blank"', "rel=", "(opens in a new tab)"],
  },
  {
    // The other half, so a fix to one cannot quietly become a fix to both: an
    // http link must KEEP the new-tab treatment.
    name: "http link keeps the new-tab treatment",
    input: "[site](https://example.com)",
    mustContain: ['target="_blank"', 'rel="noopener noreferrer"', "(opens in a new tab)"],
    mustNotContain: ["(opens your email app)"],
  },
  {
    name: "relative link",
    input: "[deck](/case-study/meridian-deck)",
    mustContain: ['<a href="/case-study/meridian-deck"'],
    mustNotContain: [],
  },

  // ── the contact address is always a link ─────────────────────────────────
  // Asked "What's the best way to reach you?", a model answered "...by email at
  // edwinsocrateslara@gmail.com" as plain prose, reproducibly. Nothing linked
  // it, so it painted as inert text on the one question a recruiter is most
  // likely to ask. The renderer now linkifies it; these hold that, and hold the
  // two ways the fix could go wrong.
  {
    name: "bare contact address is linked",
    input: "You can reach me at edwinsocrateslara@gmail.com.",
    mustContain: ['<a href="mailto:edwinsocrateslara@gmail.com"', "(opens your email app)"],
    mustNotContain: ['target="_blank"'],
  },
  {
    name: "an already-linked address is not double-linked",
    input: "He's at [edwinsocrateslara@gmail.com](mailto:edwinsocrateslara@gmail.com).",
    mustContain: ['<a href="mailto:edwinsocrateslara@gmail.com"'],
    // The signature of a double-link: the markdown survives inside the anchor,
    // or a second anchor opens. Either means autolinkContact matched an
    // occurrence that was already part of a link.
    mustNotContain: ["](mailto:", "<a href=\"mailto:edwinsocrateslara@gmail.com\" style=\"color:rgb(var(--bureau-text-primary));text-decoration:underline;text-underline-offset:3px\"><a"],
  },
  {
    name: "a link with different label text keeps its label",
    input: "Write to [Edwin](mailto:edwinsocrateslara@gmail.com) about it.",
    mustContain: ['<a href="mailto:edwinsocrateslara@gmail.com"', ">Edwin<"],
    mustNotContain: ["](mailto:"],
  },
  {
    name: "SOMEBODY ELSE'S address is never linked",
    // A visitor types their own address and the model echoes it. Linkifying
    // that would be a small injection surface for no benefit, so only Edwin's
    // is ever matched.
    input: "Sure, I'll reply to attacker@evil.example and to bob@example.com.",
    mustNotContain: ["<a href=\"mailto:attacker@evil.example", "<a href=\"mailto:bob@example.com", "](mailto:"],
  },
  {
    name: "the address is still escaped, not a markup hole",
    input: "<img onerror=x> edwinsocrateslara@gmail.com",
    mustContain: ['<a href="mailto:edwinsocrateslara@gmail.com"'],
    mustNotContain: ["<img"],
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

// ── THE CONSTANT MUST MATCH THE FALLBACK'S COPY ──────────────────────────
// autolinkContact matches ONE literal string. If the address in the system
// prompt's FALLBACK ever diverges from CONTACT_EMAIL, the autolinker silently
// stops matching and the bare-address defect returns with nothing firing. This
// is the cheapest possible guard against that: read the route as text and
// assert the address it hard-codes is the one this renderer looks for.
{
  const route = readFileSync(new URL("../app/api/chat/route.ts", import.meta.url), "utf8")
  const found = [...route.matchAll(/[\w.+-]+@[\w-]+\.[\w.]+/g)].map((m) => m[0])
  const distinct = [...new Set(found)]
  if (distinct.length === 0) {
    problems.push("route.ts contains no email address — the FALLBACK lost its contact route")
  }
  for (const addr of distinct) {
    if (addr !== CONTACT_EMAIL) {
      problems.push(
        `route.ts uses ${addr} but lib/inline-markdown.ts autolinks ${CONTACT_EMAIL} — ` +
        `the autolinker would stop matching and bare addresses would render as inert text`
      )
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
