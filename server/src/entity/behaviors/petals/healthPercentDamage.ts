import BasicHasBehaviorPetal from "./basic";
import ServerLivelyEntity from "../../livelyEntity";
import { Numeric } from "../../../../../common/src/engine/maths/numeric";
import { DamageType } from "../../../typings/damage";

export default class HealthPercentDamagePetal extends BasicHasBehaviorPetal<"health_percent_damage"> {
    override dealCollisionDamage(to: ServerLivelyEntity) {
        let damage = to.maxHealth * this.behaviorData.percent;
        if (this.behaviorData.maxDamage) {
            damage = Numeric.clamp(damage, 0, this.behaviorData.maxDamage);
        }

        to.receiveDamage({
            amount: damage,
            source: this.getTopParent(),
            to,
            type: this.behaviorData.trueDamage ? DamageType.PHYSICAL : DamageType.COLLISION
        });
    }
}
