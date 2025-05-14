import { type GameEntity } from "../../../common/src/misc/entityPool";
import { EntityType, GameConstants } from "../../../common/src/constants";
import { GameBitStream } from "../../../common/src/net/net";
import { type EntitiesNetData, EntitySerializations } from "../../../common/src/net/packets/updatePacket";
import { CircleHitbox, type Hitbox } from "../../../common/src/physics/hitbox";
import { UVector2D } from "../../../common/src/physics/uvector";
import { type ServerGame } from "../game";
import { CollisionResponse } from "../../../common/src/physics/collision";
import { PoisonEffect } from "../effect/poisonEffect";
import { Modifiers } from "../../../common/src/typings";
import { collideableEntity, damageSource } from "../typings";
import { ServerPlayer } from "./serverPlayer";
import Vector from "../../../common/src/physics/vector";
import VectorAbstract from "../../../common/src/physics/vectorAbstract";
import Velocity from "../../../common/src/physics/velocity";
import { EffectManager } from "../effect/effectManager";
import { Geometry } from "../../../common/src/maths/geometry";

export abstract class ServerEntity<T extends EntityType = EntityType> implements GameEntity {
    abstract type: T;
    game: ServerGame;
    id: number;

    _position: VectorAbstract;
    _oldPosition?: VectorAbstract;

    modifiers: Modifiers = GameConstants.defaultModifiers();
    otherModifiers: Array<Partial<Modifiers>> = [];

    hasInited = false;
    destroyed = false;

    get position(): VectorAbstract {
        return this._position;
    }

    set position(pos: VectorAbstract) {
        this.updatePosition(pos);
    }

    abstract hitbox: Hitbox;

    effects = new EffectManager(this);

    partialStream!: GameBitStream;
    fullStream!: GameBitStream;

    weight = 5;
    damagedEntityThisTick: ServerEntity[] = [];

    acceleration: Vector = new Vector();
    velocity: Velocity = new Velocity();

    absorbKnockback = 8;
    pushFactor = 1;

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

    constructor(game: ServerGame, pos: VectorAbstract) {
        this.game = game;
        this.id = game.nextEntityID;
        this._position = pos;
    }

    tick() {
        this.damagedEntityThisTick = [];

        this.effects.tick();

        this.velocity.setPosition(this.position);

        this.applyPhysics();
    }

    applyPhysics(): void {
        if (this.destroyed) return;

        this.addAcceleration(this.velocity.clone().mul(-0.2));
        this.velocity.add(this.acceleration);

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        if (this.velocity.magnitude < 0.01) this.velocity.magnitude = 0;

        this.updatePosition(this.position);

        this.acceleration.clear();
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

    setPositionSafe(position: VectorAbstract) {
        if (!this.isActive()) return;
        this.updatePosition(position);
    }

    updatePosition(position: VectorAbstract): void {
        if (this._oldPosition && this._oldPosition == position) return;

        if (this.hitbox instanceof CircleHitbox) {
            this.hitbox.position = this.game.clampPosition(
                position, this.hitbox.radius, this.hitbox.radius
            );
            this._position = this.hitbox.position;
        } else {
            this._position = position;
        }

        if (!this.hasInited) return;
        if (this.destroyed) return;

        this.setDirty();
        this.game.grid.updateEntity(this);
    }

    addVelocity(vec: VectorAbstract, downing = 0.7): void {}

    setAcceleration(vec: VectorAbstract): void {
        this.acceleration.set(vec);
    }

    addAcceleration(vec: VectorAbstract): void {
        this.acceleration.add(vec);
    }

    receiveKnockback(entity: collideableEntity): void {
        this.addAcceleration(
            UVector2D.fromPolar(
                Geometry.angleBetweenPoints(entity.position, this.position),
                -2
            )
        );
    }

    collideWith(collision: CollisionResponse, entity: collideableEntity): void {
        if (!entity.canCollideWith(this) || !this.canCollideWith(entity)) return;

        if (collision) {
            this.position = UVector2D.add(
                this.position,
                Vector.fromPolar(Geometry.directionToRadians(collision.dir), -collision.pen)
            );
            this.velocity.updateVelocity();
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
        });
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
        });

        this.otherModifiers.forEach(effect => {
            modifiersNow = this.calcModifiers(modifiersNow, effect);
        });

        this.otherModifiers = [];

        this.modifiers = modifiersNow;
    }

    abstract get data(): Required<EntitiesNetData[EntityType]>;

    destroy(noDrops = false): void {
        this.destroyed = true;
        this.game.grid.remove(this);
    }
}
