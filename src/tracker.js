// AI Datacenter Tracker — sortable, filterable table of announced projects

let trackerData = null;
let sortCol = 'capacityMW';
let sortDir = 'desc';
let filters = { search: '', status: '', state: '', country: '', developer: '' };

export async function loadTrackerData() {
    if (trackerData) return trackerData;
    const res = await fetch('/datacenter-wizard/data/ai-datacenters.json');
    trackerData = await res.json();
    return trackerData;
}

export async function renderTracker(container) {
    const data = await loadTrackerData();
    container.innerHTML = buildTracker(data);
    bindTrackerEvents(container, data);
}

function buildTracker(data) {
    const projects = getFilteredSorted(data.projects);
    const stats = computeStats(projects, data.projects);

    return `
        <div class="tracker-header">
            <div>
                <div class="tracker-title-row">
                    <h2 class="tracker-title">AI Datacenter Project Tracker</h2>
                    <span class="tracker-count">${projects.length} projects</span>
                </div>
                <span class="tracker-updated">Last updated: ${data.lastUpdated} · </span>
                <a href="${data.contributeUrl}" target="_blank" rel="noopener" class="tracker-contribute">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
                    Contribute data on GitHub
                </a>
            </div>
            <button class="tracker-export-btn" id="trackerExportCSV">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Export CSV
            </button>
        </div>

        ${buildStats(stats)}
        ${buildFilters(data.projects)}
        ${buildTable(projects)}
    `;
}

function computeStats(filtered, all) {
    const totalCapacity = filtered.reduce((s, p) => s + (p.capacityMW || 0), 0);
    const operational = filtered.filter(p => p.status === 'Operational').length;
    const underConstruction = filtered.filter(p => p.status === 'Under Construction').length;
    const planned = filtered.filter(p => p.status === 'Planned').length;
    const uniqueDevs = new Set(filtered.map(p => p.developer)).size;
    const countries = new Set(filtered.map(p => p.country)).size;

    return { totalCapacity, operational, underConstruction, planned, uniqueDevs, countries, total: filtered.length };
}

function buildStats(s) {
    const capGW = (s.totalCapacity / 1000).toFixed(1);
    return `
        <div class="tracker-stats">
            <div class="tracker-stat">
                <div class="tracker-stat-value">${capGW} GW</div>
                <div class="tracker-stat-label">Total Capacity</div>
            </div>
            <div class="tracker-stat">
                <div class="tracker-stat-value">${s.operational}</div>
                <div class="tracker-stat-label">Operational</div>
            </div>
            <div class="tracker-stat">
                <div class="tracker-stat-value">${s.underConstruction}</div>
                <div class="tracker-stat-label">Under Construction</div>
            </div>
            <div class="tracker-stat">
                <div class="tracker-stat-value">${s.planned}</div>
                <div class="tracker-stat-label">Planned</div>
            </div>
            <div class="tracker-stat">
                <div class="tracker-stat-value">${s.uniqueDevs}</div>
                <div class="tracker-stat-label">Developers</div>
            </div>
            <div class="tracker-stat">
                <div class="tracker-stat-value">${s.countries}</div>
                <div class="tracker-stat-label">Countries</div>
            </div>
        </div>
    `;
}

function getUniqueValues(projects, key) {
    return [...new Set(projects.map(p => p[key]).filter(Boolean))].sort();
}

