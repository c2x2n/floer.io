import { UVector2D } from "./uvector";
import VectorAbstract from "./vectorAbstract";
import { Geometry } from "../maths/geometry";
import { Numeric } from "../maths/numeric";

export type CollisionT = { dir: VectorAbstract, pen: number };
export type CollisionResponse = CollisionT | null;
export type LineIntersection = { point: VectorAbstract, normal: VectorAbstract } | null;

export const Collision = {
    /**
    * Check whether two circles collide
    * @param pos1 The center of the first circle
    * @param r1 The radius of the first circle
    * @param pos2 The center of the second circle
    * @param r2 The radius of the second circle
    */
    checkCircleCircle(pos1: VectorAbstract, r1: number, pos2: VectorAbstract, r2: number): boolean {
        const a = r1 + r2;
        const x = pos1.x - pos2.x;
        const y = pos1.y - pos2.y;

        return a * a > x * x + y * y;
    },

    /**
    * Check whether a rectangle and a circle collide
    * @param min The min Vector of the rectangle
    * @param max The max vector of the rectangle
    * @param pos The center of the circle
    * @param rad The radius of the circle
    */
    checkRectCircle(min: VectorAbstract, max: VectorAbstract, pos: VectorAbstract, rad: number): boolean {
        const cpt = {
            x: Numeric.clamp(pos.x, min.x, max.x),
            y: Numeric.clamp(pos.y, min.y, max.y)
        };

        const distX = pos.x - cpt.x;
        const distY = pos.y - cpt.y;
        const distSquared = distX * distX + distY * distY;

        return (distSquared < rad * rad) || (pos.x >= min.x && pos.x <= max.x && pos.y >= min.y && pos.y <= max.y);
    },

    /**
    * Check whether two rectangles collide
    * @param min1 - The min Vector of the first rectangle
    * @param max1 - The max vector of the first rectangle
    * @param min2 - The min Vector of the second rectangle
    * @param max2 - The max vector of the second rectangle
    */
    checkRectRect(min1: VectorAbstract, max1: VectorAbstract, min2: VectorAbstract, max2: VectorAbstract): boolean {
        return min2.x < max1.x && min2.y < max1.y && min1.x < max2.x && min1.y < max2.y;
    },

    /**
     * Checks if a line intersects another line
     * @param a0 The start of the first line
     * @param a1 The end of the first line
     * @param b0 The start of the second line
     * @param b1 The end of the second line
     * @return The intersection position if it happened, if not returns null
    */
    lineIntersectsLine(a0: VectorAbstract, a1: VectorAbstract, b0: VectorAbstract, b1: VectorAbstract): VectorAbstract | null {
        const x1 = Geometry.signedAreaTri(a0, a1, b1);
        const x2 = Geometry.signedAreaTri(a0, a1, b0);
        if (x1 !== 0 && x2 !== 0 && x1 * x2 < 0) {
            const x3 = Geometry.signedAreaTri(b0, b1, a0);
            const x4 = x3 + x2 - x1;
            if (x3 * x4 < 0) {
                const t = x3 / (x3 - x4);
                return UVector2D.add(a0, UVector2D.mul(UVector2D.sub(a1, a0), t));
            }
        }
        return null;
    },

    /**
     * Checks if a line intersects a circle
     * @param s0 The start of the line
     * @param s1 The end of the line
     * @param pos The position of the circle
     * @param rad The radius of the circle
     * @return An intersection response with the intersection position and normal Vectors, returns null if they don't intersect
    */
    lineIntersectsCircle(s0: VectorAbstract, s1: VectorAbstract, pos: VectorAbstract, rad: number): LineIntersection {
        let d = UVector2D.sub(s1, s0);
        const len = Math.max(UVector2D.length(d), 0.000001);
        d = UVector2D.div(d, len);
        const m = UVector2D.sub(s0, pos);
        const b = UVector2D.dot(m, d);
        const c = UVector2D.dot(m, m) - rad * rad;
        if (c > 0 && b > 0.0) {
            return null;
        }
        const discSq = b * b - c;
        if (discSq < 0) {
            return null;
        }
        const disc = Math.sqrt(discSq);
        let t = -b - disc;
        if (t < 0) {
            t = -b + disc;
        }
        if (t <= len) {
            const point = UVector2D.add(s0, UVector2D.mul(d, t));
            return {
                point,
                normal: UVector2D.normalize(UVector2D.sub(point, pos))
            };
        }
        return null;
    },

    /**
     * Checks if a line intersects a rectangle
     * @param s0 The start of the line
     * @param s1 The end of the line
     * @param min The min Vector of the rectangle
     * @param max The max Vector of the rectangle
     * @return An intersection response with the intersection position and normal Vectors, returns null if they don't intersect
    */
    lineIntersectsRect(s0: VectorAbstract, s1: VectorAbstract, min: VectorAbstract, max: VectorAbstract): LineIntersection {
        let tmin = 0;
        let tmax = Number.MAX_VALUE;
        const eps = 0.00001;
        const r = s0;
        let d = UVector2D.sub(s1, s0);
        const dist = UVector2D.length(d);
        d = dist > eps ? UVector2D.div(d, dist) : UVector2D.new(1, 0);

        let absDx = Math.abs(d.x);
        let absDy = Math.abs(d.y);

        if (absDx < eps) {
            d.x = eps * 2;
            absDx = d.x;
        }
        if (absDy < eps) {
            d.y = eps * 2;
            absDy = d.y;
        }

        if (absDx > eps) {
            const tx1 = (min.x - r.x) / d.x;
            const tx2 = (max.x - r.x) / d.x;
            tmin = Math.max(tmin, Math.min(tx1, tx2));
            tmax = Math.min(tmax, Math.max(tx1, tx2));
            if (tmin > tmax) {
                return null;
            }
        }
        if (absDy > eps) {
            const ty1 = (min.y - r.y) / d.y;
            const ty2 = (max.y - r.y) / d.y;
            tmin = Math.max(tmin, Math.min(ty1, ty2));
            tmax = Math.min(tmax, Math.max(ty1, ty2));
            if (tmin > tmax) {
                return null;
            }
        }
        if (tmin > dist) {
            return null;
        }
        // Hit
        const point = UVector2D.add(s0, UVector2D.mul(d, tmin));
        // Intersection normal
        const c = UVector2D.add(min, UVector2D.mul(UVector2D.sub(max, min), 0.5));
        const p0 = UVector2D.sub(point, c);
        const d0 = UVector2D.mul(UVector2D.sub(min, max), 0.5);

        const x = p0.x / Math.abs(d0.x) * 1.001;
        const y = p0.y / Math.abs(d0.y) * 1.001;
        const normal = UVector2D.normalizeSafe({
            x: x < 0 ? Math.ceil(x) : Math.floor(x),
            y: y < 0 ? Math.ceil(y) : Math.floor(y)
        }, UVector2D.new(1, 0));
        return {
            point,
            normal
        };
    },

    /**
     * Checks if circle intersects another circle
     * @param pos0 The position of the first circle
     * @param rad0 The radius of the first circle
     * @param pos1 The position of the second circle
     * @param rad1 The radius of the second circle
     * @return An intersection response with the intersection direction and pen, returns null if they don't intersect
    */
    circleCircleIntersection(pos0: VectorAbstract, rad0: number, pos1: VectorAbstract, rad1: number): CollisionResponse {
        const r = rad0 + rad1;
        const toP1 = UVector2D.sub(pos1, pos0);
        const distSqr = UVector2D.lengthSqr(toP1);
        if (distSqr < r * r) {
            const dist = Math.sqrt(distSqr);
            return {
                dir: dist > 0.00001 ? UVector2D.div(toP1, dist) : UVector2D.new(1.0, 0.0),
                pen: r - dist
            };
        }
        return null;
    },

    /**
     * Checks if circle intersects a rectangle
     * @param min The min Vector of the rectangle
     * @param max The max Vector of the rectangle
     * @param pos The position of the circle
     * @param radius The radius of the circle
     * @return An intersection response with the intersection direction and pen, returns null if they don't intersect
    */
    rectCircleIntersection(min: VectorAbstract, max: VectorAbstract, pos: VectorAbstract, radius: number): CollisionResponse {
        if (pos.x >= min.x && pos.x <= max.x && pos.y >= min.y && pos.y <= max.y) {
            const e = UVector2D.mul(UVector2D.sub(max, min), 0.5);
            const c = UVector2D.add(min, e);
            const p = UVector2D.sub(pos, c);
            const xp = Math.abs(p.x) - e.x - radius;
            const yp = Math.abs(p.y) - e.y - radius;
            if (xp > yp) {
                return {
                    dir: UVector2D.new(p.x > 0.0 ? 1.0 : -1.0, 0.0),
                    pen: -xp
                };
            }
            return {
                dir: UVector2D.new(0.0, p.y > 0.0 ? 1.0 : -1.0),
                pen: -yp
            };
        }
        const cpt = UVector2D.new(
            Numeric.clamp(pos.x, min.x, max.x),
            Numeric.clamp(pos.y, min.y, max.y)
        );
        let dir = UVector2D.sub(pos, cpt);

        dir = UVector2D.sub(pos, cpt);

        const dstSqr = UVector2D.lengthSqr(dir);
        if (dstSqr < radius * radius) {
            const dst = Math.sqrt(dstSqr);
            return {
                dir: dst > 0.0001 ? UVector2D.div(dir, dst) : UVector2D.new(1.0, 0.0),
                pen: radius - dst
            };
        }

        return null;
    },

    /**
    * Checks if a rectangle intersects a rectangle
    * @param min0 - The min Vector of the first rectangle
    * @param max0 - The max vector of the first rectangle
    * @param min1 - The min Vector of the second rectangle
    * @param max1 - The max vector of the second rectangle
    * @return An intersection response with the intersection direction and pen, returns null if they don't intersect
    */
    rectRectIntersection(min0: VectorAbstract, max0: VectorAbstract, min1: VectorAbstract, max1: VectorAbstract): CollisionResponse {
        const e0 = UVector2D.mul(UVector2D.sub(max0, min0), 0.5);
        const c0 = UVector2D.add(min0, e0);
        const e1 = UVector2D.mul(UVector2D.sub(max1, min1), 0.5);
        const c1 = UVector2D.add(min1, e1);
        const n = UVector2D.sub(c1, c0);
        const xo = e0.x + e1.x - Math.abs(n.x);
        if (xo > 0.0) {
            const yo = e0.y + e1.y - Math.abs(n.y);
            if (yo > 0.0) {
                if (xo > yo) {
                    return {
                        dir: n.x < 0.0 ? UVector2D.new(-1.0, 0.0) : UVector2D.new(1.0, 0.0),
                        pen: xo
                    };
                }
                return {
                    dir: n.y < 0.0 ? UVector2D.new(0.0, -1.0) : UVector2D.new(0.0, 1.0),
                    pen: yo
                };
            }
        }
        return null;
    }
};
