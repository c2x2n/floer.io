import { Game } from "../../game";
import { P2 } from "../../../../../common/src/maths/constants";
import { ZoneName, Zones } from "../../../../../common/src/definitions/zones";
import { Walls } from "../../../../../common/src/definitions/walls";
import { Numeric } from "../../../../../common/src/maths/numeric";

const widthDiv = 10;
const heightDiv = 8;

export class Minimap {
    private minimapPositionX = 0;
    private minimapPositionY = 0;
    private minimapWidth = 0;
    private minimapHeight = 0;
    private gameWidth = 0;
    private gameHeight = 0;
    sized = false;

    constructor(private game: Game) {}

    resize(): void {
        if (this.game.playerIsOnMobile) {
            const screenWidth = this.game.screenWidth;
            this.minimapPositionX = screenWidth / 2;
            this.minimapPositionY = 30;

            return;
        }
        const screenWidth = this.game.screenWidth;
        const screenHeight = this.game.screenHeight;

        this.minimapPositionX = screenWidth - this.minimapWidth - 45;
        this.minimapPositionY = screenHeight - this.minimapHeight - 75;
    }

    update(): void {
        if (this.sized) return;

        this.gameWidth = this.game.gameWidth;
        this.gameHeight = this.game.gameHeight;

        this.minimapWidth = this.gameWidth / widthDiv;
        this.minimapHeight = this.gameHeight / heightDiv;

        this.sized = true;
    }

    render(ctx: CanvasRenderingContext2D): void {
        if (this.game.playerIsOnMobile && this.game.leaderboard.on) { return; }

        ctx.save();

        ctx.translate(
            this.minimapPositionX,
            this.minimapPositionY
        );

        ctx.globalAlpha = 1;

        ctx.fillStyle = "#000";
        ctx.globalAlpha = 0.8;
        ctx.strokeStyle = "#454545";
        ctx.lineWidth = 10;
        ctx.beginPath();

        ctx.roundRect(
            0,
            0,
            this.minimapWidth,
            this.minimapHeight, 2
        );

        ctx.fill();
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        let index = 0;
        for (const name in Zones) {
            const data = Zones[name as ZoneName];

            const y = (data.y ?? 0) / heightDiv;
            const x = data.x / widthDiv;
            const width = data.width / widthDiv;
            const height = (data.height ?? this.minimapHeight * heightDiv) / heightDiv;

            ctx.fillStyle = data.displayColor;

            ctx.globalAlpha = 0.9;
            ctx.beginPath();
            ctx.fillRect(
                x,
                y,
                width,
                height
            );
            ctx.fill();

            ctx.globalAlpha = 0.8;
            ctx.font = "15px Ubuntu";
            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#000000";
            ctx.lineWidth = 2;
            ctx.strokeText(data.displayName,
                x + width / 2,
                y + height / 2
            );
            ctx.fillText(data.displayName,
                x + width / 2,
                y + height / 2
            );

            ctx.fillStyle = "#000000";
            ctx.globalAlpha = 0.8;

            index++;
        }

        ctx.font = "25px Ubuntu";
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 2;
        ctx.strokeText("Map",
            this.minimapWidth / 2,
            -8
        );
        ctx.fillText("Map",
            this.minimapWidth / 2,
            -8
        );

        for (const data of Walls) {
            ctx.beginPath();
            ctx.rect(
                data.x / widthDiv,
                data.y / heightDiv,
                data.width / widthDiv,
                data.height / heightDiv
            );

            ctx.fill();
        }

        const position = this.game.activePlayer?.position;

        if (position) {
            const remappedX
                = Numeric.remap(position.x, 0, this.gameWidth, 0, this.minimapWidth);
            const remappedY
                = Numeric.remap(position.y, 0, this.gameHeight, 0, this.minimapHeight);

            ctx.fillStyle = "#FEE763";
            ctx.strokeStyle = "#988A3B";
            ctx.lineWidth = 1;
            ctx.beginPath();

            ctx.arc(
                remappedX,
                remappedY,
                5,
                0, P2
            );

            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    }
}
