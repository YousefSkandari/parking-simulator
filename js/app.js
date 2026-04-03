// Main application - wires together simulation, visualization, and UI controls
import { CONFIG } from './config.js';
import { Simulation } from './engine/simulation.js';
import { runMultiDay } from './engine/multi-day.js';
import { PRESET_POLICIES, createCustomPolicy } from './engine/policy.js';
import { MapView } from './viz/map-view.js';
import { ChartManager } from './viz/charts.js';
import { Dashboard } from './viz/dashboard.js';
import { AISummary } from './viz/ai-summary.js';

class App {
    constructor() {
        this.mapView = null;
        this.charts = new ChartManager();
        this.dashboard = new Dashboard('dashboard');
        this.aiSummary = new AISummary('ai-summary');
        this.scenarioResults = [];
        this.currentSimulation = null;
        this.animationFrame = null;
        this.isAnimating = false;
        this.currentArea = 'ealingBroadway';
        this.currentDayType = 'weekday';
        this.currentPeriod = 'single';
        this.selectedPolicies = ['current_strict', 'grace_10min'];
        this.simDuration = null;
    }

    init() {
        this.mapView = new MapView('map');
        this.mapView.initArea(this.currentArea);

        this.charts.createUtilizationChart('chart-utilization');
        this.charts.createEconomicChart('chart-economic');
        this.charts.createRadarChart('chart-radar');
        this.charts.createForecastChart('chart-forecast');
        this.charts.createDriverChart('chart-drivers');

        this._initControls();
        this._initPolicySelector();
        this._initCustomPolicyControls();
        this._initSensitivityControls();

        this._updateStatus('Ready — Select policies and click "Run Comparison" to start');
    }

    _initControls() {
        document.getElementById('area-select').addEventListener('change', (e) => {
            this.currentArea = e.target.value;
            this.mapView.initArea(this.currentArea);
        });

        document.getElementById('day-select').addEventListener('change', (e) => {
            this.currentDayType = e.target.value;
        });

        // Period selector
        document.getElementById('period-select').addEventListener('change', (e) => {
            this.currentPeriod = e.target.value;
            const customInput = document.getElementById('custom-days');
            const daySelect = document.getElementById('day-select');

            customInput.style.display = e.target.value === 'custom' ? 'inline-block' : 'none';
            // Hide day-type select for multi-day (it runs all day types)
            daySelect.style.display = (e.target.value === 'single') ? 'inline-block' : 'none';
        });

        // Time range controls
        document.getElementById('start-hour').addEventListener('change', (e) => {
            CONFIG.SIM_START_HOUR = parseInt(e.target.value);
        });
        document.getElementById('end-hour').addEventListener('change', (e) => {
            CONFIG.SIM_END_HOUR = parseInt(e.target.value);
        });

        document.getElementById('btn-run').addEventListener('click', () => this.runComparison());
        document.getElementById('btn-animate').addEventListener('click', () => this.runAnimated());
        document.getElementById('btn-stop').addEventListener('click', () => this.stopAnimation());
        document.getElementById('btn-export').addEventListener('click', () => this.dashboard.exportCSV());

        document.getElementById('speed-range').addEventListener('input', (e) => {
            document.getElementById('speed-label').textContent = `${e.target.value}x`;
        });
    }

    _initPolicySelector() {
        const container = document.getElementById('policy-checkboxes');
        for (const [id, policy] of Object.entries(PRESET_POLICIES)) {
            const div = document.createElement('div');
            div.className = 'policy-checkbox';
            div.innerHTML = `
                <label>
                    <input type="checkbox" value="${id}" ${this.selectedPolicies.includes(id) ? 'checked' : ''}>
                    <span class="policy-dot" style="background:${policy.color}"></span>
                    <span class="policy-name">${policy.name}</span>
                </label>
                <div class="policy-desc">${policy.description}</div>
            `;
            container.appendChild(div);
        }

        const customDiv = document.createElement('div');
        customDiv.className = 'policy-checkbox custom-policy';
        customDiv.innerHTML = `
            <label>
                <input type="checkbox" value="custom" id="custom-check">
                <span class="policy-dot" style="background:#34495e"></span>
                <span class="policy-name">Custom Policy</span>
            </label>
            <div class="policy-desc">Configure your own parameters below</div>
        `;
        container.appendChild(customDiv);
    }

