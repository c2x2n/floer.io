import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { Game } from "@/scripts/game";


export class ClientWall extends ClientEntity {
    type = EntityType.Wall;

    constructor(game: Game, id: number) {
        super(game, id);
    }
}
