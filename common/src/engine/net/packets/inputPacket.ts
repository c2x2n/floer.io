import { type GameBitStream, type Packet } from "../net";
import { P2 } from "../../maths/constants";
import { ActionType } from "../../../constants";

export type InputAction = {
    type: ActionType
} & ({
    type: ActionType.SwitchPetal
    petalIndex: number
    petalToIndex: number
} | {
    type: ActionType.DeletePetal
    petalIndex: number
} | {
    type: ActionType.TransformLoadout
} | {
    type: ActionType.Left
});

export class InputPacket implements Packet {
    direction = {
        direction: 0,
        mouseDirection: 0
    };

    movementDistance = 0;
    isAttacking = false;
    isDefending = false;
    actions: InputAction[] = [];

    serialize(stream: GameBitStream): void {
        stream.writeBoolean(this.isAttacking);
        stream.writeBoolean(this.isDefending);
        stream.writeFloat(this.direction.direction, -P2, P2, 8);
        stream.writeFloat(this.direction.mouseDirection, -P2, P2, 8);
        stream.writeUint8(this.movementDistance);

        stream.writeArray(this.actions, 4, action => {
            stream.writeUint8(action.type);

            switch (action.type) {
                case ActionType.SwitchPetal:
                    stream.writeUint8(action.petalIndex);
                    stream.writeUint8(action.petalToIndex);
                    break;
                case ActionType.DeletePetal:
                    stream.writeUint8(action.petalIndex);
                    break;
                case ActionType.TransformLoadout:
                case ActionType.Left:
                    break;
            }
        });
    }

    deserialize(stream: GameBitStream): void {
        this.isAttacking = stream.readBoolean();
        this.isDefending = stream.readBoolean();
        this.direction.direction = stream.readFloat(-P2, P2, 8);
        this.direction.mouseDirection = stream.readFloat(-P2, P2, 8);
        this.movementDistance = stream.readUint8();

        stream.readArray(this.actions, 4, () => {
            const type = stream.readUint8();

            switch (type) {
                case ActionType.SwitchPetal:
                    return {
                        type,
                        petalIndex: stream.readUint8(),
                        petalToIndex: stream.readUint8()
                    };
                case ActionType.DeletePetal:
                    return {
                        type,
                        petalIndex: stream.readUint8()
                    };
                case ActionType.TransformLoadout:
                case ActionType.Left:
                    return {
                        type
                    };
            }
        });
    }
}

export interface DirectionIn {
    direction: number
    mouseDirection: number
}
