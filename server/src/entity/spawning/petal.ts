import { PetalBehaviors, PetalDefinition } from "../../../../common/src/definitions/petals";
import { ServerPetal } from "../serverPetal";
import BasicHasBehaviorPetal from "../behaviors/petals/basic";
import SelfDamagePetal from "../behaviors/petals/selfDamage";
import { PetalBunch } from "../../systems/inventory/petalBunch";

const behaviorMapped: { [K in keyof PetalBehaviors]: typeof BasicHasBehaviorPetal<K>} = {
    self_damage: SelfDamagePetal
};

export default function spawnPetal(bunch: PetalBunch, definition: PetalDefinition): ServerPetal {
    if (definition.behavior) {
        return new behaviorMapped[definition.behavior.name](bunch, definition);
    } else {
        return new ServerPetal(bunch, definition);
    }
}