    _initCustomPolicyControls() {
        const controls = {
            'custom-grace': { default: 0, display: 'custom-grace-val', suffix: ' min' },
            'custom-free': { default: 0, display: 'custom-free-val', suffix: ' min' },
            'custom-pcn': { default: 160, display: 'custom-pcn-val', prefix: '£' },
            'custom-enforcement': { default: 100, display: 'custom-enforcement-val', suffix: '%' },
            'custom-rate': { default: 100, display: 'custom-rate-val', suffix: '%' }
        };

        for (const [id, config] of Object.entries(controls)) {
            const slider = document.getElementById(id);
            if (!slider) continue;
            slider.value = config.default;
            const display = document.getElementById(config.display);
            if (display) display.textContent = (config.prefix || '') + config.default + (config.suffix || '');
            slider.addEventListener('input', () => {
                if (display) display.textContent = (config.prefix || '') + slider.value + (config.suffix || '');
            });
        }
    }

    _initSensitivityControls() {
        const controls = {
            'sens-footfall': { default: 0, display: 'sens-footfall-val', prefix: '', suffix: '%' },
            'sens-price': { default: 100, display: 'sens-price-val', prefix: '', suffix: '%' }
        };

        for (const [id, config] of Object.entries(controls)) {
            const slider = document.getElementById(id);
            if (!slider) continue;
            slider.value = config.default;
            const display = document.getElementById(config.display);
            if (display) display.textContent = (config.prefix || '') + config.default + (config.suffix || '');
            slider.addEventListener('input', () => {
                const v = parseInt(slider.value);
                if (display) {
                    const sign = v > 0 ? '+' : '';
                    display.textContent = (config.prefix || '') + sign + v + (config.suffix || '');
                }
            });
        }

        // CEO salary controls
        const salarySlider = document.getElementById('ceo-salary');
        const salaryDisplay = document.getElementById('ceo-salary-val');
        if (salarySlider) {
            salarySlider.addEventListener('input', () => {
                if (salaryDisplay) salaryDisplay.textContent = '£' + parseInt(salarySlider.value).toLocaleString();
            });
        }
        const daysSlider = document.getElementById('ceo-days');
        const daysDisplay = document.getElementById('ceo-days-val');
        if (daysSlider) {
            daysSlider.addEventListener('input', () => {
                if (daysDisplay) daysDisplay.textContent = daysSlider.value;
            });
        }
    }

    _getCEODailyCost() {
        const salary = parseInt(document.getElementById('ceo-salary')?.value) || 38000;
        const days = parseInt(document.getElementById('ceo-days')?.value) || 250;
        return Math.round(salary / days);
    }

    _getSelectedPolicies() {
        const checkboxes = document.querySelectorAll('#policy-checkboxes input[type="checkbox"]:checked');
        const policies = [];

        for (const cb of checkboxes) {
            if (cb.value === 'custom') {
                policies.push(createCustomPolicy({
                    dylGracePeriodMinutes: parseInt(document.getElementById('custom-grace').value) || 0,
                    onStreetFreePeriodMinutes: parseInt(document.getElementById('custom-free').value) || 0,
                    pcnBandA: parseInt(document.getElementById('custom-pcn').value) || 160,
                    pcnBandAEarly: Math.round((parseInt(document.getElementById('custom-pcn').value) || 160) / 2),
                    enforcementIntensity: (parseInt(document.getElementById('custom-enforcement').value) || 100) / 100,
                    onStreetRateMultiplier: (parseInt(document.getElementById('custom-rate').value) || 100) / 100,
                    carParkRateMultiplier: (parseInt(document.getElementById('custom-rate').value) || 100) / 100
                }));
            } else if (PRESET_POLICIES[cb.value]) {
                policies.push(PRESET_POLICIES[cb.value]);
            }
        }

        return policies;
    }

