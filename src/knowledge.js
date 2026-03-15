let faqData = null
let currentDomain = 'power'

export function initKnowledge(data, domain) {
    faqData = data
    currentDomain = domain
    renderKnowledge(domain)
}

export function renderKnowledge(domain) {
    currentDomain = domain
    const container = document.getElementById('knowledgeContainer')
    if (!container || !faqData) return

    const sections = faqData.sections.filter(s => s.domain.includes(domain))

    let html = `<input type="text" class="knowledge-search" id="knowledgeSearch" placeholder="Search questions...">`

    if (sections.length === 0) {
        html += `<div class="faq-no-results">No knowledge base entries for this domain yet.</div>`
    } else {
        sections.forEach(section => {
            html += `
            <div class="knowledge-section">
                <h3 class="knowledge-section-title">${section.title}</h3>
                ${section.items.map((item, i) => `
                    <div class="faq-item" data-q="${item.q.toLowerCase()}" data-a="${item.a.toLowerCase()}">
                        <button class="faq-question">
                            <span>${item.q}</span>
                            <svg class="faq-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                        <div class="faq-answer">${item.a}</div>
                    </div>
                `).join('')}
            </div>`
        })
    }

    container.innerHTML = html

    // Bind FAQ accordion
    container.querySelectorAll('.faq-question').forEach(btn => {
        btn.addEventListener('click', () => {
            const item = btn.closest('.faq-item')
            const wasOpen = item.classList.contains('open')
            // Close all
            container.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'))
            if (!wasOpen) item.classList.add('open')
        })
    })

    // Bind search
    const searchInput = container.querySelector('#knowledgeSearch')
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const query = searchInput.value.toLowerCase().trim()
            container.querySelectorAll('.faq-item').forEach(item => {
                const q = item.dataset.q || ''
                const a = item.dataset.a || ''
                const match = !query || q.includes(query) || a.includes(query)
                item.style.display = match ? '' : 'none'
            })
            // Hide empty sections
            container.querySelectorAll('.knowledge-section').forEach(sec => {
                const visible = sec.querySelectorAll('.faq-item:not([style*="display: none"])')
                sec.style.display = visible.length > 0 ? '' : 'none'
            })
        })
    }
}
