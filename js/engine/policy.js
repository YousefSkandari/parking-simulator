// Policy definitions and rule evaluation
// Each policy defines the enforcement rules for the simulation

export const PRESET_POLICIES = {
    current_strict: {
        id: 'current_strict',
        name: 'Current Policy (Strict Enforcement)',
        description: 'No grace period on double yellows. Full PCN enforcement as per Ealing Council 2025 rules.',
        dylGracePeriodMinutes: 0,
        onStreetFreePeriodMinutes: 0,
        pcnBandA: 160,
        pcnBandAEarly: 80,
        pcnBandB: 110,
        pcnBandBEarly: 55,
        enforcementIntensity: 1.0,    // 100% of normal staffing
        onStreetRateMultiplier: 1.0,
        carParkRateMultiplier: 1.0,
        color: '#e74c3c'
    },

    grace_5min: {
        id: 'grace_5min',
        name: '5-Minute Grace Period',
        description: 'Allow 5 minutes on double yellows before enforcement. Designed for quick drop-offs and pick-ups.',
        dylGracePeriodMinutes: 5,
        onStreetFreePeriodMinutes: 0,
        pcnBandA: 160,
        pcnBandAEarly: 80,
        pcnBandB: 110,
        pcnBandBEarly: 55,
        enforcementIntensity: 1.0,
        onStreetRateMultiplier: 1.0,
        carParkRateMultiplier: 1.0,
        color: '#f39c12'
    },

    grace_10min: {
        id: 'grace_10min',
        name: '10-Minute Grace Period',
        description: 'Allow 10 minutes on double yellows. Enables quick shopping trips to nearby businesses.',
        dylGracePeriodMinutes: 10,
        onStreetFreePeriodMinutes: 0,
        pcnBandA: 160,
        pcnBandAEarly: 80,
        pcnBandB: 110,
        pcnBandBEarly: 55,
        enforcementIntensity: 1.0,
        onStreetRateMultiplier: 1.0,
        carParkRateMultiplier: 1.0,
        color: '#e67e22'
    },

    free_15min_onstreet: {
        id: 'free_15min_onstreet',
        name: '15-Min Free On-Street',
        description: 'First 15 minutes free at on-street bays. No DYL grace period.',
        dylGracePeriodMinutes: 0,
        onStreetFreePeriodMinutes: 15,
        pcnBandA: 160,
        pcnBandAEarly: 80,
        pcnBandB: 110,
        pcnBandBEarly: 55,
        enforcementIntensity: 1.0,
        onStreetRateMultiplier: 1.0,
        carParkRateMultiplier: 1.0,
        color: '#3498db'
    },

    grace_reduced_pcn: {
        id: 'grace_reduced_pcn',
        name: '10-Min Grace + Reduced PCN',
        description: '10-minute grace on DYLs with reduced fines. Balances convenience with compliance.',
        dylGracePeriodMinutes: 10,
        onStreetFreePeriodMinutes: 0,
        pcnBandA: 100,
        pcnBandAEarly: 50,
        pcnBandB: 70,
        pcnBandBEarly: 35,
        enforcementIntensity: 1.0,
        onStreetRateMultiplier: 1.0,
        carParkRateMultiplier: 1.0,
        color: '#9b59b6'
    },

    relaxed_enforcement: {
        id: 'relaxed_enforcement',
        name: 'Relaxed Enforcement',
        description: 'Half the enforcement officers. Same fines but lower detection probability.',
        dylGracePeriodMinutes: 0,
        onStreetFreePeriodMinutes: 0,
        pcnBandA: 160,
        pcnBandAEarly: 80,
        pcnBandB: 110,
        pcnBandBEarly: 55,
        enforcementIntensity: 0.5,
        onStreetRateMultiplier: 1.0,
        carParkRateMultiplier: 1.0,
        color: '#1abc9c'
    },

    combined_liberal: {
        id: 'combined_liberal',
        name: 'Combined Liberal Policy',
        description: '10-min DYL grace, 15-min free on-street, reduced fines, slightly reduced enforcement.',
        dylGracePeriodMinutes: 10,
        onStreetFreePeriodMinutes: 15,
        pcnBandA: 100,
        pcnBandAEarly: 50,
        pcnBandB: 70,
        pcnBandBEarly: 35,
        enforcementIntensity: 0.75,
        onStreetRateMultiplier: 1.0,
        carParkRateMultiplier: 1.0,
        color: '#2ecc71'
    },

    reduced_rates: {
        id: 'reduced_rates',
        name: 'Reduced Parking Rates',
        description: '30% reduction in on-street and car park charges to attract more drivers.',
        dylGracePeriodMinutes: 0,
        onStreetFreePeriodMinutes: 0,
        pcnBandA: 160,
        pcnBandAEarly: 80,
        pcnBandB: 110,
        pcnBandBEarly: 55,
        enforcementIntensity: 1.0,
        onStreetRateMultiplier: 0.7,
        carParkRateMultiplier: 0.7,
        color: '#16a085'
    }
};

// Create a custom policy from user inputs
export function createCustomPolicy(overrides) {
    return {
        id: 'custom',
        name: 'Custom Policy',
        description: 'User-defined policy parameters.',
        dylGracePeriodMinutes: 0,
        onStreetFreePeriodMinutes: 0,
        pcnBandA: 160,
        pcnBandAEarly: 80,
        pcnBandB: 110,
        pcnBandBEarly: 55,
        enforcementIntensity: 1.0,
        onStreetRateMultiplier: 1.0,
        carParkRateMultiplier: 1.0,
        color: '#34495e',
        ...overrides
    };
}

// Calculate effective parking cost for a driver under a policy
export function calculateEffectiveCost(policy, parkingType, durationMinutes, baseRate) {
    const hours = durationMinutes / 60;

    if (parkingType === 'dyl') {
        // Double yellow: free if within grace period, otherwise risk PCN
        if (durationMinutes <= policy.dylGracePeriodMinutes) {
            return { cost: 0, pcnRisk: 0, type: 'grace_period' };
        }
        return { cost: 0, pcnRisk: 1, type: 'violation' };
    }

    if (parkingType === 'onstreet') {
        if (durationMinutes <= policy.onStreetFreePeriodMinutes) {
            return { cost: 0, pcnRisk: 0, type: 'free_period' };
        }
        const chargeableMinutes = durationMinutes - policy.onStreetFreePeriodMinutes;
        const cost = (chargeableMinutes / 60) * baseRate * policy.onStreetRateMultiplier;
        return { cost, pcnRisk: 0, type: 'paid' };
    }

    if (parkingType === 'carpark') {
        return { cost: baseRate * policy.carParkRateMultiplier, pcnRisk: 0, type: 'paid' };
    }

    return { cost: 0, pcnRisk: 0, type: 'unknown' };
}

// Get effective PCN amount (weighted average based on payment patterns)
export function getEffectivePCNRevenue(policy) {
    const earlyRate = 0.55;
    const fullRate = 0.25;
    const appealRate = 0.12;
    const writeOff = 0.08;
    const appealSuccess = 0.35;

    return (
        policy.pcnBandA * fullRate +
        policy.pcnBandAEarly * earlyRate +
        policy.pcnBandA * appealRate * (1 - appealSuccess) * 0.5 +
        0 * writeOff
    );
}
