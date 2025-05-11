import { ServerPetal } from "../entities/serverPetal";
import { Geometry, P2 } from "../../../common/src/utils/math";
import { Vec2 } from "../../../common/src/utils/vector";
import { AttributeNames, AttributeParameters } from "../../../common/src/definitions/petals";
import { EventInitializer } from "./petalEvents";
import { Effect } from "./effects";
import { EntityType } from "../../../common/src/constants";
import { ServerPlayer } from "../entities/serverPlayer";
import { ServerFriendlyMob, ServerMob } from "../entities/serverMob";
import { ServerProjectile } from "../entities/serverProjectile";
import { isDamageableEntity } from "../typings";
import { CircleHitbox } from "../../../common/src/utils/hitbox";
import { ServerEntity } from "../entities/serverEntity";

export enum AttributeEvents {
    HEALING = "HEALING",
    DEFEND = "DEFEND",
    ATTACK = "ATTACK",
    PETAL_DEAL_DAMAGE = "PETAL_DEAL_DAMAGE",
    FLOWER_DEAL_DAMAGE = "FLOWER_DEAL_DAMAGE",
    FLOWER_GET_DAMAGE = "FLOWER_GET_DAMAGE",
    PROJECTILE_DEAL_DAMAGE = "PROJECTILE_DEAL_DAMAGE",
    USABLE = "USABLE"
}

export enum PetalUsingAnimations {
    ABSORB = "ABSORB",
    NORMAL = "NORMAL",
    HATCH = "HATCH"
}

export interface AttributeRealize<T extends AttributeNames = AttributeNames> {
    readonly unstackable?: boolean;
    readonly callback: (
        on: EventInitializer, petal: ServerPetal, data: AttributeParameters[T]
    ) => void
}

