// Business data for Ealing Broadway and Acton Town
//
// METHODOLOGY: Revenue estimates derived from:
// 1. ONS Annual Business Survey (Table 1, SIC codes 47.xx retail, 56.xx food service)
// 2. Average revenue per employee by sector (ONS IDBR) scaled by typical store size
// 3. Cross-referenced with Companies House filings where available for named chains
// 4. Adjusted for location using Ealing Broadway footfall (285,000 weekly, experientialspace.co.uk)
//
// IMPORTANT: These are estimates, not actual accounts. For a government deployment,
// these should be replaced with actual data from the Ealing BID or individual businesses.
//
// Average spend per visit figures from BPA "Re-Think! Parking on the High Street" (2013)
// and ATCM Town Centre Performance benchmarks.
// Footfall sensitivity: how much business depends on passing trade (0-1)

export const BUSINESS_TYPES = {
    RESTAURANT: 'restaurant',
    CAFE: 'cafe',
    RETAIL: 'retail',
    SUPERMARKET: 'supermarket',
    PUB: 'pub',
    SERVICE: 'service',      // hairdresser, dry cleaner, etc.
    BANK: 'bank',
    ESTATE_AGENT: 'estate_agent',
    TAKEAWAY: 'takeaway',
    PHARMACY: 'pharmacy',
    CHARITY: 'charity_shop',
    GYM: 'gym'
};

const T = BUSINESS_TYPES;

// Average spend per visitor by business type (GBP)
export const AVG_SPEND_PER_VISIT = {
    [T.RESTAURANT]: 22,
    [T.CAFE]: 6.50,
    [T.RETAIL]: 18,
    [T.SUPERMARKET]: 25,
    [T.PUB]: 14,
    [T.SERVICE]: 28,
    [T.BANK]: 0,
    [T.ESTATE_AGENT]: 0,
    [T.TAKEAWAY]: 9,
    [T.PHARMACY]: 12,
    [T.CHARITY]: 5,
    [T.GYM]: 0   // membership-based
};

// How sensitive is the business to walk-in footfall? (0 = not at all, 1 = completely)
export const FOOTFALL_SENSITIVITY = {
    [T.RESTAURANT]: 0.6,
    [T.CAFE]: 0.85,
    [T.RETAIL]: 0.8,
    [T.SUPERMARKET]: 0.5,
    [T.PUB]: 0.55,
    [T.SERVICE]: 0.4,
    [T.BANK]: 0.15,
    [T.ESTATE_AGENT]: 0.1,
    [T.TAKEAWAY]: 0.75,
    [T.PHARMACY]: 0.5,
    [T.CHARITY]: 0.7,
    [T.GYM]: 0.1
};

// Peak hours by business type (when they get most of their trade)
export const PEAK_HOURS = {
    [T.RESTAURANT]: { start: 12, end: 14, eveningStart: 18, eveningEnd: 21 },
    [T.CAFE]: { start: 8, end: 11, eveningStart: null, eveningEnd: null },
    [T.RETAIL]: { start: 10, end: 16, eveningStart: null, eveningEnd: null },
    [T.SUPERMARKET]: { start: 10, end: 13, eveningStart: 17, eveningEnd: 19 },
    [T.PUB]: { start: 12, end: 14, eveningStart: 17, eveningEnd: 22 },
    [T.SERVICE]: { start: 10, end: 16, eveningStart: null, eveningEnd: null },
    [T.TAKEAWAY]: { start: 12, end: 14, eveningStart: 17, eveningEnd: 21 },
    [T.PHARMACY]: { start: 9, end: 17, eveningStart: null, eveningEnd: null },
};

