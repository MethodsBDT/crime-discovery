//
// For guidance on how to add JavaScript see:
// https://prototype-kit.service.gov.uk/docs/adding-css-javascript-and-images
//

window.GOVUKPrototypeKit.documentReady(() => {
  // ---------------------------------------------------------------------------
  // Expand/collapse toggle for any summary card whose action link carries
  // `data-cps-toggle="<card-id>"`. The toggle hides .govuk-summary-card__content
  // inside the card with that id, swaps "Collapse" / "Expand", and rotates
  // the chevron via a class on the link.
  // ---------------------------------------------------------------------------
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('[data-cps-toggle]')
    if (!toggle) return

    event.preventDefault()

    const cardId = toggle.getAttribute('data-cps-toggle')
    const card = document.getElementById(cardId)
    if (!card) return

    const content = card.querySelector('.govuk-summary-card__content')
    if (!content) return

    const wasExpanded = toggle.getAttribute('aria-expanded') === 'true'
    const nowExpanded = !wasExpanded

    toggle.setAttribute('aria-expanded', nowExpanded ? 'true' : 'false')
    toggle.classList.toggle('cps-toggle--collapsed', !nowExpanded)
    content.hidden = !nowExpanded

    const label = toggle.querySelector('.cps-toggle__text')
    if (label) label.textContent = nowExpanded ? 'Collapse' : 'Expand'
  })

  // ---------------------------------------------------------------------------
  // Case notes — Save button prepends a new note to the list so it appears
  // immediately below the textarea + button. Date formatted as
  // "DD Mon YYYY, HH:MM"; author is hardcoded as "You" for the prototype.
  // ---------------------------------------------------------------------------
  const monthShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  function formatNoteDate (d) {
    const dd = String(d.getDate()).padStart(2, '0')
    const yyyy = d.getFullYear()
    const hh = String(d.getHours()).padStart(2, '0')
    const mm = String(d.getMinutes()).padStart(2, '0')
    return `${dd} ${monthShort[d.getMonth()]} ${yyyy}, ${hh}:${mm}`
  }

  document.addEventListener('click', (event) => {
    if (!event.target.closest('.cps-case-notes__save')) return

    const textarea = document.getElementById('new-note')
    const list = document.getElementById('case-notes-list')
    if (!textarea || !list) return

    const value = textarea.value.trim()
    if (!value) return

    const li = document.createElement('li')
    li.className = 'cps-case-notes__item'

    const author = document.createElement('p')
    author.className = 'cps-case-notes__author'
    author.textContent = 'You'

    const text = document.createElement('p')
    text.className = 'cps-case-notes__text'
    text.textContent = value

    const time = document.createElement('p')
    time.className = 'cps-case-notes__time'
    time.textContent = formatNoteDate(new Date())

    li.appendChild(author)
    li.appendChild(text)
    li.appendChild(time)

    list.insertBefore(li, list.firstChild)
    textarea.value = ''
    textarea.focus()
  })

  // ---------------------------------------------------------------------------
  // Sidebar tabs. Each tab is <button data-cps-tab="..."> with aria-controls
  // pointing at a <section role="tabpanel">. Clicking switches which panel is
  // visible — the others get `hidden` and aria-selected="false".
  // ---------------------------------------------------------------------------
  document.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-cps-tab]')
    if (!tab) return

    const tablist = tab.parentElement
    if (!tablist) return
    const sidebar = tablist.parentElement
    if (!sidebar) return

    // Deactivate sibling tabs
    tablist.querySelectorAll('[data-cps-tab]').forEach((t) => {
      const isActive = t === tab
      t.classList.toggle('cps-timeline__tab--active', isActive)
      t.setAttribute('aria-selected', isActive ? 'true' : 'false')
    })

    // Show only the matching panel
    const targetId = tab.getAttribute('aria-controls')
    sidebar.querySelectorAll('.cps-timeline__panel').forEach((panel) => {
      panel.hidden = panel.id !== targetId
    })
  })

  // ---------------------------------------------------------------------------
  // Offence row expand/collapse. Each offence has a <button class="cps-offence__toggle">
  // with aria-expanded + aria-controls pointing at its content div. Clicking the
  // button flips aria-expanded and shows/hides the content. The chevron rotates
  // 180° in CSS based on aria-expanded.
  // ---------------------------------------------------------------------------
  document.addEventListener('click', (event) => {
    const toggle = event.target.closest('.cps-offence__toggle')
    if (!toggle) return

    const isExpanded = toggle.getAttribute('aria-expanded') === 'true'
    const contentId = toggle.getAttribute('aria-controls')
    const content = contentId ? document.getElementById(contentId) : null
    if (!content) return

    toggle.setAttribute('aria-expanded', isExpanded ? 'false' : 'true')
    content.hidden = isExpanded
  })

  // ---------------------------------------------------------------------------
  // Defendant picker: when a radio under name="defendant" changes, show the
  // matching offences panel (data-defendant-panel="<id>") and hide the rest.
  // Also moves the .cps-defendants__item--selected highlight to the new row.
  // ---------------------------------------------------------------------------
  document.addEventListener('change', (event) => {
    const radio = event.target
    if (!radio || radio.name !== 'defendant') return

    const selectedId = radio.value

    // Swap centre column visibility
    document.querySelectorAll('[data-defendant-panel]').forEach((panel) => {
      panel.hidden = panel.getAttribute('data-defendant-panel') !== selectedId
    })

    // Move the left-column "selected" highlight
    document.querySelectorAll('.cps-defendants__item').forEach((item) => {
      const input = item.querySelector('input[name="defendant"]')
      const isSelected = !!input && input.value === selectedId
      item.classList.toggle('cps-defendants__item--selected', isSelected)
    })
  })
})
