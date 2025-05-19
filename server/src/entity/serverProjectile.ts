import { ServerEntity } from "./entity";
import { UVector2D } from "../../../common/src/engine/physics/uvector";
import { type EntitiesNetData } from "../../../common/src/engine/net/packets/updatePacket";
import { CircleHitbox, RectHitbox } from "../../../common/src/engine/physics/hitbox";
import { EntityType } from "../../../common/src/constants";
import { ProjectileDefinition, ProjectileParameters } from "../../../common/src/definitions/projectiles";
import { AttributeEvents } from "../utils/attributeRealizes";
import { ServerPetal } from "./serverPetal";
import { damageSource } from "../typings";
import { ServerFriendlyMob, ServerMob } from "./serverMob";
import { ServerPlayer } from "./serverPlayer";
import { Random } from "../../../common/src/engine/maths/random";
import { P2 } from "../../../common/src/engine/maths/constants";
import VectorAbstract from "../../../common/src/engine/physics/vectorAbstract";
import { Geometry } from "../../../common/src/engine/maths/geometry";
import { Effect } from "./effect/effect";
import ServerLivelyEntity from "./lively";
import { Damage } from "./typings/damage";

export class ServerProjectile extends ServerLivelyEntity<EntityType.Projectile> {
    type: EntityType.Projectile = EntityType.Projectile;

    readonly name: string;
    hitbox: CircleHitbox;
    definition: ProjectileDefinition;
    parameters: ProjectileParameters;

    damage = 0;

    existingTime = 0;
    direction: VectorAbstract = UVector2D.new(0, 0);
    source: ServerLivelyEntity;
    knockback = 0.002;
    weight = 9;
    fromPetal?: ServerPetal;
    canCollideWith(source: ServerLivelyEntity): boolean {
        if (this.invincible) return false;
        if (source instanceof ServerLivelyEntity) return this.canReceiveDamageFrom(source);
        else return false;
    }

    constructor(source: ServerLivelyEntity,
        position: VectorAbstract,
        direction: VectorAbstract,
        parameters: ProjectileParameters,
        fromPetal?: ServerPetal) {
        super(source.game, position, EntityType.Projectile);
        this.setParent(source);
        this.name = parameters.definition.displayName;

        this.parameters = parameters;

        this.hitbox = new CircleHitbox(parameters.hitboxRadius);
        this.direction = direction;
        this.source = source;
        this.definition = parameters.definition;

        this.parameters = parameters;

        this.fromPetal = fromPetal;

        if (parameters.health) {
            this.maxHealth = parameters.health;
            this.health = parameters.health;
        } else {
            this.invincible = true;
        }

        this.damage = parameters.damage ?? 0;
        this.game.grid.addEntity(this);

        this.addAcceleration(
            UVector2D.mul(this.direction, (parameters.velocityAtFirst ?? parameters.speed * 6) * 0.2)
        );
        if (this.definition.onGround && parameters.velocityAtFirst) {
            this.addAcceleration(UVector2D.mul(direction, 80 * parameters.hitboxRadius / 25));
        }
    }

    tick(): void {
        super.tick();

        for (const collision of this.getCollisions()) {
            const to = collision.entity;
            if (to instanceof ServerLivelyEntity && this.parameters.modifiersWhenOn && this.canEffect(to)) {
                to.otherModifiersOnTick.push(this.parameters.modifiersWhenOn);
            }
        }

        this.existingTime += this.game.dt;
        if (this.existingTime >= this.parameters.despawnTime) {
            this.destroy();
        }

        this.maintainAcceleration(Geometry.directionToRadians(this.direction), this.parameters.speed);
    }

    protected onReceiveDamage(damage: Damage) {
        super.onReceiveDamage(damage);
    }

    override dealCollisionDamageTo(to: ServerLivelyEntity): void {
        if (this.definition.doesNotDamage?.includes(to.type)) return;
        super.dealCollisionDamageTo(to);
        // if (this.fromPetal && this.source.type === EntityType.Player) {
        //     this.source.sendEvent(AttributeEvents.PROJECTILE_DEAL_DAMAGE, to, this.fromPetal);
        // }

        if (this.parameters.modifiersWhenDamage) {
            const d = this.parameters.modifiersWhenDamage;
            new Effect({
                effectedTarget: to,
                duration: d.duration,
                source: this.source,
                modifier: d.modifier
            }).start();
        }

        if (this.parameters.poison) {
            to.receivePoison(
                this.source
                , this.parameters.poison.damagePerSecond
                , this.parameters.poison.duration
            );
        }
    }

    canEffect(to: ServerLivelyEntity): to is ServerPlayer | ServerMob {
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

    get data(): Required<EntitiesNetData[EntityType.Projectile]> {
        return {
            position: this.position,
            direction: this.direction,
            full: {
                hitboxRadius: this.parameters.hitboxRadius,
                definition: this.definition
            }
        };
    };

    destroy(illegal = false) {
        super.destroy(illegal);
        if (illegal) return;

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
                    );
                    radiansNow += P2 / spawner.amount;
                }
            } else {
                for (let i = 0; i < spawner.amount; i++) {
                    const position = Random.pointInsideCircle(
                        this.position, 8
                    );
                    this.game.spawnMob(
                        spawner.spawn,
                        position
                    );
                }
            }
        }
    }
}
