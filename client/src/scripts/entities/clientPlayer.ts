import { ClientEntity } from "./clientEntity";
import { EntityType, GameConstants } from "@common/constants";
import { GameSprite, getGameAssetsPath } from "@/scripts/utils/pixi";
import { Game } from "@/scripts/game";
import { EntitiesNetData, PlayerState } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Graphics, Text, Container } from "pixi.js";
import { MathNumeric } from "@common/utils/math.ts";
import { Tween } from "@tweenjs/tween.js";
import { Vec2 } from "@common/utils/vector.ts";

export class ClientPlayer extends ClientEntity {
    type = EntityType.Player;

    images = {
        body: new GameSprite(getGameAssetsPath("flower","body"))
            .setScaleByUnitRadius(GameConstants.player.radius)
    };

    body: Graphics = new Graphics();

    name: Text;

    healthPercent = 1.0;
    healthBar = new Graphics();

    lastGettingDamage: number = 0;

    constructor(game: Game, id: number) {
        super(game, id)

        this.container.zIndex = 2;

        this.name = new Text({
            text: this.game.playerData.get(id)?.name,
            style: {
                fontFamily: 'Ubuntu',
                fontSize: 14,
                fill: "#fff",
                stroke: {color: "#000", width: 2}
            },
            resolution: 1.5,
        });

        this.name.anchor.set(0.5);
        this.name.position.set(0, -50);
        this.healthBar.position.set(0, 50);

        this.container.addChild(
            this.body,
            this.name,
            this.healthBar,
        );

        this.game.camera.addObject(this.container);
    }

    mouthTopPosition: number = 0;
    eyeTrianglePosition: number = 0;
    eyeDirection: number = 0;

    getMouthTopPosition(): number {
        switch (this.state) {
            case PlayerState.Poisoned:
                return -1;
            case PlayerState.Attacking:
                return -3;
            case PlayerState.Defending:
                return -2;
            case PlayerState.Danded:
                return -1;
        }
        return 3;
    }

