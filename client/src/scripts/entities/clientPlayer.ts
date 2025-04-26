import { ClientEntity } from "./clientEntity";
import { EntityType, GameConstants, PlayerState } from "@common/constants";
import { GameSprite, getGameAssetsPath } from "@/scripts/utils/pixi";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Graphics, Text, Container } from "pixi.js";
import { MathNumeric } from "@common/utils/math.ts";
import { Tween } from "@tweenjs/tween.js";
import { Vec2 } from "@common/utils/vector.ts";

export class ClientPlayer extends ClientEntity {
    type = EntityType.Player;

    body: Graphics = new Graphics();

    name: Text = new Text({
        text: "",
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 14,
            fill: "#fff",
            stroke: {color: "#000", width: 2}
        },
        resolution: 1.5,
    });

    healthPercent = 1.0;
    healthBar = new Graphics();

    // 添加护盾相关属性
    shieldPercent = 0.0;
    shieldBar = new Graphics();

    lastGettingDamage: number = 0;

    constructor(game: Game, id: number) {
        super(game, id)
        this.hitboxRadius = GameConstants.player.radius;

        this.container.zIndex = 2;

        this.name.anchor.set(0.5);
        this.name.position.set(0, -50);
        this.healthBar.position.set(0, 50);

        this.container.addChild(
            this.body,
        );

        this.staticContainer.addChild(
            this.name,
            this.healthBar,
            this.shieldBar
        )
    }

    mouthTopPosition: number = 0;
    eyeTrianglePosition: number = 0;
    eyeDirection: number = 0;

    getMouthTopPosition(): number {
        switch (this.state) {
            case PlayerState.Poisoned:
                return -3;
            case PlayerState.Attacking:
                return -3;
            case PlayerState.Defending:
                return -2;
            case PlayerState.Danded:
                return -3;
        }
        return 3;
    }

    getBodyColor(): [number, number] {
        switch (this.state) {
            case PlayerState.Poisoned:
                return [0xcc77db, 0xa95fb5];
            case PlayerState.Danded:
                return [0xffee92, 0xd2c374];
        }
        return [0xffe862, 0xd2bd47];
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

        const colors = this.getBodyColor();
        const bodyColor = colors[0];
        const borderColor = colors[1];

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
            .fill(bodyColor)
            .stroke({ width: 3, color: borderColor })
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
            .stroke({ width: eyeStroke, color: bodyColor })
            .ellipse(
                -firstEyeCenter.x,
                firstEyeCenter.y, eyeWidth + eyeStroke / 2, eyeHeight + eyeStroke / 2)
            .stroke({ width: eyeStroke, color: bodyColor })
            .poly([firstEyeCenter.x + eyeWidth,
                firstEyeCenter.y + this.eyeTrianglePosition,
                firstEyeCenter.x + eyeWidth,
                firstEyeCenter.y + this.eyeTrianglePosition + eyeWidth * 2,
                firstEyeCenter.x - eyeWidth * 2,
                firstEyeCenter.y + this.eyeTrianglePosition,
            ], true)
            .fill(bodyColor)
            .poly([-firstEyeCenter.x - eyeWidth,
                firstEyeCenter.y + this.eyeTrianglePosition,
                -firstEyeCenter.x - eyeWidth,
                firstEyeCenter.y + this.eyeTrianglePosition + eyeWidth * 2,
                -firstEyeCenter.x + eyeWidth * 2,
                firstEyeCenter.y + this.eyeTrianglePosition,
            ], true)
            .fill(bodyColor);
    }

    reddrawHealthBar(): void {
        const healthbarWidth = 80;
        const fillWidth = this.healthPercent * healthbarWidth;

        // 有护盾时总是显示血条
        this.healthBar.visible =
            this.healthPercent < 1.0 || this.shieldPercent > 0;

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

        // 绘制护盾条
        if (this.shieldPercent > 0) {
            const shieldWidth = this.shieldPercent * healthbarWidth;
            this.shieldBar.visible = true;
            this.shieldBar.position.set(0, 43);
            this.shieldBar.clear()
                .roundRect((-healthbarWidth - 5) / 2, 0, healthbarWidth + 5, 6)
                .fill({
                    color: 0x000000,
                    alpha: 0.3
                })
                .roundRect(-healthbarWidth / 2, 1, shieldWidth, 4)
                .fill({
                    color: 0xffffff,
                    alpha: 0.8
                });
        } else {
            this.shieldBar.visible = false;
        }
    }

    state: PlayerState = PlayerState.Normal;

    updateFromData(data: EntitiesNetData[EntityType.Player], isNew: boolean): void {
        this.position = data.position;
        this.direction = data.direction;

        if (data.gotDamage) {
            this.getDamageAnimation(true)

            if (this.id == this.game.activePlayerID) {
                this.game.camera.screenShake();
            }
        }

        if (data.full) {
            if (isNew){
                this.container.position = Camera.vecToScreen(this.position);
                if (data.full.isAdmin) this.name.style.fill = "#FF0000"
            }

            if (data.full.healthPercent != this.healthPercent
                || data.full.shieldPercent != this.shieldPercent) {
                this.healthPercent = data.full.healthPercent;
                this.shieldPercent = data.full.shieldPercent ?? 0;
                this.reddrawHealthBar();
            }
        }

        this.state = data.state;

        super.updateFromData(data, isNew);
    }

    destroy() {
        if (this.id == this.game.activePlayerID) {
            this.game.camera.screenShake();
        }

        this.game.addTween(
            new Tween({ scale: 1, alpha: 1 },)
                .to({ scale: 3, alpha: 0 }, 100 )
                .onUpdate(d => {
                    this.container.scale = d.scale;
                    this.container.alpha = d.alpha;
                }),
            super.destroy.bind(this)
        )
    }
}
