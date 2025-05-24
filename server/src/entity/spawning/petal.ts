import { PetalDefinition } from "../../../../common/src/definitions/petals";
import { ServerPetal } from "../serverPetal";
import { PetalBunch } from "../../systems/inventory/petalBunch";
import { petalBehaviorMapped } from "./petalMapped";

export default function spawnPetal(bunch: PetalBunch, definition: PetalDefinition): ServerPetal {
    if (definition.behavior) {
        return new petalBehaviorMapped[definition.behavior.name](bunch, definition);
    } else {
        return new ServerPetal(bunch, definition);
    }
}
