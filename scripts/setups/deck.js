// Rail document rows, visible set only — [Case Study, Resume, About].
// The deck is row 0.
const rows = [...document.querySelectorAll('.rail-doc')].filter(e => e.getBoundingClientRect().width > 0)
rows[0].click()
