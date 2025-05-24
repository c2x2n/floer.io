import { type GameBitStream, type Packet } from "../net";
import { P2 } from "../../maths/constants";
import { ActionType } from "../../../constants";

export interface DirectionIn {
    moveDirection: number
    mouseDirection: number
}

export interface DistanceIn {
    moveDistance: number
    mouseDistance: number
}

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
    direction: DirectionIn = {
        moveDirection: 0,
        mouseDirection: 0
    };

    distance: DistanceIn = {
        moveDistance: 0,
        mouseDistance: 0
    };

    isAttacking = false;
    isDefending = false;
    actions: InputAction[] = [];

    serialize(stream: GameBitStream): void {
        stream.writeBoolean(this.isAttacking);
        stream.writeBoolean(this.isDefending);
        stream.writeFloat(this.direction.moveDirection, -P2, P2, 8);
        stream.writeFloat(this.direction.mouseDirection, -P2, P2, 8);
        stream.writeUint8(this.distance.moveDistance);
        stream.writeUint8(this.distance.mouseDistance);

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
        this.direction.moveDirection = stream.readFloat(-P2, P2, 8);
        this.direction.mouseDirection = stream.readFloat(-P2, P2, 8);
        this.distance.moveDistance = stream.readUint8();
        this.distance.mouseDistance = stream.readUint8();

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

