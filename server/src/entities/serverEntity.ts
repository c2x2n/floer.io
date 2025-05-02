import { type GameEntity } from "../../../common/src/utils/entityPool";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { GameBitStream } from "../../../common/src/net";
import { type EntitiesNetData, EntitySerializations } from "../../../common/src/packets/updatePacket";
import { CircleHitbox, type Hitbox } from "../../../common/src/utils/hitbox";
import { Vec2, type Vector } from "../../../common/src/utils/vector";
import { type Game } from "../game";
import { CollisionResponse } from "../../../common/src/utils/collision";
import { EffectManager, PoisonEffect } from "../utils/effects";
import { Modifiers, PlayerModifiers } from "../../../common/src/typings";
import { collideableEntity, damageSource } from "../typings";

export interface Velocity {
    vector: Vector;
    downing: number;
}


export abstract class ServerEntity<T extends EntityType = EntityType> implements GameEntity{
    abstract type: T;
    game: Game;
    id: number;

    _position: Vector;
    _oldPosition?: Vector;

    modifiers: Modifiers = GameConstants.defaultModifiers();
    otherModifiers: Partial<Modifiers>[] = [];

    hasInited: boolean = false;
    destroyed: boolean = false;

    get position(): Vector {
        return this._position;
    }
    set position(pos: Vector) {
        this.updatePosition(pos);
    }

    abstract hitbox: Hitbox;

    effects = new EffectManager(this);

    partialStream!: GameBitStream;
    fullStream!: GameBitStream;

    weight: number = 5;
    elasticity: number = 0.7;
    knockback: number = 1;

    velocity: Velocity[] = [{
        vector: Vec2.new(0,0),
        downing: 0.7
    }];
    acceleration: Vector = Vec2.new(0,0);

    state: {
        poison?: PoisonEffect
    } = {};

    canReceiveDamageFrom(entity: ServerEntity): boolean {
        return !(this === entity);
    }

    canCollideWith(entity: ServerEntity): boolean {
        return !(this === entity);
    }

    isActive(): boolean {
        return !this.destroyed;
    }

    constructor(game: Game, pos: Vector) {
        this.game = game;
        this.id = game.nextEntityID;
        this._position = pos;
    }

    tick() {
        const newVelocity = this.velocity.concat([]);

        let position = Vec2.clone(this.position);

        for (const aVelocity of newVelocity) {
            const index = newVelocity.indexOf(aVelocity);

            if (index === 0) {
                aVelocity.vector = Vec2.mul(aVelocity.vector, aVelocity.downing);
                aVelocity.vector = Vec2.add(aVelocity.vector, Vec2.mul(this.acceleration, this.game.dt));

                this.acceleration = Vec2.new(0, 0);

                position = Vec2.add(position, aVelocity.vector);

                continue;
            }

            position = Vec2.add(position, Vec2.mul(aVelocity.vector, this.game.dt))

            aVelocity.vector = Vec2.mul(aVelocity.vector, aVelocity.downing);

            if (Vec2.length(aVelocity.vector) < 1) {
                newVelocity.splice(index, 1);
            }
        }

        this.velocity = newVelocity;
        this.position = position;

        this.effects.tick()
    }

    init(): void {
        // + 3 for entity id (2 bytes) and entity type (1 byte)
        this.partialStream = GameBitStream.create(EntitySerializations[this.type].partialSize + 3);
        this.fullStream = GameBitStream.create(EntitySerializations[this.type].fullSize);
        this.serializeFull();
        this.hasInited = true;
    }


    serializePartial(): void {
        this.partialStream.index = 0;
        this.partialStream.writeUint16(this.id);
        this.partialStream.writeUint8(this.type);
        EntitySerializations[this.type].serializePartial(this.partialStream, this.data as EntitiesNetData[typeof this.type]);
        this.partialStream.writeAlignToNextByte();
    }

    serializeFull(): void {
        this.serializePartial();
        this.fullStream.index = 0;
        EntitySerializations[this.type].serializeFull(this.fullStream, this.data.full);
        this.fullStream.writeAlignToNextByte();
    }

    setDirty(): void {
        if (!this.hasInited) return;

        this.game.partialDirtyEntities.add(this);
    }

    setFullDirty(): void {
        if (!this.hasInited) return;

        this.game.fullDirtyEntities.add(this);
    }

    setPositionSafe(position: Vector) {
        if (!this.isActive()) return;
        this.updatePosition(position);
    }

    updatePosition(position: Vector): void {
        if (this._oldPosition && this._oldPosition == position) return;

        if (this.hitbox instanceof CircleHitbox) {
            this.hitbox.position = this.game.clampPosition(
                position, this.hitbox.radius, this.hitbox.radius
            );
            this._position = this.hitbox.position;
        }else {
            this._position = position;
        }

        if (!this.hasInited) return;
        if (this.destroyed) return;

        this.setDirty();
        this.game.grid.updateEntity(this);
    }

    addVelocity(vec: Vector, downing: number = 0.7): void {
        this.velocity.push({
            vector: vec,
            downing: downing
        });
    }

    setAcceleration(vec: Vector): void {
        this.acceleration = vec;
    }

    collideWith(collision: CollisionResponse, entity: collideableEntity): void{
        if (!entity.canCollideWith(this) || !this.canCollideWith(entity)) return;
        const knockbackBetween: { [K in collideableEntity["type"]]: number} = {
            [EntityType.Mob]: 0,
            [EntityType.Petal]: 0,
            [EntityType.Player]: 1.5,
            [EntityType.Projectile]: 0,
            [EntityType.Loot]: 0,
            [EntityType.Wall]: 0,
        }
        if (collision) {
            if (entity.knockback === 0) {
                this.position = Vec2.add(
                    this.position,
                    Vec2.mul(collision.dir, collision.pen)
                )

                for (const aVelocity of this.velocity) {
                    aVelocity.vector = Vec2.add(
                        aVelocity.vector,
                        Vec2.mul(collision.dir, collision.pen)
                    )
                }

                return;
            }
            this.addVelocity(
                Vec2.mul(
                    collision.dir,
                    (collision.pen + (entity.type !== this.type ? entity.knockback : knockbackBetween[entity.type]))
                    * entity.weight
                    * (-1)
                    / (this.weight + entity.weight)
                    / this.game.dt
                ),
                this.elasticity
            )
        }
    }

    receivePoison(source: damageSource,
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
        })
        this.state.poison.start();
    }

    calcModifiers(now: Modifiers, extra: Partial<Modifiers>): Modifiers {
        now.healPerSecond += extra.healPerSecond ?? 0;
        now.speed *= extra.speed ?? 1;

        return now;
    }

    updateModifiers(): void {
        let modifiersNow = GameConstants.defaultModifiers();

        this.effects.effects.forEach(effect => {
            if (effect.modifier) {
                modifiersNow = this.calcModifiers(modifiersNow, effect.modifier);
            }
        })

        this.otherModifiers.forEach(effect => {
            modifiersNow = this.calcModifiers(modifiersNow, effect)
        })

        this.otherModifiers = [];

        this.modifiers = modifiersNow;
    }

    abstract get data(): Required<EntitiesNetData[EntityType]>;

    destroy(noDrops: boolean = false): void {
        this.destroyed = true;
        this.game.grid.remove(this);
    }
}
