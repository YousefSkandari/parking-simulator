// Leaflet map initialization and layer management
import { CONFIG } from '../config.js';
import { PARKING_BAYS } from '../data/parking-bays.js';
import { CAR_PARKS } from '../data/car-parks.js';
import { DOUBLE_YELLOWS } from '../data/double-yellows.js';
import { BUSINESSES, BUSINESS_TYPES } from '../data/businesses.js';

const BUSINESS_COLORS = {
    [BUSINESS_TYPES.RESTAURANT]: '#e74c3c',
    [BUSINESS_TYPES.CAFE]: '#e67e22',
    [BUSINESS_TYPES.RETAIL]: '#3498db',
    [BUSINESS_TYPES.SUPERMARKET]: '#2ecc71',
    [BUSINESS_TYPES.PUB]: '#9b59b6',
    [BUSINESS_TYPES.SERVICE]: '#95a5a6',
    [BUSINESS_TYPES.BANK]: '#34495e',
    [BUSINESS_TYPES.ESTATE_AGENT]: '#1abc9c',
    [BUSINESS_TYPES.TAKEAWAY]: '#f39c12',
    [BUSINESS_TYPES.PHARMACY]: '#e91e63',
    [BUSINESS_TYPES.CHARITY]: '#607d8b',
    [BUSINESS_TYPES.GYM]: '#ff5722'
};

export class MapView {
    constructor(containerId) {
        this.map = L.map(containerId, {
            zoomControl: true,
            scrollWheelZoom: true
        }).setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);

        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Layer groups
        this.bayLayer = L.layerGroup().addTo(this.map);
        this.carParkLayer = L.layerGroup().addTo(this.map);
        this.dylLayer = L.layerGroup().addTo(this.map);
        this.businessLayer = L.layerGroup().addTo(this.map);
        this.driverLayer = L.layerGroup().addTo(this.map);
        this.ceoLayer = L.layerGroup().addTo(this.map);
        this.pcnLayer = L.layerGroup().addTo(this.map);
        this.heatLayer = L.layerGroup();

        // Track markers for updates
        this.bayMarkers = {};
        this.carParkMarkers = {};
        this.dylPolylines = {};
        this.businessMarkers = {};
        this.driverMarkers = {};
        this.ceoMarkers = {};

