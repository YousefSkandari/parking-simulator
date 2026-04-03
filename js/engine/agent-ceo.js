// Civil Enforcement Officer (CEO) agent
// Patrols area, checks DYL vehicles, issues PCNs

import { ENFORCEMENT } from '../data/enforcement.js';
import { DOUBLE_YELLOWS } from '../data/double-yellows.js';
import { interpolatePolyline, polylineLength } from '../util/geo.js';

let nextCeoId = 0;

export const CEO_STATES = {
    PATROLLING: 'patrolling',
    INSPECTING: 'inspecting',
    ISSUING_PCN: 'issuing_pcn',
    ON_BREAK: 'on_break'
};

export function createCEO(area, patrolRoute, shiftStart, shiftEnd) {
    return {
        id: `CEO-${++nextCeoId}`,
        area,
        state: CEO_STATES.PATROLLING,
        patrolRoute,          // Array of DYL ids to check
        currentRouteIndex: 0,
        routeProgress: 0,     // 0-1 progress along current segment
        coords: null,
        shiftStart,
        shiftEnd,
        isActive: false,
        inspectingVehicle: null,
        inspectTimer: 0,
        pcnTimer: 0,
        breakTimer: 0,
        minutesSinceBreak: 0,
        pcnsIssued: [],
        observedVehicles: new Map()  // vehicleId -> first observed time
    };
}

export function resetCeoIds() {
    nextCeoId = 0;
}

// Generate patrol routes for CEOs in an area
export function generatePatrolRoutes(area, ceoCount) {
    const dyls = DOUBLE_YELLOWS[area] || [];
    if (dyls.length === 0 || ceoCount === 0) return [];

    const routes = [];
    const segmentCount = Math.ceil(dyls.length / ceoCount);

    for (let i = 0; i < ceoCount; i++) {
        const start = i * segmentCount;
        const end = Math.min(start + segmentCount, dyls.length);
        const route = dyls.slice(start, end).map(d => d.id);
        // Make it a circuit - go back and forth
        if (route.length > 1) {
            routes.push([...route, ...route.slice(0, -1).reverse()]);
        } else {
            routes.push(route);
        }
    }

    return routes;
}

// Update CEO each tick
export function updateCEO(ceo, simTime, simHour, parkingSystem, policy, rng) {
    const events = [];

    // Check if on shift
    if (simHour < ceo.shiftStart || simHour >= ceo.shiftEnd) {
        ceo.isActive = false;
        return events;
    }
    ceo.isActive = true;

    // Apply enforcement intensity (reduce effective working time)
    if (policy.enforcementIntensity < 1.0) {
        if (rng.next() > policy.enforcementIntensity) {
            return events; // Skip this tick (simulates reduced staffing)
        }
    }

    switch (ceo.state) {
        case CEO_STATES.ON_BREAK:
            ceo.breakTimer--;
            if (ceo.breakTimer <= 0) {
                ceo.state = CEO_STATES.PATROLLING;
                ceo.minutesSinceBreak = 0;
            }
            break;

        case CEO_STATES.PATROLLING: {
            ceo.minutesSinceBreak++;

            // Check if needs a break
            if (ceo.minutesSinceBreak >= ENFORCEMENT.ceo.breakFrequencyHours * 60) {
                ceo.state = CEO_STATES.ON_BREAK;
                ceo.breakTimer = ENFORCEMENT.ceo.breakDurationMinutes;
                break;
            }

            // Move along patrol route
            const currentDylId = ceo.patrolRoute[ceo.currentRouteIndex];
            const dyls = DOUBLE_YELLOWS[ceo.area] || [];
            const currentDyl = dyls.find(d => d.id === currentDylId);

            if (currentDyl) {
                // Update position
                ceo.routeProgress += 0.15; // ~15% of segment per minute at walking speed
                ceo.coords = interpolatePolyline(currentDyl.coords, Math.min(1, ceo.routeProgress));

                // Check for vehicles at this DYL
                const dylState = parkingSystem.dyls[currentDylId];
                if (dylState && dylState.vehicles.length > 0) {
                    // Found vehicles - start inspecting
                    for (const vehicle of dylState.vehicles) {
                        const parkedDuration = simTime - vehicle.parkedAt;

                        // Check grace period
                        if (parkedDuration <= policy.dylGracePeriodMinutes) {
                            // Within grace - note the vehicle for later
                            if (!ceo.observedVehicles.has(vehicle.id)) {
                                ceo.observedVehicles.set(vehicle.id, simTime);
                            }
                            continue;
                        }

                        // Past grace period - issue PCN
                        ceo.state = CEO_STATES.ISSUING_PCN;
                        ceo.inspectingVehicle = vehicle.id;
                        ceo.pcnTimer = ENFORCEMENT.ceo.pcnIssueTimeMinutes;
                        events.push({
                            type: 'pcn_start',
                            ceoId: ceo.id,
                            vehicleId: vehicle.id,
                            dylId: currentDylId,
                            time: simTime
                        });
                        break; // One at a time
                    }
                }

                // Move to next segment
                if (ceo.routeProgress >= 1) {
                    ceo.routeProgress = 0;
                    ceo.currentRouteIndex = (ceo.currentRouteIndex + 1) % ceo.patrolRoute.length;
                }
            } else {
                ceo.currentRouteIndex = (ceo.currentRouteIndex + 1) % ceo.patrolRoute.length;
            }
            break;
        }

        case CEO_STATES.ISSUING_PCN: {
            ceo.pcnTimer--;
            if (ceo.pcnTimer <= 0) {
                const pcnAmount = policy.pcnBandA;
                ceo.pcnsIssued.push({
                    vehicleId: ceo.inspectingVehicle,
                    amount: pcnAmount,
                    time: simTime
                });
                events.push({
                    type: 'pcn_issued',
                    ceoId: ceo.id,
                    vehicleId: ceo.inspectingVehicle,
                    amount: pcnAmount,
                    time: simTime,
                    coords: ceo.coords
                });
                ceo.inspectingVehicle = null;
                ceo.state = CEO_STATES.PATROLLING;
            }
            break;
        }
    }

    return events;
}
