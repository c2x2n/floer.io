import { ClientEntity } from "./clientEntity";
import { EntityType } from "@common/constants";
import { getGameAssetsFile, getGameAssetsName } from "@/scripts/utils/render.ts";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Tween } from '@tweenjs/tween.js';
import { PetalDefinition } from "@common/definitions/petal.ts";
import { EasingFunctions, MathGraphics } from "@common/utils/math.ts";
import { Rarity } from "@common/definitions/rarity.ts";
import { petalAssets } from "@/assets/petal.ts";
import { Vec2 } from "@common/utils/vector.ts";

export class ClientPetal extends ClientEntity {
    type = EntityType.Petal;

    angle: number = 0;
    ownerId: number = -1;

    definition?: PetalDefinition;

    reloadAnimation?: Tween;

    visible: boolean = true;

    constructor(game: Game, id: number) {
        super(game, id);
    }

    image?: HTMLImageElement

    render(dt: number) {
        super.render(dt);

        if (!this.definition) return;

        const name = getGameAssetsName(this.definition);

        if (this.container.visible && petalAssets.hasOwnProperty(name)) {
            petalAssets[name](this.container)
        } else {
            const scalePercent =
                Camera.unitToScreen(this.hitboxRadius) * 2 / 200;
            if (!this.image) {
                const image = new Image();

                image.src = `/img/game/petal/${getGameAssetsFile(this.definition)}`;

                image.onload = () => {
                    this.image = image;
                }
            } else if (this.image){
                this.ctx.drawImage(
                    this.image,
                    -this.image.width * scalePercent / 2,
                    -this.image.height * scalePercent / 2,
                    this.image.width * scalePercent,
                    this.image.height * scalePercent,
                )
            }
        }

        if (this.definition) {
            const owner = this.game.entityPool.get(this.ownerId);

            if (this.definition.equipment) {
                if (this.definition.images?.equipmentStyles?.noRender) {
                    return;
                }
                if (owner) {
                    const x = this.definition.images?.equipmentStyles?.coordsToOwner?.x ?? 0;
                    const y = this.definition.images?.equipmentStyles?.coordsToOwner?.y ?? 25;
                    const scale = this.definition.images?.equipmentStyles?.coordsToOwner?.scale ?? 1;
                    const rotation = this.definition.images?.equipmentStyles?.coordsToOwner?.rotation ?? 0;
                    const ZI =  this.definition.images?.equipmentStyles?.coordsToOwner?.zIndex ?? 3;
                    this.container.position = Vec2.sub(
                        owner.container.position,
                        Vec2.new(x, y)
                    );

                    this.container.zIndex = ZI;

                    // Apply the scale to the container
                    this.container.scale = scale;
                    this.container.rotation = rotation;
                }

                return;
            }

            if (this.definition.images?.facingOut) {
                if (owner) {
                    this.container.rotation =
                        Vec2.directionToRadians(
                            MathGraphics.directionBetweenPoints(this.position, owner.position)
                        )
                }
            } else if (this.definition.images?.selfGameRotation) {
                this.angle += this.definition.images.selfGameRotation  * dt;
                this.container.rotation = MathGraphics.degreesToRadians(this.angle)
            }

            if (Rarity.fromString(this.definition.rarity).showParticle && this.visible) {
                this.game.particles.spawnParticle({
                    position: this.container.position,
                    tint: "#FFFFFF",
                    speed: { min: 0, max: 150 },
                    direction: { min: -6.28, max: 6.28 },
                    alpha: { min: 0, max: 0.5 },
                    lifeTime: { min: 0, max: 0.25 },
                    scale: { min: 2, max: 4 },
                    rotation: { value: 0 }
                })
            }
        }

        if (this.reloadAnimation) {
            this.reloadAnimation.update();
        } else {
            this.updateContainerPosition(6)
        }
    }

    changeVisibleTo(visible: boolean): void {
        if (!this.definition) return;
        if (this.visible !== visible) {
            this.visible = visible;
            if (visible || this.definition.equipment) {
                this.reloadAnimation = undefined;
                this.container.visible = visible;
                this.container.alpha = 1;
                this.container.scale = 1;
                this.container.rotation = 0;
            } else {
                this.reloadAnimation = new Tween({ alpha: 1, scale: this.container.scale })
                    .to({ alpha: 0, scale: this.container.scale * 3}
                        , Math.min(200, this.definition.reloadTime ? this.definition.reloadTime * 1000 : 100))
                    .easing(EasingFunctions.sineOut)
                    .onUpdate((obj) => {
                        this.container.alpha = obj.alpha;
                        this.container.scale = obj.scale;
                    }).onComplete(() => {
                        this.container.visible = false;
                        this.reloadAnimation = undefined;
                    }).start()
            }
        }
    }

    updateFromData(data: EntitiesNetData[EntityType.Petal], isNew: boolean): void {
        this.position = data.position;

        if (data.full) {
            if (isNew){
                this.definition = data.full.definition;
                this.hitboxRadius = this.definition.hitboxRadius;
                this.container.radius = Camera.unitToScreen(this.hitboxRadius);
                this.container.visible = !data.isReloading;
                this.container.position = Camera.vecToScreen(data.position);
            }

            this.ownerId = data.full.ownerId;
        }

        if (data.gotDamage) this.getDamageAnimation(true);

        this.changeVisibleTo(!data.isReloading);

        super.updateFromData(data, isNew);
    }
}
