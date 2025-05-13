import { ClientEntity } from "./clientEntity";
import { EntityType } from "../../../../common/src/constants";
import { Game } from "../game";
import { EntitiesNetData } from "../../../../common/src/net/packets/updatePacket";
import { Camera } from "../render/camera";
import { MobDefinition } from "../../../../common/src/definitions/mobs";
import { UVec2D } from "../../../../common/src/physics/utils";
import { Rarity } from "../../../../common/src/definitions/rarities";
import { Tween, Easing } from "@tweenjs/tween.js";
import { Geometry, Numeric } from "../../../../common/src/maths/math";
import { getAssets, getGameAssetsName } from "../../assets/assets";

export class ClientMob extends ClientEntity {
    type = EntityType.Mob;

    healthPercent = 1;

    definition?: MobDefinition;

    lastGettingDamage = 0;

    constructor(game: Game, id: number) {
        super(game, id);
    }

    selfRotation = 0;

    render(dt: number): void {
        super.render(dt);

        if (!this.definition) return;

        if (this.definition.movement?.sandstormLike) {
        } else {
            if (this.definition.images?.rotation) {
                this.selfRotation += this.definition.images.rotation * this.game.dt;

                this.container.rotation = this.selfRotation;
                return;
            } else {
                const actualDirection = this.direction;
                this.container.rotation
                    = Geometry.directionToRadians(UVec2D.targetEasing(
                        Geometry.radiansToDirection(this.container.rotation),
                        actualDirection, 6)
                    );
            }
        }

        this.updateContainerPosition(8);

        const movementDistance = UVec2D.distanceBetween(this.oldPosition, this.position);
        if (movementDistance) {
            this.playMovementAnimation(movementDistance);
        }

        this.container.radius = Camera.unitToScreen(this.hitboxRadius);

        const assets = getAssets("mob", this.definition);
        if (assets) assets(this.container);
    }

    staticRender(dt: number): void {
        super.staticRender(dt);

        this.drawHealthBar();
    }

    healthBarY = 0;

    drawHealthBar(): void {
        if (!this.definition) return;

        const { ctx } = this;
        const positionY = this.healthBarY;

        const healthBarWidth = Numeric.clamp(
            Camera.unitToScreen(this.definition.hitboxRadius) * 2,
            80,
            Infinity
        );
        const fillWidth = healthBarWidth * this.healthPercent;

        if (this.definition.hideInformation) {
            if (this.healthPercent > 0.999) return;
        } else {
            const name = this.definition.displayName;
            ctx.textAlign = "left";
            ctx.textBaseline = "bottom";
            ctx.font = "11px Ubuntu";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeText(name, -healthBarWidth / 2, positionY - 6);
            ctx.font = "11px Ubuntu";
            ctx.fillStyle = "#ffffff";
            ctx.fillText(name, -healthBarWidth / 2, positionY - 6);

            const rarity = Rarity.fromString(this.definition.rarity);
            ctx.fillStyle = rarity.color;
            ctx.textAlign = "right";
            ctx.textBaseline = "top";
            ctx.strokeText(rarity.displayName, (healthBarWidth + 5) / 2, positionY + 6);
            ctx.fillText(rarity.displayName, (healthBarWidth + 5) / 2, positionY + 6);
        }

        ctx.fillStyle = "#000000";
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.roundRect((-healthBarWidth - 5) / 2, positionY - 5, healthBarWidth + 5, 10, 10);
        ctx.fill();

        ctx.globalAlpha = 1;
        ctx.fillStyle = "#87e63e";
        ctx.beginPath();
        ctx.roundRect(-healthBarWidth / 2, positionY + 3 / 2 - 5, fillWidth, 7, 10);
        ctx.fill();
    }

    updateFromData(data: EntitiesNetData[EntityType.Mob], isNew: boolean): void {
        this.position = data.position;
        this.direction = data.direction;

        if (data.full) {
            this.definition = data.full.definition;
            this.hitboxRadius = this.definition.hitboxRadius;

            if (isNew) {
                this.container.position = Camera.vecToScreen(this.position);
                this.container.rotation = Geometry.directionToRadians(data.direction);
                this.container.radius = Camera.unitToScreen(this.hitboxRadius);

                this.healthBarY = Camera.unitToScreen(this.definition.hitboxRadius + 5 / 20) + 6;

                if (this.definition.idString === "sandstorm") {
                    this.container.rotation = Math.random() * Math.PI * 2;
                } else {
                    this.container.rotation = Geometry.directionToRadians(data.direction);
                }
            }

            if (isNew || this.healthPercent != data.full.healthPercent) {
                if (!isNew && this.healthPercent > data.full.healthPercent) { this.getDamageAnimation(); }
                this.healthPercent = data.full.healthPercent;
                const rarity = Rarity.fromString(this.definition.rarity);
                if (rarity.globalMessage && !this.definition.hideInformation) {
                    this.game.bossbar.bossbarDatas.set(this.id, {
                        mob: this.definition,
                        healthPercent: this.healthPercent
                    });
                }
            }
        }

        super.updateFromData(data, isNew);
    }

    lastMovementAnimation = 0;
    lastMovementAnimationTime = 0;
    lastScale = 1;

    playMovementAnimation(size: number): void {
        if (!this.definition) return;
        if (Date.now() - this.lastMovementAnimation < this.lastMovementAnimationTime * 2) return;
        let time = 150;

        this.lastMovementAnimation = Date.now();
        if (this.definition.images?.mouth) {
            time
                = Numeric.remap(size, 0, 0.3, 500, 150);
            this.game.addTween(
                new Tween({ angle: 0 })
                    .to({ angle: 8 }, time)
                    .onUpdate(d => {
                        this.container.transing = d.angle;
                    })
            );

            this.game.addTween(
                new Tween({ angle: 8 })
                    .delay(time)
                    .to({ angle: 0 }, time)
                    .onUpdate(d => {
                        this.container.transing = d.angle;
                    })
            );
        }

        if (this.definition.images?.legs) {
            time
                = Numeric.remap(size, 0, 0.3, 600, 160);
            this.game.addTween(
                new Tween({ angle: 0 })
                    .to({ angle: 20 }, time)
                    .onUpdate(d => {
                        this.container.transing = d.angle;
                    })
            );

            this.game.addTween(
                new Tween({ angle: 20 })
                    .delay(time)
                    .to({ angle: 0 }, time)
                    .onUpdate(d => {
                        this.container.transing = d.angle;
                    })
            );
        }

        this.lastMovementAnimationTime = time;
    }

    destroy() {
        this.getDamageAnimation();
        this.game.addTween(
            new Tween({ scale: this.container.scale, alpha: 1 })
                .to({ scale: this.container.scale * 4, alpha: 0 }, 200)
                .onUpdate(d => {
                    this.container.scale = d.scale;
                    this.container.alpha = d.alpha;
                }),
            super.destroy.bind(this)
        );

        this.game.bossbar.bossbarDatas["delete"](this.id);
    }
}
