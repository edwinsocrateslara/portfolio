// The signal that a link leaves the site.
//
// Every `target="_blank"` in this app had none of this: no visible mark, no
// announcement. A link that reassigns the window without warning is the
// failure WCAG G201 describes, and it is worse here than usual — the chat
// holds conversation state in memory, so a visitor who follows a link
// expecting navigation and gets a new tab has not lost anything, but one who
// expects a new tab and gets navigation would lose the thread.
//
// The glyph is aria-hidden and the text is visually hidden: together they say
// the same thing once to each audience, rather than twice to one of them.
// `glyph={false}` is for links that already carry their own visual mark — the
// doc-link card has a download arrow, and two glyphs on one control reads as
// two different actions.
export function NewTabMark({ glyph = true }: { glyph?: boolean }) {
  return (
    <>
      {glyph && (
        <span aria-hidden="true" className="link-ext">
          ↗
        </span>
      )}
      <span className="sr-only"> (opens in a new tab)</span>
    </>
  )
}
