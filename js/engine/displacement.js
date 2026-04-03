// Displacement model: where do deterred drivers go?
// Models competing centres that deterred drivers might choose instead

import { haversineDistance } from '../util/geo.js';

// Competing centres for Ealing Broadway and Acton
const COMPETING_CENTRES = {
    ealingBroadway: [
        {
            id: 'CC-WESTFIELD',
            name: 'Westfield London (Shepherd\'s Bush)',
            coords: [51.5074, -0.2216],
            distanceKm: 5.8,
            driveTimeMinutes: 15,
            attractiveness: 0.85,   // Strong alternative (huge shopping centre)
            freeParking: false,
            parkingCostPerHour: 4.00,
            annualFootfall: 27000000,  // ~27M visitors/year
        },
        {
            id: 'CC-CHISWICK',
            name: 'Chiswick High Road',
            coords: [51.4927, -0.2590],
            distanceKm: 3.5,
            driveTimeMinutes: 12,
            attractiveness: 0.55,   // Moderate alternative
            freeParking: false,
            parkingCostPerHour: 3.50,
            annualFootfall: 5000000,
        },
        {
            id: 'CC-GREENFORD',
            name: 'Greenford / Westway Cross',
            coords: [51.5254, -0.3454],
            distanceKm: 4.2,
            driveTimeMinutes: 14,
            attractiveness: 0.45,
            freeParking: true,      // Retail park with free parking
            parkingCostPerHour: 0,
            annualFootfall: 3000000,
        },
        {
            id: 'CC-SOUTHALL',
            name: 'Southall Broadway',
            coords: [51.5063, -0.3780],
            distanceKm: 5.0,
            driveTimeMinutes: 16,
            attractiveness: 0.35,
            freeParking: false,
            parkingCostPerHour: 1.50,
            annualFootfall: 4000000,
        },
        {
            id: 'CC-ONLINE',
            name: 'Online Shopping (no trip)',
            coords: null,
            distanceKm: 0,
            driveTimeMinutes: 0,
            attractiveness: 0.30,   // Convenience but no immediate gratification
            freeParking: true,
            parkingCostPerHour: 0,
            annualFootfall: null,
        },
    ],
    actonTown: [
        {
            id: 'CC-WESTFIELD',
            name: 'Westfield London (Shepherd\'s Bush)',
            coords: [51.5074, -0.2216],
            distanceKm: 4.2,
            driveTimeMinutes: 12,
            attractiveness: 0.85,
            freeParking: false,
            parkingCostPerHour: 4.00,
            annualFootfall: 27000000,
        },
        {
            id: 'CC-EALING',
            name: 'Ealing Broadway',
            coords: [51.5136, -0.3010],
            distanceKm: 3.0,
            driveTimeMinutes: 10,
            attractiveness: 0.70,
            freeParking: false,
            parkingCostPerHour: 2.50,
            annualFootfall: 15000000,
        },
        {
            id: 'CC-CHISWICK',
            name: 'Chiswick High Road',
            coords: [51.4927, -0.2590],
            distanceKm: 2.5,
            driveTimeMinutes: 8,
            attractiveness: 0.55,
            freeParking: false,
            parkingCostPerHour: 3.50,
            annualFootfall: 5000000,
        },
        {
            id: 'CC-ONLINE',
            name: 'Online Shopping (no trip)',
            coords: null,
            distanceKm: 0,
            driveTimeMinutes: 0,
            attractiveness: 0.30,
            freeParking: true,
            parkingCostPerHour: 0,
            annualFootfall: null,
        },
    ]
};

export class DisplacementModel {
    constructor(area) {
        this.area = area;
        this.centres = COMPETING_CENTRES[area] || [];
        this.displacedDrivers = [];  // Record of where each deterred driver went
        this.centreStats = {};

        for (const c of this.centres) {
            this.centreStats[c.id] = { count: 0, totalSpend: 0, name: c.name };
        }
        this.centreStats['STAYED_HOME'] = { count: 0, totalSpend: 0, name: 'Stayed Home / Gave Up' };
    }

    // When a driver is deterred, model where they go instead
    recordDeterredDriver(driver, rng) {
        // Score each competing centre
        const scores = this.centres.map(centre => {
            let score = centre.attractiveness * 100;

            // Distance penalty (further = less likely)
            score -= centre.driveTimeMinutes * 1.5;

            // Free parking bonus
            if (centre.freeParking) score += 15;

            // Trip purpose alignment
            if (driver.profile === 'quick_stop') {
                // Quick-stop shoppers less likely to drive far
                score -= centre.distanceKm * 5;
                // More likely to just go home
                if (centre.id === 'CC-ONLINE') score += 10;
            } else if (driver.profile === 'destination') {
                // Destination shoppers will travel for a good alternative
                score += centre.attractiveness * 20;
            }

            return { centre, score: Math.max(0, score) };
        });

        // Add "gave up / stayed home" option
        const gaveUpScore = 30 + (driver.profile === 'quick_stop' ? 20 : 0);
        scores.push({ centre: { id: 'STAYED_HOME', name: 'Stayed Home' }, score: gaveUpScore });

        // Weighted random selection
        const totalScore = scores.reduce((s, item) => s + item.score, 0);
        let r = rng.next() * totalScore;
        let chosen = scores[scores.length - 1];
        for (const item of scores) {
            r -= item.score;
            if (r <= 0) { chosen = item; break; }
        }

        const destination = chosen.centre;
        const record = {
            driverId: driver.id,
            profile: driver.profile,
            plannedSpend: driver.plannedSpend,
            destinationId: destination.id,
            destinationName: destination.name,
        };

        this.displacedDrivers.push(record);

        if (this.centreStats[destination.id]) {
            this.centreStats[destination.id].count++;
            // If they went somewhere else, that centre captures the spend
            if (destination.id !== 'STAYED_HOME' && destination.id !== 'CC-ONLINE') {
                this.centreStats[destination.id].totalSpend += driver.plannedSpend;
            }
        }

        return record;
    }

    getResults() {
        const totalDeterred = this.displacedDrivers.length;
        const totalLostSpend = this.displacedDrivers.reduce((s, d) => s + d.plannedSpend, 0);

        // Build displacement breakdown
        const breakdown = Object.entries(this.centreStats)
            .map(([id, stats]) => ({
                id,
                name: stats.name,
                count: stats.count,
                percent: totalDeterred > 0 ? (stats.count / totalDeterred * 100) : 0,
                capturedSpend: stats.totalSpend,
            }))
            .filter(b => b.count > 0)
            .sort((a, b) => b.count - a.count);

        // Revenue leaked to competitors
        const leakedToCompetitors = breakdown
            .filter(b => b.id !== 'STAYED_HOME' && b.id !== 'CC-ONLINE')
            .reduce((s, b) => s + b.capturedSpend, 0);

        return {
            totalDeterred,
            totalLostSpend,
            leakedToCompetitors,
            lostToOnline: this.centreStats['CC-ONLINE']?.totalSpend || 0,
            stayedHome: this.centreStats['STAYED_HOME']?.count || 0,
            breakdown,
            competingCentres: this.centres.filter(c => c.coords).map(c => ({
                name: c.name,
                coords: c.coords,
                attracted: this.centreStats[c.id]?.count || 0,
            })),
        };
    }

    reset() {
        this.displacedDrivers = [];
        for (const id of Object.keys(this.centreStats)) {
            this.centreStats[id] = { count: 0, totalSpend: 0, name: this.centreStats[id].name };
        }
    }
}
