import { ServerEntity } from "./entity/entity";
import { ServerPetal } from "./entity/entities/serverPetal";
import { ServerPlayer } from "./entity/entities/serverPlayer";
import { ServerMob } from "./entity/entities/serverMob";
import { EntityType } from "../../common/src/constants";
import { ServerProjectile } from "./entity/entities/serverProjectile";
import { ServerLoot } from "./entity/entities/serverLoot";
import { ServerWall } from "./entity/entities/serverWall";
import { CollisionT } from "../../common/src/physics/collision";

export type damageSource = ServerPlayer | ServerMob;

export function isDamageSourceEntity(entity: ServerEntity): entity is damageSource {
    return entity.type === EntityType.Player
        || entity.type === EntityType.Mob;
}

export type CollisionInformation = {
    entity: ServerEntity
    collision: CollisionT
}
