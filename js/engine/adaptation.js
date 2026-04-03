// Long-term behavioral adaptation model
// Models how driver behavior changes over time as they learn about policy
//
// Based on: Reinforcement learning / experience-weighted attraction (EWA)
// theory from behavioral economics. Drivers update their beliefs about
// parking options based on past experience.

export class AdaptationModel {
    constructor() {
        this.dayIndex = 0;
        this.experiencePool = {
            // Aggregated driver experiences that influence future behavior
            dylSuccessRate: 0.5,      // Fraction of DYL users who avoided PCN
            avgSearchTime: 5,          // Average minutes spent searching
            avgParkingCost: 0,         // Average parking cost experienced
            deterrenceRate: 0.1,       // Fraction of drivers deterred
            pcnRate: 0,                // Fraction of drivers who got PCN
        };
        this.history = [];
        this.adaptationRate = 0.15;    // How quickly drivers adapt (0-1)
    }

    // Update the experience pool based on a day's simulation results
    updateFromDayResults(result) {
        this.dayIndex++;

        const newExperience = {
            dylSuccessRate: result.parkingDistribution.dyl > 0 ?
                1 - (result.pcnCount / Math.max(1, result.parkingDistribution.dyl)) : 0.5,
            avgSearchTime: 5, // Would need tick-level data for precision
            avgParkingCost: result.parkedDrivers > 0 ?
                (result.meterRevenue + result.carParkRevenue) / result.parkedDrivers : 0,
            deterrenceRate: result.deterredPercent / 100,
            pcnRate: result.totalDrivers > 0 ? result.pcnCount / result.totalDrivers : 0,
        };

        // Exponential moving average (EWA)
        const a = this.adaptationRate;
        for (const key of Object.keys(this.experiencePool)) {
            this.experiencePool[key] = (1 - a) * this.experiencePool[key] + a * newExperience[key];
        }

        this.history.push({
            day: this.dayIndex,
            ...newExperience,
            adapted: { ...this.experiencePool },
        });
    }

    // Get behavioral adjustments to apply to drivers on subsequent days
    getAdjustments() {
        if (this.dayIndex === 0) {
            return { pcnRiskAdjust: 1.0, searchPatienceAdjust: 1.0, carParkPreference: 1.0, dylAvoidance: 0 };
        }

        const exp = this.experiencePool;

        // If DYL success rate is high (few PCNs), more drivers try DYL
        // If DYL success rate is low, drivers avoid DYL
        const dylAvoidance = Math.max(0, 1 - exp.dylSuccessRate) * 0.5;

        // If deterrence rate is high, drivers become more patient in searching
        // (or more likely to use car parks directly)
        const searchPatienceAdjust = 1 + exp.deterrenceRate * 0.3;

        // If PCN rate is high, drivers become more risk-averse
        const pcnRiskAdjust = 1 + exp.pcnRate * 5;

        // If parking costs were high, drivers shift toward car parks (known cost) vs meters (variable)
        const carParkPreference = 1 + Math.max(0, exp.avgParkingCost - 3) * 0.1;

        return {
            pcnRiskAdjust,          // Multiply into driver's PCN risk aversion
            searchPatienceAdjust,   // Multiply into max search time
            carParkPreference,      // Boost to car park utility scores
            dylAvoidance,           // Penalty to DYL option scores (0 = no avoidance)
            dayIndex: this.dayIndex,
        };
    }

    getResults() {
        return {
            totalDaysAdapted: this.dayIndex,
            currentExperience: { ...this.experiencePool },
            currentAdjustments: this.getAdjustments(),
            history: this.history,
            adaptationRate: this.adaptationRate,
        };
    }

    reset() {
        this.dayIndex = 0;
        this.experiencePool = {
            dylSuccessRate: 0.5,
            avgSearchTime: 5,
            avgParkingCost: 0,
            deterrenceRate: 0.1,
            pcnRate: 0,
        };
        this.history = [];
    }
}
