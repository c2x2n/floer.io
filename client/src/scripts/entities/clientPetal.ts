import { ClientEntity } from "./clientEntity";
import { EntityType } from "../../../../common/src/constants";
import { Game } from "../game";
import { Camera } from "../render/camera";
import { Tween } from "@tweenjs/tween.js";
import { PetalDefinition, Petals } from "../../../../common/src/definitions/petals";
import { Rarity } from "../../../../common/src/definitions/rarities";
import { UVector2D } from "../../../../common/src/engine/physics/uvector";
import { getAssets } from "../../assets/assets";
import Velocity from "../../../../common/src/engine/physics/velocity";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { Geometry } from "../../../../common/src/engine/maths/geometry";
import { Numeric } from "../../../../common/src/engine/maths/numeric";
import { EasingFunctions } from "../../../../common/src/engine/maths/easing";
import { EntitiesNetData } from "../../../../common/src/engine/net/entitySerializations";
import Vector from "../../../../common/src/engine/physics/vector";
import { Random } from "../../../../common/src/engine/maths/random";

export class ClientPetal extends ClientEntity {
    type = EntityType.Petal;

    angle = 0;
    ownerId = -1;

    definition?: PetalDefinition;

    reloadAnimation?: Tween;

    visible = true;

    velocity: Velocity = new Velocity();

    render(dt: number) {
        super.render(dt);

        if (!this.definition) return;

        if (this.container.visible) {
            const assets = getAssets("petal", this.definition);
            if (assets) assets(this.container);
        }

        const owner = this.game.entityPool.get(this.ownerId);

        if (this.definition && this.visible) {
            if (this.definition.equipment) {
                if (this.definition.images?.equipmentStyles?.noRender) {
                    return;
                }
                if (owner) {
                    const x = this.definition.images?.equipmentStyles?.coordsToOwner?.x ?? 0;
                    const y = this.definition.images?.equipmentStyles?.coordsToOwner?.y ?? 25;
                    const scale = this.definition.images?.equipmentStyles?.coordsToOwner?.scale ?? 1;
                    const rotation = this.definition.images?.equipmentStyles?.coordsToOwner?.rotation ?? 0;
                    const ZI = this.definition.images?.equipmentStyles?.coordsToOwner?.zIndex ?? 3;
                    this.container.position = UVector2D.sub(
                        owner.container.position,
                        UVector2D.new(x, y)
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
                    this.container.rotation
                        = Geometry.directionToRadians(
                            Geometry.directionBetweenPoints(this.position, owner.position)
                        );
                }
            } else if (this.definition.images?.selfGameRotation) {
                this.angle += this.definition.images.selfGameRotation * dt;
                this.container.rotation = Geometry.degreesToRadians(this.angle);
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
                });
            }
        }

        if (this.reloadAnimation) {
            this.reloadAnimation.update();
        } else {
            this.toCenterPosition.add(this.velocity);

            this.velocity.add(this.velocity.clone().mul(-0.12));
            if (owner) {
                this.ownerPosition.set(UVector2D.targetEasing(
                    this.ownerPosition,
                    owner.position,
                    2.5
                ));
            }

            this.position = UVector2D.add(this.toCenterPosition, this.ownerPosition);

            this.updateContainerPosition(4.5);
        }
    }

    changeVisibleTo(visible: boolean): void {
        if (!this.definition) return;

        if (this.ownerId !== -1) {
            const owner = this.game.entityPool.get(this.ownerId);
            if (owner?.type === EntityType.Player && (owner as any).invisible) {
                if (this.visible || this.container.visible) {
                    this.visible = false;
                    this.container.visible = false;
                }
                return;
            }
        }

        if (this.visible !== visible) {
            this.visible = visible;
            if (visible || this.definition.equipment) {
                this.reloadAnimation = undefined;
                this.container.visible = visible;
                this.container.alpha = 1;
                this.container.scale = 1;
            } else {
                this.reloadAnimation = new Tween({ alpha: 1, scale: this.container.scale })
                    .to({ alpha: 0, scale: this.container.scale * 3 }
                        , Math.min(200, this.definition.reloadTime ? this.definition.reloadTime * 1000 : 100))
                    .easing(EasingFunctions.sineOut)
                    .onUpdate(obj => {
                        this.container.alpha = obj.alpha;
                        this.container.scale = obj.scale;
                    }).onComplete(() => {
                        this.container.visible = false;
                        this.reloadAnimation = undefined;
                        this.container.rotation = 0;
                    }).start();
            }
        }
    }

    ownerPosition: Vector = new Vector();
    toCenterPosition: Vector = new Vector();

    updateFromData(data: EntitiesNetData[EntityType.Petal], isNew: boolean): void {
        const c = UVector2D.div(data.position, 100);

        if (data.full && isNew) {
            this.definition = data.full.definition;
            this.hitboxRadius = this.definition.hitboxRadius;
            this.container.radius = Camera.unitToScreen(this.hitboxRadius);
            this.container.visible = !data.isReloading;
            this.container.position = Camera.vecToScreen(data.position);
            this.container.zIndex = 2;
            this.ownerId = data.full.ownerId;
            const owner = this.game.entityPool.get(this.ownerId);
            if (owner) this.ownerPosition.set(owner.position);
            this.toCenterPosition.set(c);
            this.position = UVector2D.add(this.toCenterPosition, this.ownerPosition);
        }

        if (data.gotDamage) this.getDamageAnimation(true);

        const length
            = UVector2D.distanceBetween(this.toCenterPosition, c);
        const vector = Vector.fromPolar(Geometry.angleBetweenPoints(
            c, this.toCenterPosition
        ), length * 1.1);
        const downer = Numeric.clamp(length, 0, 0.17) * Random.float(0.6, 1.2);

        if (length > 0.1) {
            this.velocity.add(vector.mul(downer));
        }

        this.changeVisibleTo(!data.isReloading);
    }
}
