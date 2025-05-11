import { Game } from "@/scripts/game.ts";
import { Numeric } from "@common/utils/math.ts";
import { getLevelInformation } from "@common/utils/levels.ts";

export class ExpUI {

    positionX: number = 0;
    positionY: number = 0;
    exp: number = 0;
    currentExpWidth: number = 30;
    readonly width: number = 340;
    readonly height: number = 39;

    constructor(private game: Game) {}

    render(ctx: CanvasRenderingContext2D){
        ctx.save();

        ctx.translate(
            this.positionX,
            this.positionY
        )

        const levelInfo = getLevelInformation(this.exp);

        const targetExpWidth = Math.max(
            Numeric.remap(levelInfo.remainsExp, 0, levelInfo.toNextLevelExp, 0, this.width - 8),
            30 // set minimum width so that it won't look weird
        );

        // Use targetEasing for smooth animation
        this.currentExpWidth = Numeric.targetEasing(this.currentExpWidth, targetExpWidth, 10);

        ctx.fillStyle = "#343434";
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        ctx.roundRect(
            0,
            0,
            this.width,
            this.height,
            100
        )
        ctx.fill()

        ctx.fillStyle = "#D8F060";
        ctx.globalAlpha = 1;
        ctx.beginPath();
        ctx.roundRect(
            6/2,
            6/2,
            this.currentExpWidth,
            this.height - 6,
            100
        )
        ctx.fill()

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "16px Ubuntu";
        ctx.fillStyle = "#FFFFFF";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 1.6;
        ctx.globalAlpha = 0.9;

        ctx.strokeText(
            `Lvl ${levelInfo.level} Flower`,
            this.width / 2,
            this.height / 2
        )
        ctx.fillText(
            `Lvl ${levelInfo.level} Flower`,
            this.width / 2,
            this.height / 2
        )

        if (levelInfo.nextExtraSlot !== 0) {
            ctx.font = "14px Ubuntu";
            ctx.lineWidth = 1.25;
            ctx.strokeText(
                `Extra petal slot at level ${levelInfo.nextExtraSlot}`,
                this.width / 2, this.height + 10
            )
            ctx.fillText(
                `Extra petal slot at level ${levelInfo.nextExtraSlot}`,
                this.width / 2, this.height + 10
            )
        }

        ctx.font = "22.5px Ubuntu";
        ctx.lineWidth = 2.1;

        const name = this.game.activePlayerName
        ctx.strokeText(
            name,
            this.width / 2,
            -18.5
        )
        ctx.fillText(
            name,
            this.width / 2,
            -18.5
        )

        ctx.restore();
    }

    resize(): void {
        if (this.game.playerIsOnMobile){
            this.positionX = 10;
            this.positionY = 40;
            return
        }
        const screenHeight = this.game.screenHeight;

        const positionX = 10;
        const positionY = screenHeight - this.height - 50;

        this.positionX = positionX;
        this.positionY = positionY;
    }
}
