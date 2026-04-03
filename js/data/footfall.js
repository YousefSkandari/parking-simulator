// Hourly footfall patterns based on Ealing BID data and TfL estimates
// Values are people per hour passing through the town centre

export const FOOTFALL_PATTERNS = {
    ealingBroadway: {
        weekday: {
            7: 200, 8: 400, 9: 600, 10: 800, 11: 900,
            12: 1100, 13: 1000, 14: 900, 15: 850, 16: 800,
            17: 700, 18: 500, 19: 350, 20: 250, 21: 150
        },
        saturday: {
            7: 100, 8: 200, 9: 450, 10: 900, 11: 1200,
            12: 1400, 13: 1350, 14: 1250, 15: 1100, 16: 950,
            17: 700, 18: 450, 19: 350, 20: 300, 21: 200
        },
        sunday: {
            7: 50, 8: 100, 9: 250, 10: 500, 11: 750,
            12: 900, 13: 850, 14: 800, 15: 700, 16: 550,
            17: 400, 18: 250, 19: 150, 20: 100, 21: 50
        }
    },

    actonTown: {
        weekday: {
            7: 80, 8: 180, 9: 280, 10: 380, 11: 420,
            12: 520, 13: 480, 14: 420, 15: 400, 16: 380,
            17: 340, 18: 240, 19: 160, 20: 110, 21: 60
        },
        saturday: {
            7: 40, 8: 90, 9: 200, 10: 420, 11: 560,
            12: 650, 13: 620, 14: 580, 15: 510, 16: 440,
            17: 320, 18: 200, 19: 150, 20: 120, 21: 80
        },
        sunday: {
            7: 20, 8: 50, 9: 120, 10: 240, 11: 360,
            12: 430, 13: 400, 14: 380, 15: 330, 16: 260,
            17: 190, 18: 120, 19: 70, 20: 50, 21: 30
        }
    }
};

// Get footfall for a specific hour and day type
export function getFootfall(area, dayType, hour) {
    const pattern = FOOTFALL_PATTERNS[area]?.[dayType];
    if (!pattern) return 0;
    const h = Math.floor(hour);
    return pattern[h] || 0;
}

// Get total daily footfall
export function getDailyFootfall(area, dayType) {
    const pattern = FOOTFALL_PATTERNS[area]?.[dayType];
    if (!pattern) return 0;
    return Object.values(pattern).reduce((s, v) => s + v, 0);
}

// Driver arrivals per hour (footfall * driver proportion)
export function getDriverArrivals(area, dayType, hour, driverProportion = 0.35) {
    return Math.round(getFootfall(area, dayType, hour) * driverProportion);
}
