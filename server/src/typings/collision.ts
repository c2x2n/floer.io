import { ServerEntity } from "../entity/serverEntity";
import { CollisionT } from "../../../common/src/engine/physics/collision";

export type CollisionInformation = {
    entity: ServerEntity
    collision: CollisionT
};
