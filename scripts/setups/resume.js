// The visible Resume link: the header above the pane on desktop, the rail's
// document group in the mobile sheet. Selected by data-pane, not by position.
;[...document.querySelectorAll('[data-pane="resume"]')].find(e => e.getBoundingClientRect().width > 0).click()
