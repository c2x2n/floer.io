import { EntityType } from "../../../../common/src/constants";
import { Effect } from "./effect";
import { EffectData } from "../../typings/effect";
import { DamageType } from "../../typings/damage";

export default class BleedingEffect extends Effect {
    damageForNow = 0;

    public constructor(data: EffectData) {
        super({
            effectedTarget: data.effectedTarget,
            source: data.source,
            duration: data.duration,
            callback: (dt, effected) => {
                if (!data) return;
                if (effected.velocity.magnitude > 0.1) {
                    if (!effected.canReceiveDamageFrom(this.source)) return;
                    this.damageForNow += effected.velocity.magnitude * 4;
                    effected.receiveDamage({
                        amount: dt * this.damageForNow,
                        source: this.source,
                        type: DamageType.PHYSICAL,
                        to: effected
                    });
                } else {
                    this.damageForNow = 0;
                }
            },
            workingType: [EntityType.Mob, EntityType.Player]
        });
    }
}
