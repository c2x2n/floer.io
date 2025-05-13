import { BitStream } from "bit-buffer";
import { GameConstants } from "../constants";
import { Numeric } from "../maths/math";
import { JoinPacket } from "./packets/joinPacket";
import { InputPacket } from "./packets/inputPacket";
import { UpdatePacket } from "./packets/updatePacket";
import { GameOverPacket } from "./packets/gameOverPacket";
import { LogInPacket } from "./packets/logInPacket";
import { LoggedInPacket } from "./packets/loggedInPacket";
import { ChatPacket } from "./packets/chatPacket";
import VectorAbstract from "../physics/vectorAbstract";

export class GameBitStream extends BitStream {
    static create(size: number): GameBitStream {
        return new GameBitStream(new ArrayBuffer(size));
    }

    /**
     * Write a floating point number to the stream
     * @param value The number
     * @param min The minimum number
     * @param max The maximum number
     * @param bitCount The number of bits to write
     */
    writeFloat(value: number, min: number, max: number, bitCount: number): void {
        if (bitCount < 0 || bitCount >= 31) {
            throw new Error(`Invalid bit count ${bitCount}`);
        }
        if (value > max || value < min) {
            throw new Error(`Value out of range: ${value}, range: [${min}, ${max}]`);
        }
        const range = (1 << bitCount) - 1;
        const clamped = Numeric.clamp(value, min, max);
        this.writeBits(((clamped - min) / (max - min)) * range + 0.5, bitCount);
    }

    /**
     * Read a floating point number from the stream
     * @param min The minimum number
     * @param max The maximum number
     * @param bitCount The number of bits to read
     * @return The floating point number
     */
    readFloat(min: number, max: number, bitCount: number): number {
        if (bitCount < 0 || bitCount >= 31) {
            throw new Error(`Invalid bit count ${bitCount}`);
        }
        const range = (1 << bitCount) - 1;
        return min + (max - min) * this.readBits(bitCount) / range;
    }

    /**
     * Write a position Vector to the stream.
     * @param vector The Vector.
     * @param minX The minimum X position.
     * @param minY The minimum Y position.
     * @param maxX The maximum X position.
     * @param maxY The maximum Y position.
     * @param bitCount The number of bits to write.
     */
    writeVector(vector: VectorAbstract, minX: number, minY: number, maxX: number, maxY: number, bitCount: number): void {
        this.writeVectorByXY(vector.x, vector.y, minX, minY, maxX, maxY, bitCount);
    }

    /**
     * Write a position Vector to the stream.
     * @param x The X position.
     * @param y The Y position.
     * @param minX The minimum X position.
     * @param minY The minimum Y position.
     * @param maxX The maximum X position.
     * @param maxY The maximum Y position.
     * @param bitCount The number of bits to write.
     * @return The position Vector.
     */
    writeVectorByXY(x: number, y: number, minX: number, minY: number, maxX: number, maxY: number, bitCount: number): void {
        this.writeFloat(x, minX, maxX, bitCount);
        this.writeFloat(y, minY, maxY, bitCount);
    }

    /**
     * Read a position Vector from the stream.
     * @param minX The minimum X position.
     * @param minY The minimum Y position.
     * @param maxX The maximum X position.
     * @param maxY The maximum Y position.
     * @param bitCount The number of bits to read
     */
    readVector(minX: number, minY: number, maxX: number, maxY: number, bitCount: number): VectorAbstract {
        return {
            x: this.readFloat(minX, maxX, bitCount),
            y: this.readFloat(minY, maxY, bitCount)
        };
    }

    /**
     * Write a position Vector to the stream with the game default max and minimum X and Y.
     * @param vector The Vector to write.
     */
    writePosition(vector: VectorAbstract): void {
        this.writePositionByXY(vector.x, vector.y);
    }

    /**
     * Write a position Vector to the stream with the game default max and minimum X and Y.
     * @param x The x-coordinate of the vector to write
     * @param y The y-coordinate of the vector to write
     */
    writePositionByXY(x: number, y: number): void {
        // this.writeVectorByXY(x, y, -GameConstants.maxPosition, -GameConstants.maxPosition, GameConstants.maxPosition, GameConstants.maxPosition, 16);
        this.writeBoolean(x < 0);
        this.writeBoolean(y < 0);
        this.writeUint16((Math.abs(x) / GameConstants.maxPosition) * 65536 + 0.5);
        this.writeUint16((Math.abs(y) / GameConstants.maxPosition) * 65536 + 0.5);
    }

    /**
     * Read a position Vector from stream with the game default max and minimum X and Y.
     * @return the position Vector.
     */
    readPosition(): VectorAbstract {
        // return this.readVector(-GameConstants.maxPosition, -GameConstants.maxPosition, GameConstants.maxPosition, GameConstants.maxPosition, 16);
        const negaX = this.readBoolean();
        const negaY = this.readBoolean();

        return {
            x: (negaX ? -1 : 1) * (this.readUint16() / 65536) * GameConstants.maxPosition,
            y: (negaY ? -1 : 1) * (this.readUint16() / 65536) * GameConstants.maxPosition
        };
    }

    static unitEps = 1.0001;
    /**
    * Write a unit vector to the stream
    * @param vector The Vector to write.
    * @param bitCount The number of bits to write.
    */
    writeUnit(vector: VectorAbstract, bitCount: number): void {
        this.writeVector(
            vector,
            -GameBitStream.unitEps,
            -GameBitStream.unitEps,
            GameBitStream.unitEps,
            GameBitStream.unitEps,
            bitCount
        );
    }

