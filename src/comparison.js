let allProducts = {}
let currentDomain = 'power'
let selectedProducts = []

const domainToKey = { power: 'power', cooling: 'cooling', racks: 'racks', monitoring: 'monitoring' }

export function initComparison(data, domain) {
    allProducts = data
    currentDomain = domain
    renderComparison(domain)
}

export function renderComparison(domain) {
    currentDomain = domain
    selectedProducts = []
    const container = document.getElementById('comparisonContainer')
    if (!container) return
    render(container)
}

function render(container) {
    const key = domainToKey[currentDomain] || 'power'
    const data = allProducts[key]
    if (!data || !data.products) {
        container.innerHTML = `<div class="compare-empty"><div class="compare-empty-icon">📦</div><p>No equipment data available for this domain.</p></div>`
        return
    }

    const products = data.products
    const categories = [...new Set(products.map(p => p.category))]
    const manufacturers = [...new Set(products.map(p => p.manufacturer))]

    // Filter toolbar
    let html = `
    <div class="compare-toolbar">
        <select class="compare-filter" id="compareCategory">
            <option value="">All Categories</option>
            ${categories.map(c => `<option value="${c}">${formatCategory(c)}</option>`).join('')}
        </select>
        <select class="compare-filter" id="compareMfg">
            <option value="">All Manufacturers</option>
            ${manufacturers.map(m => `<option value="${m}">${m}</option>`).join('')}
        </select>
        <span class="compare-badge" id="compareCount">${selectedProducts.length} / 3 selected</span>
    </div>
    ${selectedProducts.length === 0 ? `<div class="compare-hint"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg> Click any 2-3 products below to compare their specs side by side</div>` : ''}
    ${selectedProducts.length === 1 ? `<div class="compare-hint active"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> 1 selected — pick 1 more to see the comparison table</div>` : ''}`

    // Product cards
    html += `<div class="compare-grid" id="compareGrid">`
    products.forEach(p => {
        const isSel = selectedProducts.includes(p.id)
        const specs = p.specs || {}
        const specKeys = Object.keys(specs).slice(0, 4)
        html += `
        <div class="compare-product-card ${isSel ? 'selected' : ''}" data-id="${p.id}" data-category="${p.category}" data-mfg="${p.manufacturer}">
            <div class="select-indicator">${isSel ? '✓' : ''}</div>
            <div class="product-mfg">${p.manufacturer}</div>
            <div class="product-name">${p.name}</div>
            <div class="product-specs">
                ${specKeys.map(k => `<div class="spec-item"><strong>${k}:</strong> ${specs[k]}</div>`).join('')}
            </div>
        </div>`
    })
    html += `</div>`

    // Comparison table (if products selected)
    if (selectedProducts.length >= 2) {
        const selProds = selectedProducts.map(id => products.find(p => p.id === id)).filter(Boolean)
        const allSpecKeys = [...new Set(selProds.flatMap(p => Object.keys(p.specs || {})))]

        html += `
        <div class="compare-table-wrapper">
            <table class="compare-table">
                <thead>
                    <tr>
                        <th>Specification</th>
                        ${selProds.map(p => `<th>${p.manufacturer}<br><strong>${p.name}</strong></th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${allSpecKeys.map(key => `
                        <tr>
                            <td class="spec-label">${key}</td>
                            ${selProds.map(p => `<td>${(p.specs || {})[key] || '-'}</td>`).join('')}
                        </tr>
                    `).join('')}
                    <tr>
                        <td class="spec-label">Description</td>
                        ${selProds.map(p => `<td>${p.description || '-'}</td>`).join('')}
                    </tr>
                </tbody>
            </table>
        </div>`
    } else if (selectedProducts.length === 1) {
        html += `<div class="compare-empty"><p>Select at least 2 products to compare side by side.</p></div>`
    }

    container.innerHTML = html

    // Bind card clicks
    container.querySelectorAll('.compare-product-card').forEach(card => {
        card.addEventListener('click', () => {
            const id = card.dataset.id
            const idx = selectedProducts.indexOf(id)
            if (idx >= 0) {
                selectedProducts.splice(idx, 1)
            } else if (selectedProducts.length < 3) {
                selectedProducts.push(id)
            }
            render(container)
        })
    })

    // Bind filters
    const catFilter = container.querySelector('#compareCategory')
    const mfgFilter = container.querySelector('#compareMfg')
    if (catFilter) catFilter.addEventListener('change', () => applyFilters(container))
    if (mfgFilter) mfgFilter.addEventListener('change', () => applyFilters(container))
}

function applyFilters(container) {
    const cat = container.querySelector('#compareCategory')?.value || ''
    const mfg = container.querySelector('#compareMfg')?.value || ''
    container.querySelectorAll('.compare-product-card').forEach(card => {
        const matchCat = !cat || card.dataset.category === cat
        const matchMfg = !mfg || card.dataset.mfg === mfg
        card.style.display = matchCat && matchMfg ? '' : 'none'
    })
}

function formatCategory(cat) {
    const labels = {
        ups: 'UPS Systems', pdu: 'Power Distribution (PDU)', generator: 'Generators', ats: 'Transfer Switches',
        busway: 'Busway', crac: 'CRAC Units', crah: 'CRAH Units', inrow: 'In-Row Cooling',
        rdhx: 'Rear-Door Heat Exchangers', cdu: 'Coolant Distribution Units', chiller: 'Chillers',
        cabinet: 'Server Cabinets', containment: 'Containment Systems', cabling: 'Structured Cabling',
        dcim: 'DCIM Software', sensor: 'Environmental Sensors', fire: 'Fire Suppression', detection: 'Smoke Detection'
    }
    return labels[cat] || cat.charAt(0).toUpperCase() + cat.slice(1)
}
