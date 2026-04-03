// Double yellow line segments in Ealing Broadway and Acton Town
// Each segment is a polyline with coordinates and estimated capacity (cars that could physically fit)
// DYLs are enforced 24/7 - no parking at any time

export const DOUBLE_YELLOWS = {
    // EALING BROADWAY — DYLs on real streets with corrected coordinates
    ealingBroadway: [
        {
            id: 'DYL-EB01',
            street: 'The Broadway (south side, near station)',
            coords: [[51.5142, -0.3052], [51.5140, -0.3045], [51.5138, -0.3038]],
            capacity: 6,
            nearestBusinesses: ['EB-BIZ-25', 'EB-BIZ-26', 'EB-BIZ-02']
        },
        {
            id: 'DYL-EB02',
            street: 'New Broadway',
            coords: [[51.5132, -0.3065], [51.5130, -0.3058], [51.5128, -0.3052]],
            capacity: 8,
            nearestBusinesses: ['EB-BIZ-27', 'EB-BIZ-28']
        },
        {
            id: 'DYL-EB03',
            street: 'The Broadway (north side, by Arcadia)',
            coords: [[51.5143, -0.3046], [51.5141, -0.3042], [51.5139, -0.3038]],
            capacity: 5,
            nearestBusinesses: ['EB-BIZ-10', 'EB-BIZ-06']
        },
        {
            id: 'DYL-EB04',
            street: 'Haven Green (east side)',
            coords: [[51.5155, -0.3015], [51.5152, -0.3010], [51.5150, -0.3006]],
            capacity: 4,
            nearestBusinesses: ['EB-BIZ-06', 'EB-BIZ-08']
        },
        {
            id: 'DYL-EB05',
            street: 'High Street (near Wagamama/Pret)',
            coords: [[51.5130, -0.3046], [51.5126, -0.3047], [51.5122, -0.3048]],
            capacity: 4,
            nearestBusinesses: ['EB-BIZ-01', 'EB-BIZ-07']
        },
        {
            id: 'DYL-EB06',
            street: 'Spring Bridge Road (junction with Broadway)',
            coords: [[51.5140, -0.3050], [51.5138, -0.3048], [51.5136, -0.3046]],
            capacity: 5,
            nearestBusinesses: ['EB-BIZ-25']
        },
        {
            id: 'DYL-EB07',
            street: 'The Mall (south of SC)',
            coords: [[51.5126, -0.3038], [51.5124, -0.3035], [51.5122, -0.3032]],
            capacity: 3,
            nearestBusinesses: ['EB-BIZ-15', 'EB-BIZ-12']
        },
        {
            id: 'DYL-EB08',
            street: 'Bond Street',
            coords: [[51.5122, -0.3032], [51.5120, -0.3028], [51.5118, -0.3025]],
            capacity: 4,
            nearestBusinesses: ['EB-BIZ-15']
        },
        {
            id: 'DYL-EB09',
            street: 'Mattock Lane',
            coords: [[51.5120, -0.3040], [51.5117, -0.3038], [51.5114, -0.3036]],
            capacity: 5,
            nearestBusinesses: ['EB-BIZ-17']
        },
        {
            id: 'DYL-EB10',
            street: "St Mary's Road (SC car park access)",
            coords: [[51.5118, -0.3044], [51.5115, -0.3046], [51.5112, -0.3048]],
            capacity: 6,
            nearestBusinesses: ['EB-BIZ-17']
        }
    ],

    // ACTON HIGH STREET (W3) — runs N-S
    actonTown: [
        {
            id: 'DYL-AT01',
            street: 'High Street (north, near King St junction)',
            coords: [[51.5084, -0.2670], [51.5081, -0.2672], [51.5078, -0.2674]],
            capacity: 5,
            nearestBusinesses: ['AT-BIZ-12', 'AT-BIZ-05']
        },
        {
            id: 'DYL-AT02',
            street: 'High Street (east side, near Oaks)',
            coords: [[51.5074, -0.2678], [51.5071, -0.2682], [51.5068, -0.2685]],
            capacity: 6,
            nearestBusinesses: ['AT-BIZ-09', 'AT-BIZ-06']
        },
        {
            id: 'DYL-AT03',
            street: 'High Street (south section)',
            coords: [[51.5064, -0.2682], [51.5061, -0.2680], [51.5058, -0.2678]],
            capacity: 4,
            nearestBusinesses: ['AT-BIZ-03', 'AT-BIZ-16']
        },
        {
            id: 'DYL-AT04',
            street: 'High Street / Uxbridge Road junction',
            coords: [[51.5054, -0.2676], [51.5052, -0.2678]],
            capacity: 3,
            nearestBusinesses: ['AT-BIZ-11']
        },
        {
            id: 'DYL-AT05',
            street: 'King Street (near High Street junction)',
            coords: [[51.5088, -0.2666], [51.5086, -0.2670], [51.5084, -0.2672]],
            capacity: 4,
            nearestBusinesses: ['AT-BIZ-12', 'AT-BIZ-08']
        }
    ]
};

// Total DYL capacity
export const DYL_TOTALS = {
    ealingBroadway: DOUBLE_YELLOWS.ealingBroadway.reduce((s, d) => s + d.capacity, 0),
    actonTown: DOUBLE_YELLOWS.actonTown.reduce((s, d) => s + d.capacity, 0)
};
