// Parking infrastructure state management
// Tracks occupancy of all parking locations in real-time during simulation

import { PARKING_BAYS } from '../data/parking-bays.js';
import { CAR_PARKS, calculateCarParkCost } from '../data/car-parks.js';
import { DOUBLE_YELLOWS } from '../data/double-yellows.js';
import { haversineDistance, walkingDistance, findWithinRadius } from '../util/geo.js';

export class ParkingSystem {
    constructor(area) {
        this.area = area;
        this.bays = {};      // bayId -> { occupied: count, vehicles: [] }
        this.carParks = {};   // carParkId -> { occupied: count, vehicles: [] }
        this.dyls = {};       // dylId -> { vehicles: [{id, parkedAt, duration}] }

        this._initBays();
        this._initCarParks();
        this._initDYLs();
    }

    _initBays() {
        for (const bay of PARKING_BAYS[this.area] || []) {
            this.bays[bay.id] = { occupied: 0, capacity: bay.capacity, vehicles: [], data: bay };
        }
    }

    _initCarParks() {
        for (const cp of CAR_PARKS[this.area] || []) {
            this.carParks[cp.id] = { occupied: 0, capacity: cp.capacityWeekday, vehicles: [], data: cp };
        }
    }

    _initDYLs() {
        for (const dyl of DOUBLE_YELLOWS[this.area] || []) {
            this.dyls[dyl.id] = { vehicles: [], capacity: dyl.capacity, data: dyl };
        }
    }

    // Set capacity based on day type
    setDayType(isWeekend) {
        for (const cp of CAR_PARKS[this.area] || []) {
            if (this.carParks[cp.id]) {
                this.carParks[cp.id].capacity = isWeekend ? cp.capacityWeekend : cp.capacityWeekday;
            }
        }
    }

    // Find available parking options near a destination, ranked by utility
    findParkingOptions(destination, maxDistanceM, policy, durationMinutes, driverProfile) {
        const options = [];

        // On-street bays
        for (const [id, bay] of Object.entries(this.bays)) {
            if (bay.occupied >= bay.capacity) continue;
            const dist = walkingDistance(bay.data.coords, destination);
            if (dist > maxDistanceM) continue;

            const hourlyRate = bay.data.ratePerHour * policy.onStreetRateMultiplier;
            let cost;
            if (durationMinutes <= policy.onStreetFreePeriodMinutes) {
                cost = 0;
            } else {
                const chargeableMin = durationMinutes - policy.onStreetFreePeriodMinutes;
                cost = (chargeableMin / 60) * hourlyRate;
            }

            // Can't exceed max stay
            if (durationMinutes > bay.data.maxStayHours * 60) continue;

            options.push({
                type: 'onstreet',
                id,
                coords: bay.data.coords,
                distance: dist,
                cost,
                pcnRisk: 0,
                available: bay.capacity - bay.occupied,
                street: bay.data.street
            });
        }

        // Car parks
        for (const [id, cp] of Object.entries(this.carParks)) {
            if (cp.occupied >= cp.capacity) continue;
            const dist = walkingDistance(cp.data.coords, destination);
            if (dist > maxDistanceM * 1.5) continue; // People will walk further for car parks

            const baseCost = calculateCarParkCost(cp.data, durationMinutes / 60);
            const cost = baseCost * policy.carParkRateMultiplier;

            options.push({
                type: 'carpark',
                id,
                coords: cp.data.coords,
                distance: dist,
                cost,
                pcnRisk: 0,
                available: cp.capacity - cp.occupied,
                name: cp.data.name
            });
        }

        // Double yellow lines (risky but free within grace period)
        for (const [id, dyl] of Object.entries(this.dyls)) {
            if (dyl.vehicles.length >= dyl.capacity) continue;
            const midpoint = dyl.data.coords[Math.floor(dyl.data.coords.length / 2)];
            const dist = walkingDistance(midpoint, destination);
            if (dist > maxDistanceM) continue;

            const withinGrace = durationMinutes <= policy.dylGracePeriodMinutes;

            options.push({
                type: 'dyl',
                id,
                coords: midpoint,
                distance: dist,
                cost: 0,
                pcnRisk: withinGrace ? 0 : 1,
                withinGrace,
                available: dyl.capacity - dyl.vehicles.length,
                street: dyl.data.street
            });
        }

        return options;
    }

