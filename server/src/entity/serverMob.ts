import { ServerEntity } from "./serverEntity";
import { UVector2D } from "../../../common/src/engine/physics/uvector";
import { CircleHitbox } from "../../../common/src/engine/physics/hitbox";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { ServerGame } from "../game";
import { MobCategory, MobDefinition, Mobs } from "../../../common/src/definitions/mobs";
import { P2 } from "../../../common/src/engine/maths/constants";
import { ServerPlayer } from "./serverPlayer";
import { Random } from "../../../common/src/engine/maths/random";
import { PetalDefinition, Petals } from "../../../common/src/definitions/petals";
import { ServerProjectile } from "./serverProjectile";
import { ProjectileParameters } from "../../../common/src/definitions/projectiles";
import { Modifiers } from "../../../common/src/typings/modifier";
import { Rarity, RarityName } from "../../../common/src/definitions/rarities";
import { ServerWall } from "./serverWall";
import VectorAbstract from "../../../common/src/engine/physics/vectorAbstract";
import { Geometry } from "../../../common/src/engine/maths/geometry";
import ServerLivelyEntity from "./livelyEntity";
import { Damage } from "../typings/damage";
import { EntitiesNetData } from "../../../common/src/engine/net/entitySerializations";
import { spawnLoot } from "./spawning/loot";

export class ServerMob extends ServerLivelyEntity<EntityType.Mob> {
    type: EntityType.Mob = EntityType.Mob;

    hitbox: CircleHitbox;
    definition: MobDefinition;

    get name(): string {
        return this.definition.displayName;
    }

    get health(): number {
        return super.health;
    }

    override set health(value: number) {
        super.health = value;
        this.setFullDirty();
    }

    aggroTarget?: ServerLivelyEntity;

    _direction: VectorAbstract = UVector2D.new(0, 0);

    get direction(): VectorAbstract {
        return this._direction;
    }

    set direction(value: VectorAbstract) {
        if (value === this._direction) return;
        this._direction = value;

        this.setDirty();
    }

    get speed(): number {
        if (this.definition.category !== MobCategory.Fixed) { return this.definition.speed * this.modifiers.speed; }
        return 0;
    }

    walkingReload = 0;
    walkingTime = 0;
    shootReload = 0;

    canCollideWith(entity: ServerEntity): boolean {
        const rarity = Rarity.fromString(this.definition.rarity);
        if (entity instanceof ServerWall) return true;
        if (rarity.notCollideWithOther) return false;

        if (entity instanceof ServerMob
            && this.notCollidingMobs.includes(entity.definition.idString)) return false;

        return !(
            this.definition.category === MobCategory.Fixed
            && this.definition.onGround
            && entity.type === this.type
        )
        && entity != this;
    }

    lastSegment?: ServerMob;

    damageFrom = new Map<ServerPlayer, number>();

    spawnTime: number = Date.now();
    knockback = 1;

    constructor(game: ServerGame
        , position: VectorAbstract
        , direction: VectorAbstract
        , definition: MobDefinition
        , lastSegment?: ServerMob) {
        super(game, position, EntityType.Mob);

        this.definition = definition;
        this.hitbox = new CircleHitbox(definition.hitboxRadius);
        this.damage = definition.damage;
        this.constantModifier = definition.modifiers;
        this.bodyPoison = definition.poison;

        this.maxHealth = definition.health;
        this.health = definition.health;

        this.weight = definition.hitboxRadius * 10;
        this.lastSegment = lastSegment;
        this.game.grid.addEntity(this);
        this.direction = direction;
        this.spawnTime = Date.now();
    }

    changeAggroTo(entity?: ServerLivelyEntity): void {
        if (![MobCategory.Enemy, MobCategory.Passive].includes(this.definition.category)) return;

        if (this.aggroTarget && !entity) {
            this.aggroTarget = undefined;
        } else if (!this.aggroTarget && entity) {
            if (!this.canReceiveDamageFrom(entity)) return;
            this.aggroTarget = entity;
        }

        if (this.lastSegment && !this.lastSegment.aggroTarget) {
            this.lastSegment.changeAggroTo(entity);
        }
    }

    getRandomAggroAround() {
        if ((this.definition.category != MobCategory.Enemy) || this.aggroTarget) return;
        const aggro = new CircleHitbox(
            this.definition.aggroRadius, this.position
        );

        const entities
            = this.game.grid.intersectsHitbox(aggro);

        const aggroable = Array.from(entities)
            .filter(e =>
                (e instanceof ServerLivelyEntity)
                && aggro.collidesWith(e.hitbox)) as ServerLivelyEntity[];

        if (aggroable.length) {
            this.changeAggroTo(aggroable[Random.int(0, aggroable.length - 1)].getTopParent());
        }
    }

