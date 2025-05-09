import { type GameBitStream, type Packet } from "../net";

export class GameOverPacket implements Packet {
    kills = 0;
    murderer = "Ohio";
    killerID = -1;

    serialize(stream: GameBitStream): void {
        stream.writeUint8(this.kills);
        stream.writeASCIIString(this.murderer);
        stream.writeUint16(this.killerID)
    }

    deserialize(stream: GameBitStream): void {
        this.kills = stream.readUint8();
        this.murderer = stream.readASCIIString();
        this.killerID = stream.readUint16();
    }
}
