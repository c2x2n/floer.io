import { UVector2D } from "../physics/uvector";
import VectorAbstract from "../physics/vectorAbstract";
import { Numeric } from "./numeric";

export const Random = Object.freeze({
    /**
     * Generate a random floating-point value.
     * @param min The minimum value that can be generated.
     * @param max The maximum value that can be generated.
     */
    float(min: number, max: number): number {
        return (Math.random() * (max - min) + min);
    },

    randomDirection(): VectorAbstract {
        return Random.vector(-1, 1, -1, 1);
    },

    /**
     * Generate a random integer.
     * @param min The minimum value that can be generated.
     * @param max The maximum value that can be generated.
     */
    int(min: number, max: number): number {
        return Math.floor(Random.float(min, max + 1));
    },

    /**
     * @return A random boolean.
     */
    boolean(): boolean {
        return Math.random() < 0.5;
    },

    /**
     * Generate a vector of random direction and magnitude.
     * @param minX The minimum length in the x-direction.
     * @param maxX The maximum length in the x-direction.
     * @param minY The minimum length in the y-direction.
     * @param maxY The maximum length in the y-direction.
     */
    vector(minX: number, maxX: number, minY: number, maxY: number): VectorAbstract {
        return {
            x: Random.float(minX, maxX),
            y: Random.float(minY, maxY)
        };
    },

    /**
     * Generate a random point inside of a circle.
     * @link https://stackoverflow.com/a/51727716/5905216
     * @param position The center of the circle.
     * @param radius The radius of the circle.
     * @returns A random point inside the circle radius.
     */
    pointInsideCircle(position: VectorAbstract, radius: number): VectorAbstract {
        let x: number,
            y: number;

        do {
            x = 2 * Math.random() - 1.0; // range [-1, +1)
            y = 2 * Math.random() - 1.0;
        } while ((x * x + y * y) >= 1); // check unit circle

        // scale and translate the points
        return UVector2D.new(x * radius + position.x, y * radius + position.y);
    },

    /**
     * Pick a random element from a weighted series of elements.
     * @param items The elements to choose from.
     * @param weights A legend of the elements' relative weights.
     */
    weightedRandom<T>(items: T[], weights: number[]): T {
        let i: number;
        for (i = 1; i < weights.length; i++) weights[i] += weights[i - 1];

        const random = Math.random() * weights[weights.length - 1];
        for (i = 0; i < weights.length; i++) { if (weights[i] > random) break; }
        return items[i];
    },

    pickRandomInArray<T>(array: T[], weights?: number[]): T {
        if (weights) return Random.weightedRandom(array, weights);
        return array[Random.int(0, array.length - 1)];
    }
});

export class SeededRandom {
    rng = 0;

    constructor(seed: number) {
        this.rng = seed;
    }

    get(min = 0, max = 1): number {
        this.rng = this.rng * 16807 % 2147483647;
        const t = this.rng / 2147483647;
        return Numeric.lerp(min, max, t);
    }
}
