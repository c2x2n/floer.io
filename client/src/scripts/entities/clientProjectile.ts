import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/net/packets/updatePacket.ts";
import { ProjectileDefinition } from "@common/definitions/projectiles.ts";
import { petalAssets } from "@/assets/petals.ts";
import { projectileAssets } from "@/assets/projectiles.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { Tween } from "@tweenjs/tween.js";
import { Geometry, P2 } from "@common/utils/math.ts";
import { getAssets } from "@/assets/assets.ts";

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

        if (this.container.visible) {
            const assets = getAssets("projectile", this.definition);
            if (assets) assets(this.container);
        }
    }

    updateFromData(data: EntitiesNetData[EntityType.Projectile], isNew: boolean): void {
        this.position = data.position;
        this.direction = data.direction;

        if (data.full){
            if (isNew) {
                this.container.position = Camera.vecToScreen(this.position)
                this.definition = data.full.definition;

                this.hitboxRadius = data.full.hitboxRadius;
                this.container.radius = Camera.unitToScreen(this.hitboxRadius);
                this.container.rotation = Geometry.directionToRadians(data.direction);
                if (this.definition.onGround){
                    this.container.zIndex = -999
                }

                if (this.definition.showingCrossBackground) {
                    const amount = this.definition.showingCrossBackground;
                    this.container.dotsData = []
                    let radiansNow = 0;
                    console.log(this.id, radiansNow)
                    for (let i = 0; i < amount; i++) {
                        const { x, y } =
                            Geometry.getPositionOnCircle(
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
