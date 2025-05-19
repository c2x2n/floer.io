import { EntityType } from "../../../../common/src/constants";
import { type Hitbox, RectHitbox } from "../../../../common/src/engine/physics/hitbox";
import { UVector2D } from "../../../../common/src/engine/physics/uvector";
import { type ServerEntity } from "../../entity/entity";
import { type ServerPlayer } from "../../entity/serverPlayer";
import { ServerPetal } from "../../entity/serverPetal";
import { ServerMob } from "../../entity/serverMob";
import { ServerLoot } from "../../entity/serverLoot";
import { ServerProjectile } from "../../entity/serverProjectile";
import { ServerWall } from "../../entity/serverWall";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { Numeric } from "../../../../common/src/engine/maths/numeric";

/**
 * A Grid to filter collision detection of game entities
 */
export class Grid {
    readonly width: number;
    readonly height: number;
    readonly cellSize = 16;

    //                        X     Y     Entity ID
    //                      __^__ __^__     ___^__
    private readonly _grid: Array<Array<Map<number, ServerEntity>>>;

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
        this.width = Math.floor(width / this.cellSize);
        this.height = Math.floor(height / this.cellSize);

        this._grid = Array.from(
            { length: this.width + 1 },
            () => Array.from({ length: this.height + 1 }, () => new Map())
        );
    }

    getById(id: number) {
        return this.entities.get(id);
    }

    addEntity(entity: ServerEntity): void {
        this.entities.set(entity.id, entity);
        entity.init();
        (this.byCategory[entity.type] as Set<typeof entity>).add(entity);
        this.updateEntity(entity);
    }

    /**
     * Add an entity to the grid system
     */
    updateEntity(entity: ServerEntity): void {
        this.removeFromGrid(entity);
        const cells: VectorAbstract[] = [];

        const rect = entity.hitbox.toRectangle();

        // Get the bounds of the hitbox
        // Round it to the grid cells
        const min = this._roundToCells(rect.min);
        const max = this._roundToCells(rect.max);

        // Add it to all grid cells that it intersects
        for (let x = min.x; x <= max.x; x++) {
            const xRow = this._grid[x];
            for (let y = min.y; y <= max.y; y++) {
                xRow[y].set(entity.id, entity);
                cells.push(UVector2D.new(x, y));
            }
        }
        // Store the cells this entity is occupying
        this._entitiesCells.set(entity.id, cells);
    }

    remove(entity: ServerEntity): void {
        this.entities.delete(entity.id);
        this.removeFromGrid(entity);
        entity.game.idAllocator.give(entity.id);
        (this.byCategory[entity.type] as Set<typeof entity>).delete(entity);
    }

    /**
     * Remove a entity from the grid system
     */
    removeFromGrid(entity: ServerEntity): void {
        const cells = this._entitiesCells.get(entity.id);
        if (!cells) return;

        for (const cell of cells) {
            this._grid[cell.x][cell.y].delete(entity.id);
        }
        this._entitiesCells.delete(entity.id);
    }

    /**
     * Get all entities near this Hitbox
     * This transforms the Hitbox into a rectangle
     * and gets all entities intersecting it after rounding it to grid cells
     * @param Hitbox The Hitbox
     * @return A set with the entities near this Hitbox
     */
    intersectsHitbox(hitbox: Hitbox): Set<ServerEntity> {
        const rect = hitbox.toRectangle();

        const min = this._roundToCells(rect.min);
        const max = this._roundToCells(rect.max);

        const entities = new Set<ServerEntity>();

        for (let x = min.x; x <= max.x; x++) {
            const xRow = this._grid[x];
            for (let y = min.y; y <= max.y; y++) {
                const cellEntities = xRow[y].values();
                for (const entity of cellEntities) {
                    entities.add(entity);
                }
            }
        }

        return entities;
    }

    intersectPos(pos: VectorAbstract) {
        pos = this._roundToCells(pos);
        return [...this._grid[pos.x][pos.y].values()];
    }

    // TODO: optimize this
    intersectLineSegment(a: VectorAbstract, b: VectorAbstract) {
        return this.intersectsHitbox(RectHitbox.fromLine(a, b));
    }

    /**
     * Rounds a position to this grid cells
     */
    private _roundToCells(vector: VectorAbstract): VectorAbstract {
        return {
            x: Numeric.clamp(Math.floor(vector.x / this.cellSize), 0, this.width),
            y: Numeric.clamp(Math.floor(vector.y / this.cellSize), 0, this.height)
        };
    }
}
