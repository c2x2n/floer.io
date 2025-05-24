import { ServerProjectile } from "../serverProjectile";
import { ServerPlayer } from "../serverPlayer";
import { Geometry } from "../../../../common/src/engine/maths/geometry";
import ServerLivelyEntity from "../livelyEntity";

export default class Missile extends ServerProjectile {
    getLeading = false;

    canCollideWith(source: ServerLivelyEntity): boolean {
        if (source instanceof Missile && this.getLeading) {
            return true;
        }
        return super.canCollideWith(source);
    }

    tick() {
        if (this.source instanceof ServerPlayer && this.source.modifiers.leadMissiles) {
            this.direction = Geometry.directionBetweenPoints(
                Geometry.getPositionOnCircle(
                    this.source.direction.mouseDirection,
                    this.source.distance.mouseDistance,
                    this.source.position
                ),
                this.position
            );
            this.getLeading = true;
        } else {
            this.getLeading = false;
        }

        super.tick();
    }

    override dealCollisionDamage(to: ServerLivelyEntity) {
        if (this.source instanceof ServerPlayer && this.getLeading && this.parameters.damage) {
            this.damage = this.parameters.damage * (1 - (this.source.petalCounter.missileCount * 0.05));
        } // Every missile equipped, damage was -5% of the original damage.

        super.dealCollisionDamage(to);
    }
}
