import { EntityType } from "../../../../common/src/constants";
import { type Hitbox, RectHitbox } from "../../../../common/src/engine/physics/hitbox";
import { UVector2D } from "../../../../common/src/engine/physics/uvector";
import { type ServerEntity } from "../../entity/serverEntity";
import { type ServerPlayer } from "../../entity/serverPlayer";
import { ServerPetal } from "../../entity/serverPetal";
import { ServerMob } from "../../entity/serverMob";
import { ServerLoot } from "../../entity/serverLoot";
import { ServerProjectile } from "../../entity/serverProjectile";
import { ServerWall } from "../../entity/serverWall";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { Numeric } from "../../../../common/src/engine/maths/numeric";
import SQuadTree from "./quadTree";

/**
 * A Grid to filter collision detection of game entities
 */

// TODO: (c) Replace with QuadTree soon
export class Grid {
    readonly width: number;
    readonly height: number;
    readonly cellSize = 16;

    //                        X     Y     Entity ID
    //                      __^__ __^__     ___^__
    // private readonly _grid: Array<Array<Map<number, ServerEntity>>>;

    public quadTree = new SQuadTree(0, 0);

    // store the cells each entity is occupying
    // so removing the entity from the grid is faster
    private readonly _entitiesCells = new Map<number, VectorAbstract[]>();

    readonly entities = new Map<number, ServerEntity>();

    readonly byCategory = {
        [EntityType.Player]: new Set<ServerPlayer>(),
        [EntityType.Petal]: new Set<ServerPetal>(),
        [EntityType.Mob]: new Set<ServerMob>(),
        [EntityType.Loot]: new Set<ServerLoot>(),
        [EntityType.Projectile]: new Set<ServerProjectile>(),
        [EntityType.Wall]: new Set<ServerWall>()
    };

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    addEntity(entity: ServerEntity): void {
        this.entities.set(entity.id, entity);
        entity.init();
        (this.byCategory[entity.type] as Set<typeof entity>).add(entity);
    }

    /**
     * Add an entity to the grid system
     */
    updateEntity(entity: ServerEntity): void {
        this.quadTree.insertEntity(entity);
    }

    remove(entity: ServerEntity): void {
        this.entities.delete(entity.id);
        entity.game.idAllocator.give(entity.id);
        (this.byCategory[entity.type] as Set<typeof entity>).delete(entity);
    }

    reset(): void {
        this.quadTree.reset(this.height, this.width);
    }

    /**
     * Get all entities near this Hitbox
     * This transforms the Hitbox into a rectangle
     * and gets all entities intersecting it after rounding it to grid cells
     * @param hitbox The Hitbox
     * @return A set with the entities near this Hitbox
     */
    intersectsHitbox(hitbox: Hitbox): Set<ServerEntity> {
        return new Set<ServerEntity>(this.quadTree.retrieveEntitiesByHb(hitbox));
    }
}
