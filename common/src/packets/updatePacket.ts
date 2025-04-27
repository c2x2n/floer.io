import { EntityType, GameConstants, PlayerState } from "../constants";
import { type GameBitStream, type Packet } from "../net";
import { type Vector } from "../utils/vector";
import { PetalDefinition, Petals, SavedPetalDefinitionData } from "../definitions/petal";
import { MobDefinition, Mobs } from "../definitions/mob";
import { Projectile, ProjectileDefinition } from "../definitions/projectile";

export interface EntitiesNetData {
    [EntityType.Player]: {
        position: Vector
        direction: Vector
        state: PlayerState
        gotDamage: boolean

        full?: {
            healthPercent: number
            shieldPercent?: number
            isAdmin: boolean
        }
    }
    [EntityType.Petal]: {
        position: Vector
        isReloading: boolean
        gotDamage: boolean

        full?: {
            definition: PetalDefinition
            ownerId: number
        }
    }
    [EntityType.Mob]: {
        position: Vector
        direction: Vector

        full?: {
            healthPercent: number
            definition: MobDefinition
        }
    }
    [EntityType.Loot]: {
        position: Vector

        full?: {
            definition: PetalDefinition
        }
    }
    [EntityType.Projectile]: {
        position: Vector
        direction: Vector

        full?: {
            definition: ProjectileDefinition
            hitboxRadius: number
        }
    }
    [EntityType.Wall]: {
        position: Vector
        max: Vector

        full?: {}
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
                gotDamage: stream.readBoolean(),
            };
        },
        deserializeFull(stream) {
            return {
                healthPercent: stream.readFloat(0.0, 1.0, 16),
                isAdmin: stream.readBoolean(),
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
                gotDamage: stream.readBoolean(),
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
            stream.writeUnit(data.direction, 16)
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
                position: stream.readPosition(),
            };
        },
        deserializeFull(stream) {
            return {
                definition: Petals.readFromStream(stream),
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
            Projectile.writeToStream(stream, data.definition);
            stream.writeFloat(data.hitboxRadius, 0, 10, 8);
        },
        deserializePartial(stream) {
            return {
                position: stream.readPosition(),
                direction: stream.readUnit(8)
            };
        },
        deserializeFull(stream) {
            return {
                definition: Projectile.readFromStream(stream),
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
            return {}
        }
    }
};

interface Entity {
    id: number
    type: EntityType
    data: EntitiesNetData[Entity["type"]]
}

export interface ChatData {
    content: string
    color: number
}

export interface PlayerData {
    id: number,
    zoom: number,
    inventory: SavedPetalDefinitionData[],
    slot: number,
    exp: number,
    overleveled: number
}

enum UpdateFlags {
    DeletedEntities = 1 << 0,
    FullEntities = 1 << 1,
    PartialEntities = 1 << 2,
    Players = 1 << 3,
    ChatMessage = 1 << 4,
    PlayerData = 1 << 5,
    Map = 1 << 8
}

export class UpdatePacket implements Packet {
    deletedEntities: number[] = [];
    partialEntities: Entity[] = [];
    fullEntities: Array<Entity & { data: Required<EntitiesNetData[Entity["type"]]> }> = [];

    players: Array<{
        name: string
        id: number
        exp: number
    }> = [];

    playerDataDirty: { [K in keyof PlayerData]: boolean } = {
        id: false,
        zoom: false,
        inventory: false,
        slot: false,
        exp: false,
        overleveled: false
    };

    playerData: PlayerData = {
        id: 0,
        zoom: 0,
        inventory: [],
        slot: 0,
        exp: 0,
        overleveled: 0
    };

    chatDirty = false;
    chatMessages: ChatData[] = []

    mapDirty = false;
    map = {
        width: 0,
        height: 0
    };

    // server side cached entity serializations
    serverPartialEntities: Array<{
        partialStream: GameBitStream
    }> = [];

    serverFullEntities: Array<{
        partialStream: GameBitStream
        fullStream: GameBitStream
    }> = [];

