// The VIBE CODING row — Weekly Feedback Synthesis. Last in the visible set,
// after the seven work rows.
// BY SLUG, not by position. This was rows[rows.length - 1] — "the last visible
// rail row" — which is a description of today's ordering rather than of this
// project. sidebar.tsx carries data-project-slug for exactly this.
const row = document.querySelector('.rail-item[data-project-slug="futurefit-ideas-dashboard"]')
if (!row) throw new Error('vibe setup: no rail row for futurefit-ideas-dashboard')
row.click()

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
