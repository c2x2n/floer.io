import { ServerEntity } from "./serverEntity";
import { Vec2, type VectorAbstract } from "../../../common/src/utils/vector";
import { type EntitiesNetData } from "../../../common/src/net/packets/updatePacket";
import { CircleHitbox } from "../../../common/src/utils/hitbox";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { Game } from "../game";
import { MobCategory, MobDefinition, Mobs } from "../../../common/src/definitions/mobs";
import { Geometry, Numeric, P2 } from "../../../common/src/utils/math";
import { ServerPlayer } from "./serverPlayer";
import { Random } from "../../../common/src/utils/random";
import { PetalDefinition, Petals } from "../../../common/src/definitions/petals";
import { ServerProjectile } from "./serverProjectile";
import {
    collideableEntity,
    damageableEntity,
    damageSource,
    isDamageableEntity,
    isDamageSourceEntity
} from "../typings";
import { ProjectileParameters } from "../../../common/src/definitions/projectiles";
import { Modifiers } from "../../../common/src/typings";
import { Rarity, RarityName } from "../../../common/src/definitions/rarities";
import { ServerWall } from "./serverWall";
import { spawnLoot } from "../misc/spawning";

export class ServerMob extends ServerEntity<EntityType.Mob> {
    type: EntityType.Mob = EntityType.Mob;

    hitbox: CircleHitbox;
    definition: MobDefinition;

    get name(): string {
        return this.definition.displayName
    }

    readonly damage: number;

    private _health!: number;
    get health(): number {
        return this._health;
    }

    set health(value: number) {
        if (value === this._health) return
        this._health = Numeric.clamp(value, 0, this.definition.health);

        this.setFullDirty();
    }

    aggroTarget?: damageSource;

    _direction: VectorAbstract = Vec2.new(0, 0);

    get direction(): VectorAbstract {
        return this._direction
    }

    set direction(value: VectorAbstract) {
        if (value === this._direction) return
        this._direction = value;

        this.setDirty();
    }

    get speed(): number {
        if (this.definition.category !== MobCategory.Fixed)
            return this.definition.speed * this.modifiers.speed;
        return 0;
    }

    walkingReload: number = 0;
    walkingTime: number = 0;
    shootReload: number = 0;

    canReceiveDamageFrom(entity: ServerEntity): boolean {
        if (entity instanceof ServerProjectile) {
            if (this.definition.category === MobCategory.Friendly && 
                entity.source.type === EntityType.Player) 
                return false;
            return entity.source.type != this.type;
        }
        if (entity instanceof ServerFriendlyMob)
            return true;
        if (this.definition.category === MobCategory.Friendly && 
            (entity.type === EntityType.Player || entity.type === EntityType.Petal)) 
            return false;
        if (this.definition.category === MobCategory.Friendly && entity instanceof ServerMob) {
            if (entity.definition.category === MobCategory.Friendly)
                return false;
            return true;
        }
        return !(entity instanceof ServerMob);
    }

    canCollideWith(entity: ServerEntity): boolean {
        const rarity = Rarity.fromString(this.definition.rarity);
        if (entity instanceof ServerWall) return true;
        if (rarity.notCollideWithOther) return false;

        if (entity instanceof ServerMob) {
            if (this.notCollidingMobs.includes(entity.definition.idString)) return false;
        }

        return !(
            this.definition.category === MobCategory.Fixed
                && this.definition.onGround
                && entity.type === this.type
            )
            && entity != this;
    }

    lastSegment?: ServerMob;

    damageFrom = new Map<ServerPlayer, number>;

    spawnTime: number = Date.now();

    healingToFull: boolean = false;

    constructor(game: Game
                , position: VectorAbstract
                , direction: VectorAbstract
                , definition: MobDefinition
                , lastSegment?: ServerMob) {
        super(game, position);

        this.definition = definition;
        this.hitbox = new CircleHitbox(definition.hitboxRadius);
        this.damage = definition.damage;
        this.health = definition.health;

        this.weight = definition.hitboxRadius * 10;

        this.lastSegment = lastSegment;
        this.position = position;

        this.game.grid.addEntity(this);
        this.position = position;

        this.direction = direction;
        this.spawnTime = Date.now();
    }

