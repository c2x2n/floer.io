import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { ProjectileDefinition } from "@common/definitions/projectile.ts";

export class ClientProjectile extends ClientEntity {
    type = EntityType.Projectile;

    definition!: ProjectileDefinition;

    visible: boolean = true;

    constructor(game: Game, id: number) {
        super(game, id);
    }

    updateFromData(data: EntitiesNetData[EntityType.Projectile], isNew: boolean): void {
        this.position = data.position;

        if (data.full){
            if (isNew) {

            }
        }

        super.updateFromData(data, isNew);
    }
}
