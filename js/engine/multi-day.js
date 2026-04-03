// Multi-day simulation runner
// Runs simulations across multiple days and aggregates results

import { Simulation } from './simulation.js';
import { EconomicsEngine } from './economics.js';
import { CONFIG } from '../config.js';

const DAY_SEQUENCE = {
    week: ['weekday', 'weekday', 'weekday', 'weekday', 'weekday', 'saturday', 'sunday'],
    month: [
        // 4 full weeks + 2 extra weekdays
        'weekday', 'weekday', 'weekday', 'weekday', 'weekday', 'saturday', 'sunday',
        'weekday', 'weekday', 'weekday', 'weekday', 'weekday', 'saturday', 'sunday',
        'weekday', 'weekday', 'weekday', 'weekday', 'weekday', 'saturday', 'sunday',
        'weekday', 'weekday', 'weekday', 'weekday', 'weekday', 'saturday', 'sunday',
        'weekday', 'weekday'
    ]
};

// Get day sequence for a simulation period
export function getDaySequence(periodType, customDays) {
    if (periodType === 'week') return DAY_SEQUENCE.week;
    if (periodType === 'month') return DAY_SEQUENCE.month;
    if (periodType === 'single') return [customDays || 'weekday'];
    if (periodType === 'custom' && typeof customDays === 'number') {
        // Generate N days following a Mon-Sun pattern
        const days = [];
        for (let i = 0; i < customDays; i++) {
            const dayOfWeek = i % 7;
            if (dayOfWeek < 5) days.push('weekday');
            else if (dayOfWeek === 5) days.push('saturday');
            else days.push('sunday');
        }
        return days;
    }
    return ['weekday'];
}

// Run a multi-day simulation for a single policy
export function runMultiDay(area, policy, periodType, customDays, onProgress) {
    const days = getDaySequence(periodType, customDays);
    const dailyResults = [];
    let totalSeed = CONFIG.RANDOM_SEED;

    for (let i = 0; i < days.length; i++) {
        const sim = new Simulation({
            area,
            dayType: days[i],
            policy,
            seed: totalSeed + i  // Different seed per day for variation
        });

        const result = sim.runFull();
        result.dayIndex = i;
        result.dayLabel = `Day ${i + 1} (${days[i]})`;
        dailyResults.push(result);

        if (onProgress) onProgress(i + 1, days.length);
    }

    return aggregateResults(dailyResults, policy, days);
}

// Aggregate daily results into a period summary
function aggregateResults(dailyResults, policy, days) {
    const n = dailyResults.length;
    if (n === 0) return null;

    // Sum and average key metrics
    const totals = {
        businessRevenue: 0,
        councilRevenue: 0,
        meterRevenue: 0,
        carParkRevenue: 0,
        pcnRevenue: 0,
        pcnCount: 0,
        totalDrivers: 0,
        parkedDrivers: 0,
        deterredDrivers: 0,
        totalDriverSpend: 0,
        lostRevenue: 0,
        totalEconomicImpact: 0,
        parkingDistribution: { onstreet: 0, carpark: 0, dyl: 0 },
        dwellTimes: [],
    };

    for (const r of dailyResults) {
        totals.businessRevenue += r.businessRevenue;
        totals.councilRevenue += r.councilRevenue;
        totals.meterRevenue += r.meterRevenue;
        totals.carParkRevenue += r.carParkRevenue;
        totals.pcnRevenue += r.pcnRevenue;
        totals.pcnCount += r.pcnCount;
        totals.totalDrivers += r.totalDrivers;
        totals.parkedDrivers += r.parkedDrivers;
        totals.deterredDrivers += r.deterredDrivers;
        totals.totalDriverSpend += r.totalDriverSpend;
        totals.lostRevenue += r.lostRevenue;
        totals.totalEconomicImpact += r.totalEconomicImpact;
        totals.parkingDistribution.onstreet += r.parkingDistribution.onstreet;
        totals.parkingDistribution.carpark += r.parkingDistribution.carpark;
        totals.parkingDistribution.dyl += r.parkingDistribution.dyl;
    }

    // Daily averages
    const avgDwell = dailyResults.reduce((s, r) => s + r.avgDwellTimeMinutes, 0) / n;
    const avgSpend = totals.parkedDrivers > 0 ? totals.totalDriverSpend / totals.parkedDrivers : 0;

    // Day-by-day time series for charts
    const dailySeries = dailyResults.map((r, i) => ({
        day: i + 1,
        dayType: days[i],
        dayLabel: r.dayLabel,
        businessRevenue: r.businessRevenue,
        councilRevenue: r.councilRevenue,
        pcnCount: r.pcnCount,
        deterredDrivers: r.deterredDrivers,
        totalEconomicImpact: r.totalEconomicImpact,
        totalDrivers: r.totalDrivers,
        parkedDrivers: r.parkedDrivers
    }));

    // Use last day's tick metrics for the utilization chart
    const lastDayMetrics = dailyResults[n - 1].tickMetrics;

    // Generate forecast from averaged daily data
    const avgDaily = {
        businessRevenue: totals.businessRevenue / n,
        councilRevenue: totals.councilRevenue / n,
        deterredPercent: totals.totalDrivers > 0 ? (totals.deterredDrivers / totals.totalDrivers) * 100 : 0
    };
    const forecast = EconomicsEngine.generateForecast(avgDaily);

    return {
        // Period totals
        ...totals,
        deterredPercent: totals.totalDrivers > 0 ? (totals.deterredDrivers / totals.totalDrivers) * 100 : 0,
        avgDwellTimeMinutes: avgDwell,
        avgSpendPerDriver: avgSpend,
        lostEconomicImpact: totals.lostRevenue * CONFIG.LOCAL_MULTIPLIER,
        directEconomicActivity: totals.businessRevenue + totals.councilRevenue,

        // Daily averages
        dailyAvg: {
            businessRevenue: totals.businessRevenue / n,
            councilRevenue: totals.councilRevenue / n,
            totalEconomicImpact: totals.totalEconomicImpact / n,
            pcnCount: totals.pcnCount / n,
            drivers: totals.totalDrivers / n,
        },

        // Per-day breakdown
        dailySeries,

        // Policy info
        policyName: policy.name,
        policyId: policy.id,
        policyColor: policy.color,

        // Period info
        periodDays: n,
        periodType: n === 7 ? 'week' : n >= 28 ? 'month' : 'custom',

        // For charts
        tickMetrics: lastDayMetrics,
        forecast,
        businessDetails: dailyResults[n - 1].businessDetails,

        // Hourly data from all days (averaged)
        hourlyData: dailyResults[n - 1].hourlyData,

        // CEO stats from last day
        ceoStats: dailyResults[n - 1].ceoStats,
        events: dailyResults[n - 1].events,
        area: dailyResults[0].area,
        totalSimMinutes: dailyResults.reduce((s, r) => s + r.totalSimMinutes, 0)
    };
}
