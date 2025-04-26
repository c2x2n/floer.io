import { Game } from "@/scripts/game.ts";
import { Graphics, Container, Text } from "pixi.js";
import { MathNumeric } from "@common/utils/math.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { GameConstants } from "@common/constants.ts";

import { ZoneData, ZoneName, Zones } from "@common/zones.ts";

const widthDiv = 10;
const heightDiv = 5;

export class Minimap {
    mapBackground = new Graphics({
        zIndex: 1
    });

    playerPosition = new Graphics({
        zIndex: 9
    })

    container = new Container();

    mapNames: Text[] = [];

    mapTitle: Text = new Text({
        text: 'Map',
        alpha: 0.8,
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 25,
            fill: "#fff",
            stroke: {color: "#000", width: 2}
        }
    });

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
           this.playerPosition,
           this.mapTitle
       );
       this.container.zIndex = 999;

       this.game.pixi.stage.addChild(
           this.container
       );

       this.mapTitle.anchor.set(0.5);
       this.mapTitle.zIndex = 4;
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

        this.minimapPositionX = screenWidth - this.minimapWidth - 45;
        this.minimapPositionY = screenHeight - this.minimapHeight - 75;

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
                alpha: 0.8
            })
            .stroke({
                color: 0x454545,
                width: 10,
            });

        this.mapTitle.position.set(this.minimapWidth / 2, -8)

        let index = 0;
        for (const x in Zones) {
            const data = Zones[x as ZoneName];

            this.mapBackground
                .rect(
                    data.x / widthDiv,
                    (data.y ?? 0) / heightDiv,
                    data.width / widthDiv,
                    (data.height ?? this.minimapHeight * heightDiv) / heightDiv)
                .fill(data.displayColor)

            this.mapBackground.alpha = 0.9;

            if (!this.mapNames[index]) {
                this.mapNames[index] = new Text({
                    text: data.displayName,
                    style: {
                        fontFamily: 'Ubuntu',
                        fontSize: 15,
                        fill: "#fff",
                        stroke: {color: "#000", width: 1}
                    }
                });
                this.mapNames[index].anchor.set(0.5);
                this.container.addChild(this.mapNames[index]);
                this.mapNames[index].zIndex = 3;
            }
            this.mapNames[index].position.set(
                (data.x + data.width / 2) / widthDiv ,
                ((data.y ?? 0) + (data.height ?? this.minimapHeight * heightDiv) / 2) / heightDiv
            );
            index ++;
        }
    }
}
