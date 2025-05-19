import { ServerEntity } from "./entity/entity";
import { ServerPetal } from "./entity/serverPetal";
import { ServerPlayer } from "./entity/serverPlayer";
import { ServerMob } from "./entity/serverMob";
import { EntityType } from "../../common/src/constants";
import { ServerProjectile } from "./entity/serverProjectile";
import { ServerLoot } from "./entity/serverLoot";
import { ServerWall } from "./entity/serverWall";
import { CollisionT } from "../../common/src/engine/physics/collision";

export type damageSource = ServerPlayer | ServerMob;

export function isDamageSourceEntity(entity: ServerEntity): entity is damageSource {
    return entity.type === EntityType.Player
        || entity.type === EntityType.Mob;
}

export type CollisionInformation = {
    entity: ServerEntity
    collision: CollisionT
}
