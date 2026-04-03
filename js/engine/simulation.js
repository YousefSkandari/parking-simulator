// Main simulation loop
// Orchestrates all agents: drivers, CEOs, businesses across a simulated day

import { CONFIG } from '../config.js';
import { SeededRandom } from '../util/random.js';
import { ParkingSystem } from './parking-system.js';
import { BusinessSystem } from './agent-business.js';
import { EconomicsEngine } from './economics.js';
import { TrafficModel } from './traffic.js';
import { DisplacementModel } from './displacement.js';
import { ThermodynamicModel } from './thermodynamic.js';
import { createDriver, updateDriver, resetDriverIds, DRIVER_STATES } from './agent-driver.js';
import { createCEO, updateCEO, generatePatrolRoutes, resetCeoIds } from './agent-ceo.js';
import { PROFILE_DISTRIBUTION, PROFILE_DETAILS } from '../data/demographics.js';
import { getDriverArrivals } from '../data/footfall.js';
import { ENFORCEMENT } from '../data/enforcement.js';
import { BUSINESSES } from '../data/businesses.js';

export class Simulation {
    constructor(options = {}) {
        this.area = options.area || 'ealingBroadway';
        this.dayType = options.dayType || 'weekday';
        this.policy = options.policy;
        this.seed = options.seed || CONFIG.RANDOM_SEED;
        this.ceoDailyCost = options.ceoDailyCost || 152;

        this.rng = new SeededRandom(this.seed);
        this.parkingSystem = new ParkingSystem(this.area);
        this.businessSystem = new BusinessSystem(this.area);
        this.economics = new EconomicsEngine();
        this.trafficModel = new TrafficModel(this.area);
        this.displacementModel = new DisplacementModel(this.area);
        this.thermoModel = new ThermodynamicModel({
            temperature: options.temperature ?? 1.0
        });

        this.simTime = 0;        // Minutes from start of day
        this.simHour = CONFIG.SIM_START_HOUR;
        this.currentMinute = 0;

        this.drivers = [];        // Active driver agents
        this.completedDrivers = []; // Finished drivers
        this.ceos = [];           // CEO agents
        this.events = [];         // Event log for visualization

        this.isComplete = false;
        this.tickCount = 0;
        this.lastHour = -1;

        // Metrics per tick (for animation)
        this.tickMetrics = [];

        this._initCEOs();
    }

    _initCEOs() {
        resetCeoIds();
        resetDriverIds();

        const staffing = ENFORCEMENT.ceo.staffing[this.area];
        if (!staffing) return;

        for (const [shiftName, shift] of Object.entries(staffing)) {
            const routes = generatePatrolRoutes(this.area, shift.count);
            for (let i = 0; i < shift.count; i++) {
                const route = routes[i] || routes[0];
                if (route) {
                    this.ceos.push(createCEO(
                        this.area, route, shift.start, shift.end
                    ));
                }
            }
        }
    }

    // Run a single tick (1 minute of simulation time)
    tick() {
        if (this.isComplete) return null;

        this.simTime++;
        this.tickCount++;
        this.currentMinute++;

        // Update hour
        const totalMinutes = CONFIG.SIM_START_HOUR * 60 + this.simTime;
        this.simHour = totalMinutes / 60;
        const currentHour = Math.floor(this.simHour);

        // Generate new driver arrivals
        if (this.currentMinute % 1 === 0) { // Every minute
            this._generateDrivers(currentHour);
        }

        // Update all active drivers
        for (let i = this.drivers.length - 1; i >= 0; i--) {
            const driver = this.drivers[i];
            updateDriver(driver, this.simTime, this.parkingSystem, this.policy, this.rng, this.area, this.thermoModel);

            // Record shopping visits for business revenue
            if (driver.state === DRIVER_STATES.SHOPPING && driver.parkingCoords) {
                // Record visit once (when they start shopping)
                if (this.simTime === driver.parkedAt + 1) {
                    this.businessSystem.recordVisit(
                        driver.destination,
                        driver.actualSpend,
                        driver.dwellTimeMinutes
                    );
                }
            }

            // Move completed/deterred drivers out of active pool
            if (driver.state === DRIVER_STATES.LEFT || driver.state === DRIVER_STATES.DETERRED) {
                this.economics.recordDriver(driver);
                // Track where deterred drivers go (displacement)
                if (driver.state === DRIVER_STATES.DETERRED) {
                    this.displacementModel.recordDeterredDriver(driver, this.rng);
                }
                this.completedDrivers.push(driver);
                this.drivers.splice(i, 1);
            }
        }

        // Update CEOs
        for (const ceo of this.ceos) {
            const ceoEvents = updateCEO(ceo, this.simTime, this.simHour, this.parkingSystem, this.policy, this.rng);

            // Process PCN events
            for (const event of ceoEvents) {
                this.events.push(event);
                if (event.type === 'pcn_issued') {
                    // Find the driver and mark them
                    const driver = this.drivers.find(d => d.id === event.vehicleId);
                    if (driver) {
                        driver.receivedPCN = true;
                        driver.pcnAmount = event.amount;
                    }
                }
            }
        }

        // Update traffic model every tick
        this.trafficModel.update(this.simHour, this.parkingSystem, this.drivers.length);

        // Hourly snapshots
        if (currentHour !== this.lastHour && currentHour > CONFIG.SIM_START_HOUR) {
            this.businessSystem.snapshotHour(this.lastHour >= 0 ? this.lastHour : currentHour);
            this.economics.snapshotHour(currentHour, this.parkingSystem.getStats());
            this.trafficModel.snapshotHour(currentHour);
            this.thermoModel.snapshotHour(currentHour, this.parkingSystem.getStats(),
                this.driverCount > 0 ? (this.deterredCount() / Math.max(1, this.completedDrivers.length)) * 100 : 0);
            this.lastHour = currentHour;
        }

        // Collect tick metrics
        const stats = this.parkingSystem.getStats();
        const tickData = {
            time: this.simTime,
            hour: this.simHour,
            activeDrivers: this.drivers.length,
            bayOccupancy: stats.bayOccupancy,
            carParkOccupancy: stats.carParkOccupancy,
            dylVehicles: stats.dylVehicles,
            totalPCNs: this.ceos.reduce((s, c) => s + c.pcnsIssued.length, 0),
            deterredDrivers: this.deterredCount(),
            completedDrivers: this.completedDrivers.length,
            ceos: this.ceos.filter(c => c.isActive).map(c => ({
                id: c.id, coords: c.coords, state: c.state
            }))
        };
        this.tickMetrics.push(tickData);

        // Check end condition
        if (this.simHour >= CONFIG.SIM_END_HOUR) {
            this._finalize();
        }

        return tickData;
    }

