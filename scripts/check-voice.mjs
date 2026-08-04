// Fails if any scripted answer string is not present verbatim in voice.md.
// Guards the one deliberate duplication in the source layer.
import { readFileSync } from "fs"

const voice = readFileSync("lib/sources/voice.md", "utf8")
const src = readFileSync("lib/voice-answers.ts", "utf8")

// Pull every string literal inside a `paragraphs: [...]` block.
const blocks = [...src.matchAll(/paragraphs:\s*\[([\s\S]*?)\n    \],/g)].map((m) => m[1])
const strings = blocks.flatMap((b) =>
  [...b.matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
    m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\")
  )
)

let bad = 0
for (const s of strings) {
  if (!voice.includes(s)) {
    bad++
    console.error("NOT VERBATIM IN voice.md:\n  " + s.slice(0, 110) + "…\n")
  }
}
console.log(`checked ${strings.length} scripted strings against lib/sources/voice.md`)
if (bad) {
  console.error(`FAIL — ${bad} not found verbatim`)
  process.exit(1)
}
console.log("PASS — all verbatim")
