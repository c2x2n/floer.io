import { Container } from "pixi.js";
import { Vec2, type Vector } from "@common/utils/vector";
import { type Game } from "@/scripts/game";
import { MathNumeric } from "@common/utils/math.ts";
import { Tween } from "@tweenjs/tween.js"

export class Camera {
    readonly container = new Container({
        sortableChildren: true,
        isRenderGroup: true
    });

    readonly game: Game;

    position = Vec2.new(0, 0);

    width = 1;
    height = 1;

    private _zoom = 64;
    private zoomNow = 64;

    /**
     * How many pixels each game unit is
     */
    static scale = 20;

    /**
     * Scales a game vector to pixels
     */
    static vecToScreen(a: Vector): Vector {
        return Vec2.mul(a, this.scale);
    }

    /**
     * Scales a game unit to pixels
     */
    static unitToScreen(a: number): number {
        return a * this.scale;
    }

    get zoom(): number { return this._zoom; }
    set zoom(zoom: number) {
        if (zoom === this._zoom) return;
        this._zoom = zoom;
    }

    constructor(game: Game) {
        this.game = game;
    }

    init(): void{
        this.game.pixi.stage.addChild(this.container);
        this.resize();
    }

    resize(): void {
        this.zoomNow = MathNumeric.targetEasing(this.zoomNow, this._zoom, 6);

        this.width = this.game.pixi.screen.width;
        this.height = this.game.pixi.screen.height;

        const minDim = Math.min(this.width, this.height);
        const maxDim = Math.max(this.width, this.height);
        const maxScreenDim = Math.max(minDim * (16 / 9), maxDim);

        this.container.scale.set((maxScreenDim * 0.5) / (this.zoomNow * Camera.scale));
        // this.render();
    }

    XOffset: number = 0;
    YOffset: number = 0;

    render(): void {
        this.resize();

        const position = this.position;
        const cameraPos = Vec2.add(
            Vec2.mul(position, this.container.scale.x),
            Vec2.new(-this.width / 2, -this.height / 2));
        this.container.position.set(-cameraPos.x + this.XOffset, -cameraPos.y + this.YOffset);
    }

    addObject(object: Container): void {
        this.container.addChild(object);
    }

    clear(): void {
        this.container.removeChildren();
    }

    screenShake(): void {
        if (!this.game.app.settings.data.screenShake) return;

        const tick = 50;
        const force = 4;

        this.game.addTween(
            new Tween({ x: 0, y: 0 })
                .to({ x: force, y: force }, tick)
                .onUpdate(d => {
                    this.game.camera.XOffset = d.x;
                    this.game.camera.YOffset = d.y;
                })
        )

        this.game.addTween(
            new Tween({ x: force, y: force })
                .delay(tick)
                .to({ x: -force, y: -force }, tick)
                .onUpdate(d => {
                    this.XOffset = d.x;
                    this.YOffset = d.y;
                })
        )

        this.game.addTween(
            new Tween({ x: -force, y: -force })
                .delay(tick * 2)
                .to({ x: 0, y: 0}, tick)
                .onUpdate(d => {
                    this.XOffset = d.x;
                    this.YOffset = d.y;
                })
        )
    }
}
