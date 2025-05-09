import { ClientEntity } from "./clientEntity";
import { EntityType, GameConstants, PlayerState } from "@common/constants";
import { Game } from "@/scripts/game";
import { Camera } from "@/scripts/render/camera.ts";
import { MathNumeric, P2 } from "@common/utils/math.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { EntitiesNetData } from "@common/net/packets/updatePacket.ts";

export class ClientPlayer extends ClientEntity {
    type = EntityType.Player;

    healthPercent = 1.0;

    shieldPercent = 0.0;

    lastGettingDamage: number = 0;

    constructor(game: Game, id: number) {
        super(game, id)
        this.hitboxRadius = GameConstants.player.radius;
    }

    mouthTopPosition: number = 0;
    eyeTrianglePosition: number = 0;
    eyeDirection: number = 0;

    state: PlayerState = PlayerState.Normal;

    admin: boolean = false;

    updateFromData(data: EntitiesNetData[EntityType.Player], isNew: boolean): void {
        this.position = data.position;
        this.direction = data.direction;

        if (data.gotDamage) {
            if (this.id == this.game.activePlayerID) {
                this.game.camera.screenShake();
            }
            this.getDamageAnimation(true);
        }

        if (isNew && data.full) {
            this.container.position = Camera.vecToScreen(data.position);
            this.admin = data.full.isAdmin;
            this.container.zIndex = 3;
        }

        if (data.full) {
            this.hitboxRadius = GameConstants.player.radius;
            if (data.full.healthPercent != this.healthPercent
                || data.full.shieldPercent != this.shieldPercent) {
                this.healthPercent = data.full.healthPercent;
                this.shieldPercent = data.full.shieldPercent ?? 0;
            }
        }

        this.state = data.state;

        super.updateFromData(data, isNew);
    }

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
        return 2.7;
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

        this.updateContainerPosition(4)

        this.drawFlower()
    }

    drawFlower() {
        const mouthX = 6.2;
        const mouthY = 9;

        this.mouthTopPosition = MathNumeric.targetEasing(
            this.mouthTopPosition, this.getMouthTopPosition() + mouthY
        )

        const radius = Camera.unitToScreen(GameConstants.player.radius);

        const colors = this.getBodyColor();
        const bodyColor = this.container.getRenderColor(colors[0]);
        const borderColor = this.container.getRenderColor(colors[1]);

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

        this.ctx.beginPath()
        this.ctx.fillStyle = bodyColor;
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = borderColor;
        this.ctx.arc(
            0, 0,
            radius,
            0, P2
        )
        this.ctx.fill()
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.lineWidth = 1.7;
        this.ctx.strokeStyle = "#000000";
        this.ctx.moveTo(-mouthX, mouthY)
        this.ctx.bezierCurveTo(0, this.mouthTopPosition, 0, this.mouthTopPosition, mouthX, mouthY)
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.fillStyle = "#000000";
        this.ctx.ellipse(
            firstEyeCenter.x, firstEyeCenter.y,
            eyeWidth, eyeHeight, 0, 0, P2
        )
        this.ctx.fill()

        this.ctx.beginPath()
        this.ctx.fillStyle = "#000000";
        this.ctx.ellipse(
            -firstEyeCenter.x, firstEyeCenter.y,
            eyeWidth, eyeHeight, 0, 0, P2
        )
        this.ctx.fill()

        this.ctx.beginPath()
        this.ctx.lineWidth = 1;
        this.ctx.fillStyle = "#ffffff";
        this.ctx.arc(
            firstEyeCenter.x + eyeballPosition.x, firstEyeCenter.y + eyeballPosition.y,
            3.5,
            0, P2
        )
        this.ctx.fill()
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.fillStyle = "#ffffff";
        this.ctx.arc(
            -firstEyeCenter.x + eyeballPosition.x, firstEyeCenter.y + eyeballPosition.y,
            3.5,
            0, P2
        )
        this.ctx.fill()
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.lineWidth = 2;
        this.ctx.ellipse(
            firstEyeCenter.x, firstEyeCenter.y,
            eyeWidth, eyeHeight, 0, 0, P2
        )
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.ellipse(
            -firstEyeCenter.x, firstEyeCenter.y,
            eyeWidth, eyeHeight, 0, 0, P2
        )
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.strokeStyle = bodyColor;
        this.ctx.lineWidth = eyeStroke;
        this.ctx.ellipse(
            firstEyeCenter.x, firstEyeCenter.y,
            eyeWidth + eyeStroke / 2, eyeHeight + eyeStroke / 2, 0, 0, P2
        )
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.ellipse(
            -firstEyeCenter.x, firstEyeCenter.y,
            eyeWidth + eyeStroke / 2, eyeHeight + eyeStroke / 2, 0, 0, P2
        )
        this.ctx.stroke()

        this.ctx.beginPath()
        this.ctx.fillStyle = bodyColor;
        this.ctx.moveTo(
            firstEyeCenter.x + eyeWidth,
            firstEyeCenter.y + this.eyeTrianglePosition
        )
        this.ctx.lineTo(
            firstEyeCenter.x + eyeWidth,
            firstEyeCenter.y + this.eyeTrianglePosition + eyeWidth * 2
        )
        this.ctx.lineTo(
            firstEyeCenter.x - eyeWidth * 2,
            firstEyeCenter.y + this.eyeTrianglePosition
        )
        this.ctx.fill()

        this.ctx.beginPath()
        this.ctx.moveTo(
            -firstEyeCenter.x - eyeWidth,
            firstEyeCenter.y + this.eyeTrianglePosition
        )
        this.ctx.lineTo(
            -firstEyeCenter.x - eyeWidth,
            firstEyeCenter.y + this.eyeTrianglePosition + eyeWidth * 2
        )
        this.ctx.lineTo(
            -firstEyeCenter.x + eyeWidth * 2,
            firstEyeCenter.y + this.eyeTrianglePosition
        )
        this.ctx.fill()
    }

    staticRender(dt: number) {
        super.staticRender(dt);

        const name = this.game.playerData.get(this.id)?.name ?? GameConstants.player.defaultName;

        this.drawHealthBar()

        const { ctx } = this;

        ctx.font = "14px Ubuntu";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillStyle = this.admin ? "#d95e5e" : "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText(name, 0, -50);
        ctx.fillText(name, 0, -50);
    }

    drawHealthBar() {
        const { ctx } = this;
        const healthbarWidth = 80;
        const healthbarY = 40;
        const fillWidth = this.healthPercent * healthbarWidth;
        const shieldWidth = this.shieldPercent * healthbarWidth;

        const healthBarVisible =
            this.healthPercent < 1.0
            || this.shieldPercent > 0;

        if (healthBarVisible) {
            ctx.fillStyle = "#000000";
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.roundRect((-healthbarWidth - 5) / 2, healthbarY, healthbarWidth + 5, 10, 10);
            ctx.fill();

            ctx.globalAlpha = 1;
            ctx.fillStyle = "#87e63e";
            ctx.beginPath()
            ctx.roundRect(-healthbarWidth / 2, healthbarY + 3 / 2, fillWidth, 7, 10)
            ctx.fill()
        }
        if (this.shieldPercent > 0) {
            ctx.fillStyle = "#000000";
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.roundRect((-healthbarWidth - 5) / 2, healthbarY - 7, healthbarWidth + 5, 6, 10);
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.globalAlpha = 0.8;
            ctx.beginPath()
            ctx.roundRect(-healthbarWidth / 2,  healthbarY - 7 + 1, shieldWidth, 4, 10)
            ctx.fill();
        }
    }
}
