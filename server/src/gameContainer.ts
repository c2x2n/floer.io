import { ServerGame } from "./game";
import { Config } from "./config";
import { ProcessMessage } from "./server";
import { WebSocketServer } from "ws";
import { Socket } from "node:net";
import Cluster, { Worker } from "node:cluster";

export interface GameData {
    playerCount: number
}

export const games: GameContainer[] = [];
const ws = new WebSocketServer({ noServer: true });

export class GameContainer {
    worker: Worker = Cluster.fork();

    constructor() {
        games.push(this);
        this.worker.on("message", (data: Partial<GameData>) => {
            this.data = { ...this.data, ...data };
        });
    }

    data: GameData = {
        playerCount: 0
    };

    send(data: ProcessMessage, socket: Socket) {
        this.worker.send(data, socket);
    }
}

if (Cluster.isWorker) {
    const game = new ServerGame(Config);

    process.on("message", (data: ProcessMessage, socket?: Socket) => {
        const { req } = data;
        // @ts-ignore Handling by using this way will make sure we can create the connection
        ws.handleUpgrade(req, socket, req.headers, wssocket => {
            wssocket.binaryType = "arraybuffer";

            // let player = game.newPlayer(wssocket);

            wssocket.on("message", (msg: ArrayBuffer) => {
                game.handleMessage(msg, wssocket);
            });

            wssocket.on("close", () => {
                game.removePlayer(wssocket);
            });
        });
    });
}