    // Run the entire simulation at once (no animation)
    runFull() {
        while (!this.isComplete) {
            this.tick();
        }
        return this.getResults();
    }

    // Run N ticks (for batched animation)
    runBatch(n) {
        const results = [];
        for (let i = 0; i < n && !this.isComplete; i++) {
            results.push(this.tick());
        }
        return results;
    }

    _generateDrivers(currentHour) {
        const arrivalsThisHour = getDriverArrivals(this.area, this.dayType, currentHour);
        const arrivalsThisMinute = arrivalsThisHour / 60;

        // Poisson-like arrival: probability of a driver arriving this minute
        const count = Math.floor(arrivalsThisMinute);
        const remainder = arrivalsThisMinute - count;

        let toGenerate = count;
        if (this.rng.next() < remainder) toGenerate++;

        for (let i = 0; i < toGenerate; i++) {
            // Pick driver profile
            const profile = this.rng.weighted(
                PROFILE_DISTRIBUTION.map(p => ({ item: p.profile, weight: p.weight }))
            );

            // Pick a destination (random business location)
            const businesses = BUSINESSES[this.area] || [];
            if (businesses.length === 0) continue;
            const destBiz = this.rng.pick(businesses);

            const driver = createDriver(this.rng, profile, destBiz.coords, this.simTime);
            this.drivers.push(driver);
        }
    }

    _finalize() {
        // Process remaining active drivers
        for (const driver of this.drivers) {
            if (driver.state === DRIVER_STATES.SHOPPING || driver.state === DRIVER_STATES.PARKING) {
                driver.state = DRIVER_STATES.LEFT;
                this.parkingSystem.removeVehicle(driver.parkingType, driver.parkingLocationId, driver.id);
            }
            this.economics.recordDriver(driver);
            this.completedDrivers.push(driver);
        }
        this.drivers = [];

        // Final hour snapshot
        this.businessSystem.snapshotHour(Math.floor(this.simHour));
        this.economics.snapshotHour(Math.floor(this.simHour), this.parkingSystem.getStats());

        this.isComplete = true;
    }

    deterredCount() {
        return this.completedDrivers.filter(d => d.state === DRIVER_STATES.DETERRED).length;
    }

    getResults() {
        const bizResults = this.businessSystem.getResults();
        const econResults = this.economics.calculateResults(this.policy, bizResults, this.ceoDailyCost);
        const forecast = EconomicsEngine.generateForecast(econResults);
        const trafficResults = this.trafficModel.getResults();
        const displacementResults = this.displacementModel.getResults();
        const thermoResults = this.thermoModel.getResults();

        return {
            ...econResults,
            businessDetails: bizResults.businesses,
            forecast,
            tickMetrics: this.tickMetrics,
            events: this.events,
            area: this.area,
            dayType: this.dayType,
            totalSimMinutes: this.simTime,
            ceoStats: this.ceos.map(c => ({
                id: c.id,
                pcnsIssued: c.pcnsIssued.length,
                totalPCNRevenue: c.pcnsIssued.reduce((s, p) => s + p.amount, 0)
            })),
            // New model results
            traffic: trafficResults,
            displacement: displacementResults,
            thermodynamics: thermoResults,
        };
    }

    reset() {
        this.rng = new SeededRandom(this.seed);
        this.parkingSystem.reset();
        this.businessSystem.reset();
        this.economics.reset();
        this.trafficModel.reset();
        this.displacementModel.reset();
        this.thermoModel.reset();
        this.drivers = [];
        this.completedDrivers = [];
        this.events = [];
        this.tickMetrics = [];
        this.simTime = 0;
        this.simHour = CONFIG.SIM_START_HOUR;
        this.currentMinute = 0;
        this.isComplete = false;
        this.tickCount = 0;
        this.lastHour = -1;
        this._initCEOs();
    }
}
