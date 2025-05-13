import { UVec2D } from "../physics/utils";
import VectorAbstract from "../physics/vectorAbstract";

export const PI = Math.PI;
export const P2 = PI * 2;
export const halfPI = PI / 2;

export const Geometry = {
    getPositionOnCircle(radians: number, radius: number, basic: VectorAbstract = UVec2D["new"](0, 0)): VectorAbstract {
        return UVec2D.add(basic, UVec2D["new"](
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

    angleBetweenPoints(a: VectorAbstract, b: VectorAbstract): number {
        const dy = a.y - b.y;
        const dx = a.x - b.x;
        return Math.atan2(dy, dx);
    },

    directionBetweenPoints(a: VectorAbstract, b: VectorAbstract): VectorAbstract {
        const radians = this.angleBetweenPoints(a, b);
        return UVec2D["new"](
            Math.cos(radians),
            Math.sin(radians)
        );
    },

    signedAreaTri(a: VectorAbstract, b: VectorAbstract, c: VectorAbstract): number {
        return (a.x - c.x) * (b.y - c.y) - (a.y - c.y) * (b.x - c.x);
    },

    directionToRadians(vector: VectorAbstract): number {
        return Math.atan2(vector.y, vector.x);
    },

    radiansToDirection(n: number): VectorAbstract {
        return {
            x: Math.cos(n),
            y: Math.sin(n)
        };
    }
};

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
