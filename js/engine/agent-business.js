// Business agent: tracks revenue based on nearby footfall
// Revenue model based on UK retail research

import { BUSINESSES, FOOTFALL_SENSITIVITY, AVG_SPEND_PER_VISIT, getAreaBaselineRevenue } from '../data/businesses.js';
import { findWithinRadius, walkingDistance } from '../util/geo.js';

export class BusinessSystem {
    constructor(area) {
        this.area = area;
        this.businesses = {};
        this.hourlyRevenue = {};
        this.hourlyFootfall = {};
        this.dailyRevenue = {};
        this.totalRevenue = 0;
        this.totalFootfall = 0;

        for (const biz of BUSINESSES[area] || []) {
            this.businesses[biz.id] = {
                ...biz,
                currentHourRevenue: 0,
                currentHourFootfall: 0,
                totalRevenue: 0,
                totalFootfall: 0,
                baselineDailyRevenue: biz.annualRevenue / 365,
                baselineHourlyRevenue: biz.annualRevenue / (365 * 12), // ~12 trading hours
            };
            this.hourlyRevenue[biz.id] = [];
            this.hourlyFootfall[biz.id] = [];
            this.dailyRevenue[biz.id] = 0;
        }
    }

    // Record a driver visit near businesses
    recordVisit(driverCoords, actualSpend, dwellTimeMinutes) {
        // Find businesses within walking distance of where the driver parked/shopped
        const nearbyBusinesses = findWithinRadius(
            driverCoords,
            Object.values(this.businesses).map(b => ({ ...b, coords: b.coords })),
            300 // 300m radius
        );

        if (nearbyBusinesses.length === 0) return;

        // Distribute spend across nearby businesses based on distance and sensitivity
        let totalWeight = 0;
        const weights = nearbyBusinesses.map(({ item: biz, distance }) => {
            const sensitivity = FOOTFALL_SENSITIVITY[biz.type] || 0.5;
            const distFactor = Math.max(0, 1 - distance / 300);
            const weight = sensitivity * distFactor;
            totalWeight += weight;
            return { biz, weight, distance };
        });

        if (totalWeight === 0) return;

        for (const { biz, weight } of weights) {
            const fraction = weight / totalWeight;
            const avgSpend = AVG_SPEND_PER_VISIT[biz.type] || 10;
            // Revenue is a blend of the driver's actual spend allocation and the average for the business type
            const revenue = fraction * actualSpend * 0.6 + fraction * avgSpend * 0.4;

            this.businesses[biz.id].currentHourRevenue += revenue;
            this.businesses[biz.id].currentHourFootfall += fraction;
            this.businesses[biz.id].totalRevenue += revenue;
            this.businesses[biz.id].totalFootfall += fraction;
            this.totalRevenue += revenue;
        }

        this.totalFootfall++;
    }

    // Called each hour to snapshot and reset hourly counters
    snapshotHour(hour) {
        for (const [id, biz] of Object.entries(this.businesses)) {
            this.hourlyRevenue[id].push({
                hour,
                revenue: biz.currentHourRevenue,
                footfall: biz.currentHourFootfall
            });
            this.dailyRevenue[id] = (this.dailyRevenue[id] || 0) + biz.currentHourRevenue;
            biz.currentHourRevenue = 0;
            biz.currentHourFootfall = 0;
        }
    }

    // Get aggregated results
    getResults() {
        const bizResults = [];
        for (const [id, biz] of Object.entries(this.businesses)) {
            const dailyRev = this.dailyRevenue[id] || 0;
            const baselineDaily = biz.baselineDailyRevenue;
            const changePercent = baselineDaily > 0 ? ((dailyRev - baselineDaily) / baselineDaily) * 100 : 0;

            bizResults.push({
                id: biz.id,
                name: biz.name,
                type: biz.type,
                coords: biz.coords,
                dailyRevenue: dailyRev,
                baselineDaily: baselineDaily,
                changePercent,
                totalFootfall: biz.totalFootfall,
                hourlyData: this.hourlyRevenue[id],
                employees: biz.employees
            });
        }

        return {
            businesses: bizResults,
            totalRevenue: this.totalRevenue,
            totalFootfall: this.totalFootfall,
            totalBaselineRevenue: getAreaBaselineRevenue(this.area) / 365,
            revenueChange: this.totalRevenue - getAreaBaselineRevenue(this.area) / 365,
            revenueChangePercent: ((this.totalRevenue / (getAreaBaselineRevenue(this.area) / 365)) - 1) * 100
        };
    }

    reset() {
        for (const biz of Object.values(this.businesses)) {
            biz.currentHourRevenue = 0;
            biz.currentHourFootfall = 0;
            biz.totalRevenue = 0;
            biz.totalFootfall = 0;
        }
        for (const id of Object.keys(this.hourlyRevenue)) {
            this.hourlyRevenue[id] = [];
            this.dailyRevenue[id] = 0;
        }
        this.totalRevenue = 0;
        this.totalFootfall = 0;
    }
}
