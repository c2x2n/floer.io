import { Game } from "@/scripts/game.ts";
import { MobDefinition } from "@common/definitions/mobs.ts";
import { Rarity } from "@common/definitions/rarities.ts";

export interface BossbarData {
    mob: MobDefinition;
    healthPercent: number;
}

export class Bossbar {
    readonly width: number = 335;
    readonly height: number = 30;
    readonly maxLength: number = 10;

    positionX: number = 0;
    positionY: number = 0;

    bossbarDatas = new Map<number, BossbarData>();

    constructor(private game: Game) {}

    render(ctx: CanvasRenderingContext2D): void {
        ctx.save();

        ctx.translate(this.positionX, this.positionY)

        let index = 0;
        let yPosition = 0;

        const stroke = 10;

        for (const data of this.bossbarDatas.values()) {
            if (index >= this.maxLength) break;

            let clampedWidth = this.width * data.healthPercent;
            let clampedHeight = this.height;

            if (clampedWidth < stroke * 3) {
                clampedHeight = Math.max(clampedWidth / (stroke * 3) * this.height, 0);
            }

            ctx.fillStyle = "#000000";
            ctx.globalAlpha = 0.6;
            ctx.beginPath();
            ctx.roundRect(
                -(this.width + stroke) / 2,
                yPosition - this.height / 2,
                this.width + stroke,
                this.height + stroke,
                20
            )
            ctx.fill();

            ctx.fillStyle = "#87e63e";
            ctx.globalAlpha = 0.8;
            ctx.beginPath()
            ctx.roundRect(
                -this.width / 2,
                yPosition - this.height / 2 + (this.height - clampedHeight) / 2 + stroke / 2 ,
                clampedWidth,
                clampedHeight,
                20
            )
            ctx.fill();

            ctx.globalAlpha = 0.9;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.strokeStyle = "#000000";
            ctx.fillStyle = "#FFFFFF";

            ctx.font = "29px Ubuntu";
            ctx.lineWidth = 3;
            ctx.strokeText(
                data.mob.displayName,
                0, yPosition - this.height / 2 - 1.5
            )
            ctx.fillText(
                data.mob.displayName,
                0, yPosition - this.height / 2 - 1.5
            )

            const rarity = Rarity.fromString(data.mob.rarity);

            ctx.fillStyle = rarity.color;

            ctx.font = "18px Ubuntu";
            ctx.lineWidth = 1.25;
            ctx.strokeText(
                rarity.displayName,
                0,
                yPosition + (this.height + stroke) / 2 + 1
            )
            ctx.fillText(
                rarity.displayName,
                0,
                yPosition + (this.height + stroke) / 2 + 1
            )
            yPosition += this.height + 40;
            index ++;
        }

        ctx.restore();
    }

    resize(): void {
        const screenWidth = this.game.screenWidth;

        const positionX = screenWidth / 2;
        const positionY = 60;

        this.positionX = positionX;
        this.positionY = positionY;
    }
}
