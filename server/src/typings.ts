import { ServerEntity } from "./entities/serverEntity";
import { ServerPetal } from "./entities/serverPetal";
import { ServerPlayer } from "./entities/serverPlayer";
import { ServerMob } from "./entities/serverMob";
import { EntityType } from "../../common/src/constants";
import { ServerProjectile } from "./entities/serverProjectile";
import { ServerLoot } from "./entities/serverLoot";
import { ServerWall } from "./entities/serverWall";

export type collideableEntity =
    ServerPetal
    | ServerPlayer
    | ServerMob
    | ServerProjectile
    | ServerLoot
    | ServerWall;
export type damageSource = ServerPlayer | ServerMob;
export type damageableEntity = ServerPetal | ServerPlayer | ServerMob | ServerProjectile;

export function isCollideableEntity(entity: ServerEntity): entity is collideableEntity {
    return entity.type === EntityType.Petal
        || entity.type === EntityType.Player
        || entity.type === EntityType.Mob
        || entity.type === EntityType.Projectile
        || entity.type === EntityType.Loot
        || entity.type === EntityType.Wall;
}

export function isDamageSourceEntity(entity: ServerEntity): entity is damageSource {
    return entity.type === EntityType.Player
        || entity.type === EntityType.Mob;
}

export function isDamageableEntity(entity: ServerEntity): entity is damageableEntity {
    return entity.type === EntityType.Petal
        || entity.type === EntityType.Player
        || entity.type === EntityType.Mob
        || entity.type === EntityType.Projectile;
}
