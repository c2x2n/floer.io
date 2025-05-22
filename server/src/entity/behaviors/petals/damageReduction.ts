import BasicHasBehaviorPetal from "./basic";
import { Damage } from "../../../typings/damage";

export default class DamageReductionPetal extends BasicHasBehaviorPetal<"damage_reduction_percent">{
    receiveDamage(damage: Damage) {
        if (this.behaviorData.from && !(this.behaviorData.from.includes(damage.source.type))) return;
        damage.amount *= 1 - this.behaviorData.percent;
        super.receiveDamage(damage);
    }
}
