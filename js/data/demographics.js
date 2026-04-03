// Driver demographic profiles
// Based on TfL travel surveys and UK retail research

export const DRIVER_PROFILES = {
    QUICK_STOP: 'quick_stop',
    DESTINATION: 'destination',
    COMMUTER: 'commuter'
};

const P = DRIVER_PROFILES;

export const PROFILE_DISTRIBUTION = [
    { profile: P.QUICK_STOP, weight: 0.40 },
    { profile: P.DESTINATION, weight: 0.35 },
    { profile: P.COMMUTER, weight: 0.25 }
];

export const PROFILE_DETAILS = {
    [P.QUICK_STOP]: {
        label: 'Quick-Stop Shopper',
        description: 'Needs 10-30 min, pops into 1-2 shops',
        dwellTimeMinutes: { mean: 18, stddev: 8, min: 5, max: 35 },
        spendGBP: { mean: 15, stddev: 8, min: 3, max: 40 },
        priceSensitivity: 0.85,       // Very sensitive to parking cost
        pcnRiskTolerance: 0.35,       // Willing to risk DYL for short stops
        maxWalkingDistanceM: 200,     // Won't walk far
        arrivalWeights: {             // When do they arrive (by hour)
            7: 0.02, 8: 0.05, 9: 0.08, 10: 0.12, 11: 0.13,
            12: 0.14, 13: 0.12, 14: 0.10, 15: 0.08, 16: 0.07,
            17: 0.05, 18: 0.03, 19: 0.01, 20: 0, 21: 0
        },
        typicalPurpose: ['pharmacy', 'takeaway', 'ATM', 'dry_cleaner', 'quick_shop'],
        visitCount: { mean: 1.5, max: 3 }  // Number of shops visited
    },

    [P.DESTINATION]: {
        label: 'Destination Shopper',
        description: 'Plans to spend 1-2 hours shopping/dining',
        dwellTimeMinutes: { mean: 75, stddev: 30, min: 30, max: 150 },
        spendGBP: { mean: 48, stddev: 25, min: 10, max: 150 },
        priceSensitivity: 0.50,
        pcnRiskTolerance: 0.10,       // Low - too much to lose
        maxWalkingDistanceM: 400,
        arrivalWeights: {
            7: 0.01, 8: 0.02, 9: 0.06, 10: 0.12, 11: 0.14,
            12: 0.15, 13: 0.13, 14: 0.11, 15: 0.09, 16: 0.07,
            17: 0.05, 18: 0.03, 19: 0.02, 20: 0, 21: 0
        },
        typicalPurpose: ['shopping', 'restaurant', 'multiple_shops', 'browsing'],
        visitCount: { mean: 3, max: 6 }
    },

    [P.COMMUTER]: {
        label: 'Commuter / Worker',
        description: 'Parks for 4-8+ hours for work',
        dwellTimeMinutes: { mean: 360, stddev: 90, min: 180, max: 540 },
        spendGBP: { mean: 12, stddev: 8, min: 0, max: 30 },  // Maybe lunch
        priceSensitivity: 0.30,        // Cost is part of commute budget
        pcnRiskTolerance: 0.05,        // Very low - can't check car
        maxWalkingDistanceM: 600,      // Will walk further for all-day parking
        arrivalWeights: {
            7: 0.15, 8: 0.35, 9: 0.25, 10: 0.10, 11: 0.05,
            12: 0.03, 13: 0.02, 14: 0.02, 15: 0.01, 16: 0.01,
            17: 0.01, 18: 0, 19: 0, 20: 0, 21: 0
        },
        typicalPurpose: ['work', 'office', 'appointment'],
        visitCount: { mean: 1, max: 2 }
    }
};

// Deterrence thresholds - at what cost/inconvenience does a driver give up?
export const DETERRENCE = {
    // If total parking cost exceeds this fraction of planned spend, may be deterred
    costToSpendRatio: 0.25,
    // If search time exceeds this, probability of giving up increases
    maxSearchTimeMinutes: 12,
    // Probability of leaving after max search time
    giveUpProbability: 0.6
};
