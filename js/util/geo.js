// Geographic utility functions

const DEG_TO_RAD = Math.PI / 180;
const EARTH_RADIUS_M = 6371000;

// Haversine distance between two [lat, lng] points in meters
export function haversineDistance(a, b) {
    const dLat = (b[0] - a[0]) * DEG_TO_RAD;
    const dLng = (b[1] - a[1]) * DEG_TO_RAD;
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const h = sinLat * sinLat +
        Math.cos(a[0] * DEG_TO_RAD) * Math.cos(b[0] * DEG_TO_RAD) * sinLng * sinLng;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(h));
}

// Walking distance estimate (Haversine * street network correction)
export function walkingDistance(a, b, factor = 1.3) {
    return haversineDistance(a, b) * factor;
}

// Find nearest item from a list with .coords property
export function findNearest(point, items, maxDistance = Infinity) {
    let best = null;
    let bestDist = maxDistance;
    for (const item of items) {
        const d = haversineDistance(point, item.coords);
        if (d < bestDist) {
            bestDist = d;
            best = item;
        }
    }
    return best ? { item: best, distance: bestDist } : null;
}

// Find all items within radius
export function findWithinRadius(point, items, radiusM) {
    return items
        .map(item => ({ item, distance: haversineDistance(point, item.coords) }))
        .filter(r => r.distance <= radiusM)
        .sort((a, b) => a.distance - b.distance);
}

// Midpoint of a polyline
export function polylineMidpoint(coords) {
    if (coords.length === 0) return [0, 0];
    if (coords.length === 1) return coords[0];
    const mid = Math.floor(coords.length / 2);
    return coords[mid];
}

// Interpolate position along a polyline at fraction t (0-1)
export function interpolatePolyline(coords, t) {
    if (coords.length < 2) return coords[0] || [0, 0];
    const totalDist = polylineLength(coords);
    let targetDist = t * totalDist;
    for (let i = 0; i < coords.length - 1; i++) {
        const segDist = haversineDistance(coords[i], coords[i + 1]);
        if (targetDist <= segDist) {
            const frac = segDist > 0 ? targetDist / segDist : 0;
            return [
                coords[i][0] + frac * (coords[i + 1][0] - coords[i][0]),
                coords[i][1] + frac * (coords[i + 1][1] - coords[i][1])
            ];
        }
        targetDist -= segDist;
    }
    return coords[coords.length - 1];
}

// Total length of polyline in meters
export function polylineLength(coords) {
    let total = 0;
    for (let i = 0; i < coords.length - 1; i++) {
        total += haversineDistance(coords[i], coords[i + 1]);
    }
    return total;
}
