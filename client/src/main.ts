import "./scss/main.scss";
import { Game } from "./scripts/game";
import { UI } from "@/ui.ts";
import { Settings } from "@/settings.ts";
import { loadStyleSheet } from "@/scripts/utils/styleSheets.ts";

loadStyleSheet();

const version = `0.2.8.1`

export function getVersion() {
    return `v${version}`;
}

export class ClientApplication {
    settings = new Settings(this);
    ui = new UI(this);
    game = new Game(this);

    async init() {
        await this.game.init();
    }
}

void new ClientApplication().init();
