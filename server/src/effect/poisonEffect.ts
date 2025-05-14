import { EntityType } from "../../../common/src/constants";
import { isDamageableEntity } from "../typings";
import { Effect } from "./effect";
import { PoisonEffectData } from "./typings";

export class PoisonEffect extends Effect {
    damagePerSecond: number;

    public constructor(data: PoisonEffectData) {
        super({
            effectedTarget: data.effectedTarget,
            source: data.source,
            duration: data.duration,
            callback: (dt, effected) => {
                if (!data) return;
                if (isDamageableEntity(effected)) {
                    if (!effected.canReceiveDamageFrom(this.source)) return;
                    effected.receiveDamage(dt * data.damagePerSecond, this.source);
                }
            },
            workingType: [EntityType.Mob, EntityType.Player]
        });
        this.damagePerSecond = data.damagePerSecond;
    }

    public destroy() {
        super.destroy();
        if (this.effectedTarget.state.poison === this) { this.effectedTarget.state.poison = undefined; }
    }
}

