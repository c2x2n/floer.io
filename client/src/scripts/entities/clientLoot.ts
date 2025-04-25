import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { GameSprite, getGameAssetsPath } from "@/scripts/utils/pixi";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { PetalDefinition } from "@common/definitions/petal.ts";
import { Graphics, Text, Container } from "pixi.js";
import { Vec2 } from "@common/utils/vector.ts";
import { MathGraphics, P2 } from "@common/utils/math.ts";
import { Rarity } from "@common/definitions/rarity.ts";
import { Tween } from "@tweenjs/tween.js";

const defaultCenter = Vec2.new(0, -4);

const defaultRadius = 6;
const defaultBoxSize = 50;

function drawPetalPiece(
    xOffset: number, yOffset: number, displaySize: number, petal: PetalDefinition, degree?: number
) {
    const size = GameSprite.getScaleByUnitRadius(displaySize / defaultBoxSize / 2);
    const center = Vec2.sub(defaultCenter, size);

    const piece = new GameSprite(getGameAssetsPath("petal", petal));

    piece.scale = size;
    const { x, y } = center;
    piece.position.set(x + xOffset, y + yOffset);
    piece.setRotation((petal.images?.slotRotation ?? 0) + (degree ?? 0))

    return piece;
}

function drawPetal(petal_box: Container, petal: PetalDefinition) {
    const displaySize = petal.images?.slotDisplaySize ?? 25;
    const offsetX = petal.images?.centerXOffset ?? 0;
    const offsetY = petal.images?.centerYOffset ?? 0;

    if (!petal.equipment && petal.isDuplicate) {
        let radiansNow = 0;
        const count = petal.pieceAmount;
        let degree = 0;

        for (let i = 0; i < count; i++) {
            const { x, y } =
                MathGraphics.getPositionOnCircle(radiansNow, defaultRadius)
            petal_box.addChild(
                drawPetalPiece(x + offsetX, y + offsetY,displaySize, petal, degree)
            );

            radiansNow += P2 / count;
            degree += petal.images?.slotRevolution ?? 0
        }
    } else {
        petal_box.addChild(
            drawPetalPiece(offsetX, offsetY, displaySize, petal)
        );
    }

    return petal_box;
}

export class ClientLoot extends ClientEntity {
    type = EntityType.Loot;

    background = new Graphics();

    pieces: Container = new Container();

    name: Text = new Text({
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 10,
            fill: "#fff",
            stroke: {color: "#000", width: 2}
        }
    });

    definition!: PetalDefinition;

    animations: Tween[] = [];

    constructor(game: Game, id: number) {
        super(game, id);

        this.game.camera.addObject(this.container);
    }

    override render(dt: number): void {}

    override updateFromData(data: EntitiesNetData[EntityType.Petal], isNew: boolean): void {
        this.position = data.position;
        this.container.position = Camera.vecToScreen(this.position);

        if (data.full && isNew){
            this.definition = data.full.definition;

            const rarity = Rarity.fromString(this.definition.rarity);

            this.background.clear()
                .roundRect(-27, -27, 54, 54, 2)
                .fill({ color: "#000", alpha: 0.2 })
                .roundRect(-25, -25, 50, 50, 2)
                .fill(rarity.border)
                .roundRect(-22, -22, 44, 44, 2)
                .fill(rarity.color);

            this.container.zIndex = -1;

            this.background.zIndex = -1;

            drawPetal(this.container, this.definition);

            this.name.text = this.definition.displayName;

            this.name.anchor.set(0.5);
            this.name.position.set(0, 13)

            this.name.zIndex = 0;

            this.container.addChild(
                this.pieces,
                this.background,
                this.name
            );

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