    // Park a vehicle
    parkVehicle(type, locationId, vehicleId, simTime) {
        if (type === 'onstreet' && this.bays[locationId]) {
            const bay = this.bays[locationId];
            if (bay.occupied < bay.capacity) {
                bay.occupied++;
                bay.vehicles.push({ id: vehicleId, parkedAt: simTime });
                return true;
            }
        } else if (type === 'carpark' && this.carParks[locationId]) {
            const cp = this.carParks[locationId];
            if (cp.occupied < cp.capacity) {
                cp.occupied++;
                cp.vehicles.push({ id: vehicleId, parkedAt: simTime });
                return true;
            }
        } else if (type === 'dyl' && this.dyls[locationId]) {
            const dyl = this.dyls[locationId];
            if (dyl.vehicles.length < dyl.capacity) {
                dyl.vehicles.push({ id: vehicleId, parkedAt: simTime });
                return true;
            }
        }
        return false;
    }

    // Remove a vehicle
    removeVehicle(type, locationId, vehicleId) {
        if (type === 'onstreet' && this.bays[locationId]) {
            const bay = this.bays[locationId];
            const idx = bay.vehicles.findIndex(v => v.id === vehicleId);
            if (idx >= 0) {
                bay.vehicles.splice(idx, 1);
                bay.occupied = Math.max(0, bay.occupied - 1);
                return true;
            }
        } else if (type === 'carpark' && this.carParks[locationId]) {
            const cp = this.carParks[locationId];
            const idx = cp.vehicles.findIndex(v => v.id === vehicleId);
            if (idx >= 0) {
                cp.vehicles.splice(idx, 1);
                cp.occupied = Math.max(0, cp.occupied - 1);
                return true;
            }
        } else if (type === 'dyl' && this.dyls[locationId]) {
            const dyl = this.dyls[locationId];
            const idx = dyl.vehicles.findIndex(v => v.id === vehicleId);
            if (idx >= 0) {
                dyl.vehicles.splice(idx, 1);
                return true;
            }
        }
        return false;
    }

    // Get all vehicles on DYLs (for enforcement)
    getDYLVehicles() {
        const vehicles = [];
        for (const [id, dyl] of Object.entries(this.dyls)) {
            for (const v of dyl.vehicles) {
                vehicles.push({ ...v, dylId: id, coords: dyl.data.coords[0] });
            }
        }
        return vehicles;
    }

    // Get occupancy stats
    getStats() {
        let bayTotal = 0, bayOccupied = 0;
        for (const bay of Object.values(this.bays)) {
            bayTotal += bay.capacity;
            bayOccupied += bay.occupied;
        }

        let cpTotal = 0, cpOccupied = 0;
        for (const cp of Object.values(this.carParks)) {
            cpTotal += cp.capacity;
            cpOccupied += cp.occupied;
        }

        let dylVehicles = 0;
        for (const dyl of Object.values(this.dyls)) {
            dylVehicles += dyl.vehicles.length;
        }

        return {
            bayOccupancy: bayTotal > 0 ? bayOccupied / bayTotal : 0,
            bayOccupied,
            bayTotal,
            carParkOccupancy: cpTotal > 0 ? cpOccupied / cpTotal : 0,
            carParkOccupied: cpOccupied,
            carParkTotal: cpTotal,
            dylVehicles
        };
    }

    reset() {
        this._initBays();
        this._initCarParks();
        this._initDYLs();
    }
}
