import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { ProjectileDefinition } from "@common/definitions/projectile.ts";
import { petalAssets } from "@/assets/petal.ts";
import { projectileAssets } from "@/assets/projectile.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { Tween } from "@tweenjs/tween.js";
import { MathGraphics, P2 } from "@common/utils/math.ts";

export class ClientProjectile extends ClientEntity {
    type = EntityType.Projectile;

    definition?: ProjectileDefinition;

    visible: boolean = true;

    constructor(game: Game, id: number) {
        super(game, id);
    }

    render(dt: number) {
        super.render(dt);

        this.updateContainerPosition(6);

        if (!this.definition) return;

        const name = this.definition.idString;

        if (this.container.visible && projectileAssets.hasOwnProperty(name)) {
            projectileAssets[name](this.container)
        }
    }

    updateFromData(data: EntitiesNetData[EntityType.Projectile], isNew: boolean): void {
        this.position = data.position;

        if (data.full){
            if (isNew) {
                this.container.position = Camera.vecToScreen(this.position)
                this.definition = data.full.definition;
                this.direction = data.direction;
                this.hitboxRadius = data.full.hitboxRadius;
                this.container.radius = Camera.unitToScreen(this.hitboxRadius);
                this.container.rotation = Vec2.directionToRadians(data.direction);
                if (this.definition.onGround){
                    this.container.zIndex = -999
                }

                if (this.definition.showingXBackground) {
                    const amount = this.definition.showingXBackground;
                    this.container.dotsData = []
                    let radiansNow = Vec2.directionToRadians(this.direction);
                    for (let i = 0; i < amount; i++) {
                        const { x, y } =
                            MathGraphics.getPositionOnCircle(
                                radiansNow, 4000
                            )

                        this.container.dotsData.push({x, y})

                        radiansNow += P2 / amount;
                    }
                }
            }
        }

        super.updateFromData(data, isNew);
    }

    destroy() {
        this.game.addTween(
            new Tween({ scale: 1, alpha: 1 },)
                .to({ scale: 3, alpha: 0 }, 150 )
                .onUpdate(d => {
                    this.container.scale = d.scale;
                    this.container.alpha = d.alpha;
                })
            , super.destroy.bind(this)
        )
    }
}