    // Run all selected scenarios
    async runComparison() {
        const policies = this._getSelectedPolicies();
        if (policies.length === 0) {
            this._updateStatus('Please select at least one policy to simulate.');
            return;
        }

        this._updateStatus('Running simulations...');
        this.scenarioResults = [];

        const progressBar = document.getElementById('progress-bar');
        const progressFill = document.getElementById('progress-fill');
        progressBar.style.display = 'block';

        const period = this.currentPeriod;
        const isMultiDay = period !== 'single';
        const customDays = parseInt(document.getElementById('custom-days').value) || 14;

        // Determine simulation duration info
        let totalDays;
        if (period === 'week') totalDays = 7;
        else if (period === 'month') totalDays = 30;
        else if (period === 'custom') totalDays = customDays;
        else totalDays = 1;

        this.simDuration = {
            type: period,
            days: totalDays,
            runs: policies.length
        };

        const totalSteps = policies.length * totalDays;
        let completedSteps = 0;

        for (let i = 0; i < policies.length; i++) {
            const policy = policies[i];
            this._updateStatus(`Simulating: ${policy.name} (${i + 1}/${policies.length})${isMultiDay ? ` — ${totalDays} days` : ''}...`);

            await new Promise(resolve => setTimeout(resolve, 10));

            let result;
            if (isMultiDay) {
                result = runMultiDay(this.currentArea, policy, period, customDays, (day, total) => {
                    completedSteps++;
                    progressFill.style.width = `${(completedSteps / totalSteps) * 100}%`;
                    document.getElementById('sim-day').textContent = `${day}/${total}`;
                });
            } else {
                const sim = new Simulation({
                    area: this.currentArea,
                    dayType: this.currentDayType,
                    policy: policy,
                    seed: CONFIG.RANDOM_SEED,
                    ceoDailyCost: this._getCEODailyCost()
                });
                result = sim.runFull();
                completedSteps += totalDays;
                progressFill.style.width = `${(completedSteps / totalSteps) * 100}%`;
            }

            this.scenarioResults.push(result);
        }

        // Update all visualizations
        this._updateAllVisualizations();

        // Generate AI summary
        this.aiSummary.generate(
            this.scenarioResults,
            this.currentArea,
            this.currentDayType,
            this.simDuration
        );

        progressBar.style.display = 'none';
        const periodLabel = isMultiDay ? ` (${totalDays} days)` : '';
        this._updateStatus(`Complete — ${policies.length} scenarios for ${this._areaLabel()}${periodLabel}`);
    }

    // Run with animated map visualization
    async runAnimated() {
        const policies = this._getSelectedPolicies();
        if (policies.length === 0) {
            this._updateStatus('Please select at least one policy.');
            return;
        }

        // Animate only the first selected policy (single day)
        const policy = policies[0];
        this._updateStatus(`Animating: ${policy.name}...`);

        this.simDuration = { type: 'single', days: 1, runs: policies.length };

        this.currentSimulation = new Simulation({
            area: this.currentArea,
            dayType: this.currentDayType,
            policy: policy,
            seed: CONFIG.RANDOM_SEED,
            ceoDailyCost: this._getCEODailyCost()
        });

        this.isAnimating = true;
        document.getElementById('btn-animate').disabled = true;
        document.getElementById('btn-run').disabled = true;
        document.getElementById('btn-stop').disabled = false;

        this._animateLoop();
    }

