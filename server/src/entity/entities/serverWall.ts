import { ServerEntity } from "../entity";
import { type EntitiesNetData } from "../../../../common/src/net/packets/updatePacket";
import { RectHitbox } from "../../../../common/src/physics/hitbox";
import { EntityType } from "../../../../common/src/constants";
import { ServerGame } from "../../game";
import VectorAbstract from "../../../../common/src/physics/vectorAbstract";

export class ServerWall extends ServerEntity<EntityType.Wall> {
    type: EntityType.Wall = EntityType.Wall;

    hitbox: RectHitbox;

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
