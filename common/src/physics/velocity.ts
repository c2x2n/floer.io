import VectorAbstract from "./vectorAbstract";
import Vector from "./vector";

export default class Velocity extends Vector implements VectorAbstract {
    /* private lastPosition: Vector = new Vector();
    private position: Vector = new Vector();
    private isInited = false; */

    public constructor(x = 0, y = 0) {
        super(x, y);
    }

    /* private updateVelocity(): this {
        this.x = this.position.x - this.lastPosition.x;
        this.y = this.position.y - this.lastPosition.y;
        return this;
    }

    public setPosition(newPosition: VectorAbstract): void {
        this.lastPosition = this.position.clone();
        this.position.set(newPosition);

        if (!this.isInited) {
            this.lastPosition.set(newPosition);
            this.isInited = true;
        }

        this.updateVelocity();
    } */
}
