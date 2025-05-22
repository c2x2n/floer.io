import BasicHasBehaviorPetal from "./basic";
import ServerLivelyEntity from "../../livelyEntity";
import { DamageType } from "../../../typings/damage";

export default class CritPetal extends BasicHasBehaviorPetal<"critical_hit"> {
    override dealCollisionDamage(to: ServerLivelyEntity) {
        if (!this.damage) return;

        let damage = this.damage;
        if (Math.random() < this.behaviorData.chance) {
            damage *= this.behaviorData.multiplier;
        }

        to.receiveDamage({
            amount: damage,
            source: this.getTopParent(),
            to,
            type: DamageType.COLLISION
        });
    }
}
