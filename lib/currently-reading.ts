// The two books, as structured data for the About page's ledger.
//
// The prose lives in lib/sources/voice.md § Currently reading and is what the
// chat answers with; this is the same two facts in the shape a two-column
// block needs. It is a DERIVATION, not a second source: `npm run check:voice`
// asserts every title and author below appears verbatim in voice.md, so the
// two cannot drift. Change the book in voice.md and this file fails the build
// until it follows.
export interface Book {
  title: string
  author: string
}

export const CURRENTLY_READING: Book[] = [
  {
    title: "Rock Climbing Technique: The Practical Guide to Movement Mastery",
    author: "John Kettle",
  },
  {
    title: "Simple Numbers, Straight Talk, Big Profits!",
    author: "Greg Crabtree",
  },
]
