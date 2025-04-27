import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Graphics } from "pixi.js";


export class ClientWall extends ClientEntity {
    type = EntityType.Wall;

    background = new Graphics();

    constructor(game: Game, id: number) {
        super(game, id);

        this.game.camera.addObject(this.container);

        this.container.addChild(
            this.background
        )
    }

    override render(dt: number): void {}

    override updateFromData(data: EntitiesNetData[EntityType.Wall], isNew: boolean): void {
        if (isNew) {
            const min = data.position;
            const max = data.max;
            this.background.clear()
                .roundRect(
                    Camera.unitToScreen(min.x),
                    Camera.unitToScreen(min.y),
                    Camera.unitToScreen(max.x) - Camera.unitToScreen(min.x),
                    Camera.unitToScreen(max.y) - Camera.unitToScreen(min.y),
                    100
                ).fill( { color: 0x000, alpha: 0.5 } )
        }
    }

    destroy() {
        super.destroy();
        this.background.clear();
    }
}
