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
    ealingBroadway: [
        // The Broadway (main high street)
        { id: 'EB-B01', coords: [51.5138, -0.3015], capacity: 4, street: 'The Broadway', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-B02', coords: [51.5140, -0.3005], capacity: 3, street: 'The Broadway', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-B03', coords: [51.5142, -0.2995], capacity: 5, street: 'The Broadway', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-B04', coords: [51.5136, -0.3025], capacity: 3, street: 'The Broadway', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // New Broadway
        { id: 'EB-NB01', coords: [51.5130, -0.3020], capacity: 6, street: 'New Broadway', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-NB02', coords: [51.5128, -0.3025], capacity: 4, street: 'New Broadway', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // High Street
        { id: 'EB-HS01', coords: [51.5145, -0.2980], capacity: 4, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-HS02', coords: [51.5148, -0.2970], capacity: 5, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-HS03', coords: [51.5150, -0.2960], capacity: 3, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // The Mall / Bond Street
        { id: 'EB-ML01', coords: [51.5132, -0.3030], capacity: 4, street: 'The Mall', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-BS01', coords: [51.5125, -0.3010], capacity: 3, street: 'Bond Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Spring Bridge Road
        { id: 'EB-SB01', coords: [51.5122, -0.3018], capacity: 5, street: 'Spring Bridge Road', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-SB02', coords: [51.5118, -0.3022], capacity: 4, street: 'Spring Bridge Road', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Uxbridge Road
        { id: 'EB-UX01', coords: [51.5152, -0.2990], capacity: 4, street: 'Uxbridge Road', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-UX02', coords: [51.5155, -0.2975], capacity: 3, street: 'Uxbridge Road', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Haven Green
        { id: 'EB-HG01', coords: [51.5148, -0.3030], capacity: 6, street: 'Haven Green', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Mattock Lane
        { id: 'EB-MT01', coords: [51.5120, -0.3000], capacity: 4, street: 'Mattock Lane', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-MT02', coords: [51.5115, -0.2995], capacity: 3, street: 'Mattock Lane', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // St Mary's Road
        { id: 'EB-SM01', coords: [51.5112, -0.3035], capacity: 5, street: "St Mary's Road", ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'EB-SM02', coords: [51.5108, -0.3040], capacity: 4, street: "St Mary's Road", ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
    ],

    actonTown: [
        // High Street Acton
        { id: 'AT-HS01', coords: [51.5028, -0.2720], capacity: 4, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-HS02', coords: [51.5030, -0.2710], capacity: 3, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-HS03', coords: [51.5032, -0.2700], capacity: 5, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-HS04', coords: [51.5025, -0.2730], capacity: 4, street: 'High Street', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Acton Lane
        { id: 'AT-AL01', coords: [51.5020, -0.2725], capacity: 3, street: 'Acton Lane', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-AL02', coords: [51.5015, -0.2730], capacity: 4, street: 'Acton Lane', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Churchfield Road
        { id: 'AT-CF01', coords: [51.5035, -0.2695], capacity: 3, street: 'Churchfield Road', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
        { id: 'AT-CF02', coords: [51.5038, -0.2688], capacity: 4, street: 'Churchfield Road', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Gunnersbury Lane
        { id: 'AT-GL01', coords: [51.5022, -0.2745], capacity: 4, street: 'Gunnersbury Lane', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },

        // Market Place
        { id: 'AT-MP01', coords: [51.5026, -0.2715], capacity: 5, street: 'Market Place', ratePerHour: 2.40, maxStayHours: 2, hours: '08:30-18:30', days: 'Mon-Sat' },
    ]
};

// Total bay counts for quick reference
export const BAY_TOTALS = {
    ealingBroadway: PARKING_BAYS.ealingBroadway.reduce((s, b) => s + b.capacity, 0),
    actonTown: PARKING_BAYS.actonTown.reduce((s, b) => s + b.capacity, 0)
};
