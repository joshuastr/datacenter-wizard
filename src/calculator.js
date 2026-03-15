import { formatCurrency } from './main.js'

let currentDomain = 'power'
let currentSettings = { country: 'US', currency: 'USD' }

// Power & PUE calculator state
const powerState = { itLoad: 200, upsEfficiency: 95, lightingOverhead: 3, coolingMethod: 'air-dx', electricityRate: 0.10 }
// Cooling load calculator state
const coolingState = { itLoad: 200, coolingMethod: 'air-dx', ambientTemp: 35, supplyTemp: 12, pueTarget: 1.4 }
// TCO/Build Cost calculator state
const tcoState = { rackCount: 20, densityPerRack: 8, redundancy: 'nplus1', region: 'us-avg' }

let currentCalcMode = 'power'

function safeFmt(val, decimals = 0) {
    if (!isFinite(val) || isNaN(val)) return '—'
    return decimals > 0 ? val.toFixed(decimals) : Math.round(val).toLocaleString('en')
}

export function initCalculator(domain, settings) {
    currentDomain = domain
    currentSettings = settings
    renderCalculator(domain, settings)
}

export function renderCalculator(domain, settings) {
    currentDomain = domain
    currentSettings = settings || currentSettings
    const container = document.getElementById('calculatorContainer')
    if (!container) return

    // Update electricity rate based on region
    const regionRates = { US: 0.10, CA: 0.08, EU: 0.15 }
    const newRate = regionRates[currentSettings.country] || 0.10
    if (powerState.electricityRate === 0.10 || powerState.electricityRate === 0.08 || powerState.electricityRate === 0.15) {
        powerState.electricityRate = newRate
    }

    // Pick default mode based on domain
    if (domain === 'power') currentCalcMode = 'power'
    else if (domain === 'cooling') currentCalcMode = 'cooling'
    else currentCalcMode = 'tco'

    renderCurrentCalc(container)
}

