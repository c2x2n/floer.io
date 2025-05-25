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
import spawnProjectile from "./spawning/projectile";
import MobAI from "./mobAI";

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

    canCollideWith(entity: ServerEntity): boolean {
        if (entity === this.summonr) return false;
        const rarity = Rarity.fromString(this.definition.rarity);
        if (entity instanceof ServerWall) return true;
        if (rarity.notCollideWithOther) return false;

        return !(
            this.definition.category === MobCategory.Fixed
            && this.definition.onGround
            && entity.type === this.type
        )
        && entity != this;
    }

    lastSegment?: ServerMob;
    ai: MobAI;

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

        this.ai = new MobAI(this);
    }

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

                this.ai.targeted = this.lastSegment.ai.targeted;

                return;
            }
        }

        this.ai.tick();

        this.health += this.modifiers.healPerSecond * this.game.dt;
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
        this.ai.changeAggroTo(source.getTopParent());

        if (amount > 0 && this.definition.pop) {
            const percent = this.health / this.definition.health;
            const pop = this.definition.pop;
            const lastPopped = this.lastPopped;
            for (const popKey in pop) {
                const popPercents = pop[popKey];
                popPercents.forEach(popPercent => {
                    if (popPercent >= percent && lastPopped >= popPercent) {
                        this.game.spawnMob(Mobs.fromString(popKey),
                            Geometry.getPositionOnCircle(Random.float(-P2, P2), 4, this.position)).ai.targeted = damage.source;

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
        if (this.destroyed) return;

        super.destroy();

        if (this.summonr && this.summonr instanceof ServerPlayer) return;

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
