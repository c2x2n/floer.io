import { ServerEntity } from "./serverEntity";
import { CircleHitbox } from "../../../common/src/engine/physics/hitbox";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { PetalDefinition } from "../../../common/src/definitions/petals";
import { ServerGame } from "../game";
import { Rarity } from "../../../common/src/definitions/rarities";
import { CollisionT } from "../../../common/src/engine/physics/collision";
import VectorAbstract from "../../../common/src/engine/physics/vectorAbstract";
import { ServerPlayer } from "./serverPlayer";
import ServerLivelyEntity from "./livelyEntity";
import { EntitiesNetData } from "../../../common/src/engine/net/entitySerializations";

export class ServerLoot extends ServerEntity<EntityType.Loot> {
    type: EntityType.Loot = EntityType.Loot;
    name = "Loot";

    hitbox: CircleHitbox = new CircleHitbox(GameConstants.loot.radius * 2.5);
    definition: PetalDefinition;
    despawnTime = 0;

    canCollideWith(): boolean { return false; }

    constructor(game: ServerGame, position: VectorAbstract, definition: PetalDefinition) {
        super(game, position);
        this.definition = definition;
        this.game.grid.addEntity(this);
    }

    tick(): void {
        super.tick();

        this.despawnTime += this.game.dt;
        const rarityDef = Rarity.fromString(this.definition.rarity);
        // rarityDef.level starts from 1
        const corrDespawnTime = GameConstants.loot.despawnTime[rarityDef.level - 1] || 45;
        if (this.despawnTime >= corrDespawnTime) {
            this.destroy();
        }
    }

    collideWith(collision: CollisionT, entity: ServerLivelyEntity) {
        if (!(entity instanceof ServerPlayer)) return;
        if (entity.inventory.pickUp(this.definition)) {
            this.destroy();
            {
                const rarity = Rarity.fromString(this.definition.rarity);
                if (rarity.globalMessage && !this.definition.noAnnouncement) {
                    let content = `The ${rarity.displayName} ${this.definition.fullName ?? this.definition.displayName} has been found`;
                    if (this.game.activePlayers.size >= 20) {
                        content += `by ${entity.name}`;
                    }
                    this.game.sendGlobalMessage({
                        content: `${content}!`,
                        color: parseInt(rarity.color.substring(1), 16)
                    });
                }
            }
        }
    }

    get data(): Required<EntitiesNetData[EntityType.Loot]> {
        return {
            position: this.position,
            full: {
                definition: this.definition
            }
        };
    };
}
