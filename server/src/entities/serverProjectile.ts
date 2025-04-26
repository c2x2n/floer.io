import { ServerEntity } from "./serverEntity";
import { Vec2, Vector } from "../../../common/src/utils/vector";
import { type EntitiesNetData } from "../../../common/src/packets/updatePacket";
import { CircleHitbox } from "../../../common/src/utils/hitbox";
import { EntityType } from "../../../common/src/constants";
import { ProjectileDefinition, ProjectileParameters } from "../../../common/src/definitions/projectile";
import { AttributeEvents } from "../utils/attribute";
import { ServerPetal } from "./serverPetal";
import { collideableEntity, damageableEntity, damageSource, isDamageableEntity } from "../typings";
import { Effect } from "../utils/effects";
import { ServerFriendlyMob, ServerMob } from "./serverMob";
import { Config } from "../config";
import { ServerPlayer } from "./serverPlayer";

export class ServerProjectile extends ServerEntity<EntityType.Projectile> {
    type: EntityType.Projectile = EntityType.Projectile;

    hitbox: CircleHitbox;
    definition: ProjectileDefinition;
    parameters: ProjectileParameters;

    health?: number;
    damage: number = 0;

    despawnTime: number = 0;
    direction: Vector = Vec2.new(0, 0);
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
                position: Vector,
                direction: Vector,
                parameters: ProjectileParameters,
                from?: ServerPetal) {
        super(source.game, position);

        this.hitbox = new CircleHitbox(parameters.hitboxRadius);
        this.position = position;
        this.direction = direction;
        this.source = source;
        this.definition = parameters.definition;

        this.parameters = parameters;

        this.from = from;

        this.health = parameters.health;
        this.damage = parameters.damage ?? 0;

        this.game.grid.addEntity(this);
    }

    tick(): void{
        super.tick();

        this.despawnTime += this.game.dt;
        if (this.despawnTime >= this.parameters.despawnTime) {
            this.destroy();
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
        }

        if (this.parameters.modifiers && this.canEffect(to)) {
            to.otherModifiers.push(this.parameters.modifiers)
        }
    }

    canEffect(to: damageableEntity): to is ServerPlayer | ServerMob {
        if (!(to instanceof ServerPlayer || to instanceof ServerMob)) return false

        if (this.parameters.modifiers) {
            if (this.source.type === EntityType.Player) {
                return !(to instanceof ServerMob
                    && to.definition.shootable
                    && to.definition.shoot.definition === this.definition);
            }

            if (this.source.type != to.type) {
                return true;
            }
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

    get data(): Required<EntitiesNetData[EntityType]>{
        return {
            position: this.position,
            direction: this.direction,
            full: {
                hitboxRadius: this.parameters.hitboxRadius,
                definition: this.definition,
            }
        };
    };
}