    /**
     * Read a unit vector from the stream
     * @param bitCount The number of bits to read.
     * @return the unit Vector.
     */
    readUnit(bitCount: number): VectorAbstract {
        return this.readVector(
            -GameBitStream.unitEps,
            -GameBitStream.unitEps,
            GameBitStream.unitEps,
            GameBitStream.unitEps,
            bitCount
        );
    }

    /**
     * Write an array to the stream
     * @param arr An array containing the items to serialize
     * @param bits The amount of bits to write for the array size
     * @param serializeFn The function to serialize each array item
     */
    writeArray<T>(arr: T[], bits: number, serializeFn: (item: T) => void): void {
        if (bits < 0 || bits >= 31) {
            throw new Error(`Invalid bit count ${bits}`);
        }

        this.writeBits(arr.length, bits);

        const maxSize = 1 << bits;
        for (let i = 0; i < arr.length; i++) {
            if (i > maxSize) {
                console.warn(`writeArray: array overflow: max length: ${maxSize}, length: ${arr.length}`);
                break;
            }
            serializeFn(arr[i]);
        }
    }

    /**
     * Read an array from the stream
     * @param arr The array to add the deserialized elements;
     * @param bits The amount of bits to read for the array size
     * @param deserializeFn The function to de-serialize each array item
     */
    readArray<T>(arr: T[], bits: number, deserializeFn: () => T): void {
        const size = this.readBits(bits);

        for (let i = 0; i < size; i++) {
            arr.push(deserializeFn());
        }
    }

    // private field L
    declare _view: {
        _view: Uint8Array
    };

    /**
     * Copy bytes from a source stream to this stream
     * !!!NOTE: Both streams index must be byte aligned
     * @param src The source bit stream to copy
     * @param offset The offset to start copying bytes
     * @param length The amount of bytes to copy
     */
    writeBytes(src: GameBitStream, offset: number, length: number): void {
        if (this.index % 8 !== 0) {
            throw new Error("WriteBytes: stream must be byte aligned");
        }
        const data = new Uint8Array(src._view._view.buffer, offset, length);
        this._view._view.set(data, this.index / 8);
        this.index += length * 8;
    }

    /**
     * Writes a byte alignment to the stream
     * This is to ensure the stream index is a multiple of 8
     */
    writeAlignToNextByte(): void {
        const offset = 8 - this.index % 8;
        if (offset < 8) this.writeBits(0, offset);
    }

    /**
     * Read a byte alignment from the stream
     */
    readAlignToNextByte(): void {
        const offset = 8 - this.index % 8;
        if (offset < 8) this.readBits(offset);
    }
}

export interface Packet {
    serialize(stream: GameBitStream): void
    deserialize(stream: GameBitStream): void
}

class PacketRegister {
    private _nextTypeId = 0;
    readonly typeToId: Record<string, number> = {};
    readonly idToCtor: Array<new () => Packet> = [];

    register(...packets: Array<(new () => Packet)>) {
        for (const packet of packets) {
            if (this.typeToId[packet.name]) {
                console.warn(`Trying to register ${packet.name} multiple times`);
                continue;
            }
            const id = this._nextTypeId++;
            this.typeToId[packet.name] = id;
            this.idToCtor[id] = packet;
        }
    }
}

const ClientToServerPackets = new PacketRegister();
ClientToServerPackets.register(
    JoinPacket,
    InputPacket,
    LogInPacket,
    ChatPacket
);

const ServerToClientPackets = new PacketRegister();
ServerToClientPackets.register(
    UpdatePacket,
    GameOverPacket,
    LoggedInPacket
);

export class PacketStream {
    stream: GameBitStream;
    buffer: ArrayBuffer;

    constructor(source: GameBitStream | ArrayBuffer) {
        if (source instanceof ArrayBuffer) {
            this.buffer = source;
            this.stream = new GameBitStream(source);
        } else {
            this.stream = source;
            this.buffer = source.buffer;
        }
    }

    serializeServerPacket(packet: Packet) {
        this._serializePacket(packet, ServerToClientPackets);
    }

    deserializeServerPacket(): Packet | undefined {
        return this._deserializePacket(ServerToClientPackets);
    }

    serializeClientPacket(packet: Packet) {
        this._serializePacket(packet, ClientToServerPackets);
    }

    deserializeClientPacket(): Packet | undefined {
        return this._deserializePacket(ClientToServerPackets);
    }

    private _deserializePacket(register: PacketRegister): Packet | undefined {
        if (this.stream.length - this.stream.byteIndex * 8 >= 1) {
            try {
                const id = this.stream.readUint8();
                const packet = new register.idToCtor[id]();
                packet.deserialize(this.stream);
                this.stream.readAlignToNextByte();
                return packet;
            } catch (e) {
                console.error("Failed deserializing packet: ", e);
                return undefined;
            }
        }
        return undefined;
    }

    private _serializePacket(packet: Packet, register: PacketRegister) {
        const type = register.typeToId[packet.constructor.name];
        if (type === undefined) {
            throw new Error(`Unknown packet type: ${packet.constructor.name}, did you forget to register it?`);
        }
        this.stream.writeUint8(type);
        packet.serialize(this.stream);
        this.stream.writeAlignToNextByte();
    }

    getBuffer(): ArrayBuffer {
        return this.buffer.slice(0, this.stream.byteIndex);
    }
}