export const BUSINESSES = {
    ealingBroadway: [
        // Restaurants & Cafes (verified tenants from ealingbroadwayshopping.co.uk, befriend.london)
        { id: 'EB-BIZ-01', name: 'Wagamama', type: T.RESTAURANT, coords: [51.5137, -0.3012], annualRevenue: 1200000, employees: 22 },        // Wagamama avg ~£1.2M/store
        { id: 'EB-BIZ-02', name: 'Turtle Bay', type: T.RESTAURANT, coords: [51.5139, -0.3008], annualRevenue: 900000, employees: 20 },         // Confirmed tenant
        { id: 'EB-BIZ-03', name: 'Comptoir Libanais', type: T.RESTAURANT, coords: [51.5140, -0.3002], annualRevenue: 650000, employees: 16 },  // Confirmed tenant
        { id: 'EB-BIZ-04', name: 'Costa Coffee', type: T.CAFE, coords: [51.5132, -0.3018], annualRevenue: 430000, employees: 10 },              // Costa avg ~£430K/store (Statista)
        { id: 'EB-BIZ-05', name: 'Blank Street Coffee', type: T.CAFE, coords: [51.5129, -0.3022], annualRevenue: 280000, employees: 8 },        // Confirmed new tenant
        { id: 'EB-BIZ-06', name: 'The Drayton Court', type: T.PUB, coords: [51.5130, -0.3042], annualRevenue: 580000, employees: 15 },          // Known local pub
        { id: 'EB-BIZ-07', name: 'Pret A Manger', type: T.CAFE, coords: [51.5148, -0.3018], annualRevenue: 400000, employees: 14 },
        { id: 'EB-BIZ-08', name: 'The Red Lion', type: T.PUB, coords: [51.5146, -0.3012], annualRevenue: 450000, employees: 12 },               // BBPA avg managed pub £450K-£750K

        // Retail (verified from Ealing Broadway SC tenant list)
        { id: 'EB-BIZ-09', name: 'JD Sports', type: T.RETAIL, coords: [51.5144, -0.2986], annualRevenue: 750000, employees: 15 },               // Confirmed tenant
        { id: 'EB-BIZ-10', name: 'TK Maxx', type: T.RETAIL, coords: [51.5146, -0.2978], annualRevenue: 800000, employees: 25 },
        { id: 'EB-BIZ-11', name: 'Next', type: T.RETAIL, coords: [51.5154, -0.2998], annualRevenue: 650000, employees: 14 },                    // Confirmed tenant
        { id: 'EB-BIZ-12', name: 'Boots', type: T.PHARMACY, coords: [51.5126, -0.3016], annualRevenue: 480000, employees: 18 },                 // Retail portion ~£480K (Boots AR)
        { id: 'EB-BIZ-13', name: 'River Island', type: T.RETAIL, coords: [51.5124, -0.3010], annualRevenue: 550000, employees: 12 },             // Confirmed tenant
        { id: 'EB-BIZ-14', name: 'H&M', type: T.RETAIL, coords: [51.5127, -0.3008], annualRevenue: 600000, employees: 16 },
        { id: 'EB-BIZ-15', name: 'Primark', type: T.RETAIL, coords: [51.5121, -0.3002], annualRevenue: 900000, employees: 35 },
        { id: 'EB-BIZ-16', name: 'Oliver Bonas', type: T.RETAIL, coords: [51.5119, -0.2998], annualRevenue: 250000, employees: 8 },             // Opened 2025, confirmed
        { id: 'EB-BIZ-31', name: 'Decathlon', type: T.RETAIL, coords: [51.5135, -0.3015], annualRevenue: 850000, employees: 18 },               // Confirmed tenant
        { id: 'EB-BIZ-32', name: 'Foot Locker', type: T.RETAIL, coords: [51.5133, -0.3012], annualRevenue: 500000, employees: 10 },             // Confirmed tenant
        { id: 'EB-BIZ-33', name: 'Pandora', type: T.RETAIL, coords: [51.5136, -0.3008], annualRevenue: 350000, employees: 6 },                  // Confirmed tenant
        { id: 'EB-BIZ-34', name: 'Hotel Chocolat', type: T.RETAIL, coords: [51.5138, -0.3005], annualRevenue: 280000, employees: 6 },           // Opened late 2024
        { id: 'EB-BIZ-35', name: 'MINISO', type: T.RETAIL, coords: [51.5140, -0.3000], annualRevenue: 200000, employees: 5 },                   // Reopened larger unit 2024
        { id: 'EB-BIZ-36', name: 'Robert Dyas', type: T.RETAIL, coords: [51.5142, -0.2996], annualRevenue: 320000, employees: 8 },              // Confirmed tenant

        // Supermarkets
        { id: 'EB-BIZ-17', name: 'M&S (incl Food Hall)', type: T.SUPERMARKET, coords: [51.5114, -0.3032], annualRevenue: 3500000, employees: 50 },   // Anchor tenant
        { id: 'EB-BIZ-18', name: 'Tesco', type: T.SUPERMARKET, coords: [51.5133, -0.3030], annualRevenue: 1200000, employees: 15 },

        // Services
        { id: 'EB-BIZ-20', name: 'Rush Hair', type: T.SERVICE, coords: [51.5115, -0.3050], annualRevenue: 180000, employees: 8 },
        { id: 'EB-BIZ-21', name: 'Barclays', type: T.BANK, coords: [51.5138, -0.3005], annualRevenue: 0, employees: 12 },
        { id: 'EB-BIZ-22', name: 'Foxtons', type: T.ESTATE_AGENT, coords: [51.5136, -0.3000], annualRevenue: 350000, employees: 10 },
        { id: 'EB-BIZ-24', name: 'Nuffield Health', type: T.GYM, coords: [51.5128, -0.3015], annualRevenue: 600000, employees: 20 },           // Confirmed tenant

        // Takeaways
        { id: 'EB-BIZ-25', name: 'Greggs', type: T.TAKEAWAY, coords: [51.5142, -0.2992], annualRevenue: 767000, employees: 10 },               // £2.01B / 2,618 shops = £767K (Greggs AR 2024)
        { id: 'EB-BIZ-26', name: 'Wasabi', type: T.TAKEAWAY, coords: [51.5144, -0.2990], annualRevenue: 450000, employees: 10 },               // Confirmed tenant
        { id: 'EB-BIZ-37', name: 'Gutterball', type: T.RESTAURANT, coords: [51.5130, -0.3035], annualRevenue: 500000, employees: 15 },         // Entertainment venue, opened 2025

        // Charity shops
        { id: 'EB-BIZ-27', name: 'British Heart Foundation', type: T.CHARITY, coords: [51.5120, -0.2996], annualRevenue: 85000, employees: 3 },
        { id: 'EB-BIZ-28', name: 'Oxfam', type: T.CHARITY, coords: [51.5118, -0.2992], annualRevenue: 72000, employees: 2 },
    ],

    actonTown: [
        // Verified from youractonbid.co.uk, allinlondon.co.uk, actonw3.com
        // Pubs
        { id: 'AT-BIZ-01', name: 'The Rocket', type: T.PUB, coords: [51.5029, -0.2718], annualRevenue: 380000, employees: 10 },               // Confirmed pub
        { id: 'AT-BIZ-02', name: 'The Station House', type: T.PUB, coords: [51.5027, -0.2722], annualRevenue: 320000, employees: 8 },          // Confirmed pub
        { id: 'AT-BIZ-03', name: 'Good Value Cafe', type: T.CAFE, coords: [51.5031, -0.2714], annualRevenue: 120000, employees: 5 },           // Confirmed
        { id: 'AT-BIZ-04', name: 'KFC Acton', type: T.TAKEAWAY, coords: [51.5033, -0.2706], annualRevenue: 650000, employees: 16 },            // Confirmed

        // Retail (verified)
        { id: 'AT-BIZ-05', name: 'Savers', type: T.PHARMACY, coords: [51.5020, -0.2728], annualRevenue: 180000, employees: 6 },               // Confirmed
        { id: 'AT-BIZ-06', name: 'Poundland', type: T.RETAIL, coords: [51.5035, -0.2696], annualRevenue: 350000, employees: 12 },              // Confirmed
        { id: 'AT-BIZ-07', name: 'Iceland', type: T.SUPERMARKET, coords: [51.5037, -0.2690], annualRevenue: 680000, employees: 15 },            // Confirmed
        { id: 'AT-BIZ-16', name: 'Shoe Zone', type: T.RETAIL, coords: [51.5030, -0.2712], annualRevenue: 250000, employees: 5 },               // Confirmed
        { id: 'AT-BIZ-17', name: 'Card Factory', type: T.RETAIL, coords: [51.5032, -0.2708], annualRevenue: 200000, employees: 4 },            // Confirmed
        { id: 'AT-BIZ-18', name: 'Peacocks', type: T.RETAIL, coords: [51.5034, -0.2700], annualRevenue: 300000, employees: 8 },                // Confirmed
        { id: 'AT-BIZ-19', name: 'Argos', type: T.RETAIL, coords: [51.5028, -0.2704], annualRevenue: 500000, employees: 10 },                  // Confirmed

        // Supermarkets
        { id: 'AT-BIZ-08', name: 'Morrisons', type: T.SUPERMARKET, coords: [51.5036, -0.2688], annualRevenue: 3500000, employees: 50 },        // Full-format, ~£3-5M (Morrisons AR)
        { id: 'AT-BIZ-09', name: 'Lidl', type: T.SUPERMARKET, coords: [51.5026, -0.2710], annualRevenue: 1800000, employees: 20 },              // Oaks Shopping Centre anchor

        // Services & Other
        { id: 'AT-BIZ-11', name: 'Acton Dry Cleaners', type: T.SERVICE, coords: [51.5028, -0.2700], annualRevenue: 95000, employees: 3 },
        { id: 'AT-BIZ-12', name: 'Greggs Acton', type: T.TAKEAWAY, coords: [51.5030, -0.2708], annualRevenue: 767000, employees: 10 },         // Greggs AR 2024
        { id: 'AT-BIZ-14', name: 'Boots Acton', type: T.PHARMACY, coords: [51.5025, -0.2716], annualRevenue: 480000, employees: 10 },          // Retail portion
        { id: 'AT-BIZ-20', name: 'WHSmith', type: T.RETAIL, coords: [51.5029, -0.2715], annualRevenue: 280000, employees: 6 },                 // Confirmed
    ]
};

// Get total annual revenue for an area
export function getAreaBaselineRevenue(area) {
    return BUSINESSES[area].reduce((sum, b) => sum + b.annualRevenue, 0);
}

// Get total employees for an area
export function getAreaEmployees(area) {
    return BUSINESSES[area].reduce((sum, b) => sum + b.employees, 0);
}
