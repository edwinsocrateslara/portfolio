// Rail project rows, visible set only. Meridian is retail-banking, row 2.
const rows = [...document.querySelectorAll('.rail-item')].filter(e => e.getBoundingClientRect().width > 0)
rows[1].click()

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
