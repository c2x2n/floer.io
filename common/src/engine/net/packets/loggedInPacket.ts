import { type GameBitStream, type Packet } from "../net";
import { SavedPetalDefinitionData, Petals } from "../../../definitions/petals";

export class LoggedInPacket implements Packet {
    inventory: SavedPetalDefinitionData[] = [];

    serialize(stream: GameBitStream): void {
        stream.writeArray(this.inventory, 8, def => {
            stream.writeBoolean(def == null);
            if (def) Petals.writeToStream(stream, def);
        });
    }

    deserialize(stream: GameBitStream): void {
        stream.readArray(this.inventory, 8, () => {
            if (stream.readBoolean()) return null;
            return Petals.readFromStream(stream);
        });
    }
}
