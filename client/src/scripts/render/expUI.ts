import { Game } from "@/scripts/game.ts";
import { Graphics, Container, Text } from "pixi.js";
import { MathNumeric } from "@common/utils/math.ts";
import { getLevelInformation } from "@common/utils/levels.ts";

export class ExpUI {
    expGraphics: Graphics = new Graphics();
    expText: Text = new Text({
        text: "",
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 16,
            fill: "#fff",
            stroke: {color: "#000", width: 1.6}
        }
    });
    slotText: Text = new Text({
        text: "",
        alpha: 0.9,
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 14,
            fill: "#fff",
            stroke: {color: "#000", width: 1.25}
        }
    });
    nameText: Text = new Text({
        text: "",
        alpha: 0.9,
        style: {
            fontFamily: 'Ubuntu',
            fontSize: 22.5,
            fill: "#fff",
            stroke: {color: "#000", width: 2.1}
        }
    });


    exp: number = 0;
    currentExpWidth: number = 30; // Starting width for animation

    container = new Container();

    width: number = 340;
    height: number = 39;

    constructor(private game: Game) {}

    init(){
        this.expText.anchor.set(0.5);
        this.slotText.anchor.set(0.5);
        this.nameText.anchor.set(0.5);

        this.container.addChild(
            this.expGraphics,
            this.expText,
            this.slotText,
            this.nameText
        );
        this.game.pixi.stage.addChild(
            this.container
        );

        this.resize();
    }

    render(){
        const levelInfo = getLevelInformation(this.exp);

        const targetExpWidth = Math.max(
            MathNumeric.remap(levelInfo.remainsExp, 0, levelInfo.toNextLevelExp, 0, this.width - 8),
            30 // set minimum width so that it won't look weird
        );

        // Use targetEasing for smooth animation
        this.currentExpWidth = MathNumeric.targetEasing(this.currentExpWidth, targetExpWidth, 10);

        this.expGraphics.clear()
            .roundRect(0, 0, this.width, this.height, 100)
            .fill({ color: 0x343434, alpha: 0.8 })
            .roundRect(6/2, 6/2, this.currentExpWidth, this.height - 6, 100)
            .fill({ color: 0xd8f060, alpha: 1 });

        this.expText.position.set(this.width / 2, this.height / 2);

        this.expText.text = `Lvl ${levelInfo.level} Flower`;
        if (levelInfo.nextExtraSlot !== 0) {
            this.slotText.text = `Extra petal slot at level ${levelInfo.nextExtraSlot}`;
        } else {
            this.slotText.text = "";
        }
        this.nameText.text = `${this.game.ui.nameInput.val() ?? "Player"}`;
    }

    resize(): void {
        const screenWidth = this.game.pixi.screen.width;
        const screenHeight = this.game.pixi.screen.height;

        const positionX = 10;
        const positionY = screenHeight - this.height - 50;

        this.slotText.position.set(this.width / 2, this.height + 10);
        this.nameText.position.set(this.width / 2, -this.height + 22.5);

        this.container.position.set(positionX, positionY);
    }
}
