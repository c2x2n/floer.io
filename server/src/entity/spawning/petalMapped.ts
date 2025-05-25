import { PetalBehaviors } from "../../../../common/src/definitions/petals";
import BasicHasBehaviorPetal from "../behaviors/petals/basic";
import SelfDamagePetal from "../behaviors/petals/selfDamage";
import CritPetal from "../behaviors/petals/crit";
import HealthPercentDamagePetal from "../behaviors/petals/healthPercentDamage";
import DamageAvoidancePetal from "../behaviors/petals/damageAvoidance";
import DamageReductionPetal from "../behaviors/petals/damageReduction";
import RandomEffectPetal from "../behaviors/petals/randomEffect";
import AreaPoisonPetal from "../behaviors/petals/areaPoison";
import DamageHealPetal from "../behaviors/petals/damageHeal";
import LightningPetal from "../behaviors/petals/lightning";
import MakeBleedingPetal from "../behaviors/petals/bleeding";
import BanPetalPetal from "../behaviors/petals/banPetal";

export const petalBehaviorMapped: { [K in keyof PetalBehaviors]: typeof BasicHasBehaviorPetal<K> } = {
    self_damage: SelfDamagePetal,
    critical_hit: CritPetal,
    health_percent_damage: HealthPercentDamagePetal,
    damage_avoidance: DamageAvoidancePetal,
    damage_reduction_percent: DamageReductionPetal,
    random: RandomEffectPetal,
    area_poison: AreaPoisonPetal,
    damage_heal: DamageHealPetal,
    lightning: LightningPetal,
    bleeding: MakeBleedingPetal,
    ban_petal: BanPetalPetal
};