export const PetalAttributeRealizes: {[K in AttributeNames]: AttributeRealize<K>} = {
    absorbing_heal: {
        callback: (on, petal, data) => {

            on(AttributeEvents.HEALING,
                () => {
                    if (data) petal.owner.heal(data)
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
                        const direction =
                            Geometry.directionBetweenPoints(petal.owner.position, petal.position);
                        petal.owner.addVelocity(
                            Vec2.mul(direction, data * 10)
                        )
                    }
                }
            , PetalUsingAnimations.NORMAL);

            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (entity && data && data < 0 && isDamageableEntity(entity)) {
                        // 击退效果，负值表示击退
                        const entityToPlayerDirection =
                            Geometry.directionBetweenPoints(entity.position, petal.owner.position);

                        // 计算击退力度倍率
                        let knockbackMultiplier = 1.0;

                        // 对玩家固定为1倍
                        if (entity.type === EntityType.Player) {
                            knockbackMultiplier = 1.0;
                        }
                        else {
                            const entityRadius = entity.hitbox.radius;
                            const baseRadius = 1;

                            // 计算倍率: 基础半径/实体半径 (半径越大，倍率越小)
                            knockbackMultiplier = Math.min(1.0, baseRadius / entityRadius);
                        }
                        entity.addVelocity(
                            Vec2.mul(entityToPlayerDirection, Math.abs(data) * 10 * knockbackMultiplier)
                        )
                    }
                }
            )
        }
    },

    poison: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (entity && data) {
                        entity.receivePoison(
                            petal.owner, data.damagePerSecond, data.duration
                        );
                    }
                }
            )
        }
    },

    healing_debuff: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (!entity || !data) return
                    new Effect({
                        effectedTarget: entity,
                        source: petal.owner,
                        modifier: {
                            healing: data.healing,
                        },
                        duration: data.duration,
                        workingType: [EntityType.Player]
                    }).start();
                }
            )
        }
    },

    body_poison: {
        callback: (on, petal, data) => {
            on<AttributeEvents.FLOWER_DEAL_DAMAGE>(
                AttributeEvents.FLOWER_DEAL_DAMAGE,
                (entity) => {
                    if (entity && data) {
                        entity.receivePoison(
                            petal.owner, data.damagePerSecond, data.duration
                        );
                    }
                }
            )
        }
    },

    damage_reflection: {
        unstackable: true,
        callback: (on, petal, data) => {
            on<AttributeEvents.FLOWER_GET_DAMAGE>(AttributeEvents.FLOWER_GET_DAMAGE,
                (arg) => {
                    if (arg && data) {
                        const { entity, damage } = arg;
                        if (
                            entity instanceof ServerPlayer
                            || entity instanceof ServerMob
                            && entity.canReceiveDamageFrom(petal.owner)
                        ) {
                            entity.receiveDamage(data * damage, petal.owner, true)
                        }
                    }
                }
            )
        }
    },

    shoot: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK,() => {
                if (!data) return;
                const direction =
                    Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                const projectile = new ServerProjectile(
                    petal.owner, position, direction, data, petal);
                projectile.addVelocity(Vec2.mul(direction, data.velocityAtFirst ?? data.speed * 6));
                if (data.definition.onGround)
                    projectile.addVelocity(Vec2.mul(direction, 80 * data.hitboxRadius / 5));
            }, PetalUsingAnimations.NORMAL)
        }
    },

    around_circle_shoot: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK,() => {
                if (!data) return;
                const direction =
                    Geometry.directionBetweenPoints(petal.position, petal.petalBunch.centerPosition);
                const position = petal.position;
                const projectile = new ServerProjectile(
                    petal.owner, position, direction, data, petal);
                projectile.addVelocity(Vec2.mul(direction, data.velocityAtFirst ?? data.speed * 6))
            }, PetalUsingAnimations.NORMAL)
        }
    },

    peas_shoot: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK,() => {
                if (!data) return;
                const para = data.parameters;
                const amount = data.amount;

                const radius = data.radius ?? 0.2;
                let radianNow = petal.petalBunch.rotationRadians;
                const radianStep = P2 / amount;

                for (let i = 0; i < amount; i++) {
                    const position = Geometry.getPositionOnCircle(
                        radianNow, radius, petal.petalBunch.centerPosition
                    )

                    const direction =
                        Geometry.directionBetweenPoints(position, petal.petalBunch.centerPosition);
                    const projectile = new ServerProjectile(
                        petal.owner, position, direction, para, petal);
                    projectile.addVelocity(Vec2.mul(direction, para.velocityAtFirst ?? para.speed * 6));

                    radianNow += radianStep;
                }

            }, PetalUsingAnimations.NORMAL)
        }
    },

    place_projectile: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK,() => {
                if (!data) return;
                const direction =
                    Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                const projectile = new ServerProjectile(
                    petal.owner, position, direction, data, petal);
                projectile.addVelocity(Vec2.mul(direction, data.velocityAtFirst ?? data.speed * 6));
                if (data.definition.onGround)
                    projectile.addVelocity(Vec2.mul(direction, 80 * data.hitboxRadius / 5));
            }, PetalUsingAnimations.NORMAL)

            on(AttributeEvents.DEFEND,() => {
                if (!data) return;
                const direction =
                    Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                new ServerProjectile(
                    petal.owner, position, direction, data, petal);
            }, PetalUsingAnimations.NORMAL)
        }
    },

    spawner: {
        callback: (on, petal, data) => {
            on(AttributeEvents.USABLE,() => {
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
    },

    critical_hit: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (!entity || !data) return
                    if (Math.random() < data.chance && isDamageableEntity(entity) && petal.damage) {
                        entity.receiveDamage(petal.damage * (data.multiplier - 1), petal.owner);
                    }
                }
            )
        }
    },

    health_percent_damage: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (!entity || !data) return
                    if (isDamageableEntity(entity) && entity.health) {
                        const additionalDamage = entity.health * data.percent;
                        const limitedDamage = data.maxDamage !== undefined ?
                            Math.min(additionalDamage, data.maxDamage) : additionalDamage;
                        entity.receiveDamage(limitedDamage, petal.owner);
                    }
                }
            )
        }
    },

    damage_avoidance: {
        callback: (on, petal, data) => {
            const originalReceiveDamage = petal.receiveDamage;

            petal.receiveDamage = function(amount: number, source: any) {
                if (data && Math.random() < data.chance) {
                    return;
                }
                originalReceiveDamage.call(this, amount, source);
            };
        }
    },

    paralyze: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (!entity || !data) return;
                    const existingEffects = Array.from(entity.effects.effects);
                    const existingParalyze = existingEffects.find(e =>
                        e.source === petal.owner &&
                        e.modifier &&
                        e.modifier.speed !== undefined);

                    let newSpeedMod = 1 - data.speedReduction;
                    let revolutionReduction = data.revolutionReduction || 0;
                    if (existingParalyze) {
                        existingParalyze.destroy();
                        if (existingParalyze.modifier?.speed !== undefined) {
                            newSpeedMod *= existingParalyze.modifier.speed;
                        }
                        if (existingParalyze.modifier?.revolutionSpeed !== undefined) {
                            let existingReductionPercent = Math.abs(existingParalyze.modifier.revolutionSpeed) / 2.4;
                            let combinedReductionPercent = existingReductionPercent + revolutionReduction - (existingReductionPercent * revolutionReduction);
                            combinedReductionPercent = Math.min(combinedReductionPercent, 0.99);
                            revolutionReduction = combinedReductionPercent;
                        }
                    }
                    new Effect({
                        effectedTarget: entity,
                        source: petal.owner,
                        modifier: {
                            speed: newSpeedMod,
                            revolutionSpeed: -1 * revolutionReduction * 2.4
                        },
                        duration: data.duration,
                        workingType: [EntityType.Player, EntityType.Mob]
                    }).start();
                }
            );

            on<AttributeEvents.PROJECTILE_DEAL_DAMAGE>(
                AttributeEvents.PROJECTILE_DEAL_DAMAGE,
                (entity) => {
                    if (!entity || !data) return;
                    const existingEffects = Array.from(entity.effects.effects);
                    const existingParalyze = existingEffects.find(e =>
                        e.source === petal.owner &&
                        e.modifier &&
                        e.modifier.speed !== undefined);

                    let newSpeedMod = 1 - data.speedReduction;
                    let revolutionReduction = data.revolutionReduction || 0;
                    if (existingParalyze) {
                        existingParalyze.destroy();
                        if (existingParalyze.modifier?.speed !== undefined) {
                            newSpeedMod *= existingParalyze.modifier.speed;
                        }
                        if (existingParalyze.modifier?.revolutionSpeed !== undefined) {
                            let existingReductionPercent = Math.abs(existingParalyze.modifier.revolutionSpeed) / 2.4;
                            let combinedReductionPercent = existingReductionPercent + revolutionReduction - (existingReductionPercent * revolutionReduction);
                            combinedReductionPercent = Math.min(combinedReductionPercent, 0.99);
                            revolutionReduction = combinedReductionPercent;
                        }
                    }
                    new Effect({
                        effectedTarget: entity,
                        source: petal.owner,
                        modifier: {
                            speed: newSpeedMod,
                            revolutionSpeed: -1 * revolutionReduction * 2.4
                        },
                        duration: data.duration,
                        workingType: [EntityType.Player, EntityType.Mob]
                    }).start();
                }
            );
        }
    },

    area_poison: {
        callback: (on, petal, data) => {
            if (!data) return;
            const originalTick = petal.tick;
            let timeSinceLastTick = 0;
            const tickInterval = data.tickInterval || 1;

            petal.tick = function() {
                originalTick.call(this);

                if (this.isReloading || this.destroyed) return;

                timeSinceLastTick += this.game.dt;

                if (timeSinceLastTick >= tickInterval) {
                    timeSinceLastTick = 0;

                    const circleHitbox = new CircleHitbox(data.radius);
                    circleHitbox.position = this.position;

                    const nearbyEntities = this.game.grid.intersectsHitbox(circleHitbox);

                    for (const entity of nearbyEntities) {
                        if (entity === this || entity === this.owner) continue;
                        if (entity.type === EntityType.Petal || entity.type === EntityType.Projectile) continue;
                        if (isDamageableEntity(entity) && entity.canReceiveDamageFrom(this.owner)) {
                            entity.receiveDamage(data.damagePerSecond * tickInterval, this.owner);
                        }
                    }
                }
            };
        }
    },
    self_damage: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (!entity || !data) return;
                    const owner = petal.owner;
                    const selfDamage = data;
                    if (selfDamage && owner) {
                        owner.receiveDamage(Number(selfDamage), owner);
                    }
                }
            );
        }
    },
    damage_heal: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (!entity || !data) return;
                    const owner = petal.owner;
                    let selfHealPercent = data.healPercent/100;
                    let selfHeal = (petal.damage ?? 15) * selfHealPercent;
                    if (selfHeal && owner) {
                        if (data.maximumHeal) selfHeal = Math.min(selfHeal, data.maximumHeal);
                        owner.heal(Number(selfHeal));
                    }
                }
            );
        }
    },
    armor: {
        callback: (on, petal, data) => {
            const originalReceiveDamage = petal.receiveDamage;

            petal.receiveDamage = function(amount: number, source: any) {
                if (data) {
                    amount = Math.max(0, amount - data);
                }
                originalReceiveDamage.call(this, amount, source);
            };
        }
    },
    lightning: {
        callback: (on, petal, data) => {
            if (!data) return;

            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                (entity) => {
                    if (!entity || !data) return;

                    const hitEntities = new Set([entity]);
                    let currentTarget = entity;
                    let remainingBounces = data.bounces;
                    let currentDamage = petal.damage || 0;

                    while (remainingBounces > 0 && currentDamage > 1) {

                        currentDamage *= data.attenuation;

                        const rangeHitbox = new CircleHitbox(data.range, currentTarget.position);

                        const nearbyEntities = petal.game.grid.intersectsHitbox(rangeHitbox)
                        const validTargets = Array.from(nearbyEntities).filter((e: ServerEntity) =>
                            !hitEntities.has(e) &&
                            e.type !== EntityType.Petal &&
                            e.type !== EntityType.Projectile &&
                            e !== petal.owner &&
                            isDamageableEntity(e) &&
                            e.canReceiveDamageFrom(petal.owner)
                        );

                        if (validTargets.length === 0) break;

                        let nextTarget = validTargets[0];
                        let minDistance = Vec2.distanceBetween(currentTarget.position, nextTarget.position);

                        for (let i = 1; i < validTargets.length; i++) {
                            const distance = Vec2.distanceBetween(currentTarget.position, validTargets[i].position);
                            if (distance < minDistance) {
                                minDistance = distance;
                                nextTarget = validTargets[i];
                            }
                        }

                        if (minDistance > data.range) break;

                        if (isDamageableEntity(nextTarget)) {
                            nextTarget.receiveDamage(currentDamage, petal.owner);

                            hitEntities.add(nextTarget);

                            currentTarget = nextTarget;
                            remainingBounces--;

                            // 闪电特效谁帮我写一下
                            petal.owner.sendEvent(
                                'lightning_effect' as any,
                                {
                                    sourceId: currentTarget.id,
                                    targetId: nextTarget.id,
                                    duration: 0.3
                                }
                            );
                        }
                    }
                }
            );
        }
    },
    damage_reduction_percent: {
        callback: (on, petal, data) => {
            const originalReceiveDamage = petal.receiveDamage;

            petal.receiveDamage = function(amount: number, source: any) {
                let shouldReduceDamage = false;

                if (data && source) {
                    if (source.type === EntityType.Petal || source.type === EntityType.Projectile) {
                        shouldReduceDamage = true;
                    }
                    else if (source.type === EntityType.Player && source.isPetalAttack) {
                        shouldReduceDamage = true;
                    }

                    if (shouldReduceDamage) {
                        const reduction = data / 100;
                        const originalAmount = amount;
                        amount = amount * (1 - reduction);
                    }
                }

                originalReceiveDamage.call(this, amount, source);
            };
        }
    }
} as const;
