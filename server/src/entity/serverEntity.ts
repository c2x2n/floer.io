import { type GameEntity } from "../../../common/src/misc/entityPool";
import { EntityType } from "../../../common/src/constants";
import { GameBitStream } from "../../../common/src/engine/net/net";
import { CircleHitbox, type Hitbox, RectHitbox } from "../../../common/src/engine/physics/hitbox";
import { type ServerGame } from "../game";
import { CollisionT } from "../../../common/src/engine/physics/collision";
import { CollisionInformation } from "../typings/collision";
import Vector from "../../../common/src/engine/physics/vector";
import VectorAbstract from "../../../common/src/engine/physics/vectorAbstract";
import Velocity from "../../../common/src/engine/physics/velocity";
import { EffectManager } from "../systems/effect/manager";
import { Geometry } from "../../../common/src/engine/maths/geometry";
import { UVector2D } from "../../../common/src/engine/physics/uvector";
import { EntitiesNetData, EntitySerializations } from "../../../common/src/engine/net/entitySerializations";

export abstract class ServerEntity<T extends EntityType = EntityType> implements GameEntity {
    public readonly abstract type: T;
    public readonly game: ServerGame;
    public readonly id: number;

    public abstract readonly name: string;

    public position: Vector;

    private hasInited = false;
    public destroyed = false;

    public readonly abstract hitbox: Hitbox;
    public readonly effects: EffectManager = new EffectManager(this);

    public partialStream!: GameBitStream;
    public fullStream!: GameBitStream;

    public weight = 5;
    public invisible = false;

    public acceleration: Vector = new Vector();
    public velocity: Velocity = new Velocity();

    public canCollideWith(entity: ServerEntity): boolean {
        return !(this === entity);
    }

    public isActive(): boolean {
        return !this.destroyed;
    }

    public constructor(game: ServerGame, position: VectorAbstract) {
        this.game = game;
        this.id = game.nextEntityID;
        this.position = new Vector().set(position);
        this.updatePosition();
    }

    public tick() {
        this.effects.tick();

        const collisions = this.getCollisions();
        for (const collision of collisions) {
            this.collideWith(collision.collision, collision.entity);
        }
    }

    public applyPhysics(): void {
        if (this.destroyed) return;

        {
            this.addAcceleration(this.velocity.clone().mul(-0.2));
            this.velocity.add(this.acceleration);
            this.position.x += this.velocity.x;
            this.position.y += this.velocity.y;

            if (this.velocity.magnitude < 0.01) this.velocity.magnitude = 0;

            this.acceleration.clear();
        }

        this.updatePosition();
    }

    public init(): void {
        if (this.hitbox instanceof CircleHitbox) {
            this.hitbox.position = this.position.clone();
        }
        // + 3 for entity id (2 bytes) and entity type (1 byte)
        this.partialStream = GameBitStream.create(EntitySerializations[this.type].partialSize + 3);
        this.fullStream = GameBitStream.create(EntitySerializations[this.type].fullSize);
        this.serializeFull();
        this.hasInited = true;
    }

    public serializePartial(): void {
        this.partialStream.index = 0;
        this.partialStream.writeUint16(this.id);
        this.partialStream.writeUint8(this.type);
        EntitySerializations[this.type].serializePartial(this.partialStream, this.data as EntitiesNetData[typeof this.type]);
        this.partialStream.writeAlignToNextByte();
    }

    public serializeFull(): void {
        this.serializePartial();
        this.fullStream.index = 0;
        EntitySerializations[this.type].serializeFull(this.fullStream, this.data.full);
        this.fullStream.writeAlignToNextByte();
    }

    public setDirty(): void {
        if (!this.hasInited) return;

        this.game.partialDirtyEntities.add(this);
    }

    public setFullDirty(): void {
        if (!this.hasInited) return;

        this.game.fullDirtyEntities.add(this);
    }

    public setPositionSafe(position: VectorAbstract) {
        if (!this.isActive()) return;
        this.position.set(position);
        this.updatePosition();
    }

    public updatePosition(): void {
        const position = this.position.clone();

        {
            if (this.hitbox instanceof CircleHitbox) {
                this.hitbox.position = this.game.clampPosition(
                    position, this.hitbox.radius, this.hitbox.radius
                );
                this.position.set(this.hitbox.position);
                if (!this.position.eqW(position)) this.collidedWithMapBorder();
            } else {
                this.position.set(position);
            }
        }

        {
            if (!this.hasInited) return;
            if (this.destroyed) return;

            this.setDirty();
            // this.game.grid.updateEntity(this);
        }
    }

    protected collidedWithMapBorder(): void {}

    public maintainAcceleration(angle: number, maxSpeed: number): void {
        this.addAcceleration(Vector.fromPolar(
            angle,
            maxSpeed * 0.2
        ));
    }

    public setVelocity(theta = 0, magnitude = 0): void {
        this.velocity.set(Vector.fromPolar(theta, magnitude));
    }

    public addAcceleration(vec: VectorAbstract): void {
        this.acceleration.add(vec);
    }

    public collideWith(collision: CollisionT, entity: ServerEntity): void {
        if (!entity.canCollideWith(this) || !this.canCollideWith(entity)) return;

        this.position.add(
            new Vector().set(collision.dir).mul(
                collision.pen
                * entity.weight
                / (this.weight + entity.weight)
            )
        );

        this.velocity.add(
            entity.velocity.mul(entity.weight / (this.weight + entity.weight))
        );
    }

    public abstract get data(): Required<EntitiesNetData[EntityType]>;

    public destroy(legal = false): void {
        this.destroyed = true;
        this.game.grid.remove(this);
    }

    public readonly cachedCollisions = new Set<CollisionInformation>();

    public getCollisions(): Set<CollisionInformation> {
        if (this.cachedCollisions.size > 0) return this.cachedCollisions;

        const collidedEntities = this.game.grid.intersectsHitbox(this.hitbox);

        for (const collidedEntity of collidedEntities) {
            if (collidedEntity.id === this.id || !collidedEntity.isActive()) continue;

            const collision = collidedEntity.hitbox.getIntersection(this.hitbox);

            if (collision) {
                this.cachedCollisions.add({
                    entity: collidedEntity,
                    collision: collision
                });
            }
        }

        return this.getCollisions();
    }
}
