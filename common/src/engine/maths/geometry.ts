import VectorAbstract from "../physics/vectorAbstract";
import { UVector2D } from "../physics/uvector";

export const Geometry = {
    getPositionOnCircle(radians: number, radius: number, basic: VectorAbstract = UVector2D.new(0, 0)): VectorAbstract {
        return UVector2D.add(basic, UVector2D.new(
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
        return UVector2D.new(
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
} as const;