function buildFilters(projects) {
    const statuses = getUniqueValues(projects, 'status');
    const states = getUniqueValues(projects, 'state');
    const countries = getUniqueValues(projects, 'country');
    const developers = getUniqueValues(projects, 'developer');

    return `
        <div class="tracker-filters">
            <input type="text" class="tracker-search" id="trackerSearch"
                placeholder="Search projects, developers, locations..."
                value="${filters.search}">
            <select class="tracker-select" id="trackerStatus">
                <option value="">All Statuses</option>
                ${statuses.map(s => `<option value="${s}" ${filters.status === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <select class="tracker-select" id="trackerCountry">
                <option value="">All Countries</option>
                ${countries.map(c => `<option value="${c}" ${filters.country === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
            <select class="tracker-select" id="trackerState">
                <option value="">All States</option>
                ${states.map(s => `<option value="${s}" ${filters.state === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
            <select class="tracker-select" id="trackerDeveloper">
                <option value="">All Developers</option>
                ${developers.map(d => `<option value="${d}" ${filters.developer === d ? 'selected' : ''}>${d}</option>`).join('')}
            </select>
        </div>
    `;
}

const columns = [
    { key: 'name', label: 'Project Name' },
    { key: 'city', label: 'City' },
    { key: 'state', label: 'State' },
    { key: 'country', label: 'Country' },
    { key: 'capacityMW', label: 'Capacity (MW)' },
    { key: 'developer', label: 'Developer' },
    { key: 'customer', label: 'Customer' },
    { key: 'powerProvider', label: 'Power Provider' },
    { key: 'status', label: 'Status' },
    { key: 'announcedDate', label: 'Announced' },
    { key: 'source', label: 'Source' }
];

function buildTable(projects) {
    if (!projects.length) {
        return '<div class="tracker-empty">No projects match your filters.</div>';
    }

    const ths = columns.map(col => {
        const cls = sortCol === col.key ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : '';
        const arrow = sortCol === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '▲';
        return `<th class="${cls}" data-sort="${col.key}">${col.label} <span class="sort-arrow">${arrow}</span></th>`;
    }).join('');

    const rows = projects.map(p => `
        <tr>
            <td class="tracker-project-name">${esc(p.name)}</td>
            <td>${esc(p.city)}</td>
            <td>${esc(p.state)}</td>
            <td>${esc(p.country)}</td>
            <td class="tracker-capacity">${p.capacityMW ? p.capacityMW.toLocaleString() : '—'}</td>
            <td>${esc(p.developer)}</td>
            <td>${esc(p.customer)}</td>
            <td>${esc(p.powerProvider)}</td>
            <td>${statusBadge(p.status)}</td>
            <td>${esc(p.announcedDate || '—')}</td>
            <td>${p.source ? `<a href="${p.source}" target="_blank" rel="noopener" class="tracker-source-link">View ↗</a>` : '—'}</td>
        </tr>
    `).join('');

    return `
        <div class="tracker-table-wrap">
            <table class="tracker-table">
                <thead><tr>${ths}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function statusBadge(status) {
    const cls = status === 'Operational' ? 'operational'
        : status === 'Under Construction' ? 'under-construction'
            : 'planned';
    return `<span class="tracker-status ${cls}">${esc(status)}</span>`;
}

function esc(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getFilteredSorted(projects) {
    let result = [...projects];

    // Filter
    if (filters.search) {
        const q = filters.search.toLowerCase();
        result = result.filter(p =>
            (p.name || '').toLowerCase().includes(q) ||
            (p.city || '').toLowerCase().includes(q) ||
            (p.state || '').toLowerCase().includes(q) ||
            (p.country || '').toLowerCase().includes(q) ||
            (p.developer || '').toLowerCase().includes(q) ||
            (p.customer || '').toLowerCase().includes(q) ||
            (p.powerProvider || '').toLowerCase().includes(q)
        );
    }
    if (filters.status) result = result.filter(p => p.status === filters.status);
    if (filters.state) result = result.filter(p => p.state === filters.state);
    if (filters.country) result = result.filter(p => p.country === filters.country);
    if (filters.developer) result = result.filter(p => p.developer === filters.developer);

    // Sort
    result.sort((a, b) => {
        let va = a[sortCol], vb = b[sortCol];
        if (typeof va === 'number' && typeof vb === 'number') {
            return sortDir === 'asc' ? va - vb : vb - va;
        }
        va = (va || '').toString().toLowerCase();
        vb = (vb || '').toString().toLowerCase();
        if (va < vb) return sortDir === 'asc' ? -1 : 1;
        if (va > vb) return sortDir === 'asc' ? 1 : -1;
        return 0;
    });

    return result;
}

function bindTrackerEvents(container, data) {
    // Sort
    container.querySelectorAll('.tracker-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const col = th.dataset.sort;
            if (sortCol === col) {
                sortDir = sortDir === 'asc' ? 'desc' : 'asc';
            } else {
                sortCol = col;
                sortDir = col === 'capacityMW' ? 'desc' : 'asc';
            }
            container.innerHTML = buildTracker(data);
            bindTrackerEvents(container, data);
        });
    });

    // Filters
    const searchEl = container.querySelector('#trackerSearch');
    if (searchEl) {
        let debounce;
        searchEl.addEventListener('input', () => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
                filters.search = searchEl.value;
                container.innerHTML = buildTracker(data);
                bindTrackerEvents(container, data);
                // Re-focus search
                const newSearch = container.querySelector('#trackerSearch');
                if (newSearch) { newSearch.focus(); newSearch.selectionStart = newSearch.selectionEnd = newSearch.value.length; }
            }, 250);
        });
    }

    ['trackerStatus', 'trackerCountry', 'trackerState', 'trackerDeveloper'].forEach(id => {
        const el = container.querySelector(`#${id}`);
        if (el) {
            el.addEventListener('change', () => {
                const key = id.replace('tracker', '').toLowerCase();
                filters[key] = el.value;
                container.innerHTML = buildTracker(data);
                bindTrackerEvents(container, data);
            });
        }
    });

    // Export CSV
    const exportBtn = container.querySelector('#trackerExportCSV');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            const projects = getFilteredSorted(data.projects);
            const headers = ['Project Name', 'City', 'State', 'Country', 'Capacity (MW)', 'Developer', 'Customer', 'Power Provider', 'Status', 'Announced', 'Source'];
            const keys = ['name', 'city', 'state', 'country', 'capacityMW', 'developer', 'customer', 'powerProvider', 'status', 'announcedDate', 'source'];
            const csvRows = [headers.join(',')];
            projects.forEach(p => {
                const row = keys.map(k => {
                    const val = (p[k] ?? '').toString().replace(/"/g, '""');
                    return `"${val}"`;
                });
                csvRows.push(row.join(','));
            });
            const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `ai-datacenter-projects-${new Date().toISOString().slice(0, 10)}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }
}
