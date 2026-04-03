// Traffic flow, congestion, and road safety model
// Tracks vehicle movements, road capacity utilization, and safety risks
// from DYL parking near junctions

import { haversineDistance } from '../util/geo.js';

// Road segment definitions with capacity (vehicles/hour)
const ROAD_SEGMENTS = {
    ealingBroadway: [
        { id: 'RS-EB01', name: 'The Broadway', coords: [[51.5135, -0.3025], [51.5145, -0.2975]], capacityPerHour: 800, lanes: 2, speedLimitMph: 20, type: 'high_street' },
        { id: 'RS-EB02', name: 'Uxbridge Road (W)', coords: [[51.5150, -0.3010], [51.5158, -0.2970]], capacityPerHour: 1200, lanes: 2, speedLimitMph: 30, type: 'a_road' },
        { id: 'RS-EB03', name: 'New Broadway', coords: [[51.5128, -0.3025], [51.5135, -0.3010]], capacityPerHour: 600, lanes: 1, speedLimitMph: 20, type: 'side_street' },
        { id: 'RS-EB04', name: 'High Street', coords: [[51.5142, -0.2990], [51.5152, -0.2955]], capacityPerHour: 700, lanes: 2, speedLimitMph: 20, type: 'high_street' },
        { id: 'RS-EB05', name: 'Spring Bridge Road', coords: [[51.5125, -0.3020], [51.5115, -0.3005]], capacityPerHour: 500, lanes: 1, speedLimitMph: 20, type: 'side_street' },
        { id: 'RS-EB06', name: 'Haven Green', coords: [[51.5148, -0.3035], [51.5142, -0.3015]], capacityPerHour: 600, lanes: 1, speedLimitMph: 20, type: 'side_street' },
    ],
    actonTown: [
        { id: 'RS-AT01', name: 'Uxbridge Road (E)', coords: [[51.5087, -0.2710], [51.5090, -0.2760]], capacityPerHour: 1400, lanes: 2, speedLimitMph: 30, type: 'a_road', hasBusLane: true },
        { id: 'RS-AT02', name: 'Uxbridge Road (W)', coords: [[51.5090, -0.2760], [51.5095, -0.2820]], capacityPerHour: 1400, lanes: 2, speedLimitMph: 30, type: 'a_road', hasBusLane: true },
        { id: 'RS-AT03', name: 'Horn Lane', coords: [[51.5095, -0.2810], [51.5105, -0.2825]], capacityPerHour: 600, lanes: 1, speedLimitMph: 20, type: 'side_street' },
        { id: 'RS-AT04', name: 'Salisbury Street', coords: [[51.5085, -0.2745], [51.5078, -0.2752]], capacityPerHour: 400, lanes: 1, speedLimitMph: 20, type: 'side_street' },
        { id: 'RS-AT05', name: 'The Vale', coords: [[51.5094, -0.2800], [51.5100, -0.2815]], capacityPerHour: 500, lanes: 1, speedLimitMph: 20, type: 'side_street' },
    ]
};

// Junction definitions with safety-critical DYL proximity
const JUNCTIONS = {
    ealingBroadway: [
        { id: 'JN-EB01', name: 'Broadway / New Broadway', coords: [51.5136, -0.3018], sightlineDistanceM: 15, criticalDYLs: ['DYL-EB01', 'DYL-EB02'] },
        { id: 'JN-EB02', name: 'Broadway / High Street', coords: [51.5143, -0.2988], sightlineDistanceM: 12, criticalDYLs: ['DYL-EB05'] },
        { id: 'JN-EB03', name: 'Haven Green junction', coords: [51.5149, -0.3025], sightlineDistanceM: 18, criticalDYLs: ['DYL-EB04'] },
        { id: 'JN-EB04', name: 'Spring Bridge Rd junction', coords: [51.5124, -0.3016], sightlineDistanceM: 10, criticalDYLs: ['DYL-EB07'] },
        { id: 'JN-EB05', name: 'Mattock Lane junction', coords: [51.5120, -0.3002], sightlineDistanceM: 12, criticalDYLs: ['DYL-EB09'] },
    ],
    actonTown: [
        { id: 'JN-AT01', name: 'Uxbridge Rd / Town Hall', coords: [51.5088, -0.2715], sightlineDistanceM: 15, criticalDYLs: ['DYL-AT01'] },
        { id: 'JN-AT02', name: 'Uxbridge Rd / Salisbury St', coords: [51.5090, -0.2748], sightlineDistanceM: 12, criticalDYLs: ['DYL-AT02', 'DYL-AT07'] },
        { id: 'JN-AT03', name: 'Uxbridge Rd / Horn Lane', coords: [51.5095, -0.2808], sightlineDistanceM: 18, criticalDYLs: ['DYL-AT05'] },
        { id: 'JN-AT04', name: 'Uxbridge Rd / The Vale', coords: [51.5094, -0.2803], sightlineDistanceM: 15, criticalDYLs: ['DYL-AT06'] },
    ]
};

