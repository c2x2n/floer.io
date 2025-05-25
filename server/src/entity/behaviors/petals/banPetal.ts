import BasicHasBehaviorPetal from "./basic";
import ServerLivelyEntity from "../../livelyEntity";
import { Numeric } from "../../../../../common/src/engine/maths/numeric";
import { DamageType } from "../../../typings/damage";
import BleedingEffect from "../../../systems/effect/bleeding";
import { ServerPlayer } from "../../serverPlayer";
import { compareRarities, Rarity } from "../../../../../common/src/definitions/rarities";

export default class BanPetalPetal extends BasicHasBehaviorPetal<"ban_petal"> {
    override collisionDamage(to: ServerLivelyEntity) {
        super.collisionDamage(to);

        if (to instanceof ServerPlayer) {
            to.petalEntities.filter(petal => !petal.banned).sort((a, b) => {
                return compareRarities(a.definition.rarity, b.definition.rarity);
            }).splice(0, this.behaviorData.num).forEach(petal => {
                petal.banned = true;
                petal.bannedOutTime = this.behaviorData.duration;
            });
        }
    }
}
