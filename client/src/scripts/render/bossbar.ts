import { Graphics, Text, Container } from "pixi.js";
import { Game } from "@/scripts/game.ts";
import { MobDefinition, Mobs } from "@common/definitions/mob.ts";
import { MathNumeric } from "@common/utils/math.ts";
import { Rarity } from "@common/definitions/rarity.ts";

export class BossbarContent {
    bossbarGraphics: Graphics = new Graphics();
    nameText: Text = new Text({
        text: "",
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 29,
            fill: "#fff",
            stroke: {color: "#000", width: 3}
        }
    });
    rarityText: Text = new Text({
        text: "",
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 18,
            fill: "#fff",
            stroke: {color: "#000", width: 1.25}
        }
    });

    constructor() {
        this.nameText.anchor.set(0.5);
        this.rarityText.anchor.set(0.5);
    }
}

export interface BossbarData {
    mob: MobDefinition;
    healthPercent: number;
}

export class Bossbar {
    readonly width: number = 320;
    readonly height: number = 30;

    bossbars: BossbarContent[] = [];

    bossbarDatas = new Map<number, BossbarData>();

    container = new Container();

    constructor(private game: Game) {}

    init(): void {
        this.game.pixi.stage.addChild(
            this.container
        )

        for (let i = 0; i < 10; i++) {
            this.bossbars.push(new BossbarContent());

            this.container.addChild(
                this.bossbars[i].bossbarGraphics,
                this.bossbars[i].nameText,
                this.bossbars[i].rarityText
            )
        }

        this.resize();
    }

    render(): void {
        let index = 0;
        let yPosition = 0;

        this.bossbars.forEach(bossbar => {
            bossbar.bossbarGraphics.clear();
            if (index < this.bossbarDatas.size && index < this.bossbars.length) {
                let data = Array.from(this.bossbarDatas.values())[index];

                const stroke = 10;

                let width = this.width * data.healthPercent;
                let height = this.height;

                if (width < stroke * 3) {
                    height = Math.max(width / (stroke * 3) * this.height, 0);
                }

                bossbar.bossbarGraphics
                    .roundRect(
                        -(this.width + stroke) / 2,
                        yPosition - this.height / 2,
                        this.width + stroke,
                        this.height + stroke,
                        20
                    )
                    .fill({ color: 0x000, alpha: 0.6 })
                    .roundRect(
                        -this.width / 2,
                        yPosition - this.height / 2 + (this.height - height) / 2 + stroke / 2 ,
                        width,
                        height,
                        20
                    )
                    .fill({ color: 0x87e63e, alpha: 0.8 })

                bossbar.nameText.text = data.mob.displayName;
                bossbar.nameText.position.set(0, yPosition - this.height / 2 - 3);

                const rarity = Rarity.fromString(data.mob.rarity);
                bossbar.rarityText.text = rarity.displayName;
                bossbar.rarityText.style.fill = rarity.color;
                bossbar.rarityText.position.set(0, yPosition + (this.height + stroke) / 2 + 3);

            } else {
                bossbar.nameText.text = ""
                bossbar.rarityText.text = ""
            }

            yPosition += this.height + 40;
            index ++;
        })
    }

    resize(): void {
        const screenWidth = this.game.pixi.screen.width;
        const screenHeight = this.game.pixi.screen.height;

        const positionX = screenWidth / 2;
        const positionY = 60;

        this.container.position.set(positionX, positionY);
    }
}
