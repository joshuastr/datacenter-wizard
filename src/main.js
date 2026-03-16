import { initWizard, renderWizard, resetWizard } from './wizard.js'
import { initKnowledge, renderKnowledge } from './knowledge.js'
import { initCalculator, renderCalculator } from './calculator.js'
import { initComparison, renderComparison } from './comparison.js'
import { initIncentives, renderIncentives } from './incentives.js'
import { renderTracker } from './tracker.js'
import { initDirectory, renderDirectory } from './directory.js'

let activeDomain = 'power'
let activeCountry = 'US'
let activeCurrency = 'USD'

export function getSettings() {
    return { country: activeCountry, currency: activeCurrency }
}

export function formatCurrency(amount) {
    const symbols = { USD: '$', CAD: 'C$', EUR: '€' }
    const rates = { USD: 1, CAD: 1.37, EUR: 0.92 }
    const converted = amount * (rates[activeCurrency] || 1)
    return `${symbols[activeCurrency] || '$'}${Math.round(converted).toLocaleString('en')}`
}

const domainNames = {
    power: 'Power Systems',
    cooling: 'Cooling & HVAC',
    racks: 'Racks & Containment',
    monitoring: 'Monitoring & Safety'
}
const tabContexts = {
    advisor: { suffix: 'Advisor', desc: 'Walk through your project details step by step and get tailored infrastructure recommendations with expert tips.' },
    knowledge: { suffix: 'Knowledge Base', desc: 'Browse FAQs and reference guides covering datacenter infrastructure fundamentals.' },
    calculator: { suffix: 'Calculators', desc: 'Estimate power requirements, cooling loads, PUE, and total cost of ownership for your project.' },
    compare: { suffix: 'Equipment Comparison', desc: 'Filter by manufacturer and category, then select up to 3 products to compare specs side by side.' },
    incentives: { suffix: 'Incentives', desc: 'Browse available rebates, tax credits, grants, and certifications for datacenter infrastructure.' },
    directory: { suffix: 'Directory', desc: 'Find engineers, manufacturers, installers, sales agents, and wholesalers in the datacenter industry.' },
    tracker: { suffix: 'Project Tracker', desc: 'Track announced AI datacenter projects worldwide - capacity, developers, status, and power providers.' }
}
let activeTab = 'advisor'

function updateContextBar() {
    const contextTitle = document.getElementById('domainContextTitle')
    const contextDesc = document.getElementById('domainContextDesc')
    if (activeDomain === 'tracker') {
        if (contextTitle) contextTitle.textContent = 'AI Datacenter Project Tracker'
        if (contextDesc) contextDesc.textContent = 'Track announced AI datacenter projects worldwide - capacity, developers, status, and power providers.'
    } else {
        const domain = domainNames[activeDomain] || 'Datacenter'
        const tab = tabContexts[activeTab] || tabContexts.advisor
        if (contextTitle) contextTitle.textContent = `${domain} ${tab.suffix}`
        if (contextDesc) contextDesc.textContent = tab.desc
    }
}

function toggleTrackerMode(isTracker) {
    const settingsBar = document.getElementById('settingsBar')
    const tabsWrapper = document.querySelector('.tool-tabs-wrapper')
    const toolPanels = document.querySelectorAll('#advisorPanel, #knowledgePanel, #calculatorPanel, #comparePanel, #incentivesPanel, #directoryPanel')
    const trackerPanel = document.getElementById('trackerPanel')

    if (isTracker) {
        if (settingsBar) settingsBar.style.display = 'none'
        if (tabsWrapper) tabsWrapper.style.display = 'none'
        toolPanels.forEach(p => p.classList.remove('active'))
        if (trackerPanel) {
            trackerPanel.classList.add('active')
            if (!trackerPanel.dataset.loaded) {
                trackerPanel.dataset.loaded = '1'
                const container = document.getElementById('trackerContainer')
                if (container) renderTracker(container)
            }
        }
    } else {
        if (settingsBar) settingsBar.style.display = ''
        if (tabsWrapper) tabsWrapper.style.display = ''
        if (trackerPanel) trackerPanel.classList.remove('active')
        // Restore active tool tab panel
        const activeToolTab = document.querySelector('.tool-tab.active')
        if (activeToolTab) {
            const panel = document.getElementById(activeToolTab.dataset.tab + 'Panel')
            if (panel) panel.classList.add('active')
        }
    }
}

function initTabs() {
    const tabs = document.querySelectorAll('.tool-tab')
    const panels = document.querySelectorAll('.tab-panel:not(#trackerPanel)')
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const target = tab.dataset.tab
            activeTab = target
            tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false') })
            tab.classList.add('active')
            tab.setAttribute('aria-selected', 'true')
            panels.forEach(p => p.classList.remove('active'))
            const panel = document.getElementById(target + 'Panel')
            if (panel) panel.classList.add('active')
            updateContextBar()
        })
    })
}

function initDomainSelector() {
    const btns = document.querySelectorAll('.domain-btn')
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            const domain = btn.dataset.domain
            if (domain === activeDomain) return
            activeDomain = domain
            btns.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')
            document.body.dataset.domain = domain

            if (domain === 'tracker') {
                toggleTrackerMode(true)
            } else {
                toggleTrackerMode(false)
                resetWizard()
                refreshAllModules()
            }
            updateContextBar()
        })
    })
    document.body.dataset.domain = activeDomain
}

function initSettingsBar() {
    const countryBtns = document.querySelectorAll('.country-btn')
    const currencyDisplay = document.getElementById('currencyDisplay')

    countryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const country = btn.dataset.country
            if (country === activeCountry) return
            activeCountry = country
            activeCurrency = country === 'CA' ? 'CAD' : country === 'EU' ? 'EUR' : 'USD'

            countryBtns.forEach(b => b.classList.remove('active'))
            btn.classList.add('active')

            if (currencyDisplay) currencyDisplay.textContent = activeCurrency
            refreshAllModules()
        })
    })
}

function refreshAllModules() {
    const settings = getSettings()
    renderWizard(activeDomain, settings)
    renderKnowledge(activeDomain)
    renderCalculator(activeDomain, settings)
    renderComparison(activeDomain)
    renderIncentives(activeDomain, settings)
    renderDirectory(activeDomain)
}

const BASE = import.meta.env.BASE_URL

async function loadJSON(path) {
    const res = await fetch(path)
    return res.json()
}

document.addEventListener('DOMContentLoaded', async () => {
    initTabs()
    initDomainSelector()
    initSettingsBar()
    const [treeData, faqData, powerData, coolingData, racksData, monitoringData, incentiveData, directoryListings] = await Promise.all([
        loadJSON(`${BASE}data/decision-tree.json`),
        loadJSON(`${BASE}data/faq.json`),
        loadJSON(`${BASE}data/products-power.json`),
        loadJSON(`${BASE}data/products-cooling.json`),
        loadJSON(`${BASE}data/products-racks.json`),
        loadJSON(`${BASE}data/products-monitoring.json`),
        loadJSON(`${BASE}data/incentives.json`),
        loadJSON(`${BASE}data/directory.json`),
    ])
    const settings = getSettings()
    initWizard(treeData, activeDomain)
    initKnowledge(faqData, activeDomain)
    initCalculator(activeDomain, settings)
    initComparison({ power: powerData, cooling: coolingData, racks: racksData, monitoring: monitoringData }, activeDomain)
    initIncentives(incentiveData, activeDomain, settings)
    initDirectory(directoryListings)
    renderDirectory(activeDomain)
})
