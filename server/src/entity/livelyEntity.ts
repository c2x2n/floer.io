import { ServerEntity } from "./serverEntity";
import { UVector2D } from "../../../common/src/engine/physics/uvector";
import { Geometry } from "../../../common/src/engine/maths/geometry";
import { PoisonEffect } from "../systems/effect/poison";
import { Modifiers } from "../../../common/src/typings/modifier";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { Numeric } from "../../../common/src/engine/maths/numeric";
import { ServerGame } from "../game";
import VectorAbstract from "../../../common/src/engine/physics/vectorAbstract";
import { Damage, DamageType } from "../typings/damage";
import { EffectsOnHitDataType, PoisonDataType } from "../../../common/src/typings/effect";
import { Effect } from "../systems/effect/effect";

export default abstract class ServerLivelyEntity<T extends EntityType = EntityType> extends ServerEntity<T> {
    public absorbKnockback = 1;
    public knockback = 2;

    // The differences between the parent and the summonr is:
    // When parent were destroyed, their children will be destroyed too. used in petals.
    // When summonr were destroyed, their children will not be destroyed. used in mobs.
    public parent: ServerLivelyEntity | undefined;
    public children: ServerLivelyEntity[] = [];
    public summonr: ServerLivelyEntity | undefined;

    private _team: number;
    public get team(): number {
        return this._team;
    }

    public set team(value: number) {
        if (this._team !== value) {
            this._team = value;
            this.game.giveTeam(this.team);
        }
    }

    public invincible = false;

    protected bodyPoison?: PoisonDataType;
    protected effectsOnHit?: EffectsOnHitDataType;
    protected constantModifier?: Partial<Modifiers>;
    public modifiers: Modifiers = GameConstants.defaultModifiers();
    public otherModifiersOnTick: Array<Partial<Modifiers>> = [];

    public damage?: number; // If it's an undefined, it means it cant do damages.

    protected killedBy?: ServerLivelyEntity;

    protected _health = 1;
    public get health(): number {
        return this._health;
    }

    public set health(value: number) {
        this._health = Numeric.clamp(value, 0, this.maxHealth);
    }

    protected _maxHealth = 1;

    public get maxHealth(): number {
        return this._maxHealth;
    }

    public set maxHealth(value: number) {
        this._maxHealth = value;
        this.health = this._health;
    }

    public state: {
        poison?: PoisonEffect
    } = {};

    public canReceiveDamageFrom(entity: ServerLivelyEntity): boolean {
        return !this.invincible && !!entity.damage && !(this === entity) && this.team != entity.team;
    }

    protected constructor(game: ServerGame, position: VectorAbstract, type: T) {
        super(game, position);

        this._team = game.teamGenerator.create(type);
    }

    public dealtDamageTick = new Set<ServerLivelyEntity>();

    private bleeding = 0;

    public tick() {
        super.tick();

        this.dealtDamageTick.clear();

        const collisions = this.getCollisions();
        for (const collision of collisions) {
            if (!((collision.entity) instanceof ServerLivelyEntity)) continue;
            if (collision.entity.dealtDamageTick.has(this) || this.dealtDamageTick.has(collision.entity)) continue;

            if (collision.entity.canReceiveDamageFrom(this)) {
                this.collisionDamage(collision.entity);
                collision.entity.receiveKnockback(this);

                this.dealtDamageTick.add(collision.entity);
            }

            if (this.canReceiveDamageFrom(collision.entity)) {
                collision.entity.collisionDamage(this);
                this.receiveKnockback(collision.entity);

                collision.entity.dealtDamageTick.add(this);
            }
        }

        this.modifiers = this.updateModifiers();

    }

    public receiveKnockback(entity: ServerLivelyEntity): void {
        this.addAcceleration(
            UVector2D.fromPolar(
                Geometry.angleBetweenPoints(this.position, entity.position),
                entity.knockback
                * this.absorbKnockback
                * entity.weight
                / (this.weight + entity.weight)
            )
        );
    }

