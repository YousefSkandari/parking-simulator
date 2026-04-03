// Main application - wires together simulation, visualization, and UI controls
import { CONFIG } from './config.js';
import { Simulation } from './engine/simulation.js';
import { PRESET_POLICIES, createCustomPolicy } from './engine/policy.js';
import { MapView } from './viz/map-view.js';
import { ChartManager } from './viz/charts.js';
import { Dashboard } from './viz/dashboard.js';

class App {
    constructor() {
        this.mapView = null;
        this.charts = new ChartManager();
        this.dashboard = new Dashboard('dashboard');
        this.scenarioResults = [];
        this.currentSimulation = null;
        this.animationFrame = null;
        this.isAnimating = false;
        this.currentArea = 'ealingBroadway';
        this.currentDayType = 'weekday';
        this.selectedPolicies = ['current_strict', 'grace_10min'];
    }

    init() {
        // Initialize map
        this.mapView = new MapView('map');
        this.mapView.initArea(this.currentArea);

        // Initialize charts
        this.charts.createUtilizationChart('chart-utilization');
        this.charts.createEconomicChart('chart-economic');
        this.charts.createRadarChart('chart-radar');
        this.charts.createForecastChart('chart-forecast');
        this.charts.createDriverChart('chart-drivers');

        // Wire up UI controls
        this._initControls();
        this._initPolicySelector();
        this._initCustomPolicyControls();

        // Show intro state
        this._updateStatus('Ready - Select policies and click "Run Comparison" to start');
    }