export class TrafficModel {
    constructor(area) {
        this.area = area;
        this.segments = {};
        this.junctions = {};
        this.hourlyTraffic = [];
        this.safetyEvents = [];

        this._init();
    }

    _init() {
        for (const seg of ROAD_SEGMENTS[this.area] || []) {
            this.segments[seg.id] = {
                ...seg,
                currentFlow: 0,         // vehicles this hour
                congestionLevel: 0,      // 0-1 (0 = free flow, 1 = gridlock)
                avgSpeedMph: seg.speedLimitMph,
                capacityReduction: 0,    // from DYL parking blocking lanes
            };
        }

        for (const jn of JUNCTIONS[this.area] || []) {
            this.junctions[jn.id] = {
                ...jn,
                sightlineBlocked: false,
                blockingVehicles: 0,
                riskScore: 0,       // 0-100
            };
        }
    }

    // Update traffic model each simulation tick
    update(simHour, parkingSystem, driverCount) {
        const hour = Math.floor(simHour);

        // Base traffic flow from time-of-day pattern (background non-parking traffic)
        const baseFlowMultiplier = this._getBaseTrafficMultiplier(hour);

        for (const [id, seg] of Object.entries(this.segments)) {
            // Background traffic + parking-related traffic
            const backgroundFlow = seg.capacityPerHour * baseFlowMultiplier * 0.6;
            const parkingFlow = driverCount * 2; // Drivers searching + parking generate road trips
            seg.currentFlow = backgroundFlow + parkingFlow;

            // Capacity reduction from DYL parking (vehicles blocking road)
            const nearbyDYLVehicles = this._countDYLVehiclesNearSegment(seg, parkingSystem);
            // Each DYL-parked vehicle reduces effective capacity by ~5% (blocks part of lane)
            seg.capacityReduction = Math.min(0.4, nearbyDYLVehicles * 0.05);
            const effectiveCapacity = seg.capacityPerHour * (1 - seg.capacityReduction);

            // Congestion level (volume-to-capacity ratio)
            seg.congestionLevel = Math.min(1, seg.currentFlow / Math.max(1, effectiveCapacity));

            // Speed reduction from congestion (BPR formula simplified)
            // Speed = freeflow / (1 + 0.15 * (V/C)^4)
            const vcRatio = seg.congestionLevel;
            seg.avgSpeedMph = seg.speedLimitMph / (1 + 0.15 * Math.pow(vcRatio, 4));
        }

        // Update junction safety
        this._updateJunctionSafety(parkingSystem);
    }

    _countDYLVehiclesNearSegment(segment, parkingSystem) {
        let count = 0;
        const segMid = [
            (segment.coords[0][0] + segment.coords[1][0]) / 2,
            (segment.coords[0][1] + segment.coords[1][1]) / 2
        ];

        for (const dyl of Object.values(parkingSystem.dyls)) {
            if (dyl.vehicles.length === 0) continue;
            const dylMid = dyl.data.coords[Math.floor(dyl.data.coords.length / 2)];
            if (haversineDistance(segMid, dylMid) < 100) {
                count += dyl.vehicles.length;
            }
        }
        return count;
    }

    _updateJunctionSafety(parkingSystem) {
        for (const [id, jn] of Object.entries(this.junctions)) {
            let blockingCount = 0;

            // Check if any DYL vehicles are within sightline distance of junction
            for (const dylId of jn.criticalDYLs) {
                const dyl = parkingSystem.dyls[dylId];
                if (!dyl) continue;

                for (const vehicle of dyl.vehicles) {
                    // Check if vehicle is parked near the junction
                    const dylCoord = dyl.data.coords[0];
                    const dist = haversineDistance(jn.coords, dylCoord);
                    if (dist <= jn.sightlineDistanceM * 1.5) {
                        blockingCount++;
                    }
                }
            }

            jn.blockingVehicles = blockingCount;
            jn.sightlineBlocked = blockingCount > 0;

            // Risk score: 0-100
            // Base risk from vehicle count near junction
            let risk = 0;
            if (blockingCount >= 1) risk += 25;
            if (blockingCount >= 2) risk += 20;
            if (blockingCount >= 3) risk += 15;

            // Higher risk on A-roads
            const nearbySegment = Object.values(this.segments).find(s =>
                haversineDistance(jn.coords, [
                    (s.coords[0][0] + s.coords[1][0]) / 2,
                    (s.coords[0][1] + s.coords[1][1]) / 2
                ]) < 80
            );
            if (nearbySegment?.type === 'a_road') risk *= 1.5;
            if (nearbySegment?.hasBusLane) risk *= 1.3;

            // Time-based: higher risk during school run / peak hours
            risk = Math.min(100, risk);
            jn.riskScore = risk;

            // Log safety events
            if (jn.sightlineBlocked && risk > 40) {
                this.safetyEvents.push({
                    junctionId: id,
                    junctionName: jn.name,
                    coords: jn.coords,
                    risk,
                    blockingVehicles: blockingCount,
                });
            }
        }
    }

