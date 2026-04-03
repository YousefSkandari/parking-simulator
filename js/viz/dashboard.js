// Dashboard: KPI cards, summary tables, scenario comparison, CSV export

export class Dashboard {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.results = [];
    }

    // Update KPI cards for a single result
    updateKPIs(result) {
        const fmt = (n) => typeof n === 'number' ? n.toLocaleString('en-GB', { maximumFractionDigits: 0 }) : '—';
        const fmtGBP = (n) => '£' + fmt(n);
        const fmtPct = (n) => typeof n === 'number' ? n.toFixed(1) + '%' : '—';

        this._setKPI('kpi-biz-revenue', fmtGBP(result.businessRevenue));
        this._setKPI('kpi-council-revenue', fmtGBP(result.councilRevenue));
        this._setKPI('kpi-total-impact', fmtGBP(result.totalEconomicImpact));
        this._setKPI('kpi-drivers', fmt(result.totalDrivers));
        this._setKPI('kpi-parked', fmt(result.parkedDrivers));
        this._setKPI('kpi-deterred', `${fmt(result.deterredDrivers)} (${fmtPct(result.deterredPercent)})`);
        this._setKPI('kpi-pcns', fmt(result.pcnCount));
        this._setKPI('kpi-pcn-revenue', fmtGBP(result.pcnRevenue));
        this._setKPI('kpi-meter-revenue', fmtGBP(result.meterRevenue));
        this._setKPI('kpi-carpark-revenue', fmtGBP(result.carParkRevenue));
        this._setKPI('kpi-avg-dwell', `${Math.round(result.avgDwellTimeMinutes)} min`);
        this._setKPI('kpi-avg-spend', fmtGBP(result.avgSpendPerDriver));
        this._setKPI('kpi-lost-revenue', fmtGBP(result.lostRevenue));
        this._setKPI('kpi-lost-impact', fmtGBP(result.lostEconomicImpact));

        // Enforcement cost KPIs
        if (result.enforcementCost !== undefined) {
            this._setKPI('kpi-enforcement-cost', fmtGBP(result.enforcementCost));
            this._setKPI('kpi-net-council', fmtGBP(result.netCouncilRevenue));
            this._setKPI('kpi-ceo-shifts', `${result.activeCEOShifts} shifts`);
        }

        // Traffic & Safety KPIs
        if (result.traffic) {
            this._setKPI('kpi-congestion', `${(result.traffic.avgCongestion * 100).toFixed(0)}%`);
            this._setKPI('kpi-safety-score', `${result.traffic.safetyScore.toFixed(0)}/100`);
            this._setKPI('kpi-junctions-risk', `${result.traffic.junctionsAtRisk}/${result.traffic.totalJunctions}`);
            this._setKPI('kpi-congestion-cost', fmtGBP(result.traffic.dailyCongestionCost));
        }

        // Displacement KPIs
        if (result.displacement) {
            this._setKPI('kpi-leaked-revenue', fmtGBP(result.displacement.leakedToCompetitors));
            this._setKPI('kpi-displacement', fmt(result.displacement.totalDeterred));
        }

        // Update parking distribution bar
        const total = result.parkingDistribution.onstreet + result.parkingDistribution.carpark +
                      result.parkingDistribution.dyl + result.deterredDrivers;
        if (total > 0) {
            this._setPctBar('dist-onstreet', result.parkingDistribution.onstreet / total * 100);
            this._setPctBar('dist-carpark', result.parkingDistribution.carpark / total * 100);
            this._setPctBar('dist-dyl', result.parkingDistribution.dyl / total * 100);
            this._setPctBar('dist-deterred', result.deterredDrivers / total * 100);
        }
    }

    // Build scenario comparison table
    updateComparisonTable(results) {
        this.results = results;
        const table = document.getElementById('comparison-table');
        if (!table) return;

        const fmt = (n) => typeof n === 'number' ? n.toLocaleString('en-GB', { maximumFractionDigits: 0 }) : '—';

        let html = `
            <thead>
                <tr>
                    <th>Metric</th>
                    ${results.map(r => `<th style="border-bottom: 3px solid ${r.policyColor}">${r.policyName}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
                <tr><td>Business Revenue</td>${results.map(r => `<td>£${fmt(r.businessRevenue)}</td>`).join('')}</tr>
                <tr><td>Council Revenue</td>${results.map(r => `<td>£${fmt(r.councilRevenue)}</td>`).join('')}</tr>
                <tr><td>Total Economic Impact</td>${results.map(r => `<td><b>£${fmt(r.totalEconomicImpact)}</b></td>`).join('')}</tr>
                <tr><td>PCNs Issued</td>${results.map(r => `<td>${fmt(r.pcnCount)}</td>`).join('')}</tr>
                <tr><td>Drivers Served</td>${results.map(r => `<td>${fmt(r.parkedDrivers)}</td>`).join('')}</tr>
                <tr><td>Deterred Drivers</td>${results.map(r => `<td>${fmt(r.deterredDrivers)} (${r.deterredPercent.toFixed(1)}%)</td>`).join('')}</tr>
                <tr><td>Avg Dwell Time</td>${results.map(r => `<td>${Math.round(r.avgDwellTimeMinutes)} min</td>`).join('')}</tr>
                <tr><td>Avg Spend / Driver</td>${results.map(r => `<td>£${r.avgSpendPerDriver.toFixed(2)}</td>`).join('')}</tr>
                <tr><td>Lost Revenue</td>${results.map(r => `<td class="negative">£${fmt(r.lostRevenue)}</td>`).join('')}</tr>
                <tr><td>On-Street Parked</td>${results.map(r => `<td>${fmt(r.parkingDistribution.onstreet)}</td>`).join('')}</tr>
                <tr><td>Car Park Used</td>${results.map(r => `<td>${fmt(r.parkingDistribution.carpark)}</td>`).join('')}</tr>
                <tr><td>DYL Used</td>${results.map(r => `<td>${fmt(r.parkingDistribution.dyl)}</td>`).join('')}</tr>
                <tr><td colspan="${results.length + 1}" style="background:var(--primary);color:white;text-align:center;font-weight:600;">Council Costs & Net Position</td></tr>
                <tr><td>CEO Enforcement Cost</td>${results.map(r => `<td>£${fmt(r.enforcementCost || 0)}</td>`).join('')}</tr>
                <tr><td>Active CEO Shifts</td>${results.map(r => `<td>${r.activeCEOShifts || '—'}</td>`).join('')}</tr>
                <tr><td><b>Net Council Position</b></td>${results.map(r => `<td><b>£${fmt(r.netCouncilRevenue || 0)}</b></td>`).join('')}</tr>
                <tr><td colspan="${results.length + 1}" style="background:var(--primary);color:white;text-align:center;font-weight:600;">Traffic & Safety</td></tr>
                <tr><td>Avg Congestion</td>${results.map(r => `<td>${r.traffic ? (r.traffic.avgCongestion * 100).toFixed(0) + '%' : '—'}</td>`).join('')}</tr>
                <tr><td>Road Safety Score</td>${results.map(r => `<td>${r.traffic ? r.traffic.safetyScore.toFixed(0) + '/100' : '—'}</td>`).join('')}</tr>
                <tr><td>Junctions at Risk</td>${results.map(r => `<td>${r.traffic ? r.traffic.junctionsAtRisk : '—'}</td>`).join('')}</tr>
                <tr><td>Congestion Cost</td>${results.map(r => `<td>${r.traffic ? '£' + fmt(r.traffic.dailyCongestionCost) : '—'}</td>`).join('')}</tr>
                <tr><td colspan="${results.length + 1}" style="background:var(--primary);color:white;text-align:center;font-weight:600;">Displacement</td></tr>
                <tr><td>Revenue Leaked</td>${results.map(r => `<td class="negative">${r.displacement ? '£' + fmt(r.displacement.leakedToCompetitors) : '—'}</td>`).join('')}</tr>
                <tr><td>Drivers to Competitors</td>${results.map(r => `<td>${r.displacement ? fmt(r.displacement.totalDeterred - (r.displacement.stayedHome || 0)) : '—'}</td>`).join('')}</tr>
            </tbody>
        `;
        table.innerHTML = html;

        // Highlight best values
        this._highlightBest(table);
    }

    _highlightBest(table) {
        const rows = table.querySelectorAll('tbody tr');
        rows.forEach(row => {
            const cells = Array.from(row.querySelectorAll('td')).slice(1);
            if (cells.length < 2) return;

            const values = cells.map(c => {
                const text = c.textContent.replace(/[£,%]/g, '').replace(/,/g, '');
                return parseFloat(text) || 0;
            });

            const metric = row.querySelector('td').textContent;
            const isLowerBetter = metric.includes('Deterred') || metric.includes('Lost') || metric.includes('PCN');
            const bestIdx = isLowerBetter ?
                values.indexOf(Math.min(...values)) :
                values.indexOf(Math.max(...values));

            if (bestIdx >= 0) {
                cells[bestIdx].classList.add('best-value');
            }
        });
    }

    // Export results as CSV
    exportCSV() {
        if (this.results.length === 0) return;

        const headers = ['Metric', ...this.results.map(r => r.policyName)];
        const rows = [
            ['Business Revenue (£)', ...this.results.map(r => r.businessRevenue.toFixed(2))],
            ['Council Revenue (£)', ...this.results.map(r => r.councilRevenue.toFixed(2))],
            ['Total Economic Impact (£)', ...this.results.map(r => r.totalEconomicImpact.toFixed(2))],
            ['PCNs Issued', ...this.results.map(r => r.pcnCount)],
            ['Drivers Served', ...this.results.map(r => r.parkedDrivers)],
            ['Deterred Drivers', ...this.results.map(r => r.deterredDrivers)],
            ['Deterred %', ...this.results.map(r => r.deterredPercent.toFixed(2))],
            ['Avg Dwell Time (min)', ...this.results.map(r => r.avgDwellTimeMinutes.toFixed(1))],
            ['Avg Spend per Driver (£)', ...this.results.map(r => r.avgSpendPerDriver.toFixed(2))],
            ['Lost Revenue (£)', ...this.results.map(r => r.lostRevenue.toFixed(2))],
            ['On-Street Parked', ...this.results.map(r => r.parkingDistribution.onstreet)],
            ['Car Park Used', ...this.results.map(r => r.parkingDistribution.carpark)],
            ['DYL Used', ...this.results.map(r => r.parkingDistribution.dyl)],
        ];

        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `parking-policy-comparison-${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    _setKPI(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    _setPctBar(id, pct) {
        const el = document.getElementById(id);
        if (el) {
            el.style.width = pct.toFixed(1) + '%';
            el.title = pct.toFixed(1) + '%';
        }
    }
}