    serialize(stream: GameBitStream): void {
        let flags = 0;
        // save the stream index for writing flags
        const flagsIdx = stream.index;
        stream.writeUint16(flags);

        if (this.deletedEntities.length) {
            stream.writeArray(this.deletedEntities, 16, id => {
                stream.writeUint16(id);
            });

            flags |= UpdateFlags.DeletedEntities;
        }

        if (this.serverFullEntities.length) {
            stream.writeArray(this.serverFullEntities, 16, entity => {
                stream.writeBytes(entity.partialStream, 0, entity.partialStream.byteIndex);
                stream.writeBytes(entity.fullStream, 0, entity.fullStream.byteIndex);
            });

            flags |= UpdateFlags.FullEntities;
        }

        if (this.serverPartialEntities.length) {
            stream.writeArray(this.serverPartialEntities, 16, entity => {
                stream.writeBytes(entity.partialStream, 0, entity.partialStream.byteIndex);
            });

            flags |= UpdateFlags.PartialEntities;
        }

        if (this.players.length) {
            stream.writeArray(this.players, 8, player => {
                stream.writeUint16(player.id);
                stream.writeASCIIString(player.name, GameConstants.player.maxNameLength);
                stream.writeUint32(player.exp)
            });

            flags |= UpdateFlags.Players;
        }

        if (Object.values(this.playerDataDirty).includes(true)) {
            stream.writeBoolean(this.playerDataDirty.id);
            if (this.playerDataDirty.id) {
                stream.writeUint16(this.playerData.id);
            }

            stream.writeBoolean(this.playerDataDirty.zoom);
            if (this.playerDataDirty.zoom) {
                stream.writeUint8(this.playerData.zoom);
            }

            stream.writeBoolean(this.playerDataDirty.inventory);
            if (this.playerDataDirty.inventory) {
                stream.writeArray(this.playerData.inventory, 8, (item) => {
                    stream.writeBoolean(item === null);
                    if (item) Petals.writeToStream(stream, item);
                })
            }

            stream.writeBoolean(this.playerDataDirty.slot);
            if (this.playerDataDirty.slot) {
                stream.writeUint8(this.playerData.slot);
            }

            stream.writeBoolean(this.playerDataDirty.exp);
            if (this.playerDataDirty.exp) {
                stream.writeUint32(this.playerData.exp);
            }

            stream.writeBoolean(this.playerDataDirty.overleveled);
            if (this.playerDataDirty.overleveled) {
                if (this.playerData.overleveled <= 0) stream.writeUint16(0);
                else stream.writeUint16(this.playerData.overleveled);
            }

            stream.writeAlignToNextByte();

            flags |= UpdateFlags.PlayerData;
        }

        if (this.chatDirty) {
            stream.writeArray(this.chatMessages, 8, msg => {
                stream.writeUint32(msg.color);
                stream.writeUTF8String(msg.content);
            })

            flags |= UpdateFlags.ChatMessage;
        }

        if (this.mapDirty) {
            stream.writeUint16(this.map.width);
            stream.writeUint16(this.map.height);

            flags |= UpdateFlags.Map;
        }

        // write flags and restore stream index
        const idx = stream.index;
        stream.index = flagsIdx;
        stream.writeUint16(flags);
        stream.index = idx;
    }

    deserialize(stream: GameBitStream): void {
        const flags = stream.readUint16();

        if (flags & UpdateFlags.DeletedEntities) {
            stream.readArray(this.deletedEntities, 16, () => {
                return stream.readUint16();
            });
        }

        if (flags & UpdateFlags.FullEntities) {
            stream.readArray(this.fullEntities, 16, () => {
                const id = stream.readUint16();
                const entityType = stream.readUint8() as EntityType;
                const data = EntitySerializations[entityType].deserializePartial(stream);
                stream.readAlignToNextByte();
                data.full = EntitySerializations[entityType].deserializeFull(stream);
                stream.readAlignToNextByte();
                return {
                    id,
                    type: entityType,
                    data
                };
            });
        }

        if (flags & UpdateFlags.PartialEntities) {
            stream.readArray(this.partialEntities, 16, () => {
                const id = stream.readUint16();
                const entityType = stream.readUint8() as EntityType;
                const data = EntitySerializations[entityType].deserializePartial(stream);
                stream.readAlignToNextByte();
                return {
                    id,
                    type: entityType,
                    data
                };
            });
        }

        if (flags & UpdateFlags.Players) {
            stream.readArray(this.players, 8, () => {
                return {
                    id: stream.readUint16(),
                    name: stream.readASCIIString(GameConstants.player.maxNameLength),
                    exp: stream.readUint32()
                };
            });
        }

        if (flags & UpdateFlags.PlayerData) {
            if (stream.readBoolean()) {
                this.playerDataDirty.id = true;
                this.playerData.id = stream.readUint16();
            }

            if (stream.readBoolean()) {
                this.playerDataDirty.zoom = true;
                this.playerData.zoom = stream.readUint8();
            }

            if (stream.readBoolean()) {
                this.playerDataDirty.inventory = true;
                stream.readArray(this.playerData.inventory, 8, () => {
                    const isEmpty = stream.readBoolean();
                    if(!isEmpty) return Petals.readFromStream(stream);
                    return null;
                })
            }

            if (stream.readBoolean()) {
                this.playerDataDirty.slot = true;
                this.playerData.slot = stream.readUint8();
            }

            if (stream.readBoolean()) {
                this.playerDataDirty.exp = true;
                this.playerData.exp = stream.readUint32();
            }

            if (stream.readBoolean()) {
                this.playerDataDirty.overleveled = true;
                this.playerData.overleveled = stream.readUint16();
            }

            stream.readAlignToNextByte();
        }

        if (flags & UpdateFlags.ChatMessage) {
            this.chatDirty = true;

            stream.readArray(this.chatMessages, 8, () => {
                return {
                    color: stream.readUint32(),
                    content: stream.readUTF8String()
                }
            })
        }

        if (flags & UpdateFlags.Map) {
            this.mapDirty = true;
            this.map.width = stream.readUint16();
            this.map.height = stream.readUint16();
        }
    }
}
