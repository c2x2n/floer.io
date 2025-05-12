import { ServerEntity } from "./serverEntity";
import { Vec2, VectorAbstract } from "../../../common/src/utils/vector";
import { type EntitiesNetData } from "../../../common/src/net/packets/updatePacket";
import { CircleHitbox } from "../../../common/src/utils/hitbox";
import { EntityType } from "../../../common/src/constants";
import { ProjectileDefinition, ProjectileParameters } from "../../../common/src/definitions/projectiles";
import { AttributeEvents } from "../utils/attributeRealizes";
import { ServerPetal } from "./serverPetal";
import { damageableEntity, damageSource, isDamageableEntity } from "../typings";
import { ServerFriendlyMob, ServerMob } from "./serverMob";
import { ServerPlayer } from "./serverPlayer";
import { Random } from "../../../common/src/utils/random";
import { Geometry, P2 } from "../../../common/src/utils/math";
import { Effect } from "../utils/effects";

export class ServerProjectile extends ServerEntity<EntityType.Projectile> {
    type: EntityType.Projectile = EntityType.Projectile;

    hitbox: CircleHitbox;
    definition: ProjectileDefinition;
    parameters: ProjectileParameters;

    health?: number;
    damage: number = 0;

    existingTime: number = 0;
    direction: VectorAbstract = Vec2.new(0, 0);
    rotation: number = 0;
    initialDirection: VectorAbstract = Vec2.new(0, 0);
    hasLockedTarget: boolean = false;
    source: damageSource;
    elasticity = 0;
    knockback = 0.002;

    from?: ServerPetal;

    canReceiveDamageFrom(source: damageableEntity): boolean {
        if (!this.health) return false;
        switch (source.type) {
            case EntityType.Player:
                return source != this.source;
            case EntityType.Mob:
                if (source instanceof ServerFriendlyMob) return source.owner != this.source;
                return source.type != this.source.type;
            case EntityType.Petal:
                return source.owner != this.source;
            case EntityType.Projectile:
                if (source.source.type === EntityType.Mob)
                    return this.source.type != EntityType.Mob;
                return source.source != this.source;
        }
    }

    canCollideWith(source: ServerEntity): boolean {
        if(isDamageableEntity(source)) return this.canReceiveDamageFrom(source)
        else return false;
    }

    constructor(source: damageSource,
        position: VectorAbstract,
        direction: VectorAbstract,
        parameters: ProjectileParameters,
        from?: ServerPetal) {
super(source.game, position);

this.hitbox = new CircleHitbox(parameters.hitboxRadius);
this.position = position;
this.direction = direction;
this.initialDirection = Vec2.clone(direction);
this.source = source;
this.definition = parameters.definition;

// 设置初始旋转角度为发射方向
const angle = Math.atan2(direction.y, direction.x);
this.rotation = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);

this.parameters = parameters;

this.from = from;

this.health = parameters.health;
this.damage = parameters.damage ?? 0;

this.game.grid.addEntity(this);
}

