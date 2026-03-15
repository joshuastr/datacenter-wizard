let incentiveData = null
let currentDomain = 'power'
let currentSettings = { country: 'US' }

export function initIncentives(data, domain, settings) {
    incentiveData = data
    currentDomain = domain
    currentSettings = settings
    renderIncentives(domain, settings)
}

export function renderIncentives(domain, settings) {
    currentDomain = domain
    currentSettings = settings || currentSettings
    const container = document.getElementById('incentivesContainer')
    if (!container || !incentiveData) return

    const country = (currentSettings.country || 'US').toUpperCase()
    const items = (incentiveData.incentives || []).filter(inc => {
        const matchDomain = !inc.domains || inc.domains.includes(domain)
        const matchRegion = !inc.region || inc.region === country
        return matchDomain && matchRegion
    })

    if (items.length === 0) {
        container.innerHTML = `<div class="incentives-empty"><p>No incentives found for this domain and region. Try changing the region selector above.</p></div>`
        return
    }

    container.innerHTML = `
    <div class="incentives-grid">
        ${items.map(inc => `
            <div class="incentive-card">
                <span class="incentive-type ${inc.type}">${inc.type.replace('-', ' ')}</span>
                <h3 class="incentive-name">${inc.name}</h3>
                <div class="incentive-value">${inc.value}</div>
                <p class="incentive-desc">${inc.description}</p>
                <div class="incentive-region">Region: ${inc.region || 'All'}</div>
            </div>
        `).join('')}
    </div>`
}
