import { ClientEntity } from "./clientEntity";
import { EntityType } from "../../../../common/src/constants";
import { Camera } from "../render/camera";
import { EntitiesNetData } from "../../../../common/src/net/packets/updatePacket";
import VectorAbstract from "../../../../common/src/physics/vectorAbstract";

export class ClientWall extends ClientEntity {
    type = EntityType.Wall;

    render(dt: number) {
        super.render(dt);

        if (!this.min || !this.max) return;

        const { ctx } = this;

        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 0.3;

        ctx.beginPath();
        ctx.roundRect(
            this.min.x,
            this.min.y,
            this.max.x - this.min.x,
            this.max.y - this.min.y,
            10
        );

        ctx.fill();
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