    shootDirection: VectorAbstract = UVector2D.new(0, 0);
    shootSpeedForNow?: number;
    lastShootTime = 0;

    shoot(shoot: ProjectileParameters): void {
        const position = shoot.definition.onGround
            ? this.position
            : UVector2D.add(this.position, UVector2D.mul(this.shootDirection, this.hitbox.radius));

        new ServerProjectile(this,
            position,
            this.shootDirection, shoot);
    }

    shootTick(): void {
        if (!this.definition.shootable) return;

        if (!this.shootSpeedForNow) {
            if (typeof this.definition.shootSpeed === "number") {
                this.shootSpeedForNow = this.definition.shootSpeed;
            } else {
                this.shootSpeedForNow
                    = Random.float(
                        this.definition.shootSpeed.min,
                        this.definition.shootSpeed.max
                    );
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
        this.maintainAcceleration(Geometry.directionToRadians(this.direction), this.speed);
    }

    sharingHealthBetweenSegments = false;

    notCollidingMobs: string[] = [];

    tick(): void {
        super.tick();

        if (this.lastSegment) {
            if (!this.lastSegment.destroyed) {
                this.direction = Geometry.directionBetweenPoints(
                    this.position,
                    this.lastSegment.position
                );

                this.position.set(Geometry.getPositionOnCircle(
                    Geometry.directionToRadians(this.direction),
                    this.definition.hitboxRadius + this.lastSegment.definition.hitboxRadius + 0.1,
                    this.lastSegment.position
                ));
                if (this.lastSegment.aggroTarget) {
                    if (this.definition.shootable) {
                        this.shootDirection = Geometry.radiansToDirection(
                            Random.float(-P2, P2)
                        );
                        this.shootTick();
                    }

                    this.changeAggroTo(this.lastSegment.aggroTarget);
                } else {
                    this.changeAggroTo();
                }

                if (
                    this.lastSegment.notCollidingMobs
                    && !this.notCollidingMobs.length
                ) {
                    this.notCollidingMobs.push(
                        ...this.lastSegment.notCollidingMobs
                    );
                }

                if (this.lastSegment.sharingHealthBetweenSegments) {
                    this.sharingHealthBetweenSegments = true;

                    if (this.lastSegment.health != this.health) this.health = this.lastSegment.health;
                }

                return;
            } else {
                if (this.sharingHealthBetweenSegments) { this.destroy(); }
            }
        }

        if (this.definition.hasSegments) {
            if (this.definition.notCollideWithSegments && !this.notCollidingMobs.length) {
                this.notCollidingMobs.push(
                    this.definition.segmentDefinitionIdString,
                    this.definition.idString
                );
            }
            if (this.definition.sharingHealth && !this.sharingHealthBetweenSegments) { this.sharingHealthBetweenSegments = true; }
        }

        this.health += this.modifiers.healPerSecond * this.game.dt;

        if (this.definition.category === MobCategory.Fixed) return;

        if ((this.definition.category === MobCategory.Enemy
            || this.definition.category === MobCategory.Passive)
            && this.aggroTarget) {
            if (this.aggroTarget.destroyed) return this.changeAggroTo();
            const distanceBetween = UVector2D.distanceBetween(this.aggroTarget.position, this.position);
            if (distanceBetween > this.definition.aggroRadius * 2.2) return this.changeAggroTo();

            this.direction = Geometry.directionBetweenPoints(
                this.aggroTarget.position, this.position
            );
            this.shootDirection = Geometry.directionBetweenPoints(
                this.aggroTarget.position, this.position
            );

            if (this.definition.shootable) {
                if (this.shootSpeedForNow && this.definition.movement?.reachingAway) {
                    const reachingAwayRadius = Math.max(15, this.definition.aggroRadius * 0.8);
                    if (distanceBetween <= reachingAwayRadius) {
                        this.shootTick();
                        if (
                            this.definition.turningHead
                            && this.shootReload >= this.shootSpeedForNow * 0.6
                        ) this.direction = UVector2D.mul(this.direction, -1);
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

            if (this.walkingReload >= GameConstants.mob.walkingReload) {
                if (this.walkingTime === 0) this.direction = Random.vector(-1, 1, -1, 1);

                this.move();

                this.walkingTime += this.game.dt;

                if (this.walkingTime >= GameConstants.mob.walkingTime) {
                    this.walkingReload = 0;
                    this.walkingTime = 0;
                }
            }

            if (this.definition.category === MobCategory.Enemy) this.getRandomAggroAround();
        }
    }

    calcModifiers(now: Modifiers, extra: Partial<Modifiers>): Modifiers {
        const result = super.calcModifiers(now, extra);

        if (
            this.definition.rarity === RarityName.mythic
            && typeof extra.speed === "number" && extra.speed < 1
        ) {
            result.speed *= (1 - (1 - extra.speed) / 3);
        } else {
            result.speed *= extra.speed ?? 1;
        }

        return result;
    }

    lastPopped = 1;

    protected override onReceiveDamage(damage: Damage): void {
        super.onReceiveDamage(damage);

        const { source, amount } = damage;

        this.changeAggroTo(source.getTopParent());

        if (this.sharingHealthBetweenSegments && this.lastSegment) {
            this.lastSegment.receiveDamage(damage);
        }

        if (amount > 0 && this.definition.pop) {
            const percent = this.health / this.definition.health;
            const pop = this.definition.pop;
            const lastPopped = this.lastPopped;
            for (const popKey in pop) {
                const popPercents = pop[popKey];
                popPercents.forEach(popPercent => {
                    if (popPercent >= percent && lastPopped >= popPercent) {
                        this.game.spawnMob(Mobs.fromString(popKey),
                            Geometry.getPositionOnCircle(Random.float(-P2, P2), 4, this.position)).changeAggroTo(source);

                        if (this.definition.idString === "ant_hole" && popKey === "queen_ant" && Math.random() < 0.2) {
                            this.game.spawnMob(Mobs.fromString("digger"),
                                Geometry.getPositionOnCircle(Random.float(-P2, P2), 6, this.position)).changeAggroTo(source);
                        }

                        if (this.lastPopped > percent) this.lastPopped = percent;
                    }
                });
            }
        }

        if (source instanceof ServerPlayer) {
            const get = this.damageFrom.get(source);
            this.damageFrom.set(source, (get ?? 0) + amount);
        }
    }

    get data(): Required<EntitiesNetData[EntityType.Mob]> {
        return {
            position: this.position,
            direction: this.direction,
            full: {
                definition: this.definition,
                healthPercent: this.health / this.definition.health
            }
        };
    };

    destroy(illegal = false) {
        super.destroy();

        if (!illegal) { // Drops
            const lootTable = this.definition.lootTable;
            const loots: PetalDefinition[] = [];
            const randomMax = 10000000000;
            for (const lootsKey in lootTable) {
                if (!Petals.hasString(lootsKey)) continue;
                const random = Random.int(0, randomMax);
                if (random <= lootTable[lootsKey] * randomMax) {
                    loots.push(Petals.fromString(lootsKey));
                }
            }
            spawnLoot(this.game, loots, this.position);
        }

        const highestPlayer
            = Array.from(this.damageFrom).filter(e => e[0].isActive())
                .sort((a, b) => b[1] - a[1])[0];

        if (!(highestPlayer?.length && highestPlayer[0].isActive())) return;

        // Players

        const rarity = Rarity.fromString(this.definition.rarity);
        if (rarity.globalMessage && !this.definition.hideInformation) {
            let content = `The ${rarity.displayName} ${this.definition.displayName} has been defeated`;
            content += ` by ${highestPlayer[0].name}`;

            this.game.sendGlobalMessage({
                content: `${content}!`,
                color: parseInt(rarity.color.substring(1), 16)
            });
        }

        highestPlayer[0].addExp(this.definition.exp);

        highestPlayer[0].collected.push(this.definition);
        highestPlayer[0].dirty.collect = true;
    }
}

// Will be replaced soon. RIP.
export class ServerFriendlyMob extends ServerMob {
    // 表示是否是被玩家召唤的生物（true）还是自然生成的（false）
    isSummoned = true;

    canCollideWith(entity: ServerLivelyEntity): boolean {
        if (entity instanceof ServerFriendlyMob) return true;
        return this.owner.canReceiveDamageFrom(entity);
    }

    changeAggroTo(entity?: ServerLivelyEntity) {
        if (!this.gettingBackToOwner) super.changeAggroTo(entity);
    }

    constructor(game: ServerGame
        , public owner: ServerPlayer
        , definition: MobDefinition
        , isSummoned = true) {
        super(game
            , Random.pointInsideCircle(owner.position, 12)
            , owner.direction.moveDirection
            , definition
        );
        this.isSummoned = isSummoned;
    }

    gettingBackToOwner = false;

    tick() {
        const distanceToOwner = UVector2D.distanceBetween(this.position, this.owner.position);
        if (distanceToOwner > Math.max(8 * this.definition.hitboxRadius, 25)) {
            this.gettingBackToOwner = true;
        }

        if (this.gettingBackToOwner) {
            this.aggroTarget = undefined;
            this.direction
                = Geometry.directionBetweenPoints(this.owner.position, this.position);
            this.maintainAcceleration(Geometry.directionToRadians(this.direction), this.speed);
            if (distanceToOwner < 3 * this.definition.hitboxRadius) { this.gettingBackToOwner = false; }
        }

        super.tick();
    }

    destroy() {
        this.destroyed = true;
        this.game.grid.remove(this);
    }
}
