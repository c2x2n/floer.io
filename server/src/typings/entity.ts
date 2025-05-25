import { ServerEntity } from "../entity/serverEntity";
import { ServerPlayer } from "../entity/serverPlayer";
import { EntityType } from "../../../common/src/constants";
import ServerLivelyEntity from "../entity/livelyEntity";

export function isPlayer(e: ServerEntity): e is ServerPlayer {
    return e.type === EntityType.Player;
}

export function isLively(e: ServerEntity): e is ServerLivelyEntity {
    return e.type === EntityType.Player
        || e.type === EntityType.Mob
        || e.type === EntityType.Projectile
        || e.type === EntityType.Petal;
}
