// Statistical utility functions

export function mean(arr) {
    if (arr.length === 0) return 0;
    return arr.reduce((s, v) => s + v, 0) / arr.length;
}

export function median(arr) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

export function stddev(arr) {
    if (arr.length < 2) return 0;
    const m = mean(arr);
    return Math.sqrt(arr.reduce((s, v) => s + (v - m) ** 2, 0) / (arr.length - 1));
}

export function percentile(arr, p) {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const frac = idx - lower;
    if (lower + 1 >= sorted.length) return sorted[lower];
    return sorted[lower] + frac * (sorted[lower + 1] - sorted[lower]);
}

export function sum(arr) {
    return arr.reduce((s, v) => s + v, 0);
}

// Confidence interval for mean (normal approximation)
export function confidenceInterval(arr, level = 0.95) {
    const n = arr.length;
    if (n < 2) return { lower: mean(arr), upper: mean(arr), mean: mean(arr) };
    const m = mean(arr);
    const se = stddev(arr) / Math.sqrt(n);
    // z-scores for common confidence levels
    const z = level >= 0.99 ? 2.576 : level >= 0.95 ? 1.96 : 1.645;
    return { lower: m - z * se, upper: m + z * se, mean: m };
}

// Moving average
export function movingAverage(arr, window) {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        const start = Math.max(0, i - window + 1);
        const slice = arr.slice(start, i + 1);
        result.push(mean(slice));
    }
    return result;
}

// Linear regression: returns {slope, intercept, r2}
export function linearRegression(xs, ys) {
    const n = xs.length;
    if (n < 2) return { slope: 0, intercept: ys[0] || 0, r2: 0 };
    const mx = mean(xs);
    const my = mean(ys);
    let ssxx = 0, ssxy = 0, ssyy = 0;
    for (let i = 0; i < n; i++) {
        ssxx += (xs[i] - mx) ** 2;
        ssxy += (xs[i] - mx) * (ys[i] - my);
        ssyy += (ys[i] - my) ** 2;
    }
    const slope = ssxx > 0 ? ssxy / ssxx : 0;
    const intercept = my - slope * mx;
    const r2 = ssyy > 0 ? (ssxy ** 2) / (ssxx * ssyy) : 0;
    return { slope, intercept, r2 };
}