    changeAggroTo(entity?: damageSource): void {
        if (![MobCategory.Enemy, MobCategory.Passive, MobCategory.Friendly].includes(this.definition.category)) return;

        if (this.aggroTarget && !entity) {
            this.aggroTarget = undefined;
        } else if (!this.aggroTarget && entity) {
            if (!this.canReceiveDamageFrom(entity)) return;
            if (this.definition.category === MobCategory.Friendly && 
                entity.type === EntityType.Player) 
                return;
            
            this.aggroTarget = entity;
        }

        if (this.lastSegment && !this.lastSegment.aggroTarget) {
            this.lastSegment.changeAggroTo(entity);
        }
    }

    getRandomAggroAround() {
        if ((this.definition.category === MobCategory.Enemy || 
            this.definition.category === MobCategory.Friendly)
            && !this.aggroTarget) {
            const aggro = new CircleHitbox(
                this.definition.aggroRadius, this.position
            );

            const entities =
                this.game.grid.intersectsHitbox(aggro);
            
            let aggroable: damageSource[] = [];
            
            if (this.definition.category === MobCategory.Enemy) {
                aggroable = Array.from(entities)
                    .filter(e =>
                        isDamageSourceEntity(e)
                        && aggro.collidesWith(e.hitbox)) as damageSource[];
            } else if (this.definition.category === MobCategory.Friendly) {
                aggroable = Array.from(entities)
                    .filter(e =>
                        e instanceof ServerMob &&
                        e.definition.category !== MobCategory.Friendly &&
                        e !== this &&
                        aggro.collidesWith(e.hitbox)) as damageSource[];
            }

            if (aggroable.length) {
                this.changeAggroTo(aggroable[Random.int(0, aggroable.length - 1)]);
            }
        }
    }

    shootDirection: VectorAbstract = Vec2.new(0, 0);
    shootSpeedForNow?: number;
    lastShootTime: number = 0;

    shoot(shoot: ProjectileParameters): void {
        const position = shoot.definition.onGround ? this.position
           : Vec2.add(this.position,Vec2.mul(this.shootDirection, this.hitbox.radius))

        const projectile = new ServerProjectile(this,
            position,
            this.shootDirection, shoot);

        if(shoot.velocityAtFirst) projectile.addVelocity(
            Vec2.mul(this.shootDirection, shoot.velocityAtFirst)
        )
    }

    shootTick(): void {
        if (!this.definition.shootable) return;

        if (!this.shootSpeedForNow) {
            if (typeof this.definition.shootSpeed === "number") {
                this.shootSpeedForNow = this.definition.shootSpeed
            } else {
                this.shootSpeedForNow =
                    Random.float(
                        this.definition.shootSpeed.min,
                        this.definition.shootSpeed.max
                    )
            }
        }

        this.shootReload += this.game.dt;
        if (this.shootReload >= this.shootSpeedForNow) {
            if (
                this.lastSegment
                && !(this.lastSegment.lastShootTime
                && (Date.now() - this.lastSegment.lastShootTime) > 90)
            ) return;

            this.shoot(this.definition.shoot);
            this.shootReload = 0;
            this.shootSpeedForNow = undefined;
            this.lastShootTime = Date.now();
        }
    }

    move(): void {
        this.setAcceleration(Vec2.mul(
            this.direction, this.speed
        ));
    }

    sharingHealthBetweenSegments = false;

    notCollidingMobs: string[] = [];

