import { ClientEntity } from "./clientEntity";
import { EntityType } from "../../../../common/src/constants";
import { EntitiesNetData } from "../../../../common/src/net/packets/updatePacket";
import { ProjectileDefinition } from "../../../../common/src/definitions/projectiles";
import { Camera } from "../render/camera";
import { Tween } from "@tweenjs/tween.js";
import { P2 } from "../../../../common/src/maths/constants";
import { getAssets } from "../../assets/assets";
import { Geometry } from "../../../../common/src/maths/geometry";

export class ClientProjectile extends ClientEntity {
    type = EntityType.Projectile;

    definition?: ProjectileDefinition;

    visible = true;

    render(dt: number) {
        super.render(dt);

        this.updateContainerPosition(6);

        if (!this.definition) return;

        if (this.container.visible) {
            const assets = getAssets("projectile", this.definition);
            if (assets) assets(this.container);
        }
    }

    updateFromData(data: EntitiesNetData[EntityType.Projectile], isNew: boolean): void {
        this.position = data.position;
        this.direction = data.direction;

        if (data.full) {
            if (isNew) {
                this.container.position = Camera.vecToScreen(this.position);
                this.definition = data.full.definition;

                this.hitboxRadius = data.full.hitboxRadius;
                this.container.radius = Camera.unitToScreen(this.hitboxRadius);
                this.container.rotation = Geometry.directionToRadians(data.direction);
                if (this.definition.onGround) {
                    this.container.zIndex = -999;
                }

                if (this.definition.showingCrossBackground) {
                    const amount = this.definition.showingCrossBackground;
                    this.container.dotsData = [];
                    let radiansNow = 0;
                    console.log(this.id, radiansNow);
                    for (let i = 0; i < amount; i++) {
                        const { x, y }
                            = Geometry.getPositionOnCircle(
                                radiansNow, 4000
                            );

                        this.container.dotsData.push({ x, y });

                        radiansNow += P2 / amount;
                    }
                }
            }
        }

        super.updateFromData(data, isNew);
    }

    destroy() {
        this.game.addTween(
            new Tween({ scale: 1, alpha: 1 })
                .to({ scale: 3, alpha: 0 }, 150)
                .onUpdate(d => {
                    this.container.scale = d.scale;
                    this.container.alpha = d.alpha;
                })
            , super.destroy.bind(this)
        );
    }
}