        // Layer control
        this.layerControl = L.control.layers(null, {
            'Parking Bays': this.bayLayer,
            'Car Parks': this.carParkLayer,
            'Double Yellows': this.dylLayer,
            'Businesses': this.businessLayer,
            'Drivers': this.driverLayer,
            'Enforcement': this.ceoLayer,
            'PCN Events': this.pcnLayer
        }, { collapsed: false, position: 'topright' }).addTo(this.map);
    }

    // Initialize static map elements for an area
    initArea(area) {
        this.clearAll();

        // Set view based on area
        if (area === 'actonTown') {
            this.map.setView(CONFIG.ACTON_CENTER, CONFIG.MAP_ZOOM);
        } else {
            this.map.setView(CONFIG.MAP_CENTER, CONFIG.MAP_ZOOM);
        }

        this._drawParkingBays(area);
        this._drawCarParks(area);
        this._drawDoubleYellows(area);
        this._drawBusinesses(area);
    }

    _drawParkingBays(area) {
        const bays = PARKING_BAYS[area] || [];
        for (const bay of bays) {
            const marker = L.circleMarker(bay.coords, {
                radius: 6,
                fillColor: '#27ae60',
                color: '#1e8449',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(this.bayLayer);

            marker.bindPopup(`
                <b>Parking Bay: ${bay.street}</b><br>
                ID: ${bay.id}<br>
                Capacity: ${bay.capacity} spaces<br>
                Rate: £${bay.ratePerHour.toFixed(2)}/hr<br>
                Max Stay: ${bay.maxStayHours}hrs<br>
                Hours: ${bay.hours} (${bay.days})
            `);

            this.bayMarkers[bay.id] = marker;
        }
    }

    _drawCarParks(area) {
        const parks = CAR_PARKS[area] || [];
        for (const cp of parks) {
            const marker = L.marker(cp.coords, {
                icon: L.divIcon({
                    className: 'car-park-icon',
                    html: `<div class="cp-marker"><span class="cp-p">P</span></div>`,
                    iconSize: [28, 28],
                    iconAnchor: [14, 14]
                })
            }).addTo(this.carParkLayer);

            const rateHtml = cp.rates.map(r =>
                `<tr><td>${r.maxHours}hr</td><td>£${r.charge.toFixed(2)}</td></tr>`
            ).join('');

            marker.bindPopup(`
                <b>${cp.name}</b><br>
                Type: ${cp.type}<br>
                Capacity: ${cp.capacityWeekday} (weekday) / ${cp.capacityWeekend} (weekend)<br>
                Hours: ${cp.openHours}<br>
                <table class="rate-table"><tr><th>Duration</th><th>Cost</th></tr>${rateHtml}</table>
            `);

            this.carParkMarkers[cp.id] = marker;
        }
    }

    _drawDoubleYellows(area) {
        const dyls = DOUBLE_YELLOWS[area] || [];
        for (const dyl of dyls) {
            const polyline = L.polyline(dyl.coords, {
                color: '#f1c40f',
                weight: 5,
                opacity: 0.8,
                dashArray: '10, 5'
            }).addTo(this.dylLayer);

            polyline.bindPopup(`
                <b>Double Yellow Line</b><br>
                ${dyl.street}<br>
                <span style="color:#e74c3c">No parking at any time</span><br>
                Capacity (if illegally parked): ~${dyl.capacity} vehicles
            `);

            this.dylPolylines[dyl.id] = polyline;
        }
    }

    _drawBusinesses(area) {
        const businesses = BUSINESSES[area] || [];
        for (const biz of businesses) {
            const color = BUSINESS_COLORS[biz.type] || '#95a5a6';
            const marker = L.circleMarker(biz.coords, {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.9
            }).addTo(this.businessLayer);

            marker.bindPopup(`
                <b>${biz.name}</b><br>
                Type: ${biz.type.replace('_', ' ')}<br>
                Est. Annual Revenue: £${(biz.annualRevenue / 1000).toFixed(0)}K<br>
                Employees: ${biz.employees}
            `);

            this.businessMarkers[biz.id] = marker;
        }
    }

    // Update bay occupancy colors
    updateBayOccupancy(parkingSystem) {
        for (const [id, bayState] of Object.entries(parkingSystem.bays)) {
            const marker = this.bayMarkers[id];
            if (!marker) continue;

            const ratio = bayState.occupied / bayState.capacity;
            let color;
            if (ratio === 0) color = '#27ae60';      // Empty - green
            else if (ratio < 0.5) color = '#f39c12';  // Half full - amber
            else if (ratio < 1) color = '#e67e22';     // Nearly full - orange
            else color = '#e74c3c';                     // Full - red

            marker.setStyle({ fillColor: color });
        }
    }

    // Update DYL colors based on violations
    updateDYLStatus(parkingSystem) {
        for (const [id, dylState] of Object.entries(parkingSystem.dyls)) {
            const polyline = this.dylPolylines[id];
            if (!polyline) continue;

            if (dylState.vehicles.length > 0) {
                polyline.setStyle({ color: '#e74c3c', weight: 7, opacity: 1 });
            } else {
                polyline.setStyle({ color: '#f1c40f', weight: 5, opacity: 0.8 });
            }
        }
    }

    // Update car park markers
    updateCarParkOccupancy(parkingSystem) {
        for (const [id, cpState] of Object.entries(parkingSystem.carParks)) {
            const marker = this.carParkMarkers[id];
            if (!marker) continue;

            const ratio = cpState.occupied / cpState.capacity;
            const pct = Math.round(ratio * 100);
            let bgColor;
            if (ratio < 0.5) bgColor = '#27ae60';
            else if (ratio < 0.8) bgColor = '#f39c12';
            else if (ratio < 1) bgColor = '#e67e22';
            else bgColor = '#e74c3c';

            marker.setIcon(L.divIcon({
                className: 'car-park-icon',
                html: `<div class="cp-marker" style="background:${bgColor}"><span class="cp-p">P</span><span class="cp-pct">${pct}%</span></div>`,
                iconSize: [28, 28],
                iconAnchor: [14, 14]
            }));
        }
    }

    // Show PCN event on map
    showPCNEvent(coords) {
        if (!coords) return;
        const marker = L.circleMarker(coords, {
            radius: 12,
            fillColor: '#e74c3c',
            color: '#c0392b',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.9
        }).addTo(this.pcnLayer);

        // Animate and remove
        setTimeout(() => {
            marker.setStyle({ radius: 20, fillOpacity: 0.3 });
            setTimeout(() => this.pcnLayer.removeLayer(marker), 1000);
        }, 500);
    }

    // Update CEO positions
    updateCEOs(ceoData) {
        this.ceoLayer.clearLayers();
        for (const ceo of ceoData) {
            if (!ceo.coords) continue;
            const color = ceo.state === 'issuing_pcn' ? '#e74c3c' : '#2c3e50';
            L.circleMarker(ceo.coords, {
                radius: 7,
                fillColor: color,
                color: '#fff',
                weight: 2,
                fillOpacity: 0.9
            }).addTo(this.ceoLayer).bindPopup(`CEO ${ceo.id}<br>Status: ${ceo.state}`);
        }
    }

    // Update business colors based on revenue performance
    updateBusinessRevenue(businessResults) {
        if (!businessResults) return;
        for (const biz of businessResults) {
            const marker = this.businessMarkers[biz.id];
            if (!marker) continue;

            let color;
            if (biz.changePercent > 5) color = '#27ae60';       // Growing
            else if (biz.changePercent > -5) color = '#f39c12';  // Stable
            else color = '#e74c3c';                               // Declining

            marker.setStyle({ fillColor: color });
        }
    }

    clearAll() {
        this.bayLayer.clearLayers();
        this.carParkLayer.clearLayers();
        this.dylLayer.clearLayers();
        this.businessLayer.clearLayers();
        this.driverLayer.clearLayers();
        this.ceoLayer.clearLayers();
        this.pcnLayer.clearLayers();
        this.bayMarkers = {};
        this.carParkMarkers = {};
        this.dylPolylines = {};
        this.businessMarkers = {};
        this.driverMarkers = {};
        this.ceoMarkers = {};
    }

    invalidateSize() {
        setTimeout(() => this.map.invalidateSize(), 100);
    }
}