    // Time-of-day traffic multiplier (fraction of capacity used by background traffic)
    _getBaseTrafficMultiplier(hour) {
        const pattern = {
            6: 0.3, 7: 0.6, 8: 0.9, 9: 0.85, 10: 0.65, 11: 0.6,
            12: 0.65, 13: 0.6, 14: 0.55, 15: 0.65, 16: 0.8, 17: 0.95,
            18: 0.8, 19: 0.5, 20: 0.35, 21: 0.25, 22: 0.15
        };
        return pattern[hour] || 0.3;
    }

    // Snapshot hourly metrics
    snapshotHour(hour) {
        const segStats = Object.values(this.segments);
        const jnStats = Object.values(this.junctions);

        this.hourlyTraffic.push({
            hour,
            avgCongestion: segStats.reduce((s, seg) => s + seg.congestionLevel, 0) / segStats.length,
            maxCongestion: Math.max(...segStats.map(s => s.congestionLevel)),
            avgSpeed: segStats.reduce((s, seg) => s + seg.avgSpeedMph, 0) / segStats.length,
            capacityReduction: segStats.reduce((s, seg) => s + seg.capacityReduction, 0) / segStats.length,
            junctionsAtRisk: jnStats.filter(j => j.riskScore > 30).length,
            maxJunctionRisk: Math.max(0, ...jnStats.map(j => j.riskScore)),
            totalSafetyEvents: this.safetyEvents.length,
        });
    }

    // Get comprehensive results
    getResults() {
        const segStats = Object.values(this.segments);
        const jnStats = Object.values(this.junctions);

        const avgCongestion = segStats.reduce((s, seg) => s + seg.congestionLevel, 0) / segStats.length;
        const peakCongestion = this.hourlyTraffic.length > 0 ?
            Math.max(...this.hourlyTraffic.map(h => h.maxCongestion)) : 0;

        // Congestion cost: delay × value of time
        // UK Dept for Transport value of time: £12.61/hr for commuting (TAG data book 2024)
        const VALUE_OF_TIME_PER_HOUR = 12.61;
        const avgDelayMinutes = segStats.reduce((s, seg) => {
            const freeFlowTime = 1; // 1 minute baseline for segment traverse
            const congestedTime = freeFlowTime / Math.max(0.1, seg.avgSpeedMph / seg.speedLimitMph);
            return s + (congestedTime - freeFlowTime);
        }, 0);
        const totalVehicles = segStats.reduce((s, seg) => s + seg.currentFlow, 0);
        const dailyCongestionCost = (avgDelayMinutes / 60) * VALUE_OF_TIME_PER_HOUR * totalVehicles;

        // Road safety score (0-100, higher = safer)
        const maxRisk = Math.max(0, ...jnStats.map(j => j.riskScore));
        const avgRisk = jnStats.reduce((s, j) => s + j.riskScore, 0) / Math.max(1, jnStats.length);
        const safetyScore = Math.max(0, 100 - avgRisk);

        // Count unique high-risk events
        const uniqueRiskJunctions = new Set(
            this.safetyEvents.filter(e => e.risk > 40).map(e => e.junctionId)
        ).size;

        return {
            // Congestion metrics
            avgCongestion,
            peakCongestion,
            avgSpeedMph: segStats.reduce((s, seg) => s + seg.avgSpeedMph, 0) / segStats.length,
            avgCapacityReduction: segStats.reduce((s, seg) => s + seg.capacityReduction, 0) / segStats.length,
            dailyCongestionCost,

            // Safety metrics
            safetyScore,
            maxJunctionRisk: maxRisk,
            avgJunctionRisk: avgRisk,
            junctionsAtRisk: jnStats.filter(j => j.riskScore > 30).length,
            totalJunctions: jnStats.length,
            sightlineBlockedCount: jnStats.filter(j => j.sightlineBlocked).length,
            safetyEventCount: this.safetyEvents.length,
            uniqueRiskJunctions,

            // Time series
            hourlyTraffic: this.hourlyTraffic,

            // Per-segment details
            segments: segStats.map(s => ({
                name: s.name,
                type: s.type,
                congestion: s.congestionLevel,
                speed: s.avgSpeedMph,
                capacityReduction: s.capacityReduction,
            })),

            // Per-junction details
            junctions: jnStats.map(j => ({
                name: j.name,
                risk: j.riskScore,
                blocked: j.sightlineBlocked,
                blockingVehicles: j.blockingVehicles,
            })),
        };
    }

    reset() {
        this._init();
        this.hourlyTraffic = [];
        this.safetyEvents = [];
    }
}
