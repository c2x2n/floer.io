import { type Vector, Vec2 } from "./vector";

export const PI = Math.PI;
export const P2 = PI * 2;
export const halfPI = PI / 2;

export const MathGraphics = {
    getPositionOnCircle(radians: number, radius: number, basic: Vector = Vec2.new(0, 0)): Vector {
        return Vec2.add(basic, Vec2.new(
            Math.cos(radians) * radius,
            Math.sin(radians) * radius
        ));
    },

    degreesToRadians(degrees: number): number {
        return degrees * (Math.PI / 180);
    },

    radiansToDegrees(radians: number): number {
        return (radians / Math.PI) * 180;
    },

    angleBetweenPoints(a: Vector, b: Vector): number {
        const dy = a.y - b.y;
        const dx = a.x - b.x;
        return Math.atan2(dy, dx);
    },

    directionBetweenPoints(a: Vector, b: Vector): Vector {
        const radians = this.angleBetweenPoints(a, b);
        return Vec2.new(
            Math.cos(radians),
            Math.sin(radians)
        )
    },

    signedAreaTri(a: Vector, b: Vector, c: Vector): number {
        return (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
    }
};

export const MathNumeric = {
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

    targetEasing(from: number, to: number, n: number = 4): number {
        return from + (to - from) / n
    }
};

export const EasingFunctions = {
    linear: (t: number) => t,
    sineIn: (t: number) => {
        return 1 - Math.cos(t * halfPI);
    },
    sineOut: (t: number) => {
        return Math.sin(t * halfPI);
    },
    sineInOut: (t: number) => {
        return (1 - Math.cos(Math.PI * t)) / 2;
    }
};
