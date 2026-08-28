// Rail rows are duplicated for the mobile sheet, so filter to the visible set
// before indexing — [Case Study, Resume, About].
const rows = [...document.querySelectorAll('.rail-doc')].filter(e => e.getBoundingClientRect().width > 0)
rows[2].click()
