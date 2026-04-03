// Thermodynamic / Statistical Mechanics model for parking decisions
//
// Applies Boltzmann distribution (softmax) from econophysics to model
// how drivers choose between parking options. This replaces deterministic
// utility maximization with probabilistic selection based on "energy"
// (disutility) and "temperature" (bounded rationality).
//
// References:
// - Bouchaud & Mézard (2000): "Wealth condensation in a simple model of economy"
// - Chakraborti et al. (2011): "Econophysics review" (Reviews of Modern Physics)
// - Anderson, De Palma & Thisse (1992): "Discrete Choice Theory of Product
//   Differentiation" — logit choice models are mathematically equivalent to
//   Boltzmann distributions
// - Train (2009): "Discrete Choice Methods with Simulation" — the multinomial
//   logit model used in transport economics IS a Boltzmann distribution

// The Boltzmann constant analog: scales energy units to probability space
// In physics: kB = 1.381e-23 J/K. In our model: normalizes cost to [0,1] range.
const ENERGY_SCALE = 0.1; // Converts £-based costs to energy units

export class ThermodynamicModel {
    constructor(config = {}) {
        // System temperature: controls rationality of agents
        // T=0: perfectly rational (always cheapest), T→∞: random choice
        // Default T=1.0 represents "realistic bounded rationality"
        this.temperature = config.temperature ?? 1.0;

        // Inverse temperature β = 1/T (used in Boltzmann formula)
        this.beta = this.temperature > 0 ? 1 / this.temperature : 100;

        // Track system-level thermodynamic quantities
        this.totalEntropy = 0;
        this.totalFreeEnergy = 0;
        this.decisionCount = 0;
        this.hourlyEntropy = [];
        this.phaseState = 'normal'; // 'normal', 'congested', 'crisis'

        // Energy function weights (how much each factor contributes to disutility)
        this.weights = {
            walkingDistance: config.wWalk ?? 0.005,    // per meter
            parkingCost: config.wCost ?? 0.08,         // per £
            pcnRisk: config.wPCN ?? 0.3,               // per unit risk (0-1)
            searchTime: config.wSearch ?? 0.02,         // per minute
            availability: config.wAvail ?? -0.03,       // per available space (negative = good)
            congestion: config.wCongestion ?? 0.05,     // per % congestion
        };
    }

    // Calculate "energy" (disutility) of a parking option
    // Lower energy = more attractive (like physics: systems seek lowest energy)
    calculateEnergy(option, driver, policy) {
        let E = 0;

        // Walking distance energy (further = higher energy)
        E += this.weights.walkingDistance * option.distance;

        // Cost energy
        E += this.weights.parkingCost * option.cost;

        // PCN risk energy (only for DYL options without grace period)
        if (option.type === 'dyl' && !option.withinGrace) {
            const expectedPCN = option.pcnRisk * policy.pcnBandA * policy.enforcementIntensity;
            E += this.weights.pcnRisk * expectedPCN * ENERGY_SCALE;
        } else if (option.type === 'dyl' && option.withinGrace) {
            // Grace period: negative energy (attractive!)
            E -= 0.5;
        }

        // Availability bonus (more spaces = lower energy)
        E += this.weights.availability * Math.min(option.available, 10);

        // Car park reliability (guaranteed space = lower energy)
        if (option.type === 'carpark') E -= 0.3;

        // Driver profile modulates energy
        // Price-sensitive drivers weight cost more
        E += option.cost * driver.priceSensitivity * this.weights.parkingCost;

        return E;
    }

    // Boltzmann probability distribution over parking options
    // P(i) = exp(-β * E_i) / Z, where Z = Σ exp(-β * E_j) is the partition function
    boltzmannProbabilities(energies) {
        if (energies.length === 0) return [];

        // Shift energies by minimum to avoid numerical overflow
        const minE = Math.min(...energies);
        const shifted = energies.map(e => e - minE);

        // Calculate Boltzmann factors: exp(-β * E)
        const factors = shifted.map(e => Math.exp(-this.beta * e));

        // Partition function Z (normalization)
        const Z = factors.reduce((sum, f) => sum + f, 0);
        if (Z === 0) return energies.map(() => 1 / energies.length);

        // Probabilities
        const probs = factors.map(f => f / Z);

        return probs;
    }

