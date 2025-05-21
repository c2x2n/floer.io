import BasicHasBehaviorPetal from "./basic";
import ServerLivelyEntity from "../../livelyEntity";
import { DamageType } from "../../../typings/damage";

export default class SelfDamagePetal extends BasicHasBehaviorPetal<"self_damage"> {
    override dealCollisionDamageTo(to: ServerLivelyEntity) {
        super.dealCollisionDamageTo(to);
        this.owner.receiveDamage({
            source: this.owner,
            amount: this.behaviorData,
            type: DamageType.PHYSICAL,
            to: this.owner
        });
    }
}