function renderCurrentCalc(container) {
    // Mode toggle
    const modeHtml = `
    <div class="calc-mode-toggle">
        <button class="calc-mode-btn ${currentCalcMode === 'power' ? 'active' : ''}" data-mode="power">Power & PUE</button>
        <button class="calc-mode-btn ${currentCalcMode === 'cooling' ? 'active' : ''}" data-mode="cooling">Cooling Load</button>
        <button class="calc-mode-btn ${currentCalcMode === 'tco' ? 'active' : ''}" data-mode="tco">Build Cost / TCO</button>
    </div>`

    let calcHtml = ''
    if (currentCalcMode === 'power') calcHtml = renderPowerCalc()
    else if (currentCalcMode === 'cooling') calcHtml = renderCoolingCalc()
    else calcHtml = renderTCOCalc()

    container.innerHTML = modeHtml + calcHtml

    // Bind mode toggle
    container.querySelectorAll('.calc-mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentCalcMode = btn.dataset.mode
            renderCurrentCalc(container)
        })
    })

    // Bind inputs
    if (currentCalcMode === 'power') bindPowerInputs(container)
    else if (currentCalcMode === 'cooling') bindCoolingInputs(container)
    else bindTCOInputs(container)

    // Add copy button after outputs
    const outputs = container.querySelector('.calc-outputs')
    if (outputs) {
        const copyBtn = document.createElement('button')
        copyBtn.className = 'calc-copy-btn'
        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Results`
        copyBtn.addEventListener('click', () => {
            const cards = outputs.querySelectorAll('.calc-card')
            const lines = []
            const modeLabels = { power: 'Power & PUE', cooling: 'Cooling Load', tco: 'Build Cost / TCO' }
            lines.push(`Datacenter Build Wizard — ${modeLabels[currentCalcMode] || 'Calculator'} Results`)
            lines.push('─'.repeat(40))
            cards.forEach(card => {
                const label = card.querySelector('.calc-card-label')?.textContent || ''
                const value = card.querySelector('.calc-card-value')?.textContent || ''
                const note = card.querySelector('.calc-card-note')?.textContent || ''
                lines.push(`${label}: ${value}${note ? ` (${note})` : ''}`)
            })
            navigator.clipboard.writeText(lines.join('\n')).then(() => {
                copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Copied!`
                copyBtn.classList.add('copied')
                setTimeout(() => {
                    copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy Results`
                    copyBtn.classList.remove('copied')
                }, 1500)
            })
        })
        outputs.appendChild(copyBtn)
    }
}

// ── Power & PUE Calculator ─────────────────────
function renderPowerCalc() {
    const s = powerState
    const upsLoss = s.itLoad * (1 - s.upsEfficiency / 100)
    const lightingPower = s.itLoad * (s.lightingOverhead / 100)
    const coolingFactors = { 'air-dx': 0.45, 'chilled-water': 0.35, 'in-row': 0.30, 'rear-door': 0.22, 'liquid': 0.08, 'immersion': 0.04 }
    const coolingPower = s.itLoad * (coolingFactors[s.coolingMethod] || 0.35)
    const totalFacility = s.itLoad + upsLoss + lightingPower + coolingPower
    const pue = s.itLoad > 0 ? totalFacility / s.itLoad : 0
    const annualEnergy = totalFacility * 8760
    const annualCost = annualEnergy * s.electricityRate
    const costPerKwMonth = s.itLoad > 0 ? annualCost / s.itLoad / 12 : 0

    return `
    <div class="calc-container">
        <div class="calc-inputs">
            <h3>Power & PUE Inputs</h3>
            <div class="calc-group">
                <label class="calc-label">IT Load <span class="calc-value" id="itLoadVal">${s.itLoad} kW</span></label>
                <input type="range" class="calc-slider" id="itLoadSlider" min="10" max="5000" step="10" value="${s.itLoad}">
            </div>
            <div class="calc-group">
                <label class="calc-label">UPS Efficiency <span class="calc-value" id="upsEffVal">${s.upsEfficiency}%</span></label>
                <input type="range" class="calc-slider" id="upsEffSlider" min="85" max="99" step="0.5" value="${s.upsEfficiency}">
            </div>
            <div class="calc-group">
                <label class="calc-label">Lighting & Other Overhead <span class="calc-value" id="lightingVal">${s.lightingOverhead}%</span></label>
                <input type="range" class="calc-slider" id="lightingSlider" min="1" max="10" step="0.5" value="${s.lightingOverhead}">
            </div>
            <div class="calc-group">
                <label class="calc-label">Cooling Method</label>
                <select class="calc-select" id="coolingMethodSelect">
                    <option value="air-dx" ${s.coolingMethod === 'air-dx' ? 'selected' : ''}>Air-Cooled DX (CRAC)</option>
                    <option value="chilled-water" ${s.coolingMethod === 'chilled-water' ? 'selected' : ''}>Chilled Water (CRAH)</option>
                    <option value="in-row" ${s.coolingMethod === 'in-row' ? 'selected' : ''}>In-Row / Close-Coupled</option>
                    <option value="rear-door" ${s.coolingMethod === 'rear-door' ? 'selected' : ''}>Rear-Door Heat Exchanger</option>
                    <option value="liquid" ${s.coolingMethod === 'liquid' ? 'selected' : ''}>Direct Liquid Cooling</option>
                    <option value="immersion" ${s.coolingMethod === 'immersion' ? 'selected' : ''}>Immersion Cooling</option>
                </select>
            </div>
            <div class="calc-group">
                <label class="calc-label">Electricity Rate <span class="calc-value" id="rateVal">${formatCurrency(s.electricityRate * 100)}/kWh</span></label>
                <input type="range" class="calc-slider" id="rateSlider" min="4" max="30" step="1" value="${s.electricityRate * 100}">
            </div>
        </div>
        <div class="calc-outputs">
            <div class="calc-card highlight">
                <div class="calc-card-label">PUE</div>
                <div class="calc-card-value" id="pueOutput">${safeFmt(pue, 2)}</div>
                <div class="calc-card-note">${pue < 1.4 ? 'Excellent' : pue < 1.6 ? 'Good' : pue < 1.8 ? 'Average' : 'Below average'}</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Total Facility Power</div>
                <div class="calc-card-value" id="totalPowerOutput">${Math.round(totalFacility)}<span class="calc-card-unit">kW</span></div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Cooling Load</div>
                <div class="calc-card-value" id="coolingLoadOutput">${Math.round(coolingPower)}<span class="calc-card-unit">kW</span></div>
                <div class="calc-card-note">${Math.round(coolingPower / 3.517)} tons</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">UPS Losses</div>
                <div class="calc-card-value" id="upsLossOutput">${upsLoss.toFixed(1)}<span class="calc-card-unit">kW</span></div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Annual Energy</div>
                <div class="calc-card-value" id="annualEnergyOutput">${(annualEnergy / 1000000).toFixed(2)}<span class="calc-card-unit">GWh</span></div>
            </div>
            <div class="calc-card highlight">
                <div class="calc-card-label">Annual Energy Cost</div>
                <div class="calc-card-value" id="annualCostOutput">${formatCurrency(annualCost)}</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Cost per kW IT / Month</div>
                <div class="calc-card-value" id="costPerKwOutput">${formatCurrency(costPerKwMonth)}</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">IT Load</div>
                <div class="calc-card-value">${s.itLoad}<span class="calc-card-unit">kW</span></div>
            </div>
        </div>
    </div>`
}

function bindPowerInputs(container) {
    function update() {
        const c = document.getElementById('calculatorContainer')
        if (c) renderCurrentCalc(c)
    }
    bindSlider(container, 'itLoadSlider', 'itLoadVal', v => { powerState.itLoad = +v; return v + ' kW' }, update)
    bindSlider(container, 'upsEffSlider', 'upsEffVal', v => { powerState.upsEfficiency = +v; return v + '%' }, update)
    bindSlider(container, 'lightingSlider', 'lightingVal', v => { powerState.lightingOverhead = +v; return v + '%' }, update)
    bindSlider(container, 'rateSlider', 'rateVal', v => { powerState.electricityRate = +v / 100; return formatCurrency(+v) + '/kWh' }, update)
    const sel = container.querySelector('#coolingMethodSelect')
    if (sel) sel.addEventListener('change', () => { powerState.coolingMethod = sel.value; update() })
}

// ── Cooling Load Calculator ────────────────────
function renderCoolingCalc() {
    const s = coolingState
    const coolingFactors = { 'air-dx': 0.45, 'chilled-water': 0.35, 'in-row': 0.30, 'rear-door': 0.22, 'liquid': 0.08, 'immersion': 0.04 }
    const factor = coolingFactors[s.coolingMethod] || 0.35
    const coolingKW = s.itLoad * factor
    const tons = coolingKW / 3.517
    const cfm = s.itLoad * 160 // approx CFM per kW for air-cooled
    const annualCoolCost = coolingKW * 8760 * powerState.electricityRate
    const gpm = coolingKW * 0.57 // approx GPM for chilled water
    const cracUnits = Math.ceil(coolingKW / 50) // approx 50kW per CRAC
    const airflowNeeded = s.coolingMethod === 'liquid' || s.coolingMethod === 'immersion'

    return `
    <div class="calc-container">
        <div class="calc-inputs">
            <h3>Cooling Load Inputs</h3>
            <div class="calc-group">
                <label class="calc-label">IT Load <span class="calc-value" id="coolItLoadVal">${s.itLoad} kW</span></label>
                <input type="range" class="calc-slider" id="coolItLoadSlider" min="10" max="5000" step="10" value="${s.itLoad}">
            </div>
            <div class="calc-group">
                <label class="calc-label">Cooling Method</label>
                <select class="calc-select" id="coolMethodSelect">
                    <option value="air-dx" ${s.coolingMethod === 'air-dx' ? 'selected' : ''}>Air-Cooled DX (CRAC)</option>
                    <option value="chilled-water" ${s.coolingMethod === 'chilled-water' ? 'selected' : ''}>Chilled Water (CRAH)</option>
                    <option value="in-row" ${s.coolingMethod === 'in-row' ? 'selected' : ''}>In-Row / Close-Coupled</option>
                    <option value="rear-door" ${s.coolingMethod === 'rear-door' ? 'selected' : ''}>Rear-Door Heat Exchanger</option>
                    <option value="liquid" ${s.coolingMethod === 'liquid' ? 'selected' : ''}>Direct Liquid Cooling</option>
                    <option value="immersion" ${s.coolingMethod === 'immersion' ? 'selected' : ''}>Immersion Cooling</option>
                </select>
            </div>
            <div class="calc-group">
                <label class="calc-label">Ambient Temp <span class="calc-value" id="ambientVal">${s.ambientTemp}°C</span></label>
                <input type="range" class="calc-slider" id="ambientSlider" min="15" max="50" step="1" value="${s.ambientTemp}">
            </div>
            <div class="calc-group">
                <label class="calc-label">Supply Temp <span class="calc-value" id="supplyVal">${s.supplyTemp}°C</span></label>
                <input type="range" class="calc-slider" id="supplySlider" min="5" max="27" step="1" value="${s.supplyTemp}">
            </div>
        </div>
        <div class="calc-outputs">
            <div class="calc-card highlight">
                <div class="calc-card-label">Cooling Required</div>
                <div class="calc-card-value">${Math.round(coolingKW)}<span class="calc-card-unit">kW</span></div>
            </div>
            <div class="calc-card highlight">
                <div class="calc-card-label">Cooling Capacity</div>
                <div class="calc-card-value">${Math.round(tons)}<span class="calc-card-unit">tons</span></div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">${airflowNeeded ? 'Coolant Flow' : 'Airflow Needed'}</div>
                <div class="calc-card-value">${airflowNeeded ? Math.round(gpm) : Math.round(cfm).toLocaleString()}<span class="calc-card-unit">${airflowNeeded ? 'GPM' : 'CFM'}</span></div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Est. Cooling Units</div>
                <div class="calc-card-value">${cracUnits}<span class="calc-card-unit">units</span></div>
                <div class="calc-card-note">At ~50 kW per unit (N capacity)</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Cooling Power Draw</div>
                <div class="calc-card-value">${Math.round(coolingKW)}<span class="calc-card-unit">kW</span></div>
                <div class="calc-card-note">${Math.round(factor * 100)}% of IT load</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Annual Cooling Cost</div>
                <div class="calc-card-value">${formatCurrency(annualCoolCost)}</div>
                <div class="calc-card-note">At ${formatCurrency(powerState.electricityRate * 100)}/kWh</div>
            </div>
        </div>
    </div>`
}

function bindCoolingInputs(container) {
    function update() {
        const c = document.getElementById('calculatorContainer')
        if (c) renderCurrentCalc(c)
    }
    bindSlider(container, 'coolItLoadSlider', 'coolItLoadVal', v => { coolingState.itLoad = +v; return v + ' kW' }, update)
    bindSlider(container, 'ambientSlider', 'ambientVal', v => { coolingState.ambientTemp = +v; return v + '°C' }, update)
    bindSlider(container, 'supplySlider', 'supplyVal', v => { coolingState.supplyTemp = +v; return v + '°C' }, update)
    const sel = container.querySelector('#coolMethodSelect')
    if (sel) sel.addEventListener('change', () => { coolingState.coolingMethod = sel.value; update() })
}

// ── TCO / Build Cost Calculator ────────────────
function renderTCOCalc() {
    const s = tcoState
    const totalItKW = s.rackCount * s.densityPerRack
    const redundancyMultipliers = { n: 1, nplus1: 1.35, twon: 2, twonplus1: 2.15 }
    const redMult = redundancyMultipliers[s.redundancy] || 1.35

    // Cost per kW estimates
    const powerCostPerKW = 800 * redMult // UPS, PDU, switchgear, gen
    const coolingCostPerKW = 500 * redMult // CRAC/CRAH, chiller, containment
    const rackCostPerRack = 3500 // rack + PDUs + containment + cabling
    const monitoringCostPerRack = 800 // DCIM, sensors, fire, security

    const powerCapex = totalItKW * powerCostPerKW
    const coolingCapex = totalItKW * coolingCostPerKW
    const rackCapex = s.rackCount * rackCostPerRack
    const monitoringCapex = s.rackCount * monitoringCostPerRack
    const totalCapex = powerCapex + coolingCapex + rackCapex + monitoringCapex

    // 5-year OpEx estimate
    const annualPowerCost = totalItKW * 1.4 * 8760 * 0.10 // PUE 1.4
    const annualMaintenance = totalCapex * 0.06
    const fiveYearOpex = (annualPowerCost + annualMaintenance) * 5
    const fiveYearTCO = totalCapex + fiveYearOpex
    const costPerKW = totalItKW > 0 ? totalCapex / totalItKW : 0

    const redundancyLabels = { n: 'N (Basic)', nplus1: 'N+1 (Tier II)', twon: '2N (Tier III+)', twonplus1: '2N+1 (Tier IV)' }

    return `
    <div class="calc-container">
        <div class="calc-inputs">
            <h3>Build Cost / TCO Inputs</h3>
            <div class="calc-group">
                <label class="calc-label">Number of Racks <span class="calc-value" id="rackCountVal">${s.rackCount}</span></label>
                <input type="range" class="calc-slider" id="rackCountSlider" min="4" max="500" step="2" value="${s.rackCount}">
            </div>
            <div class="calc-group">
                <label class="calc-label">Density per Rack <span class="calc-value" id="densityVal">${s.densityPerRack} kW</span></label>
                <input type="range" class="calc-slider" id="densitySlider" min="2" max="60" step="1" value="${s.densityPerRack}">
            </div>
            <div class="calc-group">
                <label class="calc-label">Redundancy Level</label>
                <select class="calc-select" id="redundancySelect">
                    <option value="n" ${s.redundancy === 'n' ? 'selected' : ''}>N - Basic (Tier I)</option>
                    <option value="nplus1" ${s.redundancy === 'nplus1' ? 'selected' : ''}>N+1 - Redundant Components (Tier II)</option>
                    <option value="twon" ${s.redundancy === 'twon' ? 'selected' : ''}>2N - Concurrently Maintainable (Tier III)</option>
                    <option value="twonplus1" ${s.redundancy === 'twonplus1' ? 'selected' : ''}>2N+1 - Fault Tolerant (Tier IV)</option>
                </select>
            </div>
        </div>
        <div class="calc-outputs">
            <div class="calc-card highlight">
                <div class="calc-card-label">Total IT Capacity</div>
                <div class="calc-card-value">${totalItKW.toLocaleString()}<span class="calc-card-unit">kW</span></div>
                <div class="calc-card-note">${s.rackCount} racks × ${s.densityPerRack} kW</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Power Infrastructure</div>
                <div class="calc-card-value">${formatCurrency(powerCapex)}</div>
                <div class="calc-card-note">UPS, PDUs, switchgear, generator</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Cooling Infrastructure</div>
                <div class="calc-card-value">${formatCurrency(coolingCapex)}</div>
                <div class="calc-card-note">CRAC/CRAH, chiller, containment</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Racks & Cabling</div>
                <div class="calc-card-value">${formatCurrency(rackCapex)}</div>
                <div class="calc-card-note">Cabinets, PDU strips, cabling</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Monitoring & Safety</div>
                <div class="calc-card-value">${formatCurrency(monitoringCapex)}</div>
                <div class="calc-card-note">DCIM, sensors, fire suppression</div>
            </div>
            <div class="calc-card highlight">
                <div class="calc-card-label">Total CapEx</div>
                <div class="calc-card-value">${formatCurrency(totalCapex)}</div>
                <div class="calc-card-note">${redundancyLabels[s.redundancy]}</div>
            </div>
            <div class="calc-card">
                <div class="calc-card-label">Cost per kW Capacity</div>
                <div class="calc-card-value">${formatCurrency(costPerKW)}<span class="calc-card-unit">/kW</span></div>
            </div>
            <div class="calc-card highlight">
                <div class="calc-card-label">5-Year TCO</div>
                <div class="calc-card-value">${formatCurrency(fiveYearTCO)}</div>
                <div class="calc-card-note">CapEx + OpEx (power + maintenance)</div>
            </div>
        </div>
    </div>`
}

function bindTCOInputs(container) {
    function update() {
        const c = document.getElementById('calculatorContainer')
        if (c) renderCurrentCalc(c)
    }
    bindSlider(container, 'rackCountSlider', 'rackCountVal', v => { tcoState.rackCount = +v; return v }, update)
    bindSlider(container, 'densitySlider', 'densityVal', v => { tcoState.densityPerRack = +v; return v + ' kW' }, update)
    const sel = container.querySelector('#redundancySelect')
    if (sel) sel.addEventListener('change', () => { tcoState.redundancy = sel.value; update() })
}

// ── Shared slider utility ──────────────────────
function bindSlider(container, sliderId, valueId, format, onChange) {
    const slider = container.querySelector('#' + sliderId)
    const display = container.querySelector('#' + valueId)
    if (!slider) return
    slider.addEventListener('input', () => {
        if (display) display.textContent = format(slider.value)
    })
    slider.addEventListener('change', onChange)
}
