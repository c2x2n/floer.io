import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { GameSprite, getGameAssetsPath } from "@/scripts/utils/pixi";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Text, Graphics } from "pixi.js";
import { MathNumeric } from "@common/utils/math.ts";
import { MobDefinition } from "@common/definitions/mob.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { Rarity } from "@common/definitions/rarity.ts";
import { Tween } from '@tweenjs/tween.js';
import { Easing } from '@tweenjs/tween.js';

const defaultImageSize = 200;

export class ClientMob extends ClientEntity {
    type = EntityType.Mob;

    images = {
        body: new GameSprite(),
        left_mouth: new GameSprite(),
        right_mouth: new GameSprite(),
        leg1: new GameSprite(),
        leg2: new GameSprite(),
        leg3: new GameSprite(),
        leg4: new GameSprite()
    };

    healthPercent = 1;
    healthBar = new Graphics();
    name: Text = new Text({
        text: "",
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 11,
            fill: "#fff",
            stroke: {color: "#000", width: 2}
        }
    });
    rarity: Text = new Text({
        text: "",
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 11,
            fill: "#fff",
            stroke: {color: "#000", width: 2}
        }
    });

    definition?: MobDefinition;

    lastGettingDamage: number = 0;

    constructor(game: Game, id: number) {
        super(game, id);

        this.container.zIndex = 0;

        this.images.body.anchor.set(0.5);

        this.healthBar.position.set(0, 50);

        this.name.anchor.y = 0.5;
        this.rarity.anchor.x = 1;

        this.staticContainer.addChild(
            this.name,
            this.healthBar,
            this.rarity
        )

        this.container.addChild(
            this.images.body,
        );
    }

    render(dt: number): void {
        super.render(dt);

        this.updateContainerPosition(8);

        const movementDistance = Vec2.distance(this.oldPosition, this.position);
        if (movementDistance) {
            this.playMovementAnimation(movementDistance)
        }
        if (this.definition && this.definition.idString === "sandstorm") {
            if (this.definition.images?.spiderLeg) {
                this.images.leg1.angle += 5;
                this.images.leg2.angle -= 4;
                this.images.leg3.angle += 3;
            }
        } else {
            this.container.rotation =
                Vec2.directionToRadians(Vec2.targetEasing(Vec2.radiansToDirection(this.container.rotation), this.direction, 6));
        }
    }

    updateFromData(data: EntitiesNetData[EntityType.Mob], isNew: boolean): void {
        this.position = data.position;
        this.direction = data.direction;

        if (data.full) {
            this.definition = data.full.definition;
            this.hitboxRadius = this.definition.hitboxRadius;

            if (isNew) {
                this.container.position = Camera.vecToScreen(this.position);
                this.images.body
                    .setFrame(getGameAssetsPath("mob", this.definition));
                this.container.rotation = Vec2.directionToRadians(data.direction);

                const healthBarY = Camera.unitToScreen(this.definition.hitboxRadius + 5 / 20);
                this.healthBar.position.set(0, healthBarY);
                this.name.position.y = healthBarY - 7;
                this.rarity.position.y = healthBarY + 7;

                if (this.definition.images?.width) {
                    this.images.body.anchor.x = 0.5 + (
                        (defaultImageSize - this.definition.images.width) / defaultImageSize
                    ) / 2;
                }

                if (this.definition.images?.height) {
                    this.images.body.anchor.y = 0.5 + (
                        (defaultImageSize - this.definition.images.height) / defaultImageSize
                    ) / 2;
                }

                if (this.definition.idString === "sandstorm") {
                    this.container.rotation = Math.random() * Math.PI * 2;
                } else {
                    this.container.rotation = Vec2.directionToRadians(data.direction);
                }

                this.init();
            }

            if (isNew || this.healthPercent != data.full.healthPercent) {
                if (!isNew && this.healthPercent > data.full.healthPercent)
                    this.getDamageAnimation()
                this.healthPercent = data.full.healthPercent;
                this.reddrawHealthBar();
            }
        }

        super.updateFromData(data, isNew);
    }

    init(): void {
        if (!this.definition) return;

        const hitboxRadius = this.definition.hitboxRadius;

        if (this.definition.images?.mouth) {
            this.container.addChild(
                this.images.left_mouth,
                this.images.right_mouth
            )

            this.images.left_mouth
                .setFrame(getGameAssetsPath("animation", this.definition))
                .setZIndex(-1)
                .setAnchor(Vec2.new(0, 0.5));
            this.images.right_mouth
                .setFrame(getGameAssetsPath("animation", this.definition))
                .setZIndex(-1)
                .setAnchor(Vec2.new(0, 0.5));
            this.images.right_mouth.scale.y = -1;

            this.images.right_mouth.position.x = Camera.unitToScreen(hitboxRadius) * (this.definition.images?.mouthXPosition ?? 0.6 * 1.5 / hitboxRadius);
            this.images.right_mouth.position.y = Camera.unitToScreen(hitboxRadius) * (this.definition.images?.mouthYPosition ?? 0.9 * 1.5 / hitboxRadius);

            this.images.left_mouth.position.x = Camera.unitToScreen(hitboxRadius) * (this.definition.images?.mouthXPosition ?? 0.6 * 1.5 / hitboxRadius);
            this.images.left_mouth.position.y = Camera.unitToScreen(-hitboxRadius) * (this.definition.images?.mouthYPosition ?? 0.9 * 1.5 / hitboxRadius);
        }

        if (this.definition.images?.spiderLeg) {
            this.container.addChild(
                this.images.leg1,
                this.images.leg2,
                this.images.leg3,
                this.images.leg4
            )

            if (this.definition.idString === "sandstorm") {
                this.images.leg1
                    .setFrame(getGameAssetsPath("mob", "sandstorm_inner"))
                    .setZIndex(-1)
                    .setAnchor(Vec2.new(0.5, 0.5));
                this.images.leg2
                    .setFrame(getGameAssetsPath("mob", "sandstorm_middle"))
                    .setZIndex(-2)
                    .setAnchor(Vec2.new(0.5, 0.5));
                this.images.leg3
                    .setFrame(getGameAssetsPath("mob", "sandstorm_outer"))
                    .setZIndex(-3)
                    .setAnchor(Vec2.new(0.5, 0.5));
                this.images.leg1.angle = Math.random() * 360;
                this.images.leg2.angle = Math.random() * 360;
                this.images.leg3.angle = Math.random() * 360;
            } else {
                this.images.leg1
                    .setFrame(getGameAssetsPath("animation", "spider_leg1"))
                    .setZIndex(-1)
                    .setAnchor(Vec2.new(0.5, 0.5));
                this.images.leg2
                    .setFrame(getGameAssetsPath("animation", "spider_leg2"))
                    .setZIndex(-1)
                    .setAnchor(Vec2.new(0.5, 0.5));
                this.images.leg3
                    .setFrame(getGameAssetsPath("animation", "spider_leg3"))
                    .setZIndex(-1)
                    .setAnchor(Vec2.new(0.5, 0.5));
                this.images.leg4
                    .setFrame(getGameAssetsPath("animation", "spider_leg4"))
                    .setZIndex(-1)
                    .setAnchor(Vec2.new(0.5, 0.5));
            }
        }

        this.container.scale = GameSprite.getScaleByUnitRadius(hitboxRadius);

        if (this.definition.hideInformation) {
            this.name.visible = false;
            this.rarity.visible = false;
        }

        this.name.text = this.definition.displayName;
        const rarity = Rarity.fromString(this.definition.rarity);
        this.rarity.text = rarity.displayName;
        this.rarity.style.fill = rarity.color;
    }

    lastMovementAnimation: number = 0;
    lastMovementAnimationTime: number = 0;
    lastScale: number = 1;

    playMovementAnimation(size: number): void {
        if (!this.definition) return;

        if (this.definition.idString === "sandstorm") {
            if (Date.now() - this.lastMovementAnimation < 1200) return;
            let time = 800 + Math.random() * 400;
            this.lastMovementAnimation = Date.now();
            const offsetX = (Math.random() * 20 - 10);
            const offsetY = (Math.random() * 20 - 10);
            this.game.addTween(new Tween({x: 0, y: 0})
                .to({x: offsetX, y: offsetY}, time)
                .easing(Easing.Cubic.InOut)
                .onUpdate((d) => {
                    this.container.position.x = Camera.vecToScreen(this.position).x + d.x;
                    this.container.position.y = Camera.vecToScreen(this.position).y + d.y;
                })
            );
            this.game.addTween(new Tween({scale: 1, alpha: 1})
                .to({scale: 1.08, alpha: 0.85}, time / 2)
                .easing(Easing.Quadratic.Out)
                .onUpdate((d) => {
                    this.container.scale.set(this.container.scale.x * d.scale / this.lastScale);
                    this.lastScale = d.scale;
                })
            );

            this.game.addTween(new Tween({scale: 1.08, alpha: 0.85})
                .delay(time / 2)
                .to({scale: 1, alpha: 1}, time / 2)
                .easing(Easing.Quadratic.In)
                .onUpdate((d) => {
                    this.container.scale.set(this.container.scale.x * d.scale / this.lastScale);
                    this.lastScale = d.scale;
                })
            );

            this.lastMovementAnimationTime = time;
            return;
        }

        if (Date.now() - this.lastMovementAnimation < this.lastMovementAnimationTime * 2) return;
        let time = 150;

        this.lastMovementAnimation = Date.now();
        if (this.definition.images?.mouth) {
            time =
                MathNumeric.remap(size, 0, 0.3, 500, 150);
            this.game.addTween(
                new Tween({angle: 0})
                .to({angle: 8}, time)
                .onUpdate((d) => {
                    this.images.left_mouth.angle = d.angle;
                    this.images.right_mouth.angle = -d.angle;
                })
            )

            this.game.addTween(
                new Tween({angle: 8})
                .delay(time)
                .to({angle: 0}, time)
                .onUpdate((d) => {
                    this.images.left_mouth.angle = d.angle;
                    this.images.right_mouth.angle = -d.angle;
                })
            )
        }

        if (this.definition.images?.spiderLeg) {
            time =
                MathNumeric.remap(size, 0, 0.3, 600, 160);
            this.game.addTween(
                new Tween({angle: 0})
                .to({ angle: 20 }, time)
                .onUpdate((d) => {
                    this.images.leg1.angle = -d.angle / 1.8;
                    this.images.leg2.angle = d.angle;
                    this.images.leg3.angle = d.angle / 2;
                    this.images.leg4.angle = -d.angle / 1.2;
                })
            )

            this.game.addTween(
                new Tween({angle: 20 })
                .delay(time)
                .to({angle: 0}, time)
                .onUpdate((d) => {
                    this.images.leg1.angle = -d.angle / 1.8;
                    this.images.leg2.angle = d.angle;
                    this.images.leg3.angle = d.angle / 2;
                    this.images.leg4.angle = -d.angle / 1.2;
                })
            )
        }

        this.lastMovementAnimationTime = time;
    }

    reddrawHealthBar(): void {
        if (!this.definition) return;

        const healthBarWidth = MathNumeric.clamp(
            Camera.unitToScreen(this.definition.hitboxRadius) * 2,
            80,
            Infinity
        );
        const fillWidth = healthBarWidth * this.healthPercent;

        if (
            this.definition.hideInformation
        ) this.healthBar.visible = this.healthPercent < 0.999;

        this.healthBar.clear()
            .roundRect((-healthBarWidth - 5) / 2, 0, healthBarWidth + 5, 10)
            .fill({
                color: 0x000000,
                alpha: 0.3
            })
            .roundRect(-healthBarWidth / 2, 3 / 2, fillWidth, 7)
            .fill({
                color: 0x87e63e
            });

        this.name.position.x = -healthBarWidth / 2;
        this.rarity.position.x = (healthBarWidth + 5) / 2;
    }

    destroy() {
        this.game.addTween(
            new Tween({ scale: this.container.scale.x, alpha: 1 },)
            .to({ scale: this.container.scale.x * 3, alpha: 0 }, 100 )
            .onUpdate(d => {
                this.container.scale.set(d.scale);
                this.container.alpha = d.alpha;
            }),
            super.destroy.bind(this)
        )
    }
}
