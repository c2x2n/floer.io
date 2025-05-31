import "./scss/client.scss";
import { Game } from "./scripts/game";
import { UI } from "./ui";
import { Settings } from "./settings";
import { Renderer } from "./scripts/render/renderer";
import { loadStyleSheet } from "./scripts/ui/shown/icons";

void document.fonts.ready.then(() => {
    loadStyleSheet();
});

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
