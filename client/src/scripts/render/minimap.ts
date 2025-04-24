import { Game } from "@/scripts/game.ts";
import { Graphics, Container, Text } from "pixi.js";
import { MathNumeric } from "@common/utils/math.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { GameConstants } from "@common/constants.ts";

import { Zone, ZoneName, Zones } from "@common/definitions/zones.ts";

const widthDiv = 12;
const heightDiv = 3;

export class Minimap {
    mapBackground = new Graphics({
        zIndex: 1
    });

    playerPosition = new Graphics({
        zIndex: 9
    })

    container = new Container();

    mapNames: Text[] = [];

    private minimapPositionX: number = 0;
    private minimapPositionY: number = 0;
    private minimapWidth: number = 0;
    private minimapHeight: number = 0;
    private width: number = 0;
    private height: number = 0;

    constructor(private game: Game) {}

    init(){
       this.container.addChild(
           this.mapBackground,
           this.playerPosition
       );
       this.container.zIndex = 999;

       this.game.pixi.stage.addChild(
           this.container
       );

    }

    render(){
        const position = this.game.activePlayer?.position;

        if (position) {
            const remappedX =
                MathNumeric.remap(position.x, 0, this.width, 0, this.minimapWidth);
            const remappedY =
                MathNumeric.remap(position.y, 0, this.height, 0, this.minimapHeight);
            this.playerPosition.clear()
                .circle(
                    remappedX,
                    remappedY,
                    5
                ).fill(0xfee763)
                 .stroke({ color: 0x988a3b, width: 1.5 });
        }
    }

    resize(): void {
        this.width = this.game.width;
        this.height = this.game.height;

        this.minimapWidth = this.width / widthDiv;
        this.minimapHeight = this.height / heightDiv;

        const screenWidth = this.game.pixi.screen.width;
        const screenHeight = this.game.pixi.screen.height;

        this.minimapPositionX = screenWidth - this.minimapWidth - 8;
        this.minimapPositionY = screenHeight - this.minimapHeight - 8;

        this.container.position.set(this.minimapPositionX, this.minimapPositionY);

        this.redraw();
    }

    redraw(): void {
        this.mapBackground.clear()
            .roundRect(
                0,
                0,
                this.minimapWidth,
                this.minimapHeight, 2
            )
            .fill({
                color: 0x000,
                alpha: 0.9
            })
            .stroke({
                color: 0x000,
                width: 3,
            });

        for (const x in Zones) {
            const data = Zones[x as ZoneName];
            this.mapBackground
                .rect(data.x / widthDiv, 0, data.width / widthDiv, this.minimapHeight)
                .fill(data.displayColor)
        }

        let index = 0;
        for (const x in Zones) {
            const data = Zones[x as ZoneName];
            if (!this.mapNames[index]) {
                this.mapNames[index] = new Text({
                    text: x,
                    style: {
                        fontFamily: 'Ubuntu',
                        fontSize: 11,
                        fill: "#fff",
                        stroke: {color: "#000", width: 2}
                    }
                });
                this.mapNames[index].anchor.set(0.5);
                this.container.addChild(this.mapNames[index]);
                this.mapNames[index].zIndex = 3;
            }
            this.mapNames[index].position.set(data.x / widthDiv + data.width / widthDiv / 2, this.minimapHeight / 2);
            index ++;
        }
    }
}
