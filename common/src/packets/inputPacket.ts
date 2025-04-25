import { type GameBitStream, type Packet } from "../net";
import { Vec2 } from "../utils/vector";
import { Petals, SavedPetalDefinitionData } from "../definitions/petal";
import { P2 } from "../utils/math";
import { GameConstants } from "../constants";

export class InputPacket implements Packet {
    direction = {
        direction: 0,
        mouseDir: 0 
    };
    mouseDistance: number = 0;
    isAttacking = false;
    isDefending = false;
    switchedPetalIndex = -1;
    switchedToPetalIndex = -1;
    deletedPetalIndex: number = -1;

    serialize(stream: GameBitStream): void {
        stream.writeBoolean(this.isAttacking);
        stream.writeBoolean(this.isDefending);
        stream.writeFloat(this.direction.direction, -P2, P2, 8);
        stream.writeFloat(this.direction.mouseDir, -P2, P2, 8);
        stream.writeUint8(this.mouseDistance);

        stream.writeUint8(this.switchedPetalIndex);
        stream.writeUint8(this.switchedToPetalIndex);
        stream.writeUint8(this.deletedPetalIndex);
    }

    deserialize(stream: GameBitStream): void {
        this.isAttacking = stream.readBoolean();
        this.isDefending = stream.readBoolean();
        this.direction.direction = stream.readFloat(-P2, P2, 8);
        this.direction.mouseDir = stream.readFloat(-P2, P2, 8);
        this.mouseDistance = stream.readUint8();

        this.switchedPetalIndex = stream.readUint8();
        this.switchedToPetalIndex = stream.readUint8();
        this.deletedPetalIndex = stream.readUint8();
    }
}
