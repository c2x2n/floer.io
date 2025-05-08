import { type GameBitStream, type Packet } from "../net";
import { GameConstants } from "../constants";
import { Petals, SavedPetalDefinitionData } from "../definitions/petals";

export class JoinPacket implements Packet {
    name = "";
    secret = "";
    petals: SavedPetalDefinitionData[] = [];

    serialize(stream: GameBitStream): void {
        stream.writeASCIIString(this.name, GameConstants.player.maxNameLength);
        stream.writeASCIIString(this.secret);
        stream.writeArray(this.petals, 8, (def) => {
            stream.writeBoolean(def == null);
            if (def) Petals.writeToStream(stream, def);
        })
    }

    deserialize(stream: GameBitStream): void {
        this.name = stream.readASCIIString(GameConstants.player.maxNameLength);
        this.secret = stream.readASCIIString();
        stream.readArray(this.petals, 8, () => {
            if (stream.readBoolean()) return null;
            return Petals.readFromStream(stream);
        })
    }
}
