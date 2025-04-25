import { ServerEntity } from "./serverEntity";
import { Vector } from "../../../common/src/utils/vector";
import { type EntitiesNetData } from "../../../common/src/packets/updatePacket";
import { CircleHitbox } from "../../../common/src/utils/hitbox";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { PetalDefinition } from "../../../common/src/definitions/petal";
import { ServerPlayer } from "./serverPlayer";
import { Game } from "../game";
import { Rarity } from "../../../common/src/definitions/rarity";
import { CollisionResponse } from "../../../common/src/utils/collision";
import { collideableEntity } from "../typings";

export class ServerLoot extends ServerEntity<EntityType.Loot> {
    type: EntityType.Loot = EntityType.Loot;

    hitbox: CircleHitbox;
    definition: PetalDefinition;

    despawnTime: number = 0;

    canCollideWith(entity: ServerEntity): boolean {
        return false
    }

    constructor(game: Game, position: Vector, definition: PetalDefinition) {
        super(game, position);
        this.hitbox = new CircleHitbox(GameConstants.loot.radius * 2.5);

        this.position = position;

        this.definition = definition;

        this.game.grid.addEntity(this);
    }

    tick(): void{
        this.despawnTime += this.game.dt;
        const rarityDef = Rarity.fromString(this.definition.rarity);
        // rarityDef.level starts from 1
        const corrDespawnTime = GameConstants.loot.despawnTime[rarityDef.level-1] || 45;
        if (this.despawnTime >= corrDespawnTime) {
            this.destroy();
        }
    }

    collideWith(collision: CollisionResponse, entity: collideableEntity) {
        if (!(entity.type === EntityType.Player)) return
        if (entity.inventory.pickUp(this.definition)){
            this.destroy();
            const rarity = Rarity.fromString(this.definition.rarity);
            if (rarity.globalMessage) {
                let content = `The ${rarity.displayName} ${this.definition.displayName} has been found`
                if (this.game.activePlayers.size >= 20) {
                    content += `by ${entity.name}`
                }
                this.game.sendGlobalMessage({
                    content: content +"!",
                    color: parseInt(rarity.color.substring(1), 16)
                })
            }
        }
    }

    get data(): Required<EntitiesNetData[EntityType.Loot]>{
        return {
            position: this.position,
            full: {
                definition: this.definition,
            }
        };
    };
}