    render(dt: number): void {
        super.render(dt);

        const name = this.game.playerData.get(this.id)?.name;

        if( name ) this.name.text = name;

        this.updateContainerPosition(4);

        const mouthX = 6;
        const mouthY = 9;

        this.mouthTopPosition = MathNumeric.targetEasing(
            this.mouthTopPosition, this.getMouthTopPosition() + mouthY
        )

        const radius = Camera.unitToScreen(GameConstants.player.radius);

        const firstEyeCenter = Vec2.new(-6.2,-4.8);
        const eyeWidth = 3;
        const eyeHeight = 6.5;
        const eyeStroke = 4;

        this.eyeTrianglePosition = MathNumeric.targetEasing(
            this.eyeTrianglePosition, (this.state === PlayerState.Attacking ? -3.5 : -8) + firstEyeCenter.y
        )

        this.eyeDirection =
            MathNumeric.targetEasing(this.eyeDirection, Vec2.directionToRadians(this.direction))

        const eyeInsideWidth = 2;
        const eyeInsideHeight = 5;

        const radians = this.eyeDirection;

        const ellRadius = Math.sqrt(
            (eyeInsideWidth * Math.sin(radians)) ** 2 + (eyeInsideHeight * Math.cos(radians)) ** 2
        )

        const eyeballPosition =
            Vec2.new(
                eyeInsideWidth * eyeInsideHeight * Math.cos(radians) / ellRadius,
                eyeInsideWidth * eyeInsideHeight * Math.sin(radians) / ellRadius,
            )

        this.body.clear()
            .circle(0, 0, radius)
            .fill(0xffe862)
            .stroke({ width: 3, color: 0xb9b74f })
            .moveTo(-mouthX, mouthY)
            .bezierCurveTo(0,
                this.mouthTopPosition,
                0,
                this.mouthTopPosition,
                mouthX,
                mouthY
            )
            .stroke({ width: 1.7, color: 0x000 })
            .ellipse(firstEyeCenter.x, firstEyeCenter.y, eyeWidth, eyeHeight)
            .fill(0x000)
            .ellipse(-firstEyeCenter.x, firstEyeCenter.y, eyeWidth, eyeHeight)
            .fill(0x000)
            .circle(
                firstEyeCenter.x + eyeballPosition.x,
                firstEyeCenter.y + eyeballPosition.y,
                3.5
            )
            .stroke({ width: 1, color: 0x000 })
            .fill(0xffffff)
            .circle(
                -firstEyeCenter.x + eyeballPosition.x,
                firstEyeCenter.y + eyeballPosition.y,
                3.5
            )
            .stroke({ width: 1, color: 0x000 })
            .fill(0xffffff)
            .ellipse(
                firstEyeCenter.x,
                firstEyeCenter.y, eyeWidth, eyeHeight
            )
            .stroke({ width: 2, color: 0x000 })
            .ellipse(
                -firstEyeCenter.x,
                firstEyeCenter.y, eyeWidth, eyeHeight
            )
            .stroke({ width: 2, color: 0x000 })
            .ellipse(
                firstEyeCenter.x,
                firstEyeCenter.y, eyeWidth + eyeStroke / 2, eyeHeight + eyeStroke / 2)
            .stroke({ width: eyeStroke, color: 0xffe862 })
            .ellipse(
                -firstEyeCenter.x,
                firstEyeCenter.y, eyeWidth + eyeStroke / 2, eyeHeight + eyeStroke / 2)
            .stroke({ width: eyeStroke, color: 0xffe862 })
            .poly([firstEyeCenter.x + eyeWidth,
                firstEyeCenter.y + this.eyeTrianglePosition,
                firstEyeCenter.x + eyeWidth,
                firstEyeCenter.y + this.eyeTrianglePosition + eyeWidth * 2,
                firstEyeCenter.x - eyeWidth * 2,
                firstEyeCenter.y + this.eyeTrianglePosition,
            ], true)
            .fill(0xffe862)
            .poly([-firstEyeCenter.x - eyeWidth,
                firstEyeCenter.y + this.eyeTrianglePosition,
                -firstEyeCenter.x - eyeWidth,
                firstEyeCenter.y + this.eyeTrianglePosition + eyeWidth * 2,
                -firstEyeCenter.x + eyeWidth * 2,
                firstEyeCenter.y + this.eyeTrianglePosition,
            ], true)
            .fill(0xffe862);
    }

    drawHealthBar(): void {
        const healthbarWidth = 80;
        const fillWidth = this.healthPercent * healthbarWidth;

        this.healthBar.visible = this.healthPercent < 1.0;
        this.healthBar.clear()
            .roundRect((-healthbarWidth - 5) / 2, 0, healthbarWidth + 5, 10)
            .fill({
                color: 0x000000,
                alpha: 0.3
            })
            .roundRect(-healthbarWidth / 2, 3 / 2, fillWidth, 7)
            .fill({
                color: 0x87e63e
            });
    }

    state: PlayerState = PlayerState.Normal;

    updateFromData(data: EntitiesNetData[EntityType.Player], isNew: boolean): void {
        this.position = data.position;
        this.direction = data.direction;

        if (isNew){
            this.container.position = Camera.vecToScreen(this.position);
        } else {
            if (data.full) {
                if (this.healthPercent > data.full.healthPercent) {
                    this.getDamageAnimation(this.images.body)
                }
            }
        }

        // if (data.state.poisoned) {
        //     this.images.body.setFrame(getGameAssetsPath("flower","poisoned_body"))
        // } else if (data.state.danded) {
        //     this.images.body.setFrame(getGameAssetsPath("flower","danded_body"))
        // } else {
        //     this.images.body.setFrame(getGameAssetsPath("flower","body"))
        // }

        if (data.full) {
            this.healthPercent = data.full.healthPercent;
            this.drawHealthBar();
        }

        this.state = data.state;

        super.updateFromData(data, isNew);
    }

    destroy() {
        this.game.addTween(
            new Tween({ scale: this.images.body.scale.x, alpha: 1 },)
                .to({ scale: this.images.body.scale.x * 3, alpha: 0 }, 200 )
                .onUpdate(d => {
                    this.images.body.setScale(d.scale);
                    this.images.body.setAlpha(d.alpha);
                }),
            super.destroy.bind(this)
        )
    }
}
