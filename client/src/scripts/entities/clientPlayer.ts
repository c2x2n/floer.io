import { ClientEntity } from "./clientEntity";
import { EntityType, GameConstants } from "@common/constants";
import { GameSprite, getGameAssetsPath } from "@/scripts/utils/pixi";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { Text, Graphics } from "pixi.js";
import { MathGraphics, MathNumeric } from "@common/utils/math.ts";
import { Vec2 } from "@common/utils/vector.ts";

export class ClientPlayer extends ClientEntity {
    type = EntityType.Player;

    images = {
        body: new GameSprite(getGameAssetsPath("flower","body"))
            .setScaleByUnitRadius(GameConstants.player.radius)
    };

    name: Text;

    healthPercent = 1.0;
    healthBar = new Graphics();

    constructor(game: Game, id: number) {
        super(game, id)

        this.container.zIndex = 0;

        this.name = new Text({
            text: this.game.playerNames.get(id),
            style: {
                fontFamily: 'Ubuntu',
                fontSize: 14,
                fill: "#fff",
                stroke: {color: "#000", width: 2}
            }
        });

        this.name.anchor.set(0.5);
        this.name.position.set(0, -50);
        this.healthBar.position.set(0, 50);

        this.container.addChild(
            this.images.body,
            this.name,
            this.healthBar,
        );

        this.game.camera.addObject(this.container);
    }

    render(): void {
        const name = this.game.playerNames.get(this.id)

        if( name ) this.name.text = name;

        this.container.position = Vec2.targetEasing(this.container.position, Camera.vecToScreen(this.position), 8);
    }

    drawHealthBar(): void {
        const healthbarWidth = 80;
        const fillWidth = this.healthPercent * healthbarWidth;

        this.healthBar.visible = this.healthPercent < 1.0;
        this.healthBar.clear()
            .roundRect(-healthbarWidth / 2, 0, healthbarWidth, 10)
            .fill({
                color: 0x000000,
                alpha: 0.3
            })
            .roundRect((-healthbarWidth + 5) / 2, 3 / 2, fillWidth - 5, 7)
            .fill({
                color: 0x87e63e
            });
    }

    updateFromData(data: EntitiesNetData[EntityType.Player], isNew: boolean): void {
        this.position = data.position;

        this.render();

        if (isNew){
            this.container.position = Camera.vecToScreen(this.position);
        }

        if (data.state.poisoned) {
            this.images.body.setFrame(getGameAssetsPath("flower","poisoned_body"))
        } else if (data.state.danded) {
            this.images.body.setFrame(getGameAssetsPath("flower","danded_body"))
        } else {
            this.images.body.setFrame(getGameAssetsPath("flower","body"))
        }

        if (data.full) {
            this.healthPercent = data.full.healthPercent;
            this.drawHealthBar();
        }
    }
}
