import VectorAbstract from "./vectorAbstract";
import { UVector2D } from "./uvector";
import { Geometry } from "../maths/geometry";

export default class Vector implements VectorAbstract {
    x: number;
    y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    add(vec: VectorAbstract): this {
        this.x += vec.x;
        this.y += vec.y;
        return this;
    }

    set(vec: VectorAbstract): this {
        this.x = vec.x;
        this.y = vec.y;
        return this;
    }

    clear(): this {
        this.x = 0;
        this.y = 0;
        return this;
    }

    sub(vec: VectorAbstract): this {
        this.x -= vec.x;
        this.y -= vec.y;
        return this;
    }

    mul(n: number): this {
        this.x *= n;
        this.y *= n;
        return this;
    }

    mulByVector(n: VectorAbstract): this {
        this.x *= n.x;
        this.y *= n.y;
        return this;
    }

    div(n: number): this {
        this.x /= n;
        this.y /= n;
        return this;
    }

    clone(): Vector {
        return new Vector(this.x, this.y);
    }

    getAbstract(): VectorAbstract {
        return {
            x: this.x,
            y: this.y
        };
    }

    get angle(): number {
        return Geometry.directionToRadians(this);
    }

    set angle(value: number) {
        const magnitude = this.magnitude;
        this.set(UVector2D.fromPolar(value, magnitude));
    }

    set magnitude(value: number) {
        const angle = this.angle;
        this.set(UVector2D.fromPolar(angle, value));
    }

    get magnitude(): number {
        return UVector2D.length(this);
    }

    static fromPolar(theta: number, magnitude: number): Vector {
        const newVector = new Vector();

        newVector.set(UVector2D.fromPolar(theta, magnitude));

        return newVector;
    }
}
