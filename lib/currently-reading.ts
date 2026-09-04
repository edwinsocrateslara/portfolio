// The two books, as structured data for the About page's ledger.
//
// The prose lives in lib/sources/voice.md § Currently reading, and that section
// is what the chat answers from; this is the same two facts in the shape a
// two-column block needs. It is a DERIVATION, not a second source: `npm run
// check:voice` asserts every title and author below appears verbatim in
// voice.md, so the two cannot drift. Change the book in voice.md and this file
// fails the build until it follows.
//
// ⚠ THAT SECOND CLAUSE WAS FALSE UNTIL THIS COMMIT. This comment said the
// section "is what the chat answers with" while scripts/build-context.mjs was
// excluding it from lib/edwin-context.md — so the About page rendered these two
// books and the chat said it had never heard of them. Two comments in two files
// asserted the content reached the model; neither was checkable, and neither
// was true. The exclusion is gone and the section is generated now.
//
// A book change touches THREE things: this file, voice.md, and — since the
// section is in the prompt — a regenerated edwin-context.md. check:voice and
// check:context fail until all three agree, so none of them is remembered.
export interface Book {
  title: string
  author: string
}

// Array order is DISPLAY order and nothing else. voice.md's sentence names
// Rock Climbing first; the check asserts each title and author appears in that
// sentence, not the sequence they appear in, so the page can lead with either
// without the prose having to change.
export const CURRENTLY_READING: Book[] = [
  {
    title: "Simple Numbers, Straight Talk, Big Profits!",
    author: "Greg Crabtree",
  },
  {
    title: "Rock Climbing Technique: The Practical Guide to Movement Mastery",
    author: "John Kettle",
  },
]
