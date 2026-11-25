// Meridian's rail row, by slug — not by position, which the vibe setup
// learned the hard way.
// Visible copy first; at 900px and below the rail is the closed sheet —
// hidden, and a click on its row still opens the thread.
;(() => { const all = [...document.querySelectorAll('.rail-item[data-project-slug="retail-banking"]')]; (all.find(e => e.getBoundingClientRect().width > 0) ?? all[0]).click() })()

// SINCE 24 NOVEMBER A REVEAL LANDS AT THE TOP and does not stream, so this
// reset no longer has anything to undo; it stays as a harmless safety net.
// What it used to answer:
//
// THE STREAM AUTO-SCROLLS. A reveal appends 13-15 blocks and follows them
// down, so by the time the transcript settles the scroller sits at the
// bottom — and the artboard, which serialises layout rather than scroll
// state, comes out unscrolled. --verify then compares a scrolled app against
// an unscrolled board and reports every image off by the scroll distance
// (measured: 1985px on Meridian, 2180px on vibe).
//
// Setup runs once, BEFORE the settle window, so the reset is scheduled to
// land inside it — just before capture, after the last block has arrived.
setTimeout(() => {
  const s = document.querySelector('.pane-scroll')
  if (s) s.scrollTop = 0
}, 20000)
