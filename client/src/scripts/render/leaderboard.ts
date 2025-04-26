import { Game } from "@/scripts/game.ts";
import { Graphics, Container, Text } from "pixi.js";
import { MathNumeric } from "@common/utils/math.ts";
import { Petals } from "@common/definitions/petal.ts";

class LeaderboardContent {
    readonly width: number = 182;
    readonly height: number = 19;

    graphics: Graphics = new Graphics();
    text: Text = new Text({
        text: "",
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 13.5,
            fill: "#fff",
            stroke: {color: "#000", width: 1.2}
        }
    });

    constructor() {
        this.text.anchor.set(0.5);
    }
}

export class Leaderboard {
    leaderboardBackground: Graphics = new Graphics();

    leaderboardContents: LeaderboardContent[] = [];

    flowerNumber: Text = new Text({
        text: "",
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 18,
            fill: "#fff",
            stroke: {color: "#000", width: 2}
        }
    })

    container = new Container();

    width: number = 200;
    height: number = 280;

    constructor(private game: Game) {}

    init(){
        this.flowerNumber.anchor.set(0.5);

        this.container.addChild(
            this.leaderboardBackground,
            this.flowerNumber
        );
        this.game.pixi.stage.addChild(
            this.container
        );

        for (let i = 0; i < 10; i++) {
            this.leaderboardContents.push(new LeaderboardContent())
            this.container.addChild(
                this.leaderboardContents[i].graphics,
                this.leaderboardContents[i].text
            )
        }

        this.resize();
        this.redraw();
    }

    render(){
        const number = this.game.playerData.size;
        this.flowerNumber.text = number + ` Flower${number === 1 ? "" : "s"}`;

        let array =
            Array.from(this.game.playerData.values()).sort(
                (a, b) => b.exp - a.exp
            )

        let index = 0;

        // first item is 9px away from green thing
        let height = 9;

        let highestScore = array[0];

        let hasActivePlayer = false;

        this.leaderboardContents.forEach(leaderboard => {
            // 'leaderboard' here stands for leaderboard content this iteration
            leaderboard.graphics.clear();
            if (index < array.length && index < this.leaderboardContents.length) {
                let data = array[index];

                let isActivePlayer = data.id === this.game.activePlayerID;
                let color = 0x55be55;

                let width;
                if (!highestScore || highestScore.exp === 0) {
                    // If all scores are 0, give everyone a small default width
                    width = 20;
                } else {
                    width = MathNumeric.remap(
                        data.exp, 0, highestScore.exp, 0, leaderboard.width
                    );
                }

                if (isActivePlayer) {
                    hasActivePlayer = true;
                    color = 0xfffc61;
                }

                if (index === this.leaderboardContents.length - 1 && !hasActivePlayer) {
                    const cache = this.game.playerData.get(this.game.activePlayerID);
                    if (cache) {
                        hasActivePlayer = true;
                        color = 0xd2d2d2;
                        data = cache;
                    }
                }

                // gray bar containing score bar
                leaderboard.graphics
                    .roundRect(8, 40 + height, leaderboard.width, leaderboard.height, 16)
                    .fill({ color: 0x343434, alpha: 0.5 })

                // score bar
                // minimum width so that border radius works
                width = Math.max(width, 20);
                leaderboard.graphics
                    .roundRect(8 + 1.5, 40 + height + 1.5, width - 3, leaderboard.height - 3, 16)
                    .fill({ color: color, alpha: 1 })

                leaderboard.text.text = data.name + " - " + data.exp;
                leaderboard.text.position.set(
                    8 + leaderboard.width / 2,
                    40 + height + leaderboard.height / 2 - 1
                );
            } else {
                leaderboard.text.text = ""
            }

            // every item later on is 4px away from the last one
            height += leaderboard.height + 3.6;
            index ++;
        })
    }

    resize(): void {
        const screenWidth = this.game.pixi.screen.width;
        const screenHeight = this.game.pixi.screen.height;

        const positionX = screenWidth - this.width - 18;
        const positionY = 17;

        this.container.position.set(positionX, positionY);

    }

    redraw(): void {
        this.leaderboardBackground.clear()
        // gray block, lb background
            .roundRect(0, 0, this.width, this.height, 5)
            .fill({ color: 0x555555, alpha: 0.9 })
            .stroke({ color: 0x454545, width: 6 })
            // green block
            .roundRect(0, 0, this.width, 40, 0.5)
            .fill({ color: 0x55bb55, alpha: 0.9 })
            .stroke({ color: 0x459745, width: 6 });
        this.flowerNumber.position.set(this.width / 2, 20);
    }
}