    // Select a parking option using Boltzmann sampling
    selectOption(options, driver, policy, rng) {
        if (options.length === 0) return null;

        // Calculate energy for each option
        const energies = options.map(opt => this.calculateEnergy(opt, driver, policy));

        // Get Boltzmann probabilities
        const probs = this.boltzmannProbabilities(energies);

        // Calculate system quantities
        const entropy = this._shannonEntropy(probs);
        const freeEnergy = this._helmholtzFreeEnergy(energies, probs);

        this.totalEntropy += entropy;
        this.totalFreeEnergy += freeEnergy;
        this.decisionCount++;

        // Add "give up" option with energy based on frustration
        const giveUpEnergy = 2.0 + (driver.priceSensitivity * 0.5);
        const allEnergies = [...energies, giveUpEnergy];
        const allProbs = this.boltzmannProbabilities(allEnergies);

        // Sample from distribution
        const r = rng.next();
        let cumulative = 0;
        for (let i = 0; i < allProbs.length; i++) {
            cumulative += allProbs[i];
            if (r <= cumulative) {
                if (i === options.length) {
                    // Chose "give up"
                    return null;
                }
                return options[i];
            }
        }

        // Fallback: return highest probability option
        const maxIdx = probs.indexOf(Math.max(...probs));
        return options[maxIdx];
    }

    // Shannon entropy: H = -Σ p_i × ln(p_i)
    // Measures disorder/unpredictability of driver choices
    // H=0: all drivers choose same option. H=ln(N): completely random.
    _shannonEntropy(probs) {
        let H = 0;
        for (const p of probs) {
            if (p > 0) H -= p * Math.log(p);
        }
        return H;
    }

    // Helmholtz free energy: F = U - TS = <E> - T × H
    // U = average energy (disutility), T = temperature, S = entropy
    // Lower F = system in more favorable state
    _helmholtzFreeEnergy(energies, probs) {
        // Average energy <E> = Σ p_i × E_i
        let U = 0;
        for (let i = 0; i < energies.length; i++) {
            U += probs[i] * energies[i];
        }
        const S = this._shannonEntropy(probs);
        return U - this.temperature * S;
    }

    // Detect phase transitions (sudden behavioral shifts)
    // Analogous to thermodynamic phase transitions
    detectPhaseState(parkingStats, deterredPercent) {
        const occupancy = parkingStats.bayOccupancy;

        // Phase boundaries (like ice→water→steam)
        if (occupancy < 0.6 && deterredPercent < 5) {
            this.phaseState = 'normal';       // Free-flowing: plenty of parking
        } else if (occupancy < 0.85 || deterredPercent < 15) {
            this.phaseState = 'congested';    // Transition: competition for spaces
        } else {
            this.phaseState = 'crisis';       // Saturated: system breakdown
        }

        return this.phaseState;
    }

    // Snapshot hourly thermodynamic quantities
    snapshotHour(hour, parkingStats, deterredPercent) {
        const avgEntropy = this.decisionCount > 0 ? this.totalEntropy / this.decisionCount : 0;
        const avgFreeEnergy = this.decisionCount > 0 ? this.totalFreeEnergy / this.decisionCount : 0;
        const phase = this.detectPhaseState(parkingStats, deterredPercent);

        this.hourlyEntropy.push({
            hour,
            avgEntropy,
            avgFreeEnergy,
            temperature: this.temperature,
            phaseState: phase,
            decisionCount: this.decisionCount,
        });
    }

    // Get comprehensive results
    getResults() {
        const avgEntropy = this.decisionCount > 0 ? this.totalEntropy / this.decisionCount : 0;
        const avgFreeEnergy = this.decisionCount > 0 ? this.totalFreeEnergy / this.decisionCount : 0;

        // Normalize entropy to 0-100 scale for display
        // Max entropy for ~5 options is ln(5) ≈ 1.61
        const normalizedEntropy = Math.min(100, (avgEntropy / 1.61) * 100);

        return {
            temperature: this.temperature,
            beta: this.beta,
            avgEntropy,
            normalizedEntropy,
            avgFreeEnergy,
            phaseState: this.phaseState,
            totalDecisions: this.decisionCount,
            hourlyData: this.hourlyEntropy,

            // Interpretation
            interpretation: this._interpret(normalizedEntropy),
        };
    }

    _interpret(normalizedEntropy) {
        if (normalizedEntropy < 20) {
            return 'Low entropy: Drivers are highly predictable — most choose the same option. One parking type dominates.';
        } else if (normalizedEntropy < 50) {
            return 'Moderate entropy: Drivers spread across 2-3 main options. Reasonable diversity in parking choices.';
        } else if (normalizedEntropy < 75) {
            return 'High entropy: Drivers are spread across many options. Policy creates genuine choice diversity.';
        } else {
            return 'Very high entropy: Near-random selection. Drivers may be confused by options or all options are equally poor.';
        }
    }

    reset() {
        this.totalEntropy = 0;
        this.totalFreeEnergy = 0;
        this.decisionCount = 0;
        this.hourlyEntropy = [];
        this.phaseState = 'normal';
    }
}
