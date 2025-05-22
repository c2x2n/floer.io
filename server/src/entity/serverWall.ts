import { ServerEntity } from "./serverEntity";
import { RectHitbox } from "../../../common/src/engine/physics/hitbox";
import { EntityType } from "../../../common/src/constants";
import { ServerGame } from "../game";
import VectorAbstract from "../../../common/src/engine/physics/vectorAbstract";
import { EntitiesNetData } from "../../../common/src/engine/net/entitySerializations";

export class ServerWall extends ServerEntity<EntityType.Wall> {
    type: EntityType.Wall = EntityType.Wall;

    hitbox: RectHitbox;

    weight = 99999;

    canCollideWith(entity: ServerEntity): boolean {
        return true;
    }

    constructor(game: ServerGame, min: VectorAbstract, max: VectorAbstract) {
        super(game, min);
        this.hitbox = new RectHitbox(min, max);

        this.game.grid.addEntity(this);
    }

    tick(): void {}

    collideWith() {}

    get data(): Required<EntitiesNetData[EntityType.Wall]> {
        return {
            position: this.hitbox.min,
            max: this.hitbox.max,
            full: {}
        };
    };

    readonly name: string = "wall";
}
