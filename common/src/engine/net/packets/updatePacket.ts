import { EntityType, GameConstants } from "../../../constants";
import { type GameBitStream, type Packet } from "../net";
import { Petals, SavedPetalDefinitionData } from "../../../definitions/petals";
import { MobDefinition, Mobs } from "../../../definitions/mobs";
import { EntitiesNetData, EntitySerializations } from "../entitySerializations";

interface EntitySerialized {
    id: number
    type: EntityType
    data: EntitiesNetData[EntitySerialized["type"]]
}

export interface ChatData {
    content: string
    color: number
}

export interface PlayerData {
    id: number
    zoom: number
    inventory: SavedPetalDefinitionData[]
    slot: number
    exp: number
    overleveled: number
    collect: MobDefinition[]
}

enum UpdateFlags {
    DeletedEntities = 1 << 0,
    FullEntities = 1 << 1,
    PartialEntities = 1 << 2,
    Players = 1 << 3,
    ChatMessage = 1 << 4,
    PlayerData = 1 << 5,
    PetalData = 1 << 6,
    Map = 1 << 8
}

export class UpdatePacket implements Packet {
    deletedEntities: number[] = [];
    partialEntities: EntitySerialized[] = [];
    fullEntities: Array<EntitySerialized & { data: Required<EntitiesNetData[EntitySerialized["type"]]> }> = [];

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
        overleveled: false,
        collect: false
    };

    playerData: PlayerData = {
        id: 0,
        zoom: 0,
        inventory: [],
        slot: 0,
        exp: 0,
        overleveled: 0,
        collect: []
    };

    chatDirty = false;
    chatMessages: ChatData[] = [];

    petalData: PetalData[] = [];

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
                stream.writeUint32(player.exp);
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
                stream.writeArray(this.playerData.inventory, 8, item => {
                    stream.writeBoolean(item === null);
                    if (item) Petals.writeToStream(stream, item);
                });
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

            stream.writeBoolean(this.playerDataDirty.collect);
            if (this.playerDataDirty.collect) {
                stream.writeArray(this.playerData.collect, 8, mob => {
                    Mobs.writeToStream(stream, mob);
                });
            }

            stream.writeAlignToNextByte();

            flags |= UpdateFlags.PlayerData;
        }

        if (this.chatDirty) {
            stream.writeArray(this.chatMessages, 8, msg => {
                stream.writeUint32(msg.color);
                stream.writeUTF8String(msg.content);
            });

            flags |= UpdateFlags.ChatMessage;
        }

        if (this.petalData.length) {
            stream.writeArray(this.petalData, 8, petal => {
                petal.writeToStream(stream);
            });

            flags |= UpdateFlags.PetalData;
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
                    if (!isEmpty) return Petals.readFromStream(stream);
                    return null;
                });
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

            if (stream.readBoolean()) {
                this.playerDataDirty.collect = true;
                stream.readArray(this.playerData.collect, 8, () => {
                    return Mobs.readFromStream(stream);
                });
            }

            stream.readAlignToNextByte();
        }

        if (flags & UpdateFlags.ChatMessage) {
            this.chatDirty = true;

            stream.readArray(this.chatMessages, 8, () => {
                return {
                    color: stream.readUint32(),
                    content: stream.readUTF8String()
                };
            });
        }

        if (flags & UpdateFlags.PetalData) {
            this.petalData = [];
            stream.readArray(this.petalData, 8, () => {
                const petal = new PetalData();
                petal.readFromStream(stream);
                return petal;
            });
        }

        if (flags & UpdateFlags.Map) {
            this.mapDirty = true;
            this.map.width = stream.readUint16();
            this.map.height = stream.readUint16();
        }
    }
}

export enum PetalState {
    Reloading,
    Normal
}

export class PetalData {
    state: PetalState = PetalState.Normal;
    percent = 1;

    writeToStream(stream: GameBitStream) {
        stream.writeUint8(this.state);
        stream.writeFloat(this.percent, 0.0, 1.0, 8);
    }

    readFromStream(stream: GameBitStream) {
        this.state = stream.readUint8() as PetalState;
        this.percent = stream.readFloat(0, 1, 8);
    }
}
