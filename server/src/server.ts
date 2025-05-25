import { createServer, ServerResponse, IncomingMessage } from "node:http";
import Cluster from "node:cluster";
import { Config } from "./config";

// LOAD ENV //
import { config } from "dotenv";
import { GameContainer, games } from "./gameContainer";
config();

const BUILD_VERSION = "0.3.1 TEST";

export interface ProcessMessage {
    req: IncomingMessage
}

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
    const worker = new GameContainer();

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
            if (games.length > 0) {
                const game = games[0];
                res.setHeader("Content-Type", "application/json").end(
                    JSON.stringify({
                        playerCount: game.data.playerCount,
                        build: BUILD_VERSION
                    })
                );
            } else {
                res.setHeader("Content-Type", "application/json").end(JSON.stringify({}));
            }
            return;
        }

        showNotFound(res);
    });

    app.on("upgrade", (req, socket, head) => {
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
}
