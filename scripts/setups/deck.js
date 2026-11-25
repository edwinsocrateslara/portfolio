// The visible Case Study link: the header above the pane on desktop, the
// rail's document group in the mobile sheet. Selected by data-pane, not by
// position.
// Visible copy first; at 900px and below the only copy is in the closed
// sheet — hidden, and a click on it still navigates.
;(() => { const all = [...document.querySelectorAll('[data-pane="deck"]')]; (all.find(e => e.getBoundingClientRect().width > 0) ?? all[0]).click() })()