    tick(): void{
        super.tick()

        this.otherModifiers.push(this.definition.modifiers ?? {});

        this.updateModifiers();

        if (this.lastSegment) {
            if (!this.lastSegment.destroyed) {
                this.direction = Geometry.directionBetweenPoints(
                    this.position,
                    this.lastSegment.position
                );

                this.position = Geometry.getPositionOnCircle(
                    Geometry.directionToRadians(
                        this.direction,
                    ),
                    this.definition.hitboxRadius + this.lastSegment.definition.hitboxRadius,
                    this.lastSegment.position
                );

                if (this.lastSegment.aggroTarget) {
                    if (this.definition.shootable) {
                        this.shootDirection = Geometry.radiansToDirection(
                            Random.float(-P2, P2)
                        )
                        this.shootTick();
                    }

                    this.changeAggroTo(this.lastSegment.aggroTarget);
                } else  {
                    this.changeAggroTo()
                }

                if (
                    this.lastSegment.notCollidingMobs
                    && !this.notCollidingMobs.length
                ) {
                    this.notCollidingMobs.push(
                        ...this.lastSegment.notCollidingMobs
                    )
                }

                if (this.lastSegment.sharingHealthBetweenSegments) {
                    this.sharingHealthBetweenSegments = true;

                    if (this.lastSegment.health != this.health) this.health = this.lastSegment.health;
                }

                return ;
            } else {
                if (this.sharingHealthBetweenSegments)
                    this.destroy()
            }
        }

        if (this.definition.hasSegments) {
            if (this.definition.notCollideWithSegments && !this.notCollidingMobs.length)
                this.notCollidingMobs.push(
                    this.definition.segmentDefinitionIdString,
                    this.definition.idString
                )
            if (this.definition.sharingHealth && !this.sharingHealthBetweenSegments)
                this.sharingHealthBetweenSegments = true
        }

        if (this.modifiers.healPerSecond) {
            if (this.definition.skills?.healUnder) {
                if (this.health < this.definition.skills.healUnder * this.definition.health) {
                    this.healingToFull = true;
                }
                if (this.healingToFull) {
                    this.health += this.modifiers.healPerSecond * this.game.dt;
                    this.modifiers.speed *= -1;
                    this.move();

                    if (this.health >= this.definition.health) {
                        this.healingToFull = false;
                    }
                    return;
                }
            } else {
                this.health += this.modifiers.healPerSecond * this.game.dt;
            }
        }

        if (this.definition.category === MobCategory.Fixed) return;

        if (this.definition.category === MobCategory.Friendly) {
            this.getRandomAggroAround();
        }

        if ((this.definition.category === MobCategory.Enemy
            || this.definition.category === MobCategory.Passive
            || this.definition.category === MobCategory.Friendly)
            && this.aggroTarget)
        {
            if (this.aggroTarget.destroyed) return this.changeAggroTo();
            const distanceBetween = Vec2.distanceBetween(this.aggroTarget.position, this.position);
            if (distanceBetween > this.definition.aggroRadius * 2.2) return this.changeAggroTo();

            this.direction = Geometry.directionBetweenPoints(
                this.aggroTarget.position, this.position
            );
            this.shootDirection = Geometry.directionBetweenPoints(
                this.aggroTarget.position, this.position
            );

            if (this.definition.shootable) {
                if (this.shootSpeedForNow && this.definition.movement && this.definition.movement.reachingAway) {
                    const reachingAwayRadius = Math.max(15, this.definition.aggroRadius * 0.8);
                    if (distanceBetween <= reachingAwayRadius) {
                        this.shootTick();
                        if (
                            this.definition.turningHead
                            && this.shootReload >= this.shootSpeedForNow * 0.6
                        ) this.direction = Vec2.mul(this.direction, -1);
                    } else {
                        this.move();
                    }
                } else {
                    this.move();
                    this.shootTick();
                }
            } else {
                this.move();
            }
        } else {
            this.walkingReload += this.game.dt;

            if (this.definition.movement && this.definition.movement.sandstormLike) {
                const changeDirectionInterval = 1 + Math.random() * 0.5;
                if (this.walkingReload >= changeDirectionInterval) {
                    const entities = this.game.grid.intersectsHitbox(new CircleHitbox(30, this.position));
                    let nearestPlayer: ServerPlayer | null = null;
                    let nearestDistance = Infinity;

                    for (const entity of entities) {
                        if (entity instanceof ServerPlayer) {
                            const distance = Vec2.distanceBetween(this.position, entity.position);
                            if (distance < nearestDistance) {
                                nearestDistance = distance;
                                nearestPlayer = entity;
                            }
                        }
                    }

                    let moveDirection;
                    const randomSpeedMultiplier = 0.6 + Math.random() * 0.5;

                    if (this instanceof ServerFriendlyMob && this.isSummoned && nearestPlayer && Math.random() < 0.7) {
                        moveDirection = Vec2.new(nearestPlayer.direction.direction.x, nearestPlayer.direction.direction.y);
                        moveDirection.x += (Math.random() * 0.6 - 0.3);
                        moveDirection.y += (Math.random() * 0.6 - 0.3);
                        moveDirection = Vec2.normalize(moveDirection);
                        this.setAcceleration(Vec2.mul(
                            moveDirection, 2 * this.speed * randomSpeedMultiplier
                        ));
                    } else {
                        moveDirection = Random.vector(-1, 1, -1, 1);
                        this.setAcceleration(Vec2.mul(
                            moveDirection, this.speed * randomSpeedMultiplier
                        ));
                    }


                }

                if (this.definition.despawnTime) {
                    const despawnTime = this.definition.despawnTime;
                    const aliveTime = (Date.now() - this.spawnTime) / 1000;
                    if (aliveTime >= despawnTime) {
                        this.destroy(true);
                    }
                }
            } else if (this.walkingReload >= GameConstants.mob.walkingReload) {
                if (this.walkingTime === 0) this.direction = Random.vector(-1, 1, -1, 1);

                this.setAcceleration(Vec2.mul(
                    this.direction, this.speed * GameConstants.mob.walkingTime
                ))

                this.walkingTime += this.game.dt;

                if (this.walkingTime >= GameConstants.mob.walkingTime) {
                    this.walkingReload = 0;
                    this.walkingTime = 0;
                }
            }

            if (this.definition.category === MobCategory.Enemy) this.getRandomAggroAround();
        }
    }

