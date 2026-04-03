// AI Policy Summary Generator
// Generates natural-language analysis of simulation results for decision-makers

export class AISummary {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.isCollapsed = false;
    }

    // Generate full analysis from scenario results
    generate(results, area, dayType, simDuration) {
        if (!results || results.length === 0) return;

        const areaName = area === 'ealingBroadway' ? 'Ealing Broadway' : 'Acton Town';
        const dayLabel = dayType === 'weekday' ? 'a typical weekday' :
                         dayType === 'saturday' ? 'a Saturday' : 'a Sunday';
        const durationLabel = this._durationLabel(simDuration);

        // Find best and worst policies
        const sorted = [...results].sort((a, b) => b.totalEconomicImpact - a.totalEconomicImpact);
        const best = sorted[0];
        const worst = sorted[sorted.length - 1];
        const baseline = results.find(r => r.policyId === 'current_strict') || results[0];

        let html = `
            <div class="summary-header" id="summary-toggle">
                <h3>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z"/>
                        <line x1="9" y1="21" x2="15" y2="21"/>
                    </svg>
                    Policy Analysis Summary
                </h3>
                <span class="toggle-icon" id="toggle-icon">${this.isCollapsed ? '+' : '−'}</span>
            </div>
            <div class="summary-body ${this.isCollapsed ? 'collapsed' : ''}" id="summary-body">
        `;

        // Executive Summary
        html += `<div class="summary-section">
            <h4>Executive Summary</h4>
            <p>Analysis of <b>${results.length} parking policy scenario${results.length > 1 ? 's' : ''}</b>
            for <b>${areaName}</b> over <b>${durationLabel}</b> (${dayLabel}).</p>`;

        if (results.length > 1) {
            const impactDiff = best.totalEconomicImpact - worst.totalEconomicImpact;
            const impactPct = worst.totalEconomicImpact > 0 ?
                ((impactDiff / worst.totalEconomicImpact) * 100).toFixed(1) : '0';
            html += `<p class="key-finding">The choice of parking policy creates a
                <b>£${this._fmt(impactDiff)} daily difference</b> (${impactPct}%) in total economic impact
                between the best and worst performing scenarios.</p>`;
        }
        html += `</div>`;

        // Recommendation
        if (results.length > 1) {
            html += this._generateRecommendation(results, best, worst, baseline, areaName);
        }

        // Detailed findings per scenario
        html += `<div class="summary-section">
            <h4>Scenario Analysis</h4>`;
        for (const r of sorted) {
            html += this._scenarioCard(r, baseline);
        }
        html += `</div>`;

        // Trade-off analysis
        html += this._generateTradeoffs(results, baseline);

        // Sensitivity & confidence
        html += this._generateConfidence(results, simDuration);

        // Data sources
        html += this._generateDataSources();

        html += `</div>`; // close summary-body

        this.container.innerHTML = html;

        // Wire toggle
        document.getElementById('summary-toggle').addEventListener('click', () => {
            this.isCollapsed = !this.isCollapsed;
            document.getElementById('summary-body').classList.toggle('collapsed');
            document.getElementById('toggle-icon').textContent = this.isCollapsed ? '+' : '−';
        });
    }

    _generateRecommendation(results, best, worst, baseline, areaName) {
        let recText = '';
        let recClass = '';

        // Determine recommendation logic
        const bestVsBaseline = baseline ?
            ((best.totalEconomicImpact - baseline.totalEconomicImpact) / baseline.totalEconomicImpact * 100) : 0;
        const councilRevLoss = baseline ?
            baseline.councilRevenue - best.councilRevenue : 0;
        const bizRevGain = baseline ?
            best.businessRevenue - baseline.businessRevenue : 0;

        if (bestVsBaseline > 5 && councilRevLoss < bizRevGain * 0.5) {
            recClass = 'rec-positive';
            recText = `<b>Recommended: ${best.policyName}</b> — This policy generates
                <b>${bestVsBaseline.toFixed(1)}% more economic activity</b> than current enforcement. `;
            if (councilRevLoss > 0) {
                recText += `While council parking revenue decreases by £${this._fmt(councilRevLoss)}/day,
                    this is offset by £${this._fmt(bizRevGain)}/day in additional business revenue,
                    which in turn supports business rates, employment, and local spending.`;
            } else {
                recText += `Council parking revenue is also maintained or improved under this scenario.`;
            }
        } else if (bestVsBaseline > 0) {
            recClass = 'rec-neutral';
            recText = `<b>Marginal improvement: ${best.policyName}</b> — Shows a modest
                ${bestVsBaseline.toFixed(1)}% improvement in economic impact. The trade-offs between
                council revenue and business revenue should be weighed carefully by stakeholders.`;
        } else {
            recClass = 'rec-caution';
            recText = `<b>Current policy performs well</b> — The existing enforcement approach
                produces competitive economic outcomes. Changes should be considered carefully
                as alternative policies show limited improvement.`;
        }

        // Deterrence insight
        const leastDeterred = [...results].sort((a, b) => a.deterredPercent - b.deterredPercent)[0];
        const mostDeterred = [...results].sort((a, b) => b.deterredPercent - a.deterredPercent)[0];

        let deterText = '';
        if (mostDeterred.deterredPercent - leastDeterred.deterredPercent > 3) {
            deterText = `<p><b>Deterrence gap:</b> ${mostDeterred.policyName} deters
                ${mostDeterred.deterredPercent.toFixed(1)}% of drivers vs ${leastDeterred.deterredPercent.toFixed(1)}%
                under ${leastDeterred.policyName}. Each deterred driver represents an average of
                £${leastDeterred.avgSpendPerDriver.toFixed(2)} in lost local spending.</p>`;
        }

        return `<div class="summary-section recommendation ${recClass}">
            <h4>Recommendation</h4>
            <p>${recText}</p>
            ${deterText}
        </div>`;
    }

    _scenarioCard(r, baseline) {
        const vsBaseline = baseline && r.policyId !== baseline.policyId ?
            ((r.totalEconomicImpact - baseline.totalEconomicImpact) / baseline.totalEconomicImpact * 100) : null;
        const changeLabel = vsBaseline !== null ?
            `<span class="${vsBaseline >= 0 ? 'positive' : 'negative'}">${vsBaseline >= 0 ? '+' : ''}${vsBaseline.toFixed(1)}% vs current</span>` : '';

        return `<div class="scenario-card" style="border-left: 3px solid ${r.policyColor}">
            <div class="sc-header">
                <b>${r.policyName}</b> ${changeLabel}
            </div>
            <div class="sc-metrics">
                <span>Economic Impact: <b>£${this._fmt(r.totalEconomicImpact)}</b></span>
                <span>Business Rev: £${this._fmt(r.businessRevenue)}</span>
                <span>Council Rev: £${this._fmt(r.councilRevenue)}</span>
                <span>PCNs: ${r.pcnCount}</span>
                <span>Deterred: ${r.deterredPercent.toFixed(1)}%</span>
                <span>Avg Dwell: ${Math.round(r.avgDwellTimeMinutes)}min</span>
            </div>
            <p class="sc-insight">${this._scenarioInsight(r, baseline)}</p>
        </div>`;
    }

    _scenarioInsight(r, baseline) {
        if (r.policyId === 'current_strict' || r === baseline) {
            return `Baseline scenario. ${r.pcnCount} PCNs generate £${this._fmt(r.pcnRevenue)} but ${r.deterredDrivers} drivers leave without spending.`;
        }
        const parts = [];
        if (r.deterredPercent < (baseline?.deterredPercent || 0) - 2) {
            parts.push(`Fewer deterred drivers (+${Math.round(r.parkedDrivers - (baseline?.parkedDrivers || 0))} more served)`);
        }
        if (r.parkingDistribution.dyl > (baseline?.parkingDistribution?.dyl || 0) * 1.3) {
            parts.push(`More DYL use (${r.parkingDistribution.dyl} vehicles) — quick stops near businesses`);
        }
        if (r.pcnCount < (baseline?.pcnCount || 0) * 0.7) {
            parts.push(`PCNs reduced by ${Math.round((1 - r.pcnCount / (baseline?.pcnCount || 1)) * 100)}%`);
        }
        if (r.avgDwellTimeMinutes > (baseline?.avgDwellTimeMinutes || 0) + 5) {
            parts.push(`Longer dwell time encourages more spending`);
        }
        return parts.length > 0 ? parts.join('. ') + '.' : 'Similar performance to baseline policy.';
    }

    _generateTradeoffs(results, baseline) {
        if (results.length < 2) return '';

        let html = `<div class="summary-section">
            <h4>Key Trade-offs</h4>
            <table class="tradeoff-table">
                <tr><th>Factor</th><th>Strict Enforcement Favours</th><th>Grace Period Favours</th></tr>`;

        html += `<tr><td>Council Revenue</td>
            <td>Higher PCN income (£${this._fmt(Math.max(...results.map(r => r.pcnRevenue)))})</td>
            <td>Lower PCN income but potentially higher meter revenue</td></tr>`;
        html += `<tr><td>Business Revenue</td>
            <td>Less DYL congestion near shops</td>
            <td>More footfall from quick-stop shoppers (£${this._fmt(Math.max(...results.map(r => r.businessRevenue)))})</td></tr>`;
        html += `<tr><td>Driver Experience</td>
            <td>Clear rules, predictable</td>
            <td>Flexibility for short errands, less anxiety</td></tr>`;
        html += `<tr><td>Road Safety</td>
            <td>DYLs kept clear</td>
            <td>More vehicles near junctions (if DYL grace used)</td></tr>`;
        html += `<tr><td>Equity</td>
            <td>Consistent application</td>
            <td>Benefits those without car park alternatives</td></tr>`;

        html += `</table></div>`;
        return html;
    }

    _generateConfidence(results, simDuration) {
        const days = simDuration?.days || 1;
        const runs = simDuration?.runs || 1;
        let confidence = 'Low';
        let confidenceClass = 'conf-low';
        let note = '';

        if (days >= 7 && runs >= 3) {
            confidence = 'High';
            confidenceClass = 'conf-high';
            note = 'Multi-day simulation with multiple runs provides robust estimates.';
        } else if (days >= 3 || runs >= 2) {
            confidence = 'Medium';
            confidenceClass = 'conf-medium';
            note = 'Results cover multiple days. Consider running a full week for higher confidence.';
        } else {
            confidence = 'Low-Medium';
            confidenceClass = 'conf-low';
            note = 'Single-day simulation. Run a full week or month for more reliable estimates. Use these results as directional indicators only.';
        }

        return `<div class="summary-section">
            <h4>Confidence Assessment</h4>
            <div class="confidence-badge ${confidenceClass}">${confidence}</div>
            <p>${note}</p>
            <ul class="confidence-notes">
                <li>Simulation period: ${days} day${days > 1 ? 's' : ''}</li>
                <li>Agent model: 3 driver archetypes, CEO patrol routes, business footfall sensitivity</li>
                <li>Data quality: PCN charges and car park rates from Ealing Council (2025). Business revenues estimated from ONS/Companies House benchmarks.</li>
                <li>Limitations: Does not model traffic flow, road safety impacts, or long-term behavioral adaptation beyond seasonal adjustment. Walking distance uses straight-line approximation with 1.3x street-network correction.</li>
            </ul>
        </div>`;
    }

    _generateDataSources() {
        return `<div class="summary-section data-sources">
            <h4>Data Sources & Methodology</h4>
            <ul>
                <li><b>PCN charges:</b> Ealing Council / London Councils, effective 7 April 2025 — Band A £160/£80, Band B £140/£70</li>
                <li><b>Enforcement stats:</b> 142,903 PCNs issued in 2024, £5.7M revenue (ealing.news / Ealing Council)</li>
                <li><b>Car parks:</b> Ealing Broadway Shopping Centre (600-800 spaces), Springbridge Road MSCP (465 spaces), Salisbury Street (62 spaces) — ealing.gov.uk</li>
                <li><b>Footfall:</b> 285,000 weekly visitors at Ealing Broadway (experientialspace.co.uk)</li>
                <li><b>Station data:</b> 13.7M entries/exits at Ealing Broadway Station 2023/24 (ORR/TfL)</li>
                <li><b>Economic multiplier:</b> 1.4x local multiplier per NEF/New Economics Foundation methodology</li>
                <li><b>Driver behavior:</b> INRIX 2017 UK parking study; BPA "Re-Think! Parking on the High Street"</li>
                <li><b>Business revenues:</b> ONS Annual Business Survey by SIC code, scaled to local footfall</li>
            </ul>
        </div>`;
    }

    _fmt(n) {
        return Math.round(n).toLocaleString('en-GB');
    }

    _durationLabel(simDuration) {
        if (!simDuration) return '1 day (07:00-22:00)';
        if (simDuration.type === 'week') return '1 full week';
        if (simDuration.type === 'month') return `${simDuration.days} days (1 month)`;
        if (simDuration.type === 'custom') return `${simDuration.days} day${simDuration.days > 1 ? 's' : ''}`;
        return `${simDuration.days || 1} day${(simDuration.days || 1) > 1 ? 's' : ''} (07:00-22:00)`;
    }

    clear() {
        if (this.container) this.container.innerHTML = '';
    }
}
