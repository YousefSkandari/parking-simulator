// Global configuration constants for the Ealing Parking Policy Simulator
export const CONFIG = {
    // Simulation timing
    SIM_START_HOUR: 7,
    SIM_END_HOUR: 22,
    TICK_MINUTES: 1,

    // Map defaults
    MAP_CENTER: [51.5136, -0.3010], // Ealing Broadway
    MAP_ZOOM: 15,
    ACTON_CENTER: [51.5025, -0.2715],

    // Walking parameters
    MAX_WALKING_DISTANCE_M: 400,
    COMFORTABLE_WALKING_M: 200,
    STREET_NETWORK_FACTOR: 1.3, // Haversine to walking distance correction

    // Economic parameters
    LOCAL_MULTIPLIER: 1.4,           // Each GBP on high street generates 1.40 in local economy
    PCN_COLLECTION_RATE: 0.65,       // 65% of PCNs actually collected
    PCN_EARLY_PAYMENT_RATE: 0.55,    // 55% pay within 14 days (discount)
    BUSINESS_CLOSURE_THRESHOLD: 0.10, // 10% sustained revenue drop triggers risk

    // Enforcement
    CEO_WALKING_SPEED_KMH: 3,
    CEO_PCN_ISSUE_TIME_MIN: 5,
    CEO_COUNT_PEAK: { ealingBroadway: 3, actonTown: 2 },

    // Driver generation
    DRIVER_PROPORTION_OF_FOOTFALL: 0.35,

    // PCN amounts (from April 2025 Ealing Council)
    PCN_HIGHER_RATE: 160,   // Band A - double yellow lines
    PCN_HIGHER_EARLY: 80,   // If paid within 14 days
    PCN_LOWER_RATE: 110,    // Band B - meter overstay etc
    PCN_LOWER_EARLY: 55,

    // On-street parking charges
    ONSTREET_RATE_PER_HOUR: 3.40,  // Ealing Broadway area
    ONSTREET_MAX_STAY_HOURS: 2,

    // Ealing Broadway Shopping Centre car park
    CAR_PARK_RATES: {
        '0-2': 2.50,
        '2-3': 3.50,
        '3-4': 4.50,
        '4-5': 5.50,
        '5-6': 7.50,
        '6+': 15.00
    },

    // Simulation speed
    ANIMATION_TICK_MS: 50,   // ms per simulation minute during playback
    FAST_RUN_BATCH: 100,     // ticks per frame in fast mode

    // Random seed (for reproducibility)
    RANDOM_SEED: 42,

    // Forecasting
    FORECAST_MONTHS: 12,
    CONFIDENCE_LEVEL: 0.95
};
