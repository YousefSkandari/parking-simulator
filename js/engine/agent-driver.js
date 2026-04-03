// Driver agent: decision-making model for parking, shopping, departing
// This is the core behavioral model of the simulation

import { PROFILE_DETAILS, DETERRENCE } from '../data/demographics.js';
import { walkingDistance } from '../util/geo.js';

export const DRIVER_STATES = {
    ARRIVING: 'arriving',
    SEARCHING: 'searching',
    PARKING: 'parking',
    SHOPPING: 'shopping',
    DEPARTING: 'departing',
    DETERRED: 'deterred',      // Gave up and left
    LEFT: 'left'               // Completed visit and left
};

let nextDriverId = 0;

export function createDriver(rng, profile, destination, simTime) {
    const details = PROFILE_DETAILS[profile];
    const dwellTime = Math.max(
        details.dwellTimeMinutes.min,
        Math.min(details.dwellTimeMinutes.max,
            Math.round(rng.normal(details.dwellTimeMinutes.mean, details.dwellTimeMinutes.stddev)))
    );
    const plannedSpend = Math.max(
        details.spendGBP.min,
        Math.round(rng.normal(details.spendGBP.mean, details.spendGBP.stddev) * 100) / 100
    );

    return {
        id: `DRV-${++nextDriverId}`,
        profile,
        state: DRIVER_STATES.ARRIVING,
        destination,
        dwellTimeMinutes: dwellTime,
        plannedSpend,
        actualSpend: 0,
        parkingCost: 0,
        parkingType: null,
        parkingLocationId: null,
        parkingCoords: null,
        arrivedAt: simTime,
        parkedAt: null,
        departAt: null,
        searchStarted: null,
        searchTimeMinutes: 0,
        receivedPCN: false,
        pcnAmount: 0,
        priceSensitivity: details.priceSensitivity,
        pcnRiskTolerance: details.pcnRiskTolerance,
        maxWalkingDistance: details.maxWalkingDistanceM
    };
}

export function resetDriverIds() {
    nextDriverId = 0;
}

// Main decision function: choose where to park
export function chooseParkingOption(driver, options, policy, rng) {
    if (options.length === 0) return null;

    const details = PROFILE_DETAILS[driver.profile];

    // Score each option
    const scored = options.map(opt => {
        let score = 100; // Base score

        // Distance penalty (sharp drop-off beyond comfortable walking)
        const comfortDist = driver.maxWalkingDistance * 0.5;
        if (opt.distance <= comfortDist) {
            score -= opt.distance * 0.05;
        } else {
            score -= comfortDist * 0.05 + (opt.distance - comfortDist) * 0.2;
        }

        // Cost penalty (weighted by price sensitivity)
        score -= opt.cost * driver.priceSensitivity * 3;

        // PCN risk penalty
        if (opt.pcnRisk > 0 && !opt.withinGrace) {
            const expectedPCNCost = opt.pcnRisk * policy.pcnBandA *
                policy.enforcementIntensity * (1 - driver.pcnRiskTolerance);
            // Quick-stop shoppers weigh PCN risk differently
            if (driver.dwellTimeMinutes <= policy.dylGracePeriodMinutes && opt.type === 'dyl') {
                score += 30; // Within grace = very attractive
            } else {
                score -= expectedPCNCost * 0.1;
            }
        }

        // DYL within grace period is very attractive for quick stops
        if (opt.type === 'dyl' && opt.withinGrace) {
            score += 40;
        }

        // Car park reliability bonus
        if (opt.type === 'carpark') {
            score += 10; // Guaranteed space, no stress
        }

        // Availability bonus (more spaces = less circling)
        score += Math.min(opt.available, 5) * 2;

        return { option: opt, score };
    });

    // Sort by score descending
    scored.sort((a, b) => b.score - a.score);

    // Check if best option is worth it (vs. giving up)
    const best = scored[0];
    if (best.score < 20) {
        // Too unattractive - might give up
        if (rng.next() < DETERRENCE.giveUpProbability * driver.priceSensitivity) {
            return null; // Deterred
        }
    }

    // Add some randomness to avoid everyone choosing identically
    // Top 3 options considered with weighted probability
    const top = scored.slice(0, Math.min(3, scored.length));
    const minScore = Math.min(...top.map(t => t.score));
    const weights = top.map(t => ({
        item: t.option,
        weight: Math.max(1, t.score - minScore + 10)
    }));

    return rng.weighted(weights);
}

// Update driver state each tick
export function updateDriver(driver, simTime, parkingSystem, policy, rng, area) {
    switch (driver.state) {
        case DRIVER_STATES.ARRIVING:
            driver.state = DRIVER_STATES.SEARCHING;
            driver.searchStarted = simTime;
            break;

        case DRIVER_STATES.SEARCHING: {
            driver.searchTimeMinutes++;

            // Check if we should give up
            if (driver.searchTimeMinutes > DETERRENCE.maxSearchTimeMinutes) {
                if (rng.next() < DETERRENCE.giveUpProbability) {
                    driver.state = DRIVER_STATES.DETERRED;
                    break;
                }
            }

            // Find parking options
            const options = parkingSystem.findParkingOptions(
                driver.destination,
                driver.maxWalkingDistance,
                policy,
                driver.dwellTimeMinutes,
                driver.profile
            );

            const chosen = chooseParkingOption(driver, options, policy, rng);

            if (chosen) {
                const success = parkingSystem.parkVehicle(
                    chosen.type, chosen.id, driver.id, simTime
                );
                if (success) {
                    driver.state = DRIVER_STATES.PARKING;
                    driver.parkingType = chosen.type;
                    driver.parkingLocationId = chosen.id;
                    driver.parkingCoords = chosen.coords;
                    driver.parkingCost = chosen.cost;
                    driver.parkedAt = simTime;
                    driver.departAt = simTime + driver.dwellTimeMinutes;
                }
            }
            break;
        }

        case DRIVER_STATES.PARKING:
            driver.state = DRIVER_STATES.SHOPPING;
            // Calculate actual spend based on dwell time
            driver.actualSpend = driver.plannedSpend;
            break;

        case DRIVER_STATES.SHOPPING:
            if (simTime >= driver.departAt) {
                driver.state = DRIVER_STATES.DEPARTING;
            }
            break;

        case DRIVER_STATES.DEPARTING:
            parkingSystem.removeVehicle(
                driver.parkingType, driver.parkingLocationId, driver.id
            );
            driver.state = DRIVER_STATES.LEFT;
            break;
    }
}
