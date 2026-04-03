// Off-street car parks - based on real Ealing locations and charges
// Ealing Broadway Shopping Centre charges from ealingbroadwayshopping.co.uk
// Ealing Council car park data from ealing.gov.uk

export const CAR_PARKS = {
    ealingBroadway: [
        {
            id: 'CP-EBSC',
            name: 'Ealing Broadway Shopping Centre',
            coords: [51.5125, -0.3025],
            capacityWeekday: 600,
            capacityWeekend: 800,
            openHours: '06:00-00:00',
            rates: [
                { maxHours: 2, charge: 2.50 },
                { maxHours: 3, charge: 3.50 },
                { maxHours: 4, charge: 4.50 },
                { maxHours: 5, charge: 5.50 },
                { maxHours: 6, charge: 7.50 },
                { maxHours: 24, charge: 15.00 }
            ],
            access: 'Grove Road via St Mary\'s Road',
            type: 'multi-storey'
        },
        {
            id: 'CP-DICK',
            name: 'Dickens Yard Car Park',
            coords: [51.5118, -0.3045],
            capacityWeekday: 200,
            capacityWeekend: 200,
            openHours: '07:00-23:00',
            rates: [
                { maxHours: 1, charge: 2.00 },
                { maxHours: 2, charge: 4.00 },
                { maxHours: 3, charge: 6.00 },
                { maxHours: 4, charge: 8.00 },
                { maxHours: 24, charge: 15.00 }
            ],
            access: 'Longfield Avenue',
            type: 'surface'
        },
        {
            id: 'CP-FILI',
            name: 'Filmworks Car Park',
            coords: [51.5130, -0.3050],
            capacityWeekday: 150,
            capacityWeekend: 150,
            openHours: '07:00-01:00',
            rates: [
                { maxHours: 2, charge: 3.00 },
                { maxHours: 3, charge: 4.50 },
                { maxHours: 4, charge: 6.00 },
                { maxHours: 24, charge: 18.00 }
            ],
            access: 'New Broadway',
            type: 'underground'
        },
        {
            id: 'CP-SBRG',
            name: 'Springbridge Road MSCP',
            coords: [51.5120, -0.3015],
            capacityWeekday: 465,   // 465 regular + 8 disabled + 9 motorcycle (Ealing Council data)
            capacityWeekend: 465,
            openHours: '07:00-18:00',  // Mon-Sun per ealing.gov.uk
            rates: [
                // Emissions-based: shown as weighted average (Band 3 mid-range)
                // Actual: Band 1 £1.10/hr, Band 2 £1.50/hr, Band 3 £1.80/hr, Band 4 £2.20/hr
                { maxHours: 1, charge: 1.80 },
                { maxHours: 2, charge: 3.60 },
                { maxHours: 3, charge: 5.40 },
                { maxHours: 4, charge: 7.20 },
                { maxHours: 24, charge: 12.00 }
            ],
            access: 'Springbridge Road, W5 2AB',
            type: 'multi-storey'
        }
    ],

    // Car parks serving Uxbridge Road, Acton corridor
    actonTown: [
        {
            id: 'CP-MORR',
            name: 'Morrisons Acton Car Park',
            coords: [51.5097, -0.2812],   // Near Horn Lane / western end of Uxbridge Road
            capacityWeekday: 120,
            capacityWeekend: 120,
            openHours: '07:00-23:00',
            rates: [
                { maxHours: 2, charge: 0.00 },  // Free with purchase for 2 hours
                { maxHours: 3, charge: 3.00 },
                { maxHours: 24, charge: 10.00 }
            ],
            access: 'Horn Lane / Princes Gardens',
            type: 'surface',
            freeWithPurchase: true,
            freeMaxHours: 2
        },
        {
            id: 'CP-SALI',
            name: 'Salisbury Street Car Park',
            coords: [51.5082, -0.2748],   // Just south of Uxbridge Road
            capacityWeekday: 62,   // 62 regular + 4 disabled + 4 motorcycle (Ealing Council data)
            capacityWeekend: 62,
            openHours: '07:00-18:00',
            rates: [
                // Emissions-based (PayByPhone ref: 37208)
                { maxHours: 1, charge: 1.25 },
                { maxHours: 2, charge: 2.50 },
                { maxHours: 4, charge: 5.00 },
                { maxHours: 24, charge: 8.00 }
            ],
            access: 'Salisbury Street, W3 8NW',
            type: 'surface'
        },
        {
            id: 'CP-LIDL',
            name: 'Lidl / Oaks Centre Car Park',
            coords: [51.5094, -0.2792],   // Near western end
            capacityWeekday: 60,
            capacityWeekend: 60,
            openHours: '07:00-22:00',
            rates: [
                { maxHours: 1.5, charge: 0.00 },  // Free for 90 minutes
                { maxHours: 3, charge: 3.00 },
                { maxHours: 24, charge: 10.00 }
            ],
            access: 'Off Uxbridge Road',
            type: 'surface',
            freeWithPurchase: true,
            freeMaxHours: 1.5
        }
    ]
};

// Helper: calculate car park cost for a given duration in hours
export function calculateCarParkCost(carPark, durationHours) {
    for (const rate of carPark.rates) {
        if (durationHours <= rate.maxHours) {
            return rate.charge;
        }
    }
    // Over max rate
    const lastRate = carPark.rates[carPark.rates.length - 1];
    return lastRate.charge;
}
