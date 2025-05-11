import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { Game } from "@/scripts/game";
import { Camera } from "@/scripts/render/camera.ts";
import { VectorAbstract } from "@common/utils/vector.ts";
import { EntitiesNetData } from "@common/net/packets/updatePacket.ts";


export class ClientWall extends ClientEntity {
    type = EntityType.Wall;

    constructor(game: Game, id: number) {
        super(game, id);
    }

    render(dt: number) {
        super.render(dt);

        if (!this.min || !this.max) return

        const { ctx } = this;

        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 0.3;

        ctx.beginPath()
        ctx.roundRect(
            this.min.x,
            this.min.y,
            this.max.x - this.min.x,
            this.max.y - this.min.y,
            10
        )

        ctx.fill()
    }

    min?: VectorAbstract;
    max?: VectorAbstract;

    override updateFromData(data: EntitiesNetData[EntityType.Wall], isNew: boolean): void {
        if (isNew) {
            this.min = Camera.vecToScreen(data.position);
            this.max = Camera.vecToScreen(data.max);
        }
    }
}
