import { ServerPetal } from "../entities/serverPetal";
import { P2 } from "../../../common/src/maths/constants";
import { UVector2D } from "../../../common/src/physics/uvector";
import { AttributeNames, AttributeParameters } from "../../../common/src/definitions/petals";
import { EventInitializer } from "./petalEvents";
import { EntityType } from "../../../common/src/constants";
import { ServerPlayer } from "../entities/serverPlayer";
import { ServerFriendlyMob, ServerMob } from "../entities/serverMob";
import { ServerProjectile } from "../entities/serverProjectile";
import { isDamageableEntity } from "../typings";
import { CircleHitbox } from "../../../common/src/physics/hitbox";
import { ServerEntity } from "../entities/serverEntity";
import { Geometry } from "../../../common/src/maths/geometry";
import { Effect } from "../effect/effect";

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
    readonly unstackable?: boolean
    readonly callback: (
        on: EventInitializer, petal: ServerPetal, data: AttributeParameters[T]
    ) => void
}

function applyTrueDamage(entity: ServerEntity, damage: number, petal: ServerPetal): boolean {
    if (!isDamageableEntity(entity) || damage <= 0 || !entity.canReceiveDamageFrom(petal.owner)) {
        return false;
    }

    const trueDamageRatio = petal.definition.attributes?.true_damage;
    if (trueDamageRatio === undefined || trueDamageRatio <= 0) {
        return false;
    }

    const trueDamage = damage * trueDamageRatio;
    const normalDamage = damage * (1 - trueDamageRatio);

    if (trueDamage > 0) {
        if (entity instanceof ServerPlayer) {
            entity.health -= trueDamage;
            if (entity.health <= 0) {
                entity.receiveDamage(0, petal.owner, true);
            }
        } else if (typeof entity.health === "number") {
            entity.health -= trueDamage;
            if (entity.health <= 0) {
                if (entity instanceof ServerMob && entity.destroyCheck) {
                    entity.destroyCheck();
                } else if (entity.destroy) {
                    entity.destroy();
                }
            }
        }
    }

    if (normalDamage > 0) {
        entity.receiveDamage(normalDamage, petal.owner);
    }

    return true;
}

