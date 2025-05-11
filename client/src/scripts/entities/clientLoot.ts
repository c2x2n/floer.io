import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/net/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { PetalDefinition } from "@common/definitions/petals.ts";
import { Rarity } from "@common/definitions/rarities.ts";
import { Tween } from "@tweenjs/tween.js";
import { ICON_drawPetal } from "@/scripts/utils/icons.ts";
import { Random } from "@common/utils/random.ts";
import { halfPI, P2 } from "@common/utils/math.ts";

export class ClientLoot extends ClientEntity {
    type = EntityType.Loot;

    definition!: PetalDefinition;

    animations: Tween[] = [];

    constructor(game: Game, id: number) {
        super(game, id);

        this.container.scale = 0;
    }

    override render(dt: number): void {
        super.render(dt);
        const rarity = Rarity.fromString(this.definition.rarity);

        const { ctx } = this;

        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.roundRect(
            -30,
            -30,
            59,
            59,
            2
        )
        ctx.fill()

        ctx.fillStyle = rarity.color;
        ctx.strokeStyle = rarity.border;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.roundRect(
            -25,
            -25,
            50,
            50,
            2
        )
        ctx.fill()
        ctx.stroke()

        ICON_drawPetal(ctx, this.definition);
    }

    override updateFromData(data: EntitiesNetData[EntityType.Petal], isNew: boolean): void {
        this.position = data.position;
        this.container.position = Camera.vecToScreen(this.position);

        if (data.full && isNew){
            this.definition = data.full.definition;
            const targetRotation = Random.float(0.1, -0.1);

            this.container.zIndex = -888;

            this.animations.push(this.game.addTween(
                new Tween({ scale: 0, alpha: 0, rotation: -halfPI })
                    .to({ scale: 0.85, alpha: 1, rotation: targetRotation }, 200 )
                    .onUpdate(d => {
                        this.container.scale = d.scale;
                        this.container.alpha = d.alpha;
                        this.container.rotation = d.rotation;
                    }),
                () => {
                    this.animations.push(this.game.addTween(
                        new Tween({ scale: 0.9 })
                            .to({ scale: 1.05 }, 400 )
                            .repeat(Infinity)
                            .onUpdate(d => {
                                this.container.scale = d.scale;
                            })
                    ));

                    this.animations.push(this.game.addTween(
                        new Tween({ scale: 1.05 })
                            .delay(400)
                            .to({ scale: 0.9 }, 400 )
                            .repeat(Infinity)
                            .onUpdate(d => {
                                this.container.scale = d.scale;
                            })
                    ));
                }
            ));
        }
    }

    destroy() {
        this.game.addTween(
            new Tween({ scale: 1 })
                .to({ scale: 0 }, 80 )
                .onUpdate(d => {
                    this.container.scale = d.scale;
                }),
            super.destroy.bind(this)
        )
        this.animations.forEach(t => {
            this.game.removeTween(t);
            t.stop();
        });
    }
}
