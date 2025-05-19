import { type GameBitStream, type Packet } from "../net";
import { GameConstants } from "../../../constants";

export enum ChatChannel {
    Local,
    Global
}

export class ChatPacket implements Packet {
    chat = "";
    channel: ChatChannel = ChatChannel.Local;

    serialize(stream: GameBitStream): void {
        stream.writeUTF8String(this.chat, GameConstants.player.maxChatLength);
        stream.writeUint8(this.channel);
    }

    deserialize(stream: GameBitStream): void {
        this.chat = stream.readUTF8String(GameConstants.player.maxChatLength);
        this.channel = stream.readUint8();
    }
}
