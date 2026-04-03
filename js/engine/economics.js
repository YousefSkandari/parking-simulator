// Economic aggregation model
// Calculates net economic impact of parking policies

import { CONFIG } from '../config.js';
import { getEffectivePCNRevenue } from './policy.js';
import { linearRegression } from '../util/stats.js';

export class EconomicsEngine {
    constructor() {
        this.reset();
    }

    reset() {
        this.meterRevenue = 0;
        this.carParkRevenue = 0;
        this.pcnRevenue = 0;
        this.pcnCount = 0;
        this.totalDriverSpend = 0;
        this.driverCount = 0;
        this.deterredDrivers = 0;
        this.parkedDrivers = 0;
        this.avgDwellTime = 0;
        this.dwellTimes = [];
        this.parkingTypeDistribution = { onstreet: 0, carpark: 0, dyl: 0 };
        this.hourlyData = [];
        this.businessRevenue = 0;
    }

    // Record a completed driver visit
    recordDriver(driver) {
        this.driverCount++;

        if (driver.state === 'deterred') {
            this.deterredDrivers++;
            return;
        }

        this.parkedDrivers++;
        this.totalDriverSpend += driver.actualSpend;
        this.dwellTimes.push(driver.dwellTimeMinutes);

        // Parking revenue
        if (driver.parkingType === 'onstreet') {
            this.meterRevenue += driver.parkingCost;
            this.parkingTypeDistribution.onstreet++;
        } else if (driver.parkingType === 'carpark') {
            this.carParkRevenue += driver.parkingCost;
            this.parkingTypeDistribution.carpark++;
        } else if (driver.parkingType === 'dyl') {
            this.parkingTypeDistribution.dyl++;
        }

        // PCN revenue
        if (driver.receivedPCN) {
            this.pcnCount++;
            this.pcnRevenue += driver.pcnAmount * CONFIG.PCN_COLLECTION_RATE *
                (CONFIG.PCN_EARLY_PAYMENT_RATE * 0.5 + (1 - CONFIG.PCN_EARLY_PAYMENT_RATE));
        }
    }

    // Record hourly snapshot
    snapshotHour(hour, parkingStats) {
        this.hourlyData.push({
            hour,
            meterRevenue: this.meterRevenue,
            carParkRevenue: this.carParkRevenue,
            pcnRevenue: this.pcnRevenue,
            driverSpend: this.totalDriverSpend,
            bayOccupancy: parkingStats.bayOccupancy,
            carParkOccupancy: parkingStats.carParkOccupancy,
            dylVehicles: parkingStats.dylVehicles,
            deterredDrivers: this.deterredDrivers,
            pcnCount: this.pcnCount
        });
    }

    // Calculate comprehensive economic results
    calculateResults(policy, businessResults) {
        const councilParkingRevenue = this.meterRevenue + this.carParkRevenue + this.pcnRevenue;
        this.businessRevenue = businessResults.totalRevenue;

        // Local economic impact (with multiplier)
        const directEconomicActivity = this.businessRevenue + councilParkingRevenue;
        const totalEconomicImpact = this.businessRevenue * CONFIG.LOCAL_MULTIPLIER + councilParkingRevenue;

        // Lost revenue from deterred drivers
        const avgSpendPerDriver = this.parkedDrivers > 0 ?
            this.totalDriverSpend / this.parkedDrivers : 25;
        const lostRevenue = this.deterredDrivers * avgSpendPerDriver;

        // Average dwell time
        const avgDwell = this.dwellTimes.length > 0 ?
            this.dwellTimes.reduce((s, v) => s + v, 0) / this.dwellTimes.length : 0;

        return {
            // Summary metrics
            totalEconomicImpact,
            directEconomicActivity,
            businessRevenue: this.businessRevenue,
            businessRevenueChange: businessResults.revenueChangePercent,

            // Council revenue breakdown
            councilRevenue: councilParkingRevenue,
            meterRevenue: this.meterRevenue,
            carParkRevenue: this.carParkRevenue,
            pcnRevenue: this.pcnRevenue,
            pcnCount: this.pcnCount,

            // Driver metrics
            totalDrivers: this.driverCount,
            parkedDrivers: this.parkedDrivers,
            deterredDrivers: this.deterredDrivers,
            deterredPercent: this.driverCount > 0 ?
                (this.deterredDrivers / this.driverCount) * 100 : 0,
            avgDwellTimeMinutes: avgDwell,
            avgSpendPerDriver,
            totalDriverSpend: this.totalDriverSpend,

            // Lost opportunity
            lostRevenue,
            lostEconomicImpact: lostRevenue * CONFIG.LOCAL_MULTIPLIER,

            // Parking distribution
            parkingDistribution: { ...this.parkingTypeDistribution },

            // Time series
            hourlyData: [...this.hourlyData],

            // Policy info
            policyName: policy.name,
            policyId: policy.id,
            policyColor: policy.color
        };
    }

    // Generate 12-month forecast based on daily simulation results
    static generateForecast(dailyResults, months = 12) {
        const monthlyProjections = [];
        const dailyBizRev = dailyResults.businessRevenue;
        const dailyCouncilRev = dailyResults.councilRevenue;
        const deterredPct = dailyResults.deterredPercent;

        for (let m = 1; m <= months; m++) {
            // Seasonal adjustments (UK retail patterns)
            const seasonalFactor = getSeasonalFactor(m);

            // Gradual behavior change: as word spreads about policy, more drivers come
            // or fewer, depending on deterrence rate
            const adoptionFactor = 1 + (1 - deterredPct / 100) * 0.02 * m; // Small growth if low deterrence

            const monthlyBizRev = dailyBizRev * 30 * seasonalFactor * adoptionFactor;
            const monthlyCouncilRev = dailyCouncilRev * 30 * seasonalFactor;
            const monthlyTotal = monthlyBizRev * CONFIG.LOCAL_MULTIPLIER + monthlyCouncilRev;

            // Confidence bands widen over time
            const uncertainty = 0.05 + m * 0.015;

            monthlyProjections.push({
                month: m,
                businessRevenue: monthlyBizRev,
                councilRevenue: monthlyCouncilRev,
                totalEconomicImpact: monthlyTotal,
                upperBound: monthlyTotal * (1 + uncertainty),
                lowerBound: monthlyTotal * (1 - uncertainty),
                seasonalFactor,
                adoptionFactor
            });
        }

        return monthlyProjections;
    }
}

// UK retail seasonal factors (1.0 = average month)
function getSeasonalFactor(month) {
    const factors = {
        1: 0.82,   // January - post-Christmas slump
        2: 0.85,
        3: 0.92,
        4: 0.95,
        5: 1.00,
        6: 1.02,
        7: 1.00,
        8: 0.98,
        9: 0.95,
        10: 1.00,
        11: 1.10,  // Black Friday etc.
        12: 1.35   // Christmas peak
    };
    return factors[month] || 1.0;
}
