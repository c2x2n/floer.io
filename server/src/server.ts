import { createServer, ServerResponse, IncomingMessage } from "node:http";
import Cluster from "node:cluster";
import { Config } from "./config";
import { WebSocketServer } from "ws";
import { Socket } from "node:net";
import { Game } from "./game";
import * as jwt from "jsonwebtoken";
import { WebhookClient } from "discord.js";

// LOAD ENV //
import { config } from "dotenv";
config();

export interface ProcessMessage {
    req: IncomingMessage
}

export const SECRET_KEY = process.env.TOKEN_SECRET_KEY as string;

function cors(res: ServerResponse) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Origin, Content-Type, Accept, X-Requested-With");
    res.setHeader("Access-Control-Max-Age", "3600");
}

function showNotFound(res: ServerResponse) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/plain").end("ERR! 404 Not Found");
}

if (Cluster.isPrimary) {
    const app = createServer();
    const worker = Cluster.fork();

    app.on("request", (req, res) => {
        cors(res);

        if (req.method !== "GET") {
            showNotFound(res);
            return;
        }

        /*
        *
        * GET
        * SERVER/floer/server_info
        *
        * */
        if (req.url?.startsWith("/floer/server_info")) {
            res.setHeader("Content-Type", "application/json").end(JSON.stringify({}))
            return;
        }

        showNotFound(res);
    })

    app.on("upgrade", async(req, socket, head) => {
        // const ip = req.socket.remoteAddress;

        /*
        *
        * WS
        * SERVER/floer/play
        *
        * */

        if (req.url?.startsWith("/floer/play")) {
            worker.send({
                req: { headers: req.headers, method: req.method } as IncomingMessage
            } as ProcessMessage, req.socket);
        } else {
            socket.emit("close");
        }
    });

    app.listen(Config.port, Config.host);
} else {

    const ws = new WebSocketServer({ noServer: true });

    const game = new Game(Config);

    process.on("message", (data: ProcessMessage, socket?: Socket) => {
        const { req } = data;
        // @ts-ignore Handling by using this way will make sure we can create the connection
        ws.handleUpgrade(req, socket, req.headers, wssocket => {
            wssocket.binaryType = "arraybuffer";

            // let player = game.newPlayer(wssocket);

            wssocket.on("message", (msg: ArrayBuffer) => {
                game.handleMessage(msg, wssocket);
            })

            wssocket.on("close", () => {
                game.removePlayer(wssocket);
            })
        });
    });
}
