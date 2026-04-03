// On-street paid parking bays - real locations in Ealing Broadway and Acton Town
// Coordinates based on actual street positions
//
// NOTE: Ealing uses emissions-based tariffs with 4 bands:
//   Band 1 (0-100 g/km CO2): £1.10-£1.25/hr
//   Band 2 (101-140 g/km):   £1.50-£1.75/hr
//   Band 3 (141-185 g/km):   £1.80-£2.00/hr
//   Band 4 (186+ g/km):      £2.20-£2.50/hr
// Town centre premium zones charge £2.50-£5.00/hr.
// The ratePerHour below uses a weighted average of ~£2.40/hr based on:
// - Post-April 2025: 13-band system, full rate £2.50-£5.00/hr, up to 50% discount
// - UK vehicle fleet emissions mix (DfT VEH0133): ~20% Band 1, ~30% Band 2, ~30% Band 3, ~20% Band 4
// - Weighted avg: 0.2×£1.25 + 0.3×£1.65 + 0.3×£2.10 + 0.2×£2.50 = ~£1.87 (pre-2025)
// - Post-April 2025 with new 13-band system likely ~£2.40/hr weighted average
// Source: ealing.gov.uk, PayByPhone location data, ealing.news tariff reporting

export const PARKING_BAYS = {
    // EALING BROADWAY — bays positioned on actual streets
    // The Broadway runs E-W ~51.514x. Shopping Centre at ~51.513, -0.303.
    // High Street runs S from Spring Bridge Road ~51.512x, -0.304x.
    ealingBroadway: [
        // The Broadway (E-W main road, bays on both sides between bus stops)
        { id: 'EB-B01', coords: [51.5140, -0.3050], capacity: 4, street: 'The Broadway (west)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-B02', coords: [51.5138, -0.3042], capacity: 3, street: 'The Broadway (west)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-B03', coords: [51.5136, -0.3035], capacity: 5, street: 'The Broadway (central)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-B04', coords: [51.5134, -0.3028], capacity: 3, street: 'The Broadway (east)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // New Broadway (parallel south of The Broadway)
        { id: 'EB-NB01', coords: [51.5132, -0.3060], capacity: 6, street: 'New Broadway', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-NB02', coords: [51.5130, -0.3055], capacity: 4, street: 'New Broadway', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // High Street (runs S from The Broadway, where Wagamama/Pret are)
        { id: 'EB-HS01', coords: [51.5126, -0.3046], capacity: 4, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-HS02', coords: [51.5120, -0.3048], capacity: 5, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // The Mall (connects The Broadway to Mattock Lane, south of SC)
        { id: 'EB-ML01', coords: [51.5124, -0.3035], capacity: 4, street: 'The Mall', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Spring Bridge Road (N-S, west of High Street, has MSCP)
        { id: 'EB-SB01', coords: [51.5138, -0.3048], capacity: 5, street: 'Spring Bridge Road', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-SB02', coords: [51.5134, -0.3046], capacity: 4, street: 'Spring Bridge Road', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Haven Green (road around the green, near station 51.5150,-0.3004)
        { id: 'EB-HG01', coords: [51.5153, -0.3018], capacity: 6, street: 'Haven Green', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-HG02', coords: [51.5156, -0.3025], capacity: 4, street: 'Haven Green', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Mattock Lane (S of The Mall)
        { id: 'EB-MT01', coords: [51.5118, -0.3038], capacity: 4, street: 'Mattock Lane', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-MT02', coords: [51.5114, -0.3036], capacity: 3, street: 'Mattock Lane', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // St Mary's Road (access to SC car park, south)
        { id: 'EB-SM01', coords: [51.5115, -0.3042], capacity: 5, street: "St Mary's Road", ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Bond Street (off Mattock Lane)
        { id: 'EB-BS01', coords: [51.5120, -0.3030], capacity: 3, street: 'Bond Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
    ],

    // ACTON HIGH STREET (W3) — runs roughly N-S
    // High Street from King Street (north ~51.508) to Uxbridge Road junction (south ~51.505)
    // The Oaks Shopping Centre is mid-way at ~51.5069
    actonTown: [
        // High Street - north section
        { id: 'AT-HS01', coords: [51.5082, -0.2672], capacity: 4, street: 'High Street (north)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-HS02', coords: [51.5078, -0.2674], capacity: 3, street: 'High Street (north)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // High Street - central (near The Oaks)
        { id: 'AT-HS03', coords: [51.5072, -0.2680], capacity: 5, street: 'High Street (central)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-HS04', coords: [51.5066, -0.2684], capacity: 4, street: 'High Street (central)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // High Street - south section
        { id: 'AT-HS05', coords: [51.5060, -0.2680], capacity: 3, street: 'High Street (south)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-HS06', coords: [51.5056, -0.2678], capacity: 4, street: 'High Street (south)', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Side streets
        { id: 'AT-KS01', coords: [51.5086, -0.2668], capacity: 4, street: 'King Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-OS01', coords: [51.5068, -0.2692], capacity: 5, street: 'Oaks Centre access', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
    ]
};

// Total bay counts for quick reference
export const BAY_TOTALS = {
    ealingBroadway: PARKING_BAYS.ealingBroadway.reduce((s, b) => s + b.capacity, 0),
    actonTown: PARKING_BAYS.actonTown.reduce((s, b) => s + b.capacity, 0)
};
