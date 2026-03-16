let directoryData = null
let filterCategory = ''
let filterCountry = ''
let filterState = ''
let filterCity = ''

const categoryLabels = {
  engineer: 'Engineers',
  manufacturer: 'Manufacturers',
  installer: 'Installers',
  sales: 'Sales Agents',
  wholesaler: 'Wholesalers'
}

const categoryBgColors = {
  engineer: '#eef2ff',
  manufacturer: '#ecfeff',
  installer: '#ecfdf5',
  sales: '#fffbeb',
  wholesaler: '#f5f3ff'
}

const categoryColors = {
  engineer: '#6366f1',
  manufacturer: '#0891b2',
  installer: '#059669',
  sales: '#d97706',
  wholesaler: '#7c3aed'
}

const countryLabels = { US: 'United States', CA: 'Canada' }

function getInitials(name) {
  return name.split(/\s+/).filter(w => w.length > 0).map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function renderLogo(listing) {
  if (listing.logo) {
    return `<img src="${listing.logo}" alt="${listing.company} logo" class="dir-card-logo-img" />`
  }
  const initials = getInitials(listing.company || listing.name)
  const bg = categoryBgColors[listing.category] || '#f1f5f9'
  const color = categoryColors[listing.category] || '#475569'
  return `<div class="dir-card-logo-initials" style="background:${bg}; color:${color}">${initials}</div>`
}

function formatLocation(listing) {
  const parts = []
  if (listing.city) parts.push(listing.city)
  if (listing.state) parts.push(listing.state)
  if (listing.country) parts.push(listing.country)
  return parts.join(', ')
}

export function initDirectory(data) {
  directoryData = data
  filterCategory = ''
  filterCountry = ''
  filterState = ''
  filterCity = ''
}

export function renderDirectory(domain) {
  const container = document.getElementById('directoryContainer')
  if (!container || !directoryData) return

  // Start with domain-filtered listings
  const domainListings = directoryData.listings.filter(l => l.domains.includes(domain))

  // Derive filter options from domain listings (before applying location/category filters)
  const countries = [...new Set(domainListings.map(l => l.country).filter(Boolean))].sort()

  // States based on selected country (or all)
  const statePool = filterCountry ? domainListings.filter(l => l.country === filterCountry) : domainListings
  const states = [...new Set(statePool.map(l => l.state).filter(Boolean))].sort()

  // Cities based on selected state (or country, or all)
  let cityPool = domainListings
  if (filterCountry) cityPool = cityPool.filter(l => l.country === filterCountry)
  if (filterState) cityPool = cityPool.filter(l => l.state === filterState)
  const cities = [...new Set(cityPool.map(l => l.city).filter(Boolean))].sort()

  // Category counts (before category filter, after location filters)
  let locationFiltered = domainListings
  if (filterCountry) locationFiltered = locationFiltered.filter(l => l.country === filterCountry)
  if (filterState) locationFiltered = locationFiltered.filter(l => l.state === filterState)
  if (filterCity) locationFiltered = locationFiltered.filter(l => l.city === filterCity)

  const categoryCounts = {}
  for (const l of locationFiltered) {
    categoryCounts[l.category] = (categoryCounts[l.category] || 0) + 1
  }
  const activeCategories = Object.keys(categoryLabels).filter(c => categoryCounts[c] > 0)

  // Apply all filters
  let listings = locationFiltered
  if (filterCategory) {
    listings = listings.filter(l => l.category === filterCategory)
  }

  const selectStyle = `min-width:140px; padding:8px 30px 8px 12px; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--bg-white); font-family:var(--font-body); font-size:12px; color:var(--ink); appearance:none; -webkit-appearance:none; background-image:url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" stroke="%23475569" stroke-width="2"><path d="M4 6l3 3 3-3"/></svg>'); background-repeat:no-repeat; background-position:right 8px center; cursor:pointer;`

  const hasLocationFilters = filterCountry || filterState || filterCity

  let html = `
    <div class="dir-cta-banner">
      <div class="dir-cta-content">
        <div class="dir-cta-icon">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
        </div>
        <div class="dir-cta-text">
          <h3>Get Your Business Listed</h3>
          <p>Reach energy professionals actively researching solutions. The only cost? A 20-minute discovery call.</p>
        </div>
        <a href="https://www.joshuastrub.com" target="_blank" rel="noopener noreferrer" class="dir-cta-btn">
          Book a Discovery Call
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        </a>
      </div>
    </div>

    <div class="dir-location-filters">
      <select id="dirCountry" style="${selectStyle}">
        <option value="">All Countries</option>
        ${countries.map(c => `<option value="${c}" ${filterCountry === c ? 'selected' : ''}>${countryLabels[c] || c}</option>`).join('')}
      </select>
      <select id="dirState" style="${selectStyle}" ${!filterCountry ? 'disabled' : ''}>
        <option value="">${filterCountry === 'CA' ? 'All Provinces' : 'All States'}</option>
        ${states.map(s => `<option value="${s}" ${filterState === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
      <select id="dirCity" style="${selectStyle}" ${!filterState ? 'disabled' : ''}>
        <option value="">All Cities</option>
        ${cities.map(c => `<option value="${c}" ${filterCity === c ? 'selected' : ''}>${c}</option>`).join('')}
      </select>
      ${hasLocationFilters ? `<button id="dirClearLocation" class="dir-clear-btn">Clear</button>` : ''}
    </div>

    <div class="dir-filter-bar">
      <button class="dir-filter-pill ${filterCategory === '' ? 'active' : ''}" data-category="">
        All <span class="dir-pill-count">${locationFiltered.length}</span>
      </button>
      ${activeCategories.map(cat => `
        <button class="dir-filter-pill ${filterCategory === cat ? 'active' : ''}" data-category="${cat}">
          ${categoryLabels[cat]} <span class="dir-pill-count">${categoryCounts[cat]}</span>
        </button>
      `).join('')}
    </div>

    <div class="dir-grid">
      ${listings.map(l => `
        <div class="dir-card">
          <div class="dir-card-logo">
            ${renderLogo(l)}
          </div>
          <div class="dir-card-header">
            <span class="dir-category-badge" style="--badge-color: ${categoryColors[l.category]}">
              ${categoryLabels[l.category]?.replace(/s$/, '') || l.category}
            </span>
            ${l.website ? `<a href="${l.website}" target="_blank" rel="noopener noreferrer" class="dir-card-link" title="Visit website">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="7" y1="17" x2="17" y2="7"/>
                <polyline points="7 7 17 7 17 17"/>
              </svg>
            </a>` : ''}
          </div>
          <h4 class="dir-card-name">${l.name}</h4>
          <span class="dir-card-company">${l.company !== l.name ? l.company : ''}</span>
          <div class="dir-card-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            ${formatLocation(l)}
          </div>
          <p class="dir-card-desc">${l.description}</p>
          <div class="dir-card-domains">
            ${l.domains.map(d => `<span class="dir-domain-tag">${d === 'ev' ? 'EV' : d.charAt(0).toUpperCase() + d.slice(1)}</span>`).join('')}
          </div>
        </div>
      `).join('')}
    </div>
  `

  if (listings.length === 0) {
    html += `
      <div class="dir-empty">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p>No listings found for this domain and filters. Check back soon or adjust your selections.</p>
      </div>
    `
  }

  container.innerHTML = html

  // Bind location filters
  const countryEl = container.querySelector('#dirCountry')
  if (countryEl) countryEl.addEventListener('change', e => {
    filterCountry = e.target.value
    filterState = ''
    filterCity = ''
    renderDirectory(domain)
  })

  const stateEl = container.querySelector('#dirState')
  if (stateEl) stateEl.addEventListener('change', e => {
    filterState = e.target.value
    filterCity = ''
    renderDirectory(domain)
  })

  const cityEl = container.querySelector('#dirCity')
  if (cityEl) cityEl.addEventListener('change', e => {
    filterCity = e.target.value
    renderDirectory(domain)
  })

  const clearLocBtn = container.querySelector('#dirClearLocation')
  if (clearLocBtn) clearLocBtn.addEventListener('click', () => {
    filterCountry = ''
    filterState = ''
    filterCity = ''
    renderDirectory(domain)
  })

  // Bind category filter pills
  container.querySelectorAll('.dir-filter-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      filterCategory = pill.dataset.category
      renderDirectory(domain)
    })
  })
}