    dealDamageTo(to: damageableEntity): void{
        if (this.definition.category === MobCategory.Friendly && 
            (to.type === EntityType.Player || to.type === EntityType.Petal))
            return;
            
        if (this.definition.category === MobCategory.Friendly && 
            to instanceof ServerMob) {
            if (to.definition.category === MobCategory.Friendly)
                return;
            to.receiveDamage(this.damage, this);
            return;
        }
            
        if (to.canReceiveDamageFrom(this))
            to.receiveDamage(this.damage, this);
    }

    calcModifiers(now: Modifiers, extra: Partial<Modifiers>): Modifiers {
        now.healPerSecond += extra.healPerSecond ?? 0;
        if (
            this.definition.rarity === RarityName.mythic
            && typeof extra.speed === "number" && extra.speed < 1
        ) {
            now.speed *= (1 - (1 - extra.speed) / 3);
        } else {
            now.speed *= extra.speed ?? 1;
        }
        now.selfPoison += extra.selfPoison ?? 0;

        return now;
    }

    lastPopped: number = 1;

    receiveDamage(amount: number, source: damageSource, disableEvent?: boolean): void {
        if (!this.isActive()) return;

        this.changeAggroTo(source);

        if (this.sharingHealthBetweenSegments && this.lastSegment) {
            this.lastSegment.receiveDamage(
                amount, source
            );
        }

        this.health -= amount;

        if (amount > 0 && this.definition.category === MobCategory.Fixed && this.definition.pop) {
            const percent = this.health / this.definition.health;
            const pop = this.definition.pop;
            const lastPopped = this.lastPopped;
            for (const popKey in pop) {
                const popPercents = pop[popKey];
                popPercents.forEach((popPercent) => {
                    if (popPercent >= percent && lastPopped >= popPercent) {
                        new ServerMob(this.game,
                            Geometry.getPositionOnCircle(Random.float(-P2, P2), 4,this.position),
                            this.direction,
                            Mobs.fromString(popKey)).changeAggroTo(source)
                        
                        if (this.definition.idString === "ant_hole" && popKey === "queen_ant" && Math.random() < 0.2) {
                            new ServerMob(this.game,
                                Geometry.getPositionOnCircle(Random.float(-P2, P2), 6, this.position),
                                this.direction,
                                Mobs.fromString("digger")).changeAggroTo(source)
                        }
                        
                        if (this.lastPopped > percent) this.lastPopped = percent;
                    }
                })
            }
        }

        if (source instanceof ServerPlayer) {
            const get = this.damageFrom.get(source)
            this.damageFrom.set(source, (get ?? 0) + amount)
        }

        this.destroyCheck();
    }