function selectRandomAttribute(attributes: Required<AttributeParameters>["random"]) {
    if (!attributes || attributes.length === 0) return null;

    const totalWeight = attributes.reduce((sum, attr) => sum + attr.weight, 0);

    const random = Math.random() * totalWeight;

    let cumulativeWeight = 0;
    for (const attr of attributes) {
        cumulativeWeight += attr.weight;
        if (random <= cumulativeWeight) {
            return {
                name: attr.attribute,
                value: attr.value
            };
        }
    }

    return {
        name: attributes[attributes.length - 1].attribute,
        value: attributes[attributes.length - 1].value
    };
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
                        petal.owner.addVelocity(
                            UVector2D.mul(direction, data * 10)
                        );
                    }
                }
                , PetalUsingAnimations.NORMAL);

            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                entity => {
                    if (entity && data && data < 0 && isDamageableEntity(entity)) {
                        // 击退效果，负值表示击退
                        const entityToPlayerDirection
                            = Geometry.directionBetweenPoints(entity.position, petal.owner.position);

                        // 计算击退力度倍率
                        let knockbackMultiplier = 1.0;

                        // 对玩家固定为1倍
                        if (entity.type === EntityType.Player) {
                            knockbackMultiplier = 1.0;
                        } else {
                            const entityRadius = entity.hitbox.radius;
                            const baseRadius = 1;

                            // 计算倍率: 基础半径/实体半径 (半径越大，倍率越小)
                            knockbackMultiplier = Math.min(1.0, baseRadius / entityRadius);
                        }
                        entity.addVelocity(
                            UVector2D.mul(entityToPlayerDirection, Math.abs(data) * 10 * knockbackMultiplier)
                        );
                    }
                }
            );
        }
    },

    poison: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                entity => {
                    if (entity && data) {
                        entity.receivePoison(
                            petal.owner, data.damagePerSecond, data.duration
                        );
                    }
                }
            );
        }
    },

    healing_debuff: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                entity => {
                    if (!entity || !data) return;
                    new Effect({
                        effectedTarget: entity,
                        source: petal.owner,
                        modifier: {
                            healing: data.healing
                        },
                        duration: data.duration,
                        workingType: [EntityType.Player]
                    }).start();
                }
            );
        }
    },

    body_poison: {
        callback: (on, petal, data) => {
            on<AttributeEvents.FLOWER_DEAL_DAMAGE>(
                AttributeEvents.FLOWER_DEAL_DAMAGE,
                entity => {
                    if (entity && data) {
                        entity.receivePoison(
                            petal.owner, data.damagePerSecond, data.duration
                        );
                    }
                }
            );
        }
    },

    damage_reflection: {
        unstackable: true,
        callback: (on, petal, data) => {
            on<AttributeEvents.FLOWER_GET_DAMAGE>(AttributeEvents.FLOWER_GET_DAMAGE,
                arg => {
                    if (arg && data) {
                        const { entity, damage } = arg;
                        if (
                            entity instanceof ServerPlayer
                            || (entity instanceof ServerMob && entity.canReceiveDamageFrom(petal.owner))
                        ) {
                            entity.receiveDamage(data * damage, petal.owner, true);
                        }
                    }
                }
            );
        }
    },

    shoot: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK, () => {
                if (!data) return;
                const direction
                    = Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                const projectile = new ServerProjectile(
                    petal.owner, position, direction, data, petal);
                projectile.addVelocity(UVector2D.mul(direction, data.velocityAtFirst ?? data.speed * 6));
                if (data.definition.onGround) { projectile.addVelocity(UVector2D.mul(direction, 80 * data.hitboxRadius / 5)); }
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
                const projectile = new ServerProjectile(
                    petal.owner, position, direction, data, petal);
                projectile.addVelocity(UVector2D.mul(direction, data.velocityAtFirst ?? data.speed * 6));
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
                    const projectile = new ServerProjectile(
                        petal.owner, position, direction, para, petal);
                    projectile.addVelocity(UVector2D.mul(direction, para.velocityAtFirst ?? para.speed * 6));

                    radianNow += radianStep;
                }
            }, PetalUsingAnimations.NORMAL);
        }
    },

    place_projectile: {
        callback: (on, petal, data) => {
            on(AttributeEvents.ATTACK, () => {
                if (!data) return;
                const direction
                    = Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                const projectile = new ServerProjectile(
                    petal.owner, position, direction, data, petal);
                projectile.addVelocity(UVector2D.mul(direction, data.velocityAtFirst ?? data.speed * 6));
                if (data.definition.onGround) { projectile.addVelocity(UVector2D.mul(direction, 80 * data.hitboxRadius / 5)); }
            }, PetalUsingAnimations.NORMAL);

            on(AttributeEvents.DEFEND, () => {
                if (!data) return;
                const direction
                    = Geometry.directionBetweenPoints(petal.position, petal.owner.position);
                const position = petal.position;
                new ServerProjectile(
                    petal.owner, position, direction, data, petal);
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
    },

    critical_hit: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                entity => {
                    if (!entity || !data) return;
                    if (Math.random() < data.chance && isDamageableEntity(entity) && petal.damage) {
                        const criticalDamage = petal.damage * (data.multiplier - 1);

                        if (!applyTrueDamage(entity, criticalDamage, petal)) {
                            entity.receiveDamage(criticalDamage, petal.owner);
                        }
                    }
                }
            );
        }
    },

    health_percent_damage: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                entity => {
                    if (!entity || !data) return;
                    if (isDamageableEntity(entity) && entity.health) {
                        const additionalDamage = entity.health * data.percent;
                        const limitedDamage = data.maxDamage !== undefined
                            ? Math.min(additionalDamage, data.maxDamage)
                            : additionalDamage;

                        if (!applyTrueDamage(entity, limitedDamage, petal)) {
                            entity.receiveDamage(limitedDamage, petal.owner);
                        }
                    }
                }
            );
        }
    },

    damage_avoidance: {
        callback: (on, petal, data) => {
            const originalReceiveDamage = (amount: number, source: any) =>
                petal.receiveDamage.call(petal, amount, source);

            petal.receiveDamage = function(amount: number, source: any) {
                if (data && Math.random() < data.chance) {
                    return;
                }
                originalReceiveDamage(amount, source);
            };
        }
    },

    paralyze: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                entity => {
                    if (!entity || !data) return;
                    const existingEffects = Array.from(entity.effects.effects);
                    const existingParalyze = existingEffects.find(e =>
                        e.source === petal.owner
                        && e.modifier?.speed !== undefined);

                    let newSpeedMod = 1 - data.speedReduction;
                    let revolutionReduction = data.revolutionReduction || 0;
                    if (existingParalyze) {
                        if (existingParalyze.modifier?.speed !== undefined) {
                            newSpeedMod *= existingParalyze.modifier.speed;
                        }
                        if (existingParalyze.modifier?.revolutionSpeed !== undefined) {
                            const existingReductionPercent = Math.abs(existingParalyze.modifier.revolutionSpeed) / 2.4;
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
                entity => {
                    if (!entity || !data) return;
                    const existingEffects = Array.from(entity.effects.effects);
                    const existingParalyze = existingEffects.find(e =>
                        e.source === petal.owner
                        && e.modifier?.speed !== undefined);

                    let newSpeedMod = 1 - data.speedReduction;
                    let revolutionReduction = data.revolutionReduction || 0;
                    if (existingParalyze) {
                        if (existingParalyze.modifier?.speed !== undefined) {
                            newSpeedMod *= existingParalyze.modifier.speed;
                        }
                        if (existingParalyze.modifier?.revolutionSpeed !== undefined) {
                            const existingReductionPercent = Math.abs(existingParalyze.modifier.revolutionSpeed) / 2.4;
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
            const originalTick = () => petal.tick.call(petal);
            let timeSinceLastTick = 0;
            const tickInterval = data.tickInterval || 1;

            petal.tick = function() {
                originalTick();

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
                entity => {
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
                entity => {
                    if (!entity || !data) return;
                    const owner = petal.owner;
                    const selfHealPercent = data.healPercent / 100;
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
            const originalReceiveDamage = (amount: number, source: any) =>
                petal.receiveDamage.call(petal, amount, source);

            petal.receiveDamage = function(amount: number, source: any) {
                if (data) {
                    amount = Math.max(0, amount - data);
                }
                originalReceiveDamage(amount, source);
            };
        }
    },
    lightning: {
        callback: (on, petal, data) => {
            if (!data) return;

            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                entity => {
                    if (!entity || !data) return;

                    const hitEntities = new Set([entity]);
                    let currentTarget = entity;
                    let remainingBounces = data.bounces;
                    let currentDamage = petal.damage || 0;

                    while (remainingBounces > 0 && currentDamage > 1) {
                        currentDamage *= data.attenuation;

                        const rangeHitbox = new CircleHitbox(data.range, currentTarget.position);

                        const nearbyEntities = petal.game.grid.intersectsHitbox(rangeHitbox);
                        const validTargets = Array.from(nearbyEntities).filter((e: ServerEntity) =>
                            !hitEntities.has(e)
                            && e.type !== EntityType.Petal
                            && e.type !== EntityType.Projectile
                            && e !== petal.owner
                            && isDamageableEntity(e)
                            && e.canReceiveDamageFrom(petal.owner)
                        );

                        if (validTargets.length === 0) break;

                        let nextTarget = validTargets[0];
                        let minDistance = UVector2D.distanceBetween(currentTarget.position, nextTarget.position);

                        for (let i = 1; i < validTargets.length; i++) {
                            const distance = UVector2D.distanceBetween(currentTarget.position, validTargets[i].position);
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
                                "lightning_effect" as any,
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
            const originalReceiveDamage = (amount: number, source: any) =>
                petal.receiveDamage.call(petal, amount, source);

            petal.receiveDamage = function(amount: number, source: any) {
                let shouldReduceDamage = false;

                if (data && source) {
                    if (source.type === EntityType.Petal || source.type === EntityType.Projectile) {
                        shouldReduceDamage = true;
                    } else if (source.type === EntityType.Player && source.isPetalAttack) {
                        shouldReduceDamage = true;
                    }

                    if (shouldReduceDamage) {
                        const reduction = data / 100;
                        const originalAmount = amount;
                        amount = amount * (1 - reduction);
                    }
                }

                originalReceiveDamage(amount, source);
            };
        }
    },
    true_damage: {
        callback: (on, petal, data) => {
            on<AttributeEvents.PETAL_DEAL_DAMAGE>(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                entity => {
                    if (!entity || !data || !petal.damage) return;
                    if (isDamageableEntity(entity) && entity.canReceiveDamageFrom(petal.owner)) {
                        const trueDamage = petal.damage * data;
                        const normalDamage = petal.damage * (1 - data);

                        if (trueDamage > 0) {
                            if (entity instanceof ServerPlayer) {
                                entity.health -= trueDamage;
                                if (entity.health <= 0) {
                                    entity.receiveDamage(0, petal.owner, true);
                                }
                            } else if (typeof entity.health === "number") {
                                entity.health -= trueDamage;
                                if (entity.health <= 0) {
                                    if (entity instanceof ServerMob && entity.destroyCheck) {
                                        entity.destroyCheck();
                                    } else if (entity.destroy) {
                                        entity.destroy();
                                    }
                                }
                            }
                        }

                        if (normalDamage > 0) {
                            entity.receiveDamage(normalDamage, petal.owner);
                        }
                    }
                }
            );
        }
    },
    random: {
        callback: (on, petal, data) => {
            if (!data || data.length === 0) return;
            const eventTypes = [
                AttributeEvents.ATTACK,
                AttributeEvents.DEFEND,
                AttributeEvents.FLOWER_DEAL_DAMAGE,
                AttributeEvents.FLOWER_GET_DAMAGE,
                AttributeEvents.HEALING,
                AttributeEvents.PETAL_DEAL_DAMAGE,
                AttributeEvents.PROJECTILE_DEAL_DAMAGE,
                AttributeEvents.USABLE
            ];

            eventTypes.forEach(eventType => {
                on(eventType, eventData => {
                    const selected = selectRandomAttribute(data);
                    if (!selected) return;

                    const attrName = selected.name;
                    if (!(attrName in PetalAttributeRealizes)) return;

                    const handler = PetalAttributeRealizes[attrName];
                    if (!handler) return;

                    const tempOn = (registeredEventType: AttributeEvents, callback: any, animation?: PetalUsingAnimations) => {
                        if (registeredEventType === eventType) {
                            callback(eventData);
                            if (animation && eventType === AttributeEvents.USABLE) {
                                petal.startUsing(animation);
                            }
                        }
                    };

                    handler.callback(tempOn, petal, selected.value);
                });
            });
        }
    }
} as const;
