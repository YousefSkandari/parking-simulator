// Seeded PRNG (xorshift128) for reproducible simulations
export class SeededRandom {
    constructor(seed = 42) {
        this.state = [seed, seed ^ 0xDEADBEEF, seed ^ 0xCAFEBABE, seed ^ 0x12345678];
    }

    next() {
        let t = this.state[3];
        const s = this.state[0];
        this.state[3] = this.state[2];
        this.state[2] = this.state[1];
        this.state[1] = s;
        t ^= t << 11;
        t ^= t >>> 8;
        this.state[0] = t ^ s ^ (s >>> 19);
        return (this.state[0] >>> 0) / 4294967296;
    }

    // Uniform random in [min, max)
    uniform(min = 0, max = 1) {
        return min + this.next() * (max - min);
    }

    // Integer in [min, max] inclusive
    int(min, max) {
        return Math.floor(this.uniform(min, max + 1));
    }

    // Normal distribution (Box-Muller)
    normal(mean = 0, stddev = 1) {
        const u1 = this.next();
        const u2 = this.next();
        const z = Math.sqrt(-2 * Math.log(u1 || 1e-10)) * Math.cos(2 * Math.PI * u2);
        return mean + z * stddev;
    }

    // Log-normal distribution
    logNormal(mean, stddev) {
        const mu = Math.log(mean * mean / Math.sqrt(stddev * stddev + mean * mean));
        const sigma = Math.sqrt(Math.log(1 + (stddev * stddev) / (mean * mean)));
        return Math.exp(this.normal(mu, sigma));
    }

    // Weighted random selection from array of {item, weight}
    weighted(items) {
        const total = items.reduce((sum, i) => sum + i.weight, 0);
        let r = this.next() * total;
        for (const item of items) {
            r -= item.weight;
            if (r <= 0) return item.item || item;
        }
        return items[items.length - 1].item || items[items.length - 1];
    }

    // Pick random element from array
    pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
    }

    // Shuffle array (Fisher-Yates)
    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(this.next() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }
}
