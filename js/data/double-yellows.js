// Double yellow line segments in Ealing Broadway and Acton Town
// Each segment is a polyline with coordinates and estimated capacity (cars that could physically fit)
// DYLs are enforced 24/7 - no parking at any time

export const DOUBLE_YELLOWS = {
    ealingBroadway: [
        {
            id: 'DYL-EB01',
            street: 'The Broadway (south side)',
            coords: [[51.5135, -0.3020], [51.5137, -0.3010], [51.5139, -0.3000]],
            capacity: 6,
            nearestBusinesses: ['EB-BIZ-01', 'EB-BIZ-02', 'EB-BIZ-03']
        },
        {
            id: 'DYL-EB02',
            street: 'New Broadway (both sides)',
            coords: [[51.5130, -0.3025], [51.5128, -0.3020], [51.5126, -0.3015]],
            capacity: 8,
            nearestBusinesses: ['EB-BIZ-04', 'EB-BIZ-05']
        },
        {
            id: 'DYL-EB03',
            street: 'The Grove',
            coords: [[51.5133, -0.3035], [51.5130, -0.3040], [51.5127, -0.3045]],
            capacity: 5,
            nearestBusinesses: ['EB-BIZ-06']
        },
        {
            id: 'DYL-EB04',
            street: 'Haven Green (east side)',
            coords: [[51.5150, -0.3025], [51.5148, -0.3020], [51.5146, -0.3015]],
            capacity: 4,
            nearestBusinesses: ['EB-BIZ-07', 'EB-BIZ-08']
        },
        {
            id: 'DYL-EB05',
            street: 'High Street (junction)',
            coords: [[51.5143, -0.2988], [51.5145, -0.2982], [51.5147, -0.2976]],
            capacity: 4,
            nearestBusinesses: ['EB-BIZ-09', 'EB-BIZ-10']
        },
        {
            id: 'DYL-EB06',
            street: 'Uxbridge Road (near station)',
            coords: [[51.5153, -0.3000], [51.5155, -0.2995], [51.5157, -0.2990]],
            capacity: 5,
            nearestBusinesses: ['EB-BIZ-11']
        },
        {
            id: 'DYL-EB07',
            street: 'Spring Bridge Road (junction)',
            coords: [[51.5125, -0.3020], [51.5123, -0.3015], [51.5121, -0.3010]],
            capacity: 3,
            nearestBusinesses: ['EB-BIZ-12', 'EB-BIZ-13']
        },
        {
            id: 'DYL-EB08',
            street: 'Bond Street',
            coords: [[51.5128, -0.3012], [51.5126, -0.3008], [51.5124, -0.3004]],
            capacity: 4,
            nearestBusinesses: ['EB-BIZ-14']
        },
        {
            id: 'DYL-EB09',
            street: 'Mattock Lane (north end)',
            coords: [[51.5122, -0.3005], [51.5120, -0.3000], [51.5118, -0.2995]],
            capacity: 5,
            nearestBusinesses: ['EB-BIZ-15', 'EB-BIZ-16']
        },
        {
            id: 'DYL-EB10',
            street: "St Mary's Road",
            coords: [[51.5115, -0.3030], [51.5112, -0.3035], [51.5109, -0.3040]],
            capacity: 6,
            nearestBusinesses: ['EB-BIZ-17']
        },
        {
            id: 'DYL-EB11',
            street: 'The Mall (junction)',
            coords: [[51.5134, -0.3032], [51.5132, -0.3028]],
            capacity: 3,
            nearestBusinesses: ['EB-BIZ-18', 'EB-BIZ-19']
        },
        {
            id: 'DYL-EB12',
            street: 'Longfield Avenue',
            coords: [[51.5116, -0.3048], [51.5114, -0.3052], [51.5112, -0.3056]],
            capacity: 4,
            nearestBusinesses: ['EB-BIZ-20']
        }
    ],

    actonTown: [
        {
            id: 'DYL-AT01',
            street: 'High Street (south side)',
            coords: [[51.5026, -0.2725], [51.5028, -0.2718], [51.5030, -0.2710]],
            capacity: 5,
            nearestBusinesses: ['AT-BIZ-01', 'AT-BIZ-02']
        },
        {
            id: 'DYL-AT02',
            street: 'High Street (north side)',
            coords: [[51.5030, -0.2722], [51.5032, -0.2715], [51.5034, -0.2708]],
            capacity: 5,
            nearestBusinesses: ['AT-BIZ-03', 'AT-BIZ-04']
        },
        {
            id: 'DYL-AT03',
            street: 'Acton Lane',
            coords: [[51.5022, -0.2728], [51.5019, -0.2732], [51.5016, -0.2736]],
            capacity: 4,
            nearestBusinesses: ['AT-BIZ-05']
        },
        {
            id: 'DYL-AT04',
            street: 'Churchfield Road (junction)',
            coords: [[51.5034, -0.2698], [51.5036, -0.2693], [51.5038, -0.2688]],
            capacity: 4,
            nearestBusinesses: ['AT-BIZ-06', 'AT-BIZ-07']
        },
        {
            id: 'DYL-AT05',
            street: 'Gunnersbury Lane',
            coords: [[51.5024, -0.2742], [51.5022, -0.2748], [51.5020, -0.2754]],
            capacity: 3,
            nearestBusinesses: ['AT-BIZ-08']
        },
        {
            id: 'DYL-AT06',
            street: 'Market Place',
            coords: [[51.5027, -0.2712], [51.5025, -0.2708]],
            capacity: 3,
            nearestBusinesses: ['AT-BIZ-09', 'AT-BIZ-10']
        }
    ]
};

// Total DYL capacity
export const DYL_TOTALS = {
    ealingBroadway: DOUBLE_YELLOWS.ealingBroadway.reduce((s, d) => s + d.capacity, 0),
    actonTown: DOUBLE_YELLOWS.actonTown.reduce((s, d) => s + d.capacity, 0)
};