    _initControls() {
        // Area selector
        document.getElementById('area-select').addEventListener('change', (e) => {
            this.currentArea = e.target.value;
            this.mapView.initArea(this.currentArea);
        });

        // Day type selector
        document.getElementById('day-select').addEventListener('change', (e) => {
            this.currentDayType = e.target.value;
        });

        // Run comparison button
        document.getElementById('btn-run').addEventListener('click', () => this.runComparison());

        // Run with animation button
        document.getElementById('btn-animate').addEventListener('click', () => this.runAnimated());

        // Stop button
        document.getElementById('btn-stop').addEventListener('click', () => this.stopAnimation());

        // Export CSV
        document.getElementById('btn-export').addEventListener('click', () => this.dashboard.exportCSV());

        // Speed control
        document.getElementById('speed-range').addEventListener('input', (e) => {
            const speed = parseInt(e.target.value);
            document.getElementById('speed-label').textContent = `${speed}x`;
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

        // Custom policy checkbox
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
        // Set default values for custom policy sliders
        const controls = {
            'custom-grace': { default: 0, display: 'custom-grace-val', suffix: ' min' },
            'custom-free': { default: 0, display: 'custom-free-val', suffix: ' min' },
            'custom-pcn': { default: 160, display: 'custom-pcn-val', prefix: '£' },
            'custom-enforcement': { default: 100, display: 'custom-enforcement-val', suffix: '%' },
            'custom-rate': { default: 100, display: 'custom-rate-val', suffix: '%' }
        };

        for (const [id, config] of Object.entries(controls)) {
            const slider = document.getElementById(id);
            if (slider) {
                slider.value = config.default;
                const display = document.getElementById(config.display);
                if (display) display.textContent = (config.prefix || '') + config.default + (config.suffix || '');

                slider.addEventListener('input', () => {
                    if (display) display.textContent = (config.prefix || '') + slider.value + (config.suffix || '');
                });
            }
        }
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

    // Run all selected scenarios instantly (no animation)
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

        // Run each policy scenario
        for (let i = 0; i < policies.length; i++) {
            const policy = policies[i];
            this._updateStatus(`Simulating: ${policy.name} (${i + 1}/${policies.length})...`);
            progressFill.style.width = `${((i) / policies.length) * 100}%`;

            // Use setTimeout to allow UI to update
            await new Promise(resolve => setTimeout(resolve, 10));

            const sim = new Simulation({
                area: this.currentArea,
                dayType: this.currentDayType,
                policy: policy,
                seed: CONFIG.RANDOM_SEED
            });

            const result = sim.runFull();
            this.scenarioResults.push(result);

            progressFill.style.width = `${((i + 1) / policies.length) * 100}%`;
        }

        // Update all visualizations
        this._updateAllVisualizations();

        progressBar.style.display = 'none';
        this._updateStatus(`Comparison complete - ${policies.length} scenarios simulated for ${this._areaLabel()}`);
    }

    // Run with animated map visualization
    async runAnimated() {
        const policies = this._getSelectedPolicies();
        if (policies.length === 0) {
            this._updateStatus('Please select at least one policy.');
            return;
        }

        // Animate only the first selected policy
        const policy = policies[0];
        this._updateStatus(`Animating: ${policy.name}...`);

        this.currentSimulation = new Simulation({
            area: this.currentArea,
            dayType: this.currentDayType,
            policy: policy,
            seed: CONFIG.RANDOM_SEED
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
        const batchSize = Math.max(1, speed);

        const results = this.currentSimulation.runBatch(batchSize);
        if (results.length === 0) return;

        const lastTick = results[results.length - 1];

        // Update map
        this.mapView.updateBayOccupancy(this.currentSimulation.parkingSystem);
        this.mapView.updateDYLStatus(this.currentSimulation.parkingSystem);
        this.mapView.updateCarParkOccupancy(this.currentSimulation.parkingSystem);

        if (lastTick && lastTick.ceos) {
            this.mapView.updateCEOs(lastTick.ceos);
        }

        // Show PCN events
        for (const event of this.currentSimulation.events.slice(-5)) {
            if (event.type === 'pcn_issued' && event.coords) {
                this.mapView.showPCNEvent(event.coords);
            }
        }

        // Update time display
        if (lastTick) {
            const h = Math.floor(lastTick.hour);
            const m = Math.round((lastTick.hour - h) * 60);
            document.getElementById('sim-time').textContent =
                `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            document.getElementById('sim-drivers').textContent = lastTick.activeDrivers;
            document.getElementById('sim-completed').textContent = lastTick.completedDrivers;
            document.getElementById('sim-pcns').textContent = lastTick.totalPCNs;

            // Update progress
            const totalMinutes = (CONFIG.SIM_END_HOUR - CONFIG.SIM_START_HOUR) * 60;
            const pct = (lastTick.time / totalMinutes) * 100;
            document.getElementById('progress-fill').style.width = pct + '%';
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

        // Get results and run remaining scenarios instantly
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
                seed: CONFIG.RANDOM_SEED
            });
            this.scenarioResults.push(sim.runFull());
        }

        this._updateAllVisualizations();
        this._updateStatus('Simulation complete');
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        document.getElementById('btn-animate').disabled = false;
        document.getElementById('btn-run').disabled = false;
        document.getElementById('btn-stop').disabled = true;
        this._updateStatus('Animation stopped');
    }

    _updateAllVisualizations() {
        if (this.scenarioResults.length === 0) return;

        // Update KPIs with first result
        this.dashboard.updateKPIs(this.scenarioResults[0]);

        // Update utilization chart with first result's time series
        this.charts.updateUtilization(this.scenarioResults[0].tickMetrics);

        // Update driver choices for first result
        this.charts.updateDriverChoices(this.scenarioResults[0]);

        // Update comparison charts with all results
        this.charts.updateEconomicComparison(this.scenarioResults);
        this.charts.updateRadar(this.scenarioResults);
        this.charts.updateForecast(this.scenarioResults);

        // Update comparison table
        this.dashboard.updateComparisonTable(this.scenarioResults);

        // Update map business colors based on first result
        if (this.scenarioResults[0].businessDetails) {
            this.mapView.updateBusinessRevenue(this.scenarioResults[0].businessDetails);
        }
    }

    _updateStatus(message) {
        const el = document.getElementById('status-text');
        if (el) el.textContent = message;
    }

    _areaLabel() {
        return this.currentArea === 'ealingBroadway' ? 'Ealing Broadway' : 'Acton Town';
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
    window.app.init();
});
