import { ServerEntity } from "./entity";
import { UVector2D } from "../../../common/src/physics/uvector";
import { Geometry } from "../../../common/src/maths/geometry";
import { PoisonEffect } from "./effect/poisonEffect";
import { Modifiers } from "../../../common/src/typings";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { damageSource } from "../typings";
import { Numeric } from "../../../common/src/maths/numeric";
import { ServerGame } from "../game";
import VectorAbstract from "../../../common/src/physics/vectorAbstract";
import { Damage, DamageType } from "./typings/damage";

export default abstract class ServerLivelyEntity<T extends EntityType = EntityType> extends ServerEntity<T> {
    public absorbKnockback = 1;
    public knockback = 2;

    public parent: ServerLivelyEntity | undefined;
    public children: ServerLivelyEntity[] = [];

    public followDestroy = false;

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

    public constructor(game: ServerGame, position: VectorAbstract, type: T) {
        super(game, position);

        this._team = game.teamGenerator.create(type);
    }

    public dealedDamage = new Set<ServerLivelyEntity>();

    public tick() {
        super.tick();

        this.dealedDamage.clear();

        const collisions = this.getCollisions();
        for (const collision of collisions) {
            if (!((collision.entity) instanceof ServerLivelyEntity)) continue;
            if (collision.entity.dealedDamage.has(this) || this.dealedDamage.has(collision.entity)) continue;

            if (collision.entity.canReceiveDamageFrom(this)) {
                this.dealCollisionDamageTo(collision.entity);
                collision.entity.receiveKnockback(this);

                this.dealedDamage.add(collision.entity);
            }

            if (this.canReceiveDamageFrom(collision.entity)) {
                collision.entity.dealCollisionDamageTo(this);
                this.receiveKnockback(collision.entity);

                collision.entity.dealedDamage.add(this);
            }
        }

        this.updateModifiers();
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

    public receivePoison(source: damageSource,
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
        now.healing *= extra.healing ?? 1;
        now.selfPoison += extra.selfPoison ?? 0;

        return now;
    }

    public updateModifiers(): void {
        let modifiersNow = GameConstants.defaultModifiers();
        this.effects.effects.forEach(effect => {
            if (effect.modifier) {
                modifiersNow = this.calcModifiers(modifiersNow, effect.modifier);
            }
        });
        this.otherModifiersOnTick.forEach(effect => {
            modifiersNow = this.calcModifiers(modifiersNow, effect);
        });
        this.otherModifiersOnTick = []; // clear all
        this.modifiers = modifiersNow;
    }

    public receiveDamage(damage: Damage) {
        const { amount } = damage;
        if (amount <= 0) return;
        this.health -= amount - this.modifiers.armor;

        this.onReceiveDamage(damage);
    }

    public getTopParent(): ServerLivelyEntity {
        return this.parent ? this.parent.getTopParent() : this;
    }

    public setParent(parent: ServerLivelyEntity, followDestroy = false): void {
        if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1);
        this.parent = parent;
        parent.children.push(this);
        this.team = parent.team;
    }

    protected onReceiveDamage(damage: Damage) {
        if (this.health <= 0) {
            this.killedBy = damage.source;
            this.destroy();
        }
    }

    public dealCollisionDamageTo(entity: ServerLivelyEntity): void {
        if (!this.damage) return;

        entity.receiveDamage({
            amount: this.damage,
            source: this.getTopParent(),
            to: entity,
            type: DamageType.COLLISION
        });
    }

    heal(amount: number) {
        amount *= this.modifiers.healing;
        this.health += amount;
    }

    public override destroy(illegal = false) {
        super.destroy(illegal);
        if (this.parent) {
            this.parent.children.splice(this.parent.children.indexOf(this), 1);
            this.parent = undefined;
        }

        const children = this.children.concat([]);
        for (const child of children) {
            child.parent = undefined;
            if (child.followDestroy) child.destroy(illegal);
        }
    }
}
