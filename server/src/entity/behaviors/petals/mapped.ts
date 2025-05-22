import { PetalBehaviors } from "../../../../../common/src/definitions/petals";
import BasicHasBehaviorPetal from "./basic";
import SelfDamagePetal from "./selfDamage";
import CritPetal from "./crit";
import HealthPercentDamagePetal from "./healthPercentDamage";
import DamageAvoidancePetal from "./damageAvoidance";
import DamageReductionPetal from "./damageReduction";
import RandomEffectPetal from "./randomEffect";
import AreaPoisonPetal from "./areaPoison";
import DamageHealPetal from "./damageHeal";
import LightningPetal from "./lightning";

export const behaviorMapped: { [K in keyof PetalBehaviors]: typeof BasicHasBehaviorPetal<K>} = {
    self_damage: SelfDamagePetal,
    critical_hit: CritPetal,
    health_percent_damage: HealthPercentDamagePetal,
    damage_avoidance: DamageAvoidancePetal,
    damage_reduction_percent: DamageReductionPetal,
    random: RandomEffectPetal,
    area_poison: AreaPoisonPetal,
    damage_heal: DamageHealPetal,
    lightning: LightningPetal
};
