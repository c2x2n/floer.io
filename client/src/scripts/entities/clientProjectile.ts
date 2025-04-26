import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { GameSprite, getGameAssetsPath } from "@/scripts/utils/pixi";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { Tween } from '@tweenjs/tween.js';
import { ProjectileDefinition } from "@common/definitions/projectile.ts";

export class ClientProjectile extends ClientEntity {
    type = EntityType.Projectile;

    images = {
        body: new GameSprite()
    };

    definition!: ProjectileDefinition;

    visible: boolean = true;

    constructor(game: Game, id: number) {
        super(game, id);

        this.container.zIndex = 3;

        this.images.body.anchor.set(0.5);

        this.container.addChild(
            this.images.body
        );
    }

    render(dt: number): void {
        super.render(dt);

        this.updateContainerPosition(3);
    }

    updateFromData(data: EntitiesNetData[EntityType.Projectile], isNew: boolean): void {
        this.position = data.position;

        if (data.full){
            if (isNew) {
                this.definition = data.full.definition;
                this.hitboxRadius = data.full.hitboxRadius;

                this.container.position = Camera.vecToScreen(this.position);

                this.images.body
                    .setFrame(getGameAssetsPath("projectile", this.definition))
                    .setScaleByUnitRadius(data.full.hitboxRadius)

                if (data.full.definition.onGround) {
                    this.container.zIndex = -2;
                }

                this.images.body.setRotation(Vec2.directionToRadians(data.direction));
            }
        }

        super.updateFromData(data, isNew);
    }

    destroy() {
        this.game.addTween(
            new Tween({ scale: this.images.body.scale.x, alpha: 1 },)
                .to({ scale: this.images.body.scale.x * 3, alpha: 0 }, 150 )
                .onUpdate(d => {
                    this.images.body.setScale(d.scale);
                    this.images.body.setAlpha(d.alpha);
                })
            , super.destroy.bind(this)
        )
    }
}
