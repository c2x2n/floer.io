import { ServerPetal } from "../../entity/serverPetal";
import { P2 } from "../../../../common/src/engine/maths/constants";
import { UVector2D } from "../../../../common/src/engine/physics/uvector";
import { AttributeNames, AttributeParameters } from "../../../../common/src/definitions/petals";
import { EventInitializer } from "./petalEvents";
import { EntityType } from "../../../../common/src/constants";
import { ServerPlayer } from "../../entity/serverPlayer";
import { ServerFriendlyMob, ServerMob } from "../../entity/serverMob";
import { ServerProjectile } from "../../entity/serverProjectile";
import { Geometry } from "../../../../common/src/engine/maths/geometry";
import { Effect } from "../effect/effect";
import { DamageType } from "../../typings/damage";

export enum AttributeEvents {
    HEALING = "HEALING",
    DEFEND = "DEFEND",
    ATTACK = "ATTACK",
    PETAL_DEAL_DAMAGE = "PETAL_DEAL_DAMAGE",
    FLOWER_DEAL_DAMAGE = "FLOWER_DEAL_DAMAGE",
    USABLE = "USABLE"
}

export enum PetalUsingAnimations {
    ABSORB = "ABSORB",
    NORMAL = "NORMAL",
    HATCH = "HATCH"
}

export interface AttributeRealize<T extends AttributeNames = AttributeNames> {
    readonly unstackable?: boolean
    readonly callback: (
        on: EventInitializer, petal: ServerPetal, data: AttributeParameters[T]
    ) => void
}

export const PetalAttributeRealizes: { [K in AttributeNames]: AttributeRealize<K> } = {
    absorbing_heal: {
        callback: (on, petal, data) => {
            on(AttributeEvents.HEALING,
                () => {
                    if (data) petal.owner.heal(data);
                }
                , PetalUsingAnimations.ABSORB);
        }
    },

    absorbing_shield: {
        callback: (on, petal, data) => {
            on(AttributeEvents.USABLE,
                () => {
                    if (data) {
                        const maxShield = petal.owner.modifiers.maxHealth * 0.75;
                        petal.owner.shield = Math.min(
                            (petal.owner.shield || 0) + Number(data),
                            maxShield
                        );
                    }
                }
                , PetalUsingAnimations.ABSORB);
        }
    },

    boost: {
        callback: (on, petal, data) => {
            on(AttributeEvents.DEFEND,
                () => {
                    if (data) {
                        const direction
                            = Geometry.directionBetweenPoints(petal.owner.position, petal.position);
                        petal.owner.addAcceleration(
                            UVector2D.mul(direction, data * 10)
                        );
                    }
                }
                , PetalUsingAnimations.NORMAL);
        }
    },

    shoot: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK, () => {
                if (!data) return;
                const direction
                    = Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                new ServerProjectile(
                    petal.owner, position, direction, data, petal);
            }, PetalUsingAnimations.NORMAL);
        }
    },

    around_circle_shoot: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK, () => {
                if (!data) return;
                const direction
                    = Geometry.directionBetweenPoints(petal.position, petal.petalBunch.centerPosition);
                const position = petal.position;
                new ServerProjectile(
                    petal.owner, position, direction, data, petal);
            }, PetalUsingAnimations.NORMAL);
        }
    },

    peas_shoot: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK, () => {
                if (!data) return;
                const para = data.parameters;
                const amount = data.amount;

                const radius = data.radius ?? 0.2;
                let radianNow = petal.petalBunch.rotationRadians;
                const radianStep = P2 / amount;

                for (let i = 0; i < amount; i++) {
                    const position = Geometry.getPositionOnCircle(
                        radianNow, radius, petal.petalBunch.centerPosition
                    );

                    const direction
                        = Geometry.directionBetweenPoints(position, petal.petalBunch.centerPosition);
                    new ServerProjectile(
                        petal.owner, position, direction, para, petal);

                    radianNow += radianStep;
                }
            }, PetalUsingAnimations.NORMAL);
        }
    },

    place_projectile: {
        callback: (on, petal, data) => {
            if (!data) return;
            on(AttributeEvents.ATTACK, () => {
                if (!data) return;
                const direction
                    = Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                new ServerProjectile(
                    petal.owner, position, direction, data, petal);
            }, PetalUsingAnimations.NORMAL);

            on(AttributeEvents.DEFEND, () => {
                if (!data) return;
                const direction
                    = Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                new ServerProjectile(
                    petal.owner, position, direction, data, petal).acceleration.clear();
            }, PetalUsingAnimations.NORMAL);
        }
    },

    spawner: {
        callback: (on, petal, data) => {
            on(AttributeEvents.USABLE, () => {
                if (!data) return;

                const isSandstorm = data.idString === "sandstorm";

                let spawnedMob: ServerFriendlyMob;

                if (isSandstorm) {
                    spawnedMob = new ServerFriendlyMob(petal.game, petal.owner, data, true);
                    if (data.despawnTime) {
                        const despawnTime = data.despawnTime * 1000;
                        setTimeout(() => {
                            if (!spawnedMob.destroyed) {
                                spawnedMob.destroy();
                            }
                        }, despawnTime);
                    }
                } else {
                    petal.spawned = new ServerFriendlyMob(petal.game, petal.owner, data, true);
                }
            }, PetalUsingAnimations.HATCH);
        }
    }
} as const;
