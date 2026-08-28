const rows = [...document.querySelectorAll('.rail-doc')].filter(e => e.getBoundingClientRect().width > 0)
rows[1].click()
