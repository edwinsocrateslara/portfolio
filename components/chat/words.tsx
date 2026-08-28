/* Splits a string into one span per word so the line can write itself out.
 *
 * NO LAYOUT SHIFT, and this is the whole reason it is opacity and nothing
 * else: the spans are laid out immediately at their final size, spaces stay
 * as text nodes BETWEEN the spans rather than inside them, and only opacity
 * animates. The line occupies its final width and wraps identically on the
 * first frame — the words are invisible, not absent. Anything that animated
 * width, display or content would reflow the pane on every word.
 *
 * `offset` continues the counter across a group, so four bullets in one role
 * cascade rather than all writing at once. */
export function Words({ text, offset = 0 }: { text: string; offset?: number }) {
  const parts = text.split(" ")
  return (
    <>
      {parts.map((w, i) => (
        <span key={`${i}-${w}`}>
          <span className="word" style={{ "--i": offset + i } as React.CSSProperties}>
            {w}
          </span>
          {i < parts.length - 1 ? " " : null}
        </span>
      ))}
    </>
  )
}

/** How many words a string will produce — for continuing the counter. */
export const wordCount = (s: string) => s.split(" ").length