tick(): void{
super.tick();

this.existingTime += this.game.dt;
if (this.existingTime >= this.parameters.despawnTime) {
    this.destroy();
}

if (this.parameters.tracking?.enabled) {
    const { turnSpeed, detectionRange, preferClosest } = this.parameters.tracking;
    
    let nearestEntity: damageableEntity | null = null;
    let nearestDistance = preferClosest ? Number.MAX_VALUE : 0;
    
    const direction = Vec2.new(this.direction.x, this.direction.y);
    const normalizedDirection = Vec2.normalize(direction);
    
    const searchHitbox = new CircleHitbox(detectionRange);
    searchHitbox.position = this.position;
    
    const nearbyEntities = this.game.grid.intersectsHitbox(searchHitbox);
    
    for (const entity of nearbyEntities) {
        if (isDamageableEntity(entity) && this.canReceiveDamageFrom(entity)) {
            const toEntity = Vec2.sub(entity.position, this.position);
            const distance = Vec2.length(toEntity);
            
            if (this.source.type === EntityType.Player) {
                const sourceToCurrent = Vec2.sub(this.position, this.source.position);
                const sourceToEntity = Vec2.sub(entity.position, this.source.position);
                
                const crossProduct = Math.abs(
                    sourceToCurrent.x * sourceToEntity.y - sourceToCurrent.y * sourceToEntity.x
                );
                const projDistance = crossProduct / Vec2.length(sourceToCurrent);
                
                if (preferClosest) {
                    if (projDistance < nearestDistance && distance <= detectionRange) {
                        nearestDistance = projDistance;
                        nearestEntity = entity;
                    }
                } 
                else if (projDistance < detectionRange * 0.3 && distance > nearestDistance) {
                    nearestDistance = distance;
                    nearestEntity = entity;
                }
            } 
            else if (distance < nearestDistance || nearestEntity === null) {
                nearestDistance = distance;
                nearestEntity = entity;
            }
        }
    }
    
    if (nearestEntity) {
        // 找到目标，标记为已锁定
        this.hasLockedTarget = true;
        
        const toTarget = Vec2.sub(nearestEntity.position, this.position);
        const targetDirection = Vec2.normalize(toTarget);
        
        const currentAngle = Math.atan2(this.direction.y, this.direction.x);
        const targetAngle = Math.atan2(targetDirection.y, targetDirection.x);
        
        let angleToTurn = targetAngle - currentAngle;
        if (angleToTurn > Math.PI) angleToTurn -= Math.PI * 2;
        if (angleToTurn < -Math.PI) angleToTurn += Math.PI * 2;
        
        const maxTurnAngle = turnSpeed * this.game.dt;
        angleToTurn = Math.max(-maxTurnAngle, Math.min(maxTurnAngle, angleToTurn));
        
        const newAngle = currentAngle + angleToTurn;
        this.direction = Geometry.radiansToDirection(newAngle);
        
        this.rotation = ((newAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    } else if (!this.hasLockedTarget) {
        const initialAngle = Math.atan2(this.initialDirection.y, this.initialDirection.x);
        this.rotation = ((initialAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    }
} else {
    const angle = Math.atan2(this.direction.y, this.direction.x);
    this.rotation = ((angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
}

this.setAcceleration(Vec2.mul(this.direction, this.parameters.speed));
}
    dealDamageTo(to: damageableEntity): void{
        if (this.definition.doesNotDamage?.includes(to.type)) return;
        if (to.canReceiveDamageFrom(this)) {
            to.receiveDamage(this.damage, this.source);
            if (this.from && this.source.type === EntityType.Player) {
                this.source.sendEvent(AttributeEvents.PROJECTILE_DEAL_DAMAGE, to, this.from)
            }

            if (this.parameters.modifiersWhenDamage) {
                const d = this.parameters.modifiersWhenDamage;
                new Effect({
                    effectedTarget: to,
                    duration: d.duration,
                    source: this.source,
                    modifier: d.modifier
                }).start()
            }

            if (this.parameters.poison) {
                to.receivePoison(
                    this.source
                    , this.parameters.poison.damagePerSecond
                    , this.parameters.poison.duration
                )
            }
        }

        if (this.parameters.modifiersWhenOn && this.canEffect(to)) {
            to.otherModifiers.push(this.parameters.modifiersWhenOn)
        }
    }

    canEffect(to: damageableEntity): to is ServerPlayer | ServerMob {
        if (!(to instanceof ServerPlayer || to instanceof ServerMob)) return false;

        if (this.parameters.modifiersWhenOn) {
            if (this.source.type === EntityType.Player) {
                return !(to instanceof ServerMob
                    && to.definition.shootable
                    && to.definition.shoot.definition === this.definition);
            }

            return this.source.type !== to.type;
        }

        return false;
    }

    receiveDamage(amount: number, source: damageSource, disableEvent?: boolean) {
        if (!this.isActive()) return;
        if (!this.health) return;

        this.health -= amount;

        if (this.health <= 0) {
            this.destroy();
        }
    }

    updatePosition(position: VectorAbstract): void {
        super.updatePosition(position);
        if (
            this.definition && !this.definition.onGround && !Vec2.equals(position, this._position)
        ) this.destroy()
    }

    get data(): Required<EntitiesNetData[EntityType]>{
        return {
            position: this.position,
            direction: this.direction,
            rotation: this.rotation,
            full: {
                hitboxRadius: this.parameters.hitboxRadius,
                definition: this.definition,
            }
        };
    };

    destroy(noDrops: boolean = false) {
        super.destroy(noDrops);
        if (noDrops) return;

        if (this.parameters.spawner) {
            const spawner = this.parameters.spawner;
            if (spawner.type === EntityType.Projectile) {
                let radiansNow = Geometry.directionToRadians(this.direction);
                for (let i = 0; i < spawner.amount; i++) {
                    new ServerProjectile(
                        this.source,
                        this.position,
                        Geometry.radiansToDirection(radiansNow),
                        spawner.spawn
                    )
                    radiansNow += P2 / spawner.amount;
                }
            } else {
                for (let i = 0; i < spawner.amount; i++) {
                    const position = Random.pointInsideCircle(
                        this.position, 8
                    )
                    new ServerMob(
                        this.game,
                        position,
                        Geometry.radiansToDirection(Random.float(-P2, P2)),
                        spawner.spawn
                    )
                }
            }
        }
    }
}
