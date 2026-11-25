// The Ideas Dashboard — the off-rail vibe project (lib/vibe-projects.ts).
// It left the rail on 24 November, so there is no row to click: this opens it
// the way a visitor now does, by asking for it in the composer. (Until then it
// clicked the rail row by slug; after the move that threw "no rail row", and
// nothing noticed, because no gate runs the artboard setups.)
const ta = [...document.querySelectorAll('textarea')].find(e => e.getBoundingClientRect().width > 0)
if (!ta) throw new Error('vibe setup: no visible composer')
Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set.call(ta, 'tell me about the ideas dashboard')
ta.dispatchEvent(new Event('input', { bubbles: true }))
ta.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', bubbles: true }))

// SINCE 24 NOVEMBER A REVEAL LANDS AT THE TOP and does not stream, so the hold
// below no longer has anything to undo; it stays as a safety net, and costs
// one assignment every 250ms. What it used to answer:
//
// THE STREAM AUTO-SCROLLS. A reveal appends 13-15 blocks and follows them
// down, so by the time the transcript settles the scroller sits at the
// bottom — and the artboard, which serialises layout rather than scroll
// state, comes out unscrolled. --verify then compares a scrolled app against
// an unscrolled board and reports every image off by the scroll distance
// (measured: 1985px on Meridian, 2180px on vibe).
//
// ── THE RESET RUNS UNTIL CAPTURE, NOT AT A GUESSED MOMENT ────────────────
// This was a single setTimeout at 20s, chosen to land "just before capture" —
// but capture happened at 1800ms, so it fired long after the board was already
// taken. Now that canvas-artboard.mjs waits for the stream to settle, the
// capture moment is no longer a number anybody can guess from here.
//
// So the scroller is held at the top on an interval instead. The stream
// auto-scrolls as it appends, and the artboard serialises layout rather than
// scroll state, so a scrolled app compared against an unscrolled board reports
// every image off by the scroll distance (measured: 1985px on Meridian, 2180px
// on vibe). Holding it costs one assignment every 250ms and removes the
// guess entirely.
const hold = setInterval(() => {
  const s = document.querySelector('.pane-scroll')
  if (s) s.scrollTop = 0
}, 250)
// Stop after any plausible settle so a long-lived page is not pinned forever.
setTimeout(() => clearInterval(hold), 60_000)