    _animateLoop() {
        if (!this.isAnimating || !this.currentSimulation) return;

        const speed = parseInt(document.getElementById('speed-range').value) || 1;
        const results = this.currentSimulation.runBatch(Math.max(1, speed));
        if (results.length === 0) return;

        const lastTick = results[results.length - 1];

        this.mapView.updateBayOccupancy(this.currentSimulation.parkingSystem);
        this.mapView.updateDYLStatus(this.currentSimulation.parkingSystem);
        this.mapView.updateCarParkOccupancy(this.currentSimulation.parkingSystem);

        if (lastTick?.ceos) this.mapView.updateCEOs(lastTick.ceos);

        for (const event of this.currentSimulation.events.slice(-5)) {
            if (event.type === 'pcn_issued' && event.coords) {
                this.mapView.showPCNEvent(event.coords);
            }
        }

        if (lastTick) {
            const h = Math.floor(lastTick.hour);
            const m = Math.round((lastTick.hour - h) * 60);
            document.getElementById('sim-time').textContent =
                `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            document.getElementById('sim-day').textContent = 'Day 1';
            document.getElementById('sim-drivers').textContent = lastTick.activeDrivers;
            document.getElementById('sim-completed').textContent = lastTick.completedDrivers;
            document.getElementById('sim-pcns').textContent = lastTick.totalPCNs;

            const totalMinutes = (CONFIG.SIM_END_HOUR - CONFIG.SIM_START_HOUR) * 60;
            document.getElementById('progress-fill').style.width = (lastTick.time / totalMinutes * 100) + '%';
            document.getElementById('progress-bar').style.display = 'block';
        }

        if (this.currentSimulation.isComplete) {
            this._onAnimationComplete();
            return;
        }

        this.animationFrame = requestAnimationFrame(() => this._animateLoop());
    }

    _onAnimationComplete() {
        this.isAnimating = false;
        document.getElementById('btn-animate').disabled = false;
        document.getElementById('btn-run').disabled = false;
        document.getElementById('btn-stop').disabled = true;

        const animatedResult = this.currentSimulation.getResults();
        this.scenarioResults = [animatedResult];

        // Run remaining policies silently
        const policies = this._getSelectedPolicies();
        for (const policy of policies) {
            if (policy.id === animatedResult.policyId) continue;
            const sim = new Simulation({
                area: this.currentArea,
                dayType: this.currentDayType,
                policy: policy,
                seed: CONFIG.RANDOM_SEED,
                ceoDailyCost: this._getCEODailyCost()
            });
            this.scenarioResults.push(sim.runFull());
        }

        this._updateAllVisualizations();
        this.aiSummary.generate(
            this.scenarioResults,
            this.currentArea,
            this.currentDayType,
            this.simDuration
        );
        this._updateStatus('Simulation complete');
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
        document.getElementById('btn-animate').disabled = false;
        document.getElementById('btn-run').disabled = false;
        document.getElementById('btn-stop').disabled = true;
        this._updateStatus('Animation stopped');
    }

    _updateAllVisualizations() {
        if (this.scenarioResults.length === 0) return;

        this.dashboard.updateKPIs(this.scenarioResults[0]);
        this.charts.updateUtilization(this.scenarioResults[0].tickMetrics);
        this.charts.updateDriverChoices(this.scenarioResults[0]);
        this.charts.updateEconomicComparison(this.scenarioResults);
        this.charts.updateRadar(this.scenarioResults);
        this.charts.updateForecast(this.scenarioResults);
        this.dashboard.updateComparisonTable(this.scenarioResults);

        if (this.scenarioResults[0].businessDetails) {
            this.mapView.updateBusinessRevenue(this.scenarioResults[0].businessDetails);
        }
    }

    _updateStatus(message) {
        const el = document.getElementById('status-text');
        if (el) el.textContent = message;
    }

    _areaLabel() {
        return this.currentArea === 'ealingBroadway' ? 'Ealing Broadway' : 'Acton (Uxbridge Road)';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
