import { Collision, type CollisionResponse, type LineIntersection } from "./collision";
import { UVec2D } from "../physics/utils";
import VectorAbstract from "../physics/vectorAbstract";

export enum HitboxType {
    Circle,
    Rect
}

export interface HitboxJSONMapping {
    [HitboxType.Circle]: {
        readonly type: HitboxType.Circle
        readonly radius: number
        readonly position: VectorAbstract
    }
    [HitboxType.Rect]: {
        readonly type: HitboxType.Rect
        readonly min: VectorAbstract
        readonly max: VectorAbstract
    }
}

export type HitboxJSON = HitboxJSONMapping[HitboxType];

export type Hitbox = CircleHitbox | RectHitbox;

export abstract class BaseHitbox {
    abstract type: HitboxType;

    /**
     * Checks if this {@link Hitbox} collides with another one
     * @param that The other {@link Hitbox}
     * @return `true` if both {@link Hitbox}es collide
     */
    abstract collidesWith(that: Hitbox): boolean;

    abstract getIntersection(that: Hitbox): CollisionResponse;

    /**
     * Resolve collision between {@link Hitbox}es.
     * @param that The other {@link Hitbox}
     */

    /**
     * Clone this {@link Hitbox}.
     * @return a new {@link Hitbox} cloned from this one
     */
    abstract clone(): Hitbox;

    /**
     * Scale this {@link Hitbox}.
     * NOTE: This does change the initial {@link Hitbox}
     * @param scale The scale
     */
    abstract scale(scale: number): void;
    /**
     * Check if a line intersects with this {@link Hitbox}.
     * @param a the start point of the line
     * @param b the end point of the line
     * @return An intersection response containing the intersection position and normal
     */
    abstract intersectsLine(a: VectorAbstract, b: VectorAbstract): LineIntersection;
    /**
     * Get a random position inside this {@link Hitbox}.
     * @return A Vector of a random position inside this {@link Hitbox}
     */

    abstract toRectangle(): RectHitbox;

    abstract isPointInside(point: VectorAbstract): boolean;
}

export class CircleHitbox extends BaseHitbox {
    override readonly type = HitboxType.Circle;
    position: VectorAbstract;
    radius: number;

    constructor(radius: number, position?: VectorAbstract) {
        super();

        this.position = position ?? UVec2D.new(0, 0);
        this.radius = radius;
    }

    override collidesWith(that: Hitbox): boolean {
        switch (that.type) {
            case HitboxType.Circle:
                return Collision.checkCircleCircle(that.position, that.radius, this.position, this.radius);
            case HitboxType.Rect:
                return Collision.checkRectCircle(that.min, that.max, this.position, this.radius);
        }
    }

    override getIntersection(that: Hitbox) {
        switch (that.type) {
            case HitboxType.Circle:
                return Collision.circleCircleIntersection(this.position, this.radius, that.position, that.radius);
            case HitboxType.Rect:
                return Collision.rectCircleIntersection(that.min, that.max, this.position, this.radius);
        }
    }

    override clone(): CircleHitbox {
        return new CircleHitbox(this.radius, UVec2D.clone(this.position));
    }

    override scale(scale: number): void {
        this.radius *= scale;
    }

    override intersectsLine(a: VectorAbstract, b: VectorAbstract): LineIntersection {
        return Collision.lineIntersectsCircle(a, b, this.position, this.radius);
    }

    override toRectangle(): RectHitbox {
        return new RectHitbox(
            UVec2D.new(this.position.x - this.radius, this.position.y - this.radius),
            UVec2D.new(this.position.x + this.radius, this.position.y + this.radius)
        );
    }

    override isPointInside(point: VectorAbstract): boolean {
        return UVec2D.distanceBetween(point, this.position) < this.radius;
    }
}

export class RectHitbox extends BaseHitbox {
    override readonly type = HitboxType.Rect;
    min: VectorAbstract;
    max: VectorAbstract;

    constructor(min: VectorAbstract, max: VectorAbstract) {
        super();

        this.min = min;
        this.max = max;
    }

    toJSON(): HitboxJSONMapping[HitboxType.Rect] {
        return {
            type: this.type,
            min: UVec2D.clone(this.min),
            max: UVec2D.clone(this.max)
        };
    }

    static fromLine(a: VectorAbstract, b: VectorAbstract): RectHitbox {
        return new RectHitbox(
            UVec2D.new(
                Math.min(a.x, b.x),
                Math.min(a.y, b.y)
            ),
            UVec2D.new(
                Math.max(a.x, b.x),
                Math.max(a.y, b.y)
            )
        );
    }

    static fromRect(width: number, height: number, pos = UVec2D.new(0, 0)): RectHitbox {
        const size = UVec2D.new(width / 2, height / 2);

        return new RectHitbox(
            UVec2D.sub(pos, size),
            UVec2D.add(pos, size)
        );
    }

    /**
     * Creates a new rectangle hitbox from the bounds of a circle
     */
    static fromCircle(radius: number, position: VectorAbstract): RectHitbox {
        return new RectHitbox(
            UVec2D.new(position.x - radius, position.y - radius),
            UVec2D.new(position.x + radius, position.y + radius));
    }

    override collidesWith(that: Hitbox): boolean {
        switch (that.type) {
            case HitboxType.Circle:
                return Collision.checkRectCircle(this.min, this.max, that.position, that.radius);
            case HitboxType.Rect:
                return Collision.checkRectRect(that.min, that.max, this.min, this.max);
        }
    }

    override getIntersection(that: Hitbox) {
        switch (that.type) {
            case HitboxType.Circle:
                return Collision.rectCircleIntersection(this.min, this.max, that.position, that.radius);
            case HitboxType.Rect:
                return Collision.rectRectIntersection(this.min, this.max, that.min, that.max);
        }
    }

    override clone(): RectHitbox {
        return new RectHitbox(UVec2D.clone(this.min), UVec2D.clone(this.max));
    }

    override scale(scale: number): void {
        const centerX = (this.min.x + this.max.x) / 2;
        const centerY = (this.min.y + this.max.y) / 2;

        this.min = UVec2D.new((this.min.x - centerX) * scale + centerX, (this.min.y - centerY) * scale + centerY);
        this.max = UVec2D.new((this.max.x - centerX) * scale + centerX, (this.max.y - centerY) * scale + centerY);
    }

    override intersectsLine(a: VectorAbstract, b: VectorAbstract): LineIntersection {
        return Collision.lineIntersectsRect(a, b, this.min, this.max);
    }

    override toRectangle(): this {
        return this;
    }

    override isPointInside(point: VectorAbstract): boolean {
        return point.x > this.min.x && point.y > this.min.y && point.x < this.max.x && point.y < this.max.y;
    }
}
