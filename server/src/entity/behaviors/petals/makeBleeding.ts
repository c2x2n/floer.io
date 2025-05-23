import BasicHasBehaviorPetal from "./basic";
import ServerLivelyEntity from "../../livelyEntity";
import { Numeric } from "../../../../../common/src/engine/maths/numeric";
import { DamageType } from "../../../typings/damage";
import BleedingEffect from "../../../systems/effect/bleeding";

export default class MakeBleedingPetal extends BasicHasBehaviorPetal<"bleeding"> {
    override collisionDamage(to: ServerLivelyEntity) {
        super.collisionDamage(to);

        new BleedingEffect({
            effectedTarget: to,
            source: this.getTopParent(),
            duration: 8
        }).start();
    }
}
