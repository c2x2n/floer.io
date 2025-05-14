import { Game } from "../../game";
import { RectHitbox } from "../../../../../common/src/physics/hitbox";
import { UVector2D } from "../../../../../common/src/physics/uvector";
import { Numeric } from "../../../../../common/src/maths/numeric";

export class Leaderboard {
    width = 200;
    height = 280;
    readonly contentWidth: number = 182;
    readonly contentHeight: number = 19;
    readonly maxLength = 10;

    on = true;
    eventLoaded = false;

    constructor(private game: Game) {}

    render(ctx: CanvasRenderingContext2D) {
        if (!this.on) {
            ctx.save();
            ctx.translate(
                this.game.screenWidth - 60,
                10
            );

            ctx.fillStyle = "#55bb55";
            ctx.strokeStyle = "#459745";
            ctx.lineWidth = 4;

            ctx.beginPath();

            ctx.roundRect(
                0, 0, 40, 40, 5
            );

            ctx.fill();
            ctx.stroke();
            ctx.restore();

            return;
        }

        ctx.save();

        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        ctx.translate(
            this.positionX,
            this.positionY
        );

        ctx.fillStyle = "#555555";
        ctx.strokeStyle = "#454545";
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.9;

        ctx.beginPath();

        ctx.roundRect(
            0, 0,
            this.width, this.height,
            5
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#55bb55";
        ctx.strokeStyle = "#459745";
        ctx.lineWidth = 6;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();

        ctx.roundRect(
            0, 0,
            this.width, 40,
            0.5
        );
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#000000";
        ctx.font = "18px Ubuntu";
        ctx.lineWidth = 2;
        ctx.globalAlpha = 1;
        ctx.beginPath();

        const number = this.game.playerData.size;

        ctx.strokeText(
            `${number} Flower${number === 1 ? "" : "s"}`,
            this.width / 2, 20,
            this.width
        );

        ctx.fillText(
            `${number} Flower${number === 1 ? "" : "s"}`,
            this.width / 2, 20,
            this.width
        );
        const sortedPlayer
            = Array.from(this.game.playerData.values()).sort(
                (a, b) => b.exp - a.exp
            );

        let index = 0;

        // first item is 9px away from green thing
        let y = 9;
        const highestScore = sortedPlayer[0];
        let hasActivePlayer = false;

        for (let data of sortedPlayer) {
            if (index >= this.maxLength) break;

            const isActivePlayer = data.id === this.game.activePlayerID;
            let color = "#55be55";

            let width = Numeric.remap(
                data.exp, 0, highestScore.exp, 0, this.contentWidth
            );

            if (isActivePlayer) {
                hasActivePlayer = true;
                color = "#fffc61";
            }

            if (index === this.maxLength - 1 && !hasActivePlayer) {
                const cache = this.game.playerData.get(this.game.activePlayerID);
                if (cache) {
                    hasActivePlayer = true;
                    color = "#d2d2d2";
                    data = cache;
                }
            }

            ctx.fillStyle = "#343434";
            ctx.globalAlpha = 0.5;
            ctx.beginPath();
            ctx.roundRect(
                8, 40 + y,
                this.contentWidth, this.contentHeight,
                16
            );
            ctx.fill();

            // score bar
            // minimum width so that border radius works
            width = Math.max(width, 20);
            ctx.fillStyle = color;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.roundRect(
                8 + 1.5, 40 + y + 1.5,
                width - 3, this.contentHeight - 3,
                16
            );
            ctx.fill();

            ctx.fillStyle = "#ffffff";
            ctx.strokeStyle = "#000000";
            ctx.font = "13.5px Ubuntu";
            ctx.lineWidth = 1.2;
            ctx.globalAlpha = 1;
            ctx.beginPath();
            ctx.strokeText(
                `${data.name} - ${data.exp}`,
                8 + this.contentWidth / 2, 40 + y + this.contentHeight / 2,
                this.contentWidth
            );
            ctx.fillText(
                `${data.name} - ${data.exp}`,
                8 + this.contentWidth / 2, 40 + y + this.contentHeight / 2,
                this.contentWidth
            );

            // every item later on is 4px away from the last one
            y += this.contentHeight + 3.6;

            index++;
        }

        ctx.restore();
    }

    positionX = 0;
    positionY = 0;

    buttonHbx?: RectHitbox;
    leaderboardHbx?: RectHitbox;

    resize(): void {
        const screenWidth = this.game.screenWidth;

        const positionX = screenWidth - this.width - 18;
        const positionY = 17;

        this.positionX = positionX;
        this.positionY = positionY;

        this.buttonHbx = new RectHitbox(
            UVector2D["new"](
                this.game.screenWidth - 60, 10
            ),
            UVector2D["new"](
                this.game.screenWidth - 20, 30
            )
        );

        this.leaderboardHbx = new RectHitbox(
            UVector2D["new"](
                this.positionX, this.positionY
            ),
            UVector2D["new"](
                this.positionX + this.width, this.positionY + this.height
            )
        );

        if (!this.eventLoaded) {
            this.eventLoaded = true;
            const canvas = this.game.ui.canvas;
            canvas.on("touchstart", e => {
                if (!this.game.playerIsOnMobile) return;
                if (!this.leaderboardHbx || !this.buttonHbx) return;
                if (!e.touches.length) return;

                for (const touch of e.touches) {
                    const position = {
                        x: touch.clientX,
                        y: touch.clientY
                    };

                    switch (this.on) {
                        case true:
                            if (this.leaderboardHbx.isPointInside(position)) {
                                this.on = false;
                                e.preventDefault();
                            }
                            return;
                        case false:
                            if (this.buttonHbx.isPointInside(position)) {
                                this.on = true;
                                e.preventDefault();
                            }
                            return;
                    }
                }
            });
        }
    }
}
