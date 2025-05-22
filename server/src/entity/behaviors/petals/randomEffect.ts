import BasicHasBehaviorPetal from "./basic";
import ServerLivelyEntity from "../../livelyEntity";
import { Numeric } from "../../../../../common/src/engine/maths/numeric";
import { DamageType } from "../../../typings/damage";
import { Random } from "../../../../../common/src/engine/maths/random";

export default class RandomEffectPetal extends BasicHasBehaviorPetal<"random"> {
    override collisionDamage(to: ServerLivelyEntity) {
        const chosen = Random.pickRandomInArray(this.behaviorData);

        this.effectsOnHit = chosen.effect;

        super.collisionDamage(to);
    }
}
