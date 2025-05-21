import { PetalDefinition, type PetalBehaviors } from "../../../../../common/src/definitions/petals";
import { ServerPetal } from "../../serverPetal";
import { PetalBunch } from "../../../systems/inventory/petalBunch";

export default class BasicHasBehaviorPetal<K extends keyof PetalBehaviors> extends ServerPetal{
    protected behaviorData: PetalBehaviors[K];

    constructor(petalBunch: PetalBunch, definition: PetalDefinition) {
        super(petalBunch, definition);
        if (!definition.behavior) {
            throw new Error("Petal definition must have an correct behavior type to use behaviored petal.");
        }
        this.behaviorData = definition.behavior.data as PetalBehaviors[K];
    }
}
