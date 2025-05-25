import BasicHasBehaviorPetal from "./basic";
import { Damage } from "../../../typings/damage";

export default class DamageAvoidancePetal extends BasicHasBehaviorPetal<"damage_avoidance"> {
    receiveDamage(damage: Damage) {
        if (Math.random() < this.behaviorData) return;
        super.receiveDamage(damage);
    }
}
