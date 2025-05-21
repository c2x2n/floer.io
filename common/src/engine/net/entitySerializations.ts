import { EntityType, PlayerState } from "../../constants";
import type { GameBitStream } from "./net";
import VectorAbstract from "../physics/vectorAbstract";
import { PetalDefinition, Petals } from "../../definitions/petals";
import { MobDefinition, Mobs } from "../../definitions/mobs";
import { ProjectileDefinition, Projectiles } from "../../definitions/projectiles";

export interface EntitiesNetData {
    [EntityType.Player]: {
        position: VectorAbstract
        direction: VectorAbstract
        state: PlayerState
        gotDamage: boolean

        full?: {
            healthPercent: number
            shieldPercent?: number
            isAdmin: boolean
            spectator: boolean
            invisible: boolean
            frozen: boolean
        }
    }
    [EntityType.Petal]: {
        position: VectorAbstract
        isReloading: boolean
        gotDamage: boolean

        full?: {
            definition: PetalDefinition
            ownerId: number
        }
    }
    [EntityType.Mob]: {
        position: VectorAbstract
        direction: VectorAbstract

        full?: {
            healthPercent: number
            definition: MobDefinition
        }
    }
    [EntityType.Loot]: {
        position: VectorAbstract

        full?: {
            definition: PetalDefinition
        }
    }
    [EntityType.Projectile]: {
        position: VectorAbstract
        direction: VectorAbstract

        full?: {
            definition: ProjectileDefinition
            hitboxRadius: number
        }
    }
    [EntityType.Wall]: {
        position: VectorAbstract
        max: VectorAbstract

        full?: NonNullable<unknown>
    }
}

interface EntitySerialization<T extends EntityType> {
    // how many bytes to alloc for the entity serialized data cache
    partialSize: number
    fullSize: number
    serializePartial: (stream: GameBitStream, data: EntitiesNetData[T]) => void
    serializeFull: (stream: GameBitStream, data: Required<EntitiesNetData[T]>["full"]) => void
    deserializePartial: (stream: GameBitStream) => EntitiesNetData[T]
    deserializeFull: (stream: GameBitStream) => Required<EntitiesNetData[T]>["full"]
}

export const EntitySerializations: { [K in EntityType]: EntitySerialization<K> } = {
    [EntityType.Player]: {
        partialSize: 10,
        fullSize: 10,
        serializePartial(stream, data): void {
            stream.writePosition(data.position);
            stream.writeUnit(data.direction, 16);
            stream.writeUint8(data.state);
            stream.writeBoolean(data.gotDamage);
        },
        serializeFull(stream, data): void {
            stream.writeFloat(data.healthPercent, 0.0, 1.0, 16);
            stream.writeBoolean(data.isAdmin);
            stream.writeBoolean(data.spectator);
            stream.writeBoolean(data.invisible);
            stream.writeBoolean(data.frozen);
            // Shield check
            stream.writeBoolean(!!data.shieldPercent);
            if (data.shieldPercent) {
                stream.writeFloat(data.shieldPercent, 0.0, 1.0, 8);
            }
        },
        deserializePartial(stream) {
            return {
                position: stream.readPosition(),
                direction: stream.readUnit(16),
                state: stream.readUint8(),
                gotDamage: stream.readBoolean()
            };
        },
        deserializeFull(stream) {
            return {
                healthPercent: stream.readFloat(0.0, 1.0, 16),
                isAdmin: stream.readBoolean(),
                spectator: stream.readBoolean(),
                invisible: stream.readBoolean(),
                frozen: stream.readBoolean(),
                shieldPercent: stream.readBoolean() ? stream.readFloat(0.0, 1.0, 8) : undefined
            };
        }
    },
    [EntityType.Petal]: {
        partialSize: 8,
        fullSize: 4,
        serializePartial(stream, data): void {
            stream.writePosition(data.position);
            stream.writeBoolean(data.isReloading);
            stream.writeBoolean(data.gotDamage);
        },
        serializeFull(stream, data): void {
            Petals.writeToStream(stream, data.definition);
            stream.writeUint16(data.ownerId);
        },
        deserializePartial(stream) {
            return {
                position: stream.readPosition(),
                isReloading: stream.readBoolean(),
                gotDamage: stream.readBoolean()
            };
        },
        deserializeFull(stream) {
            return {
                definition: Petals.readFromStream(stream),
                ownerId: stream.readUint16()
            };
        }
    },
    [EntityType.Mob]: {
        partialSize: 12,
        fullSize: 4,
        serializePartial(stream, data): void {
            stream.writePosition(data.position);
            stream.writeUnit(data.direction, 16);
        },
        serializeFull(stream, data): void {
            Mobs.writeToStream(stream, data.definition);
            stream.writeFloat(data.healthPercent, 0.0, 1.0, 16);
        },
        deserializePartial(stream) {
            return {
                position: stream.readPosition(),
                direction: stream.readUnit(16)
            };
        },
        deserializeFull(stream) {
            return {
                definition: Mobs.readFromStream(stream),
                healthPercent: stream.readFloat(0.0, 1.0, 16)
            };
        }
    },
    [EntityType.Loot]: {
        partialSize: 8,
        fullSize: 4,
        serializePartial(stream, data): void {
            stream.writePosition(data.position);
        },
        serializeFull(stream, data): void {
            Petals.writeToStream(stream, data.definition);
        },
        deserializePartial(stream) {
            return {
                position: stream.readPosition()
            };
        },
        deserializeFull(stream) {
            return {
                definition: Petals.readFromStream(stream)
            };
        }
    },
    [EntityType.Projectile]: {
        partialSize: 12,
        fullSize: 4,
        serializePartial(stream, data): void {
            stream.writePosition(data.position);
            stream.writeUnit(data.direction, 8);
        },
        serializeFull(stream, data): void {
            Projectiles.writeToStream(stream, data.definition);
            stream.writeFloat(data.hitboxRadius, 0, 10, 8);
        },
        deserializePartial(stream) {
            const position = stream.readPosition();
            const direction = stream.readUnit(8);
            return {
                position,
                direction
            };
        },
        deserializeFull(stream) {
            return {
                definition: Projectiles.readFromStream(stream),
                hitboxRadius: stream.readFloat(0, 10, 8)
            };
        }
    },
    [EntityType.Wall]: {
        partialSize: 16,
        fullSize: 0,
        serializePartial(stream, data) {
            stream.writePosition(data.position);
            stream.writePosition(data.max);
        },
        serializeFull(): void {

        },
        deserializePartial(stream) {
            return {
                position: stream.readPosition(),
                max: stream.readPosition()
            };
        },
        deserializeFull() {
            return {};
        }
    }
};