    destroyCheck() {
        if (this.health <= 0) {
            this.destroy();
        }
    }

    get data(): Required<EntitiesNetData[EntityType.Mob]>{
        return {
            position: this.position,
            direction: this.direction,
            full: {
                definition: this.definition,
                healthPercent: this.health / this.definition.health
            }
        };
    };

    destroy(noDrops: boolean = false) {
        super.destroy();

        const lootTable = this.definition.lootTable;

        let loots: PetalDefinition[] = []

        const randomMax = 10000000000;

        for (const lootsKey in lootTable) {
            if (!Petals.hasString(lootsKey)) continue;
            const random = Random.int(0, randomMax);
            if (random <= lootTable[lootsKey] * randomMax){
                loots.push(Petals.fromString(lootsKey));
            }
        }

        if (!noDrops) spawnLoot(this.game, loots, this.position);

        const highestPlayer =
            Array.from(this.damageFrom).filter(e => e[0].isActive())
                .sort((a, b) => b[1] - a[1])[0]

        if (!(highestPlayer && highestPlayer.length && highestPlayer[0].isActive())) return;

        const rarity = Rarity.fromString(this.definition.rarity);
        if (rarity.globalMessage && !this.definition.hideInformation) {
            let content = `The ${rarity.displayName} ${this.definition.displayName} has been defeated`
            content += ` by ${highestPlayer[0].name}`;

            this.game.sendGlobalMessage({
                content: content +"!",
                color: parseInt(rarity.color.substring(1), 16)
            })
        }

        highestPlayer[0].addExp(this.definition.exp);

        highestPlayer[0].collected.push(this.definition);
        highestPlayer[0].dirty.collect = true;
    }
}

export class ServerFriendlyMob extends ServerMob {
    // 表示是否是被玩家召唤的生物（true）还是自然生成的（false）
    isSummoned: boolean = true;

    canReceiveDamageFrom(source: damageableEntity): boolean {
        switch (source.type) {
            case EntityType.Player:
                return source != this.owner
            case EntityType.Mob:
                if (source instanceof ServerFriendlyMob) return source.owner !== this.owner;
                return true;
            case EntityType.Petal:
                return source.owner != this.owner
            case EntityType.Projectile:
                return source.source != this
                   && source.source !== this.owner;
        }
    }

    canCollideWith(entity: collideableEntity): boolean {
        if(entity instanceof ServerFriendlyMob) return true;
        if(isDamageableEntity(entity)) return this.owner.canReceiveDamageFrom(entity)
        else return false;
    }

    shoot(shoot: ProjectileParameters) {
        new ServerProjectile(this.owner,
            this.position,
            this.direction, shoot);
    }

    changeAggroTo(entity?: damageSource) {
        if(!this.gettingBackToOwner) super.changeAggroTo(entity);
    }

    constructor(game: Game
        , public owner: ServerPlayer
        , definition: MobDefinition
        , isSummoned: boolean = true) {
        super(game
            , Random.pointInsideCircle(owner.position, 12)
            , owner.direction.direction
            , definition
        );
        this.isSummoned = isSummoned;
    }

    gettingBackToOwner: boolean = false;

    tick() {
        const distanceToOwner = Vec2.distanceBetween(this.position, this.owner.position);
        if (distanceToOwner > Math.max(8 * this.definition.hitboxRadius, 25)) {
            this.gettingBackToOwner = true;
        }

        if (this.gettingBackToOwner) {
            this.aggroTarget = undefined;
            this.direction =
                Geometry.directionBetweenPoints(this.owner.position, this.position);
            this.setAcceleration(Vec2.mul(
                this.direction, this.speed
            ));
            if (distanceToOwner < 3 * this.definition.hitboxRadius)
                this.gettingBackToOwner = false;
        }

        super.tick();
    }

    dealDamageTo(to: damageableEntity) {
        if (to.canReceiveDamageFrom(this))
            to.receiveDamage(this.damage, this.owner);
    }

    destroy() {
        this.destroyed = true;
        this.game.grid.remove(this);
    }
}