    public receivePoison(source: ServerLivelyEntity,
        damagePerSecond: number,
        duration: number): void {
        if (this.state.poison) {
            const poison = this.state.poison;
            if (poison.duration * poison.damagePerSecond > damagePerSecond * duration) return;
            this.state.poison.destroy();
        }

        this.state.poison = new PoisonEffect({
            effectedTarget: this,
            source,
            damagePerSecond,
            duration
        });
        this.state.poison.start();
    }

    protected calcModifiers(now: Modifiers, extra: Partial<Modifiers>): Modifiers {
        now.healPerSecond += extra.healPerSecond ?? 0;
        now.speed *= extra.speed ?? 1;
        now.damageReceiveChance *= extra.damageReceiveChance ?? 1;
        if (extra.damageReflection && extra.damageReflection > now.damageReflection) {
            now.damageReflection = extra.damageReflection;
        }
        now.healing *= extra.healing ?? 1;
        now.armor += extra.armor ?? 0;

        if (extra.bodyPoison && extra.bodyPoison.duration > 0) {
            if (
                extra.bodyPoison.duration * extra.bodyPoison.damagePerSecond
                > now.bodyPoison.duration * now.bodyPoison.damagePerSecond
            ) {
                now.bodyPoison = extra.bodyPoison;
            }
        }

        return now;
    }

    public updateModifiers(): Modifiers {
        let modifiersNow = GameConstants.defaultModifiers();
        this.calcModifiers(modifiersNow, this.constantModifier ?? {});
        this.effects.effects.forEach(effect => {
            if (effect.modifier) modifiersNow = this.calcModifiers(modifiersNow, effect.modifier);
        });
        this.otherModifiersOnTick.forEach(effect => {
            modifiersNow = this.calcModifiers(modifiersNow, effect);
        });
        modifiersNow = this.calcModifiers(modifiersNow, {
            bodyPoison: this.bodyPoison
        });
        this.otherModifiersOnTick = []; // clear all old
        return modifiersNow;
    }

    public receiveDamage(damage: Damage) {
        let { amount } = damage;
        if (damage.type === DamageType.COLLISION) amount -= this.modifiers.armor;
        if (amount <= 0) return;
        this.health -= amount;

        this.onReceiveDamage(damage);
    }

    public getTopParent(): ServerLivelyEntity {
        return this.parent ? this.parent.getTopParent() : this;
    }

    public setParent(parent: ServerLivelyEntity): void {
        if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.parent = parent;
        parent.children.push(this);
        this.team = parent.team;
    }

    public setSummonr(summonr: ServerLivelyEntity): void {
        this.summonr = summonr;
        this.team = summonr.team;
    }

    protected onReceiveDamage(damage: Damage) {
        if (this.health <= 0) {
            this.killedBy = damage.source;
            this.destroy();
        }

        if (this.modifiers.damageReflection > 0 && damage.amount > 0) {
            damage.source.receiveDamage({
                source: this.getTopParent(),
                amount: damage.amount * this.modifiers.damageReflection,
                type: DamageType.DAMAGE_REFLECTION,
                to: damage.source
            });
        }
    }

    public dealCollisionDamage(entity: ServerLivelyEntity): void {
        if (!this.damage) return;

        entity.receiveDamage({
            amount: this.damage,
            source: this.getTopParent(),
            to: entity,
            type: DamageType.COLLISION
        });
    }

    public collisionDamage(entity: ServerLivelyEntity): void {
        this.dealCollisionDamage(entity);

        if (this.bodyPoison && this.bodyPoison.duration > 0) { // poison
            entity.receivePoison(this,
                this.bodyPoison.damagePerSecond,
                this.bodyPoison.duration
            );
        }
        if (this.effectsOnHit) { // effects
            new Effect({
                effectedTarget: entity,
                duration: this.effectsOnHit.duration,
                source: this.getTopParent(),
                modifier: this.effectsOnHit.modifier
            }).start();
        }
    }

    heal(amount: number) {
        amount *= this.modifiers.healing;
        this.health += amount;
    }

    public override destroy(illegal = false) {
        super.destroy(illegal);

        // Kill memory leaks here

        if (this.parent) {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
            this.parent = undefined;
        }

        if (this.summonr) this.summonr = undefined;

        const children = this.children.concat([]);
        for (const child of children) {
            child.parent = undefined;
            child.destroy(illegal);
        }
    }
}
