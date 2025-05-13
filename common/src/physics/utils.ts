import { Numeric } from "../maths/math";
import VectorAbstract from "./vectorAbstract";

/**
 * Vector util functions for 2D ( that's what "2" means lol )
 */
export const UVec2D = {
    /**
    * Creates a new Vector
    * @param x - The horizontal (x-axis) coordinate
    * @param y - The vertical (y-axis) coordinate
    * @returns A new Vector object with the provided x and y coordinates
    */
    new(x: number, y: number): VectorAbstract {
        return { x, y };
    },

    /**
    * Adds two Vectors together
    * @param a - The first Vector
    * @param b - The second Vector
    * @returns A new Vector resulting from the addition of vectors a and b
    */
    add(a: VectorAbstract, b: VectorAbstract): VectorAbstract {
        return UVec2D.new(a.x + b.x, a.y + b.y);
    },

    /**
    * Adds two vectors together
    * @param a - The first Vector
    * @param x - The x-coordinate of the second vector
    * @param y - The y-coordinate of the second vector
    * @returns A new Vector resulting from the addition of a, and x and y
    */
    add2(a: VectorAbstract, x: number, y: number): VectorAbstract {
        return UVec2D.new(a.x + x, a.y + y);
    },

    /**
    * Subtracts one Vector from another
    * @param a - The Vector to be subtracted from
    * @param b - The Vector to subtract
    * @returns A new Vector resulting from the subtraction of vector b from vector a
    */
    sub(a: VectorAbstract, b: VectorAbstract): VectorAbstract {
        return UVec2D.new(a.x - b.x, a.y - b.y);
    },

    /**
    * Subtracts one Vector from another
    * @param a - The Vector to be subtracted from
    * @param x - The x-coordinate of the second vector
    * @param y - The y-coordinate of the second vector
    * @returns A new Vector resulting from the subtraction of and x and y from vector a
    */
    sub2(a: VectorAbstract, x: number, y: number): VectorAbstract {
        return UVec2D.new(a.x - x, a.y - y);
    },

    /**
    * Multiplies a Vector by a scalar
    * @param a - The Vector to be multiplied
    * @param n - The scalar value to multiply the Vector by
    * @returns A new Vector resulting from the multiplication of vector a and scalar n
    */
    mul(a: VectorAbstract, n: number): VectorAbstract {
        return UVec2D.new(a.x * n, a.y * n);
    },

    /**
    * Divides a Vector by a scalar
    * @param a - The Vector to be divided
    * @param n - The scalar value to divide the Vector by
    * @returns A new Vector resulting from the division of vector a and scalar n
    */
    div(a: VectorAbstract, n: number): VectorAbstract {
        return UVec2D.new(a.x / n, a.y / n);
    },

    /**
    * Clones a Vector
    * @param vector - The Vector to be cloned
    * @returns A new Vector with the same coordinates as the input Vector
    */
    clone(vector: VectorAbstract): VectorAbstract {
        return UVec2D.new(vector.x, vector.y);
    },

    /**
    * Inverts a Vector
    * @param a - The Vector to be inverted
    * @returns A new Vector resulting from inverting vector a
    */
    invert(a: VectorAbstract): VectorAbstract {
        return UVec2D.new(-a.x, -a.y);
    },

    /**
    * Rotates a Vector by a given angle
    * @param vector - The Vector to be rotated
    * @param angle - The angle in radians to rotate the Vector by
    * @returns A new Vector resulting from the rotation of the input Vector by the given angle
    */
    rotate(vector: VectorAbstract, angle: number): VectorAbstract {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return UVec2D.new(vector.x * cos - vector.y * sin, vector.x * sin + vector.y * cos);
    },

    /**
     * Calculates the squared length of a Vector
     * @param a - The Vector
     * @returns The squared length of Vector a
     */
    lengthSqr(a: VectorAbstract): number {
        return a.x * a.x + a.y * a.y;
    },

    /**
     * Calculates the length of a Vector
     * @param a - The Vector
     * @returns The length of Vector a
     */
    length(a: VectorAbstract): number {
        return Math.sqrt(UVec2D.lengthSqr(a));
    },

    /**
    * Gets the distance between two vectors
    * @param a - The first Vector
    * @param b - The second Vector
    * @returns The distance between Vector a and b
    */
    distanceBetween(a: VectorAbstract, b: VectorAbstract): number {
        const diff = UVec2D.sub(a, b);
        return UVec2D.length(diff);
    },

    /**
     * Normalizes a Vector
     * @param a - The Vector to be normalized
     * @returns A new Vector resulting from normalizing the input Vector
     */
    normalize(a: VectorAbstract): VectorAbstract {
        const eps = 0.000001;
        const len = UVec2D.length(a);
        return {
            x: len > eps ? a.x / len : a.x,
            y: len > eps ? a.y / len : a.y
        };
    },

    normalizeSafe(a: VectorAbstract, b?: VectorAbstract): VectorAbstract {
        b = b ?? UVec2D.new(1.0, 0.0);
        const eps = 0.000001;
        const len = UVec2D.length(a);
        return {
            x: len > eps ? a.x / len : b.x,
            y: len > eps ? a.y / len : b.y
        };
    },

    /**
     * Interpolate between two Vectors
     * @param start The start Vector
     * @param end The end Vector
     * @param interpFactor The interpolation factor ranging from 0 to 1
     */
    lerp(start: VectorAbstract, end: VectorAbstract, interpFactor: number): VectorAbstract {
        return UVec2D.add(UVec2D.mul(start, 1 - interpFactor), UVec2D.mul(end, interpFactor));
    },

    /**
     * Performs a dot product between two vectors
     * @param a The first Vector
     * @param b The second vector
     * @returns The result of performing the dot product between the two Vectors
     */
    dot(a: VectorAbstract, b: VectorAbstract): number {
        return a.x * b.x + a.y * b.y;
    },
    /**
     * Tests whether two `Vectors` are equal, within a certain tolerance
     * @param a The first `Vector`
     * @param b The second `Vector`
     * @param epsilon The largest difference in any component that will be accepted as being "equal"
     * @returns Whether or not the two vectors are considered equal with the given epsilon
     */
    equals(a: VectorAbstract, b: VectorAbstract, epsilon = 0.001): boolean {
        return Math.abs(a.x - b.x) <= epsilon && Math.abs(a.y - b.y) <= epsilon;
    },
    /**
     * Takes a polar representation of a vector and converts it into a cartesian one
     * @param angle The vector's angle
     * @param magnitude The vector's length. Defaults to 1
     * @returns A new vector whose length is `magnitude` and whose direction is `angle`
     */
    fromPolar(angle: number, magnitude = 1): VectorAbstract {
        return {
            x: Math.cos(angle) * magnitude,
            y: Math.sin(angle) * magnitude
        };
    },

    targetEasing(a: VectorAbstract, b: VectorAbstract, n = 4): VectorAbstract {
        return UVec2D.add(a, UVec2D.div(UVec2D.sub(b, a), n));
    },

    clampWithXY(vector: VectorAbstract, minX: number, maxX: number, minY: number, maxY: number): VectorAbstract {
        const clampedVector = UVec2D.clone(vector);
        clampedVector.x = Numeric.clamp(clampedVector.x, minX, maxX);
        clampedVector.y = Numeric.clamp(clampedVector.y, minY, maxY);
        return clampedVector;
    },

    clampWithVector(vector: VectorAbstract, min: VectorAbstract, max: VectorAbstract): VectorAbstract {
        return UVec2D.clampWithXY(vector, min.x, max.x, min.y, max.y);
    }
};
