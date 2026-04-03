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
            name: 'Springbridge Road Car Park',
            coords: [51.5120, -0.3015],
            capacityWeekday: 120,
            capacityWeekend: 120,
            openHours: '07:00-22:00',
            rates: [
                { maxHours: 1, charge: 1.50 },
                { maxHours: 2, charge: 3.00 },
                { maxHours: 3, charge: 4.50 },
                { maxHours: 4, charge: 6.00 },
                { maxHours: 24, charge: 12.00 }
            ],
            access: 'Springbridge Road',
            type: 'surface'
        }
    ],

    actonTown: [
        {
            id: 'CP-MORR',
            name: 'Morrisons Acton Car Park',
            coords: [51.5035, -0.2690],
            capacityWeekday: 120,
            capacityWeekend: 120,
            openHours: '07:00-23:00',
            rates: [
                { maxHours: 2, charge: 0.00 },  // Free with purchase for 2 hours
                { maxHours: 3, charge: 3.00 },
                { maxHours: 24, charge: 10.00 }
            ],
            access: 'High Street',
            type: 'surface',
            freeWithPurchase: true,
            freeMaxHours: 2
        },
        {
            id: 'CP-SAIN',
            name: "Sainsbury's Acton Car Park",
            coords: [51.5042, -0.2680],
            capacityWeekday: 80,
            capacityWeekend: 80,
            openHours: '07:00-23:00',
            rates: [
                { maxHours: 1, charge: 0.00 },  // Free with purchase for 1 hour
                { maxHours: 2, charge: 2.00 },
                { maxHours: 24, charge: 8.00 }
            ],
            access: 'Churchfield Road',
            type: 'surface',
            freeWithPurchase: true,
            freeMaxHours: 1
        },
        {
            id: 'CP-ACTS',
            name: 'Acton Town Station Car Park',
            coords: [51.5028, -0.2802],
            capacityWeekday: 40,
            capacityWeekend: 40,
            openHours: '05:00-01:00',
            rates: [
                { maxHours: 24, charge: 8.50 }
            ],
            access: 'Gunnersbury Lane',
            type: 'surface'
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
