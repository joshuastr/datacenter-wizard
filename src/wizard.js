let treeData = null
let wizardState = {}

const svgIcons = {
    building: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M6 22V4a2 2 0 012-2h8a2 2 0 012 2v18"/><path d="M6 12H4a2 2 0 00-2 2v6a2 2 0 002 2h2"/><path d="M18 9h2a2 2 0 012 2v9a2 2 0 01-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',
    server: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>',
    edge: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="6" y="6" width="12" height="12" rx="2"/><path d="M6 2v4"/><path d="M18 2v4"/><path d="M6 18v4"/><path d="M18 18v4"/><path d="M2 6h4"/><path d="M2 18h4"/><path d="M18 6h4"/><path d="M18 18h4"/></svg>',
    cloud: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>',
    container: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="6" width="22" height="12" rx="2"/><line x1="7" y1="6" x2="7" y2="18"/><line x1="13" y1="6" x2="13" y2="18"/><line x1="19" y1="6" x2="19" y2="18"/></svg>',
    shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    dollar: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>',
    leaf: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75"/></svg>',
    tool: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>',
    grid: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>',
    briefcase: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>',
    monitor: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
    chart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
    default: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
}

function getIcon(name) {
    return svgIcons[name] || svgIcons.default
}

export function resetWizard() {
    wizardState = {}
}

export function initWizard(data, domain) {
    treeData = data
    renderWizard(domain)
}

export function renderWizard(domain, _settings) {
    if (!treeData) return
    const container = document.getElementById('wizardContainer')
    if (!container) return

    const steps = treeData.steps.filter(s => s.domain.includes(domain))
    const visibleSteps = getVisibleSteps(steps)
    const allAnswered = visibleSteps.length > 0 && visibleSteps.every(s => wizardState[s.id] !== undefined)

    let html = ''
    visibleSteps.forEach((step, idx) => {
        html += renderStep(step, idx)
    })

    if (allAnswered) {
        html += renderResults(domain, visibleSteps)
    }

    container.innerHTML = html

    container.querySelectorAll('.wizard-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const stepId = opt.dataset.step
            const value = opt.dataset.value
            const step = steps.find(s => s.id === stepId)
            if (!step) return

            if (step.type === 'multi-select') {
                const current = wizardState[stepId] || []
                const idx = current.indexOf(value)
                if (idx >= 0) current.splice(idx, 1)
                else current.push(value)
                wizardState[stepId] = [...current]
            } else {
                // Clear downstream selections when an earlier step changes
                const stepIdx = steps.indexOf(step)
                if (wizardState[stepId] !== value) {
                    steps.slice(stepIdx + 1).forEach(s => { delete wizardState[s.id] })
                }
                wizardState[stepId] = value
            }
            renderWizard(domain, _settings)
        })
    })

    // Bind reset button
    const resetBtn = container.querySelector('.wizard-reset-btn')
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            wizardState = {}
            renderWizard(domain, _settings)
        })
    }
}

function getVisibleSteps(steps) {
    return steps.filter(step => {
        if (!step.showWhen) return true
        return Object.entries(step.showWhen).every(([key, vals]) => {
            const ans = wizardState[key]
            return ans && vals.includes(ans)
        })
    })
}

function renderStep(step, idx) {
    const selected = wizardState[step.id]
    const isMulti = step.type === 'multi-select'
    return `
    <div class="wizard-step">
        <div class="wizard-step-header">
            <div class="wizard-step-number">${idx + 1}</div>
            <h2 class="wizard-step-question">${step.question}</h2>
            <p class="wizard-step-desc">${step.description}</p>
        </div>
        <div class="wizard-options">
            ${step.options.map(opt => {
        const isSel = isMulti ? (selected || []).includes(opt.value) : selected === opt.value
        return `
                <button class="wizard-option ${isSel ? 'selected' : ''} ${isMulti ? 'multi-select' : ''}"
                        data-step="${step.id}" data-value="${opt.value}">
                    <span class="wizard-option-icon">${getIcon(opt.icon)}</span>
                    <span class="wizard-option-label">${opt.label}</span>
                    <span class="wizard-option-desc">${opt.description}</span>
                </button>`
    }).join('')}
        </div>
    </div>`
}

function renderResults(domain, _steps) {
    const rule = findMatchingRule(treeData.rules, domain)
    if (!rule) return ''
    return `
    <div class="results-container">
        <h3 class="results-title">${rule.name}</h3>
        <p class="results-reasoning">${rule.reasoning}</p>
        <h4 class="results-tips-title">Expert Tips</h4>
        <ul class="results-tips">
            ${rule.tips.map(t => `<li>${t}</li>`).join('')}
        </ul>
        <button class="wizard-reset-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
            </svg>
            Start Over
        </button>
    </div>`
}

function findMatchingRule(rules, domain) {
    const domainRules = rules.filter(r => r.domain.includes(domain))
    let best = null
    let bestScore = -1

    for (const rule of domainRules) {
        const conditions = rule.conditions || {}
        const keys = Object.keys(conditions)
        if (keys.length === 0) { if (!best) best = rule; continue }

        let score = 0
        let allMatch = true
        for (const key of keys) {
            if (wizardState[key] === conditions[key]) score++
            else { allMatch = false; break }
        }
        if (allMatch && score > bestScore) {
            bestScore = score
            best = rule
        }
    }
    return best
}
