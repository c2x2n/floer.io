import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { GameSprite } from "@/scripts/utils/pixi";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Vec2 } from "@common/utils/vector.ts";

export class ClientPetal extends ClientEntity {
    type = EntityType.Petal;

    images = {
        body: new GameSprite()
    };

    constructor(game: Game, id: number) {
        super(game, id);

        this.game.camera.addObject(this.container);

        this.container.addChild(
            this.images.body
        );
    }

    render(): void {
        const position = Camera.vecToScreen(this.position);
        this.container.position = position;
    }

    updateFromData(_data: EntitiesNetData[EntityType.Petal], _isNew: boolean): void {
        this.position = _data.position;
        this.images.body.setFrame(`${_data.definition.idString}.svg`).setScale(_data.definition.radius)
        this.images.body.setVisible(!_data.isReloading)
    }

    destroy() {
        this.game.camera.container.removeChild(this.container);
    }
}
