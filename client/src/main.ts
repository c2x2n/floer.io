import "./scss/client.scss";
import { Game } from "./scripts/game";
import { UI } from "@/ui.ts";
import { Settings } from "@/settings.ts";
import { Renderer } from "@/scripts/render/renderer.ts";
import { loadStyleSheet } from "@/scripts/utils/icons.ts";

document.fonts.ready.then(() => {
    loadStyleSheet();
})

export class ClientApplication {
    settings = new Settings(this);
    ui = new UI(this);
    game = new Game(this);

    renderer = new Renderer(this);

    async init() {
        await this.game.init();
    }
}

void new ClientApplication().init();
