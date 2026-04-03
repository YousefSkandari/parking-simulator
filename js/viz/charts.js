// Chart.js chart creation and management

export class ChartManager {
    constructor() {
        this.charts = {};
    }

    // Parking utilization over time (line chart)
    createUtilizationChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        this.charts.utilization = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'On-Street Bay Occupancy %',
                        data: [],
                        borderColor: '#27ae60',
                        backgroundColor: 'rgba(39,174,96,0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'Car Park Occupancy %',
                        data: [],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52,152,219,0.1)',
                        fill: true,
                        tension: 0.3
                    },
                    {
                        label: 'DYL Violations',
                        data: [],
                        borderColor: '#e74c3c',
                        backgroundColor: 'rgba(231,76,60,0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                plugins: {
                    title: { display: true, text: 'Parking Utilization Over Time', font: { size: 14 } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    x: { title: { display: true, text: 'Time' } },
                    y: {
                        title: { display: true, text: 'Occupancy %' },
                        min: 0, max: 100
                    },
                    y1: {
                        position: 'right',
                        title: { display: true, text: 'Vehicles on DYL' },
                        min: 0,
                        grid: { drawOnChartArea: false }
                    }
                }
            }
        });
    }

    // Economic impact comparison (bar chart)
    createEconomicChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        this.charts.economic = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Business Revenue (£)',
                        data: [],
                        backgroundColor: 'rgba(46,204,113,0.8)',
                        borderColor: '#27ae60',
                        borderWidth: 1
                    },
                    {
                        label: 'Council Parking Revenue (£)',
                        data: [],
                        backgroundColor: 'rgba(52,152,219,0.8)',
                        borderColor: '#2980b9',
                        borderWidth: 1
                    },
                    {
                        label: 'Lost Revenue (Deterred) (£)',
                        data: [],
                        backgroundColor: 'rgba(231,76,60,0.6)',
                        borderColor: '#c0392b',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Economic Impact by Policy', font: { size: 14 } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    x: { title: { display: true, text: 'Policy Scenario' } },
                    y: {
                        title: { display: true, text: 'Daily Revenue (£)' },
                        beginAtZero: true
                    }
                }
            }
        });
    }

    // Scenario comparison radar chart
    createRadarChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        this.charts.radar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Business Revenue', 'Council Revenue', 'Footfall', 'Avg Dwell Time', 'Low Deterrence', 'Low PCNs'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Policy Comparison', font: { size: 14 } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    r: {
                        min: 0, max: 100,
                        ticks: { stepSize: 20, display: false },
                        pointLabels: { font: { size: 11 } }
                    }
                }
            }
        });
    }

    // 12-month forecast chart
    createForecastChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        this.charts.forecast = new Chart(ctx, {
            type: 'line',
            data: {
                labels: ['Month 1', 'Month 2', 'Month 3', 'Month 4', 'Month 5', 'Month 6',
                         'Month 7', 'Month 8', 'Month 9', 'Month 10', 'Month 11', 'Month 12'],
                datasets: []
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: '12-Month Economic Forecast', font: { size: 14 } },
                    legend: { position: 'bottom' }
                },
                scales: {
                    x: { title: { display: true, text: 'Month' } },
                    y: {
                        title: { display: true, text: 'Monthly Economic Impact (£)' },
                        beginAtZero: false
                    }
                }
            }
        });
    }

    // Driver behavior breakdown (doughnut)
    createDriverChart(canvasId) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return;

        this.charts.drivers = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['On-Street Bay', 'Car Park', 'Double Yellow', 'Deterred'],
                datasets: [{
                    data: [0, 0, 0, 0],
                    backgroundColor: ['#27ae60', '#3498db', '#f1c40f', '#e74c3c'],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: { display: true, text: 'Driver Parking Choices', font: { size: 14 } },
                    legend: { position: 'bottom' }
                }
            }
        });
    }

    // Update utilization chart with time series data
    updateUtilization(tickMetrics) {
        if (!this.charts.utilization) return;

        // Sample every 5 minutes for cleaner chart
        const sampled = tickMetrics.filter((_, i) => i % 5 === 0);
        const labels = sampled.map(t => {
            const h = Math.floor(t.hour);
            const m = Math.round((t.hour - h) * 60);
            return `${h}:${m.toString().padStart(2, '0')}`;
        });

        this.charts.utilization.data.labels = labels;
        this.charts.utilization.data.datasets[0].data = sampled.map(t => Math.round(t.bayOccupancy * 100));
        this.charts.utilization.data.datasets[1].data = sampled.map(t => Math.round(t.carParkOccupancy * 100));
        this.charts.utilization.data.datasets[2].data = sampled.map(t => t.dylVehicles);
        this.charts.utilization.update('none');
    }

    // Update economic comparison with multiple scenario results
    updateEconomicComparison(scenarioResults) {
        if (!this.charts.economic) return;

        this.charts.economic.data.labels = scenarioResults.map(r => r.policyName.replace(/ /g, '\n'));
        this.charts.economic.data.datasets[0].data = scenarioResults.map(r => Math.round(r.businessRevenue));
        this.charts.economic.data.datasets[1].data = scenarioResults.map(r => Math.round(r.councilRevenue));
        this.charts.economic.data.datasets[2].data = scenarioResults.map(r => Math.round(r.lostRevenue));

        // Color bars by policy
        this.charts.economic.data.datasets[0].backgroundColor = scenarioResults.map(r => r.policyColor + 'CC');
        this.charts.economic.update('none');
    }

    // Update radar chart with scenario comparison
    updateRadar(scenarioResults) {
        if (!this.charts.radar) return;

        // Normalize all metrics to 0-100 scale
        const maxBizRev = Math.max(...scenarioResults.map(r => r.businessRevenue));
        const maxCouncilRev = Math.max(...scenarioResults.map(r => r.councilRevenue));
        const maxFootfall = Math.max(...scenarioResults.map(r => r.parkedDrivers));
        const maxDwell = Math.max(...scenarioResults.map(r => r.avgDwellTimeMinutes));
        const maxDeterred = Math.max(...scenarioResults.map(r => r.deterredPercent), 1);
        const maxPCN = Math.max(...scenarioResults.map(r => r.pcnCount), 1);

        this.charts.radar.data.datasets = scenarioResults.map(r => ({
            label: r.policyName,
            data: [
                (r.businessRevenue / maxBizRev) * 100,
                (r.councilRevenue / maxCouncilRev) * 100,
                (r.parkedDrivers / maxFootfall) * 100,
                (r.avgDwellTimeMinutes / maxDwell) * 100,
                (1 - r.deterredPercent / maxDeterred) * 100,
                (1 - r.pcnCount / maxPCN) * 100
            ],
            borderColor: r.policyColor,
            backgroundColor: r.policyColor + '30',
            borderWidth: 2
        }));
        this.charts.radar.update('none');
    }

    // Update forecast chart
    updateForecast(scenarioResults) {
        if (!this.charts.forecast) return;

        this.charts.forecast.data.datasets = [];
        for (const result of scenarioResults) {
            if (!result.forecast) continue;

            // Main line
            this.charts.forecast.data.datasets.push({
                label: result.policyName,
                data: result.forecast.map(f => Math.round(f.totalEconomicImpact)),
                borderColor: result.policyColor,
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.3
            });

            // Confidence band (only for first 2 scenarios to avoid clutter)
            if (this.charts.forecast.data.datasets.length <= 4) {
                this.charts.forecast.data.datasets.push({
                    label: `${result.policyName} (range)`,
                    data: result.forecast.map(f => Math.round(f.upperBound)),
                    borderColor: 'transparent',
                    backgroundColor: result.policyColor + '15',
                    fill: '+1',
                    tension: 0.3,
                    pointRadius: 0
                });
                this.charts.forecast.data.datasets.push({
                    label: '',
                    data: result.forecast.map(f => Math.round(f.lowerBound)),
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                    tension: 0.3,
                    pointRadius: 0
                });
            }
        }
        this.charts.forecast.update('none');
    }

    // Update driver choice doughnut
    updateDriverChoices(result) {
        if (!this.charts.drivers) return;

        this.charts.drivers.data.datasets[0].data = [
            result.parkingDistribution.onstreet,
            result.parkingDistribution.carpark,
            result.parkingDistribution.dyl,
            result.deterredDrivers
        ];
        this.charts.drivers.update('none');
    }

    destroyAll() {
        for (const chart of Object.values(this.charts)) {
            chart.destroy();
        }
        this.charts = {};
    }
}
