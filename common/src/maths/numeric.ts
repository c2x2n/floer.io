export const Numeric = {
    /**
     * Interpolate between two values
     * @param start The start value
     * @param end The end value
     * @param interpFactor The interpolation factor ranging from 0 to 1
     *
     */
    lerp(start: number, end: number, interpFactor: number): number {
        return start * (1 - interpFactor) + end * interpFactor;
    },

    /**
     * Remap a number from a range to another
     * @param v The value
     * @param a The initial range minimum value
     * @param b The initial range maximum value
     * @param m The targeted range minimum value
     * @param n The targeted range maximum value
     */
    remap(v: number, a: number, b: number, m: number, n: number) {
        const t = this.clamp((v - a) / (b - a), 0.0, 1.0);
        return this.lerp(m, n, t);
    },
    /**
     * Conform a number to specified bounds
     * @param a The number to conform
     * @param min The minimum value the number can hold
     * @param max The maximum value the number can hold
     */
    clamp(a: number, min: number, max: number): number {
        return Math.min(Math.max(a, min), max);
    },

    targetEasing(from: number, to: number, n = 4): number {
        return from + (to - from) / n;
    }
} as const;
