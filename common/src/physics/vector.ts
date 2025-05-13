import { Geometry } from "../maths/math";
import VectorAbstract from "./vectorAbstract";
import { UVec2D } from "./utils";

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
        this.mulByVector(Geometry.radiansToDirection(value)).mul(magnitude);
    }

    set magnitude(value: number) {
        const angle = this.angle;
        this.mulByVector(Geometry.radiansToDirection(angle)).mul(value);
    }

    get magnitude(): number {
        return UVec2D.length(this);
    }
}
