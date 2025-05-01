import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { PetalDefinition } from "@common/definitions/petal.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { MathGraphics, P2 } from "@common/utils/math.ts";
import { Rarity } from "@common/definitions/rarity.ts";
import { Tween } from "@tweenjs/tween.js";
import { RenderContainer } from "@/scripts/utils/renderContainer.ts";
import { petalAssets } from "@/assets/petal.ts";

const defaultCenter = Vec2.new(0, -4);

const defaultRadius = 6;
const defaultBoxSize = 50;

function drawPetalPiece(
    ctx: CanvasRenderingContext2D,
    xOffset: number,
    yOffset: number,
    displaySize: number,
    petal: PetalDefinition,
    degree?: number
) {
    const { x, y } = defaultCenter;

    const container = new RenderContainer(ctx);
    container.radius = Camera.unitToScreen(displaySize / defaultBoxSize / 2);
    container.position = Vec2.new(
        x + xOffset,
        y + yOffset
    );
    container.rotation = (petal.images?.slotRotation ?? 0) + (degree ?? 0)

    container.renderFunc = () => {
        petalAssets["basic"](container)
    }
    container.render(0);
}

function drawPetal(
    ctx: CanvasRenderingContext2D,
    petal_box: RenderContainer,
    petal: PetalDefinition
) {
    const displaySize = petal.images?.slotDisplaySize ?? 25;
    const offsetX = petal.images?.centerXOffset ?? 0;
    const offsetY = petal.images?.centerYOffset ?? 0;

    if (!petal.equipment && petal.isDuplicate) {
        let radiansNow = 0;
        const count = petal.pieceAmount;
        let degree = 0;

        for (let i = 0; i < count; i++) {
            const { x, y } =
                MathGraphics.getPositionOnCircle(radiansNow, defaultRadius);
            drawPetalPiece(ctx, x + offsetX, y + offsetY,displaySize, petal, degree)
            radiansNow += P2 / count;
            degree += petal.images?.slotRevolution ?? 0
        }
    } else {
        drawPetalPiece(ctx, offsetX, offsetY, displaySize, petal)
    }

    return petal_box;
}

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
            -26,
            -26,
            52,
            52,
            2
        )
        ctx.fill()

        ctx.fillStyle = rarity.color;
        ctx.strokeStyle = rarity.border;
        ctx.lineWidth = 3;
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.roundRect(
            -22,
            -22,
            44,
            44,
            2
        )
        ctx.fill()
        ctx.stroke()

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "10.5px Ubuntu";
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1;

        ctx.strokeText(
            this.definition.displayName,
            0,
            13
        )

        ctx.fillText(
            this.definition.displayName,
            0,
            13
        )

        drawPetal(ctx, this.container, this.definition);
    }

    override updateFromData(data: EntitiesNetData[EntityType.Petal], isNew: boolean): void {
        this.position = data.position;
        this.container.position = Camera.vecToScreen(this.position);

        if (data.full && isNew){
            this.definition = data.full.definition;

            this.animations.push(this.game.addTween(
                new Tween({ scale: 0, alpha: 0 })
                    .to({ scale: 1, alpha: 1 }, 100 )
                    .onUpdate(d => {
                        this.container.scale = d.scale;
                        this.container.alpha = d.alpha;
                    })
            ));

            this.animations.push(this.game.addTween(
                new Tween({ angle: 0.1, scale: 0.95 })
                    .delay(100)
                    .to({ angle: -0.1, scale: 1.05 }, 900 )
                    .repeat(Infinity)
                    .onUpdate(d => {
                        this.container.rotation = d.angle;
                        this.container.scale = d.scale;
                    })
            ));

            this.animations.push(this.game.addTween(
                new Tween({ angle: -0.1, scale: 1.05 })
                    .delay(1000)
                    .to({ angle: 0.1, scale: 0.95 }, 1000 )
                    .repeat(Infinity)
                    .onUpdate(d => {
                        this.container.rotation = d.angle;
                        this.container.scale = d.scale;
                    })
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
