import BasicHasBehaviorPetal from "./basic";
import ServerLivelyEntity from "../../livelyEntity";
import { Numeric } from "../../../../../common/src/engine/maths/numeric";
import { DamageType } from "../../../typings/damage";
import { Random } from "../../../../../common/src/engine/maths/random";
import { PetalBehaviors } from "../../../../../common/src/definitions/petals";

export default class RandomEffectPetal extends BasicHasBehaviorPetal<"random"> {
    override dealCollisionDamage(entity: ServerLivelyEntity) {
        if (!this.damage || !this.chosenEffect) return;

        entity.receiveDamage({
            amount: this.chosenEffect.damage ?? this.damage,
            source: this.getTopParent(),
            to: entity,
            type: DamageType.PHYSICAL
        });
    }

    chosenEffect?: PetalBehaviors["random"][number];

    override collisionDamage(to: ServerLivelyEntity) {
        const chosen = Random.pickRandomInArray(this.behaviorData,
            this.behaviorData.map(e => e.weight));

        this.effectsOnHit = chosen.effect;
        this.bodyPoison = chosen.poison;

        this.chosenEffect = chosen;

        super.collisionDamage(to);
    }
}
