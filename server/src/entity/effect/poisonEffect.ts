import { EntityType } from "../../../../common/src/constants";
import { Effect } from "./effect";
import { PoisonEffectData } from "./typings";
import { DamageType } from "../typings/damage";

export class PoisonEffect extends Effect {
    damagePerSecond: number;

    public constructor(data: PoisonEffectData) {
        super({
            effectedTarget: data.effectedTarget,
            source: data.source,
            duration: data.duration,
            callback: (dt, effected) => {
                if (!data) return;
                if (!effected.canReceiveDamageFrom(this.source)) return;
                effected.receiveDamage({
                    amount: dt * data.damagePerSecond,
                    source: this.source,
                    type: DamageType.POISON,
                    to: effected
                });
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

