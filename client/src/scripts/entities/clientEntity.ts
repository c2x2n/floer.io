import { type GameEntity } from "../../../../common/src/misc/entityPool";
import { EntityType } from "../../../../common/src/constants";
import { UVector2D } from "../../../../common/src/engine/physics/uvector";
import { Game } from "../game";
import { Tween } from "@tweenjs/tween.js";
import { P2 } from "../../../../common/src/engine/maths/constants";
import { Camera } from "../render/camera";
import { RenderContainer } from "../render/misc";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { Numeric } from "../../../../common/src/engine/maths/numeric";
import { EntitiesNetData } from "../../../../common/src/engine/net/entitySerializations";

export abstract class ClientEntity<T extends EntityType = EntityType> implements GameEntity {
    readonly game: Game;

    readonly id: number;
    abstract readonly type: EntityType;

    ctx: CanvasRenderingContext2D;

    lastReceivePacket = 0;

    oldPosition: VectorAbstract = UVector2D.new(0, 0);
    _position: VectorAbstract = UVector2D.new(0, 0);
    hitboxRadius = 0;

    get position(): VectorAbstract {
        return this._position;
    }

    set position(position: VectorAbstract) {
        this.oldPosition = this.position;
        this._position = position;
    }

    oldDirection: VectorAbstract = UVector2D.new(0, 0);
    _direction: VectorAbstract = UVector2D.new(0, 0);

    get direction(): VectorAbstract {
        return this._direction;
    }

    set direction(direction: VectorAbstract) {
        this.oldDirection = this.direction;
        this._direction = direction;
    }

    lastGettingDamage = 0;

    container: RenderContainer;

    protected constructor(game: Game, id: number) {
        this.game = game;
        this.id = id;
        this.ctx = game.getCanvasCtx();

        this.container = new RenderContainer(
            this.ctx
        );

        this.container.renderFunc = this.render.bind(this);
        this.container.staticRenderFunc = this.staticRender.bind(this);

        game.app.renderer.addContainer(this.container);
    }

    updateFromData(_data: EntitiesNetData[T], _isNew: boolean): void {
        this.interpolationTick = 0;
        if (_isNew) {
            this.oldPosition = _data.position;
            this._position = _data.position;
        }
        this.lastReceivePacket = Date.now();
    }

    interpolationTick = 0;
    interpolationFactor = 0;

    render(dt: number): void {
        this.interpolationTick += dt;
        this.interpolationFactor = Numeric.clamp(
            this.interpolationTick / this.game.serverDt
            , 0, 1
        );
    }

    updateContainerPosition(n?: number): void {
        if (n) {
            this.container.position
                = UVector2D.targetEasing(
                    this.container.position,
                    Camera.vecToScreen(this.position),
                    n
                );
        } else {
            this.container.position = Camera.vecToScreen(
                UVector2D.lerp(this.oldPosition, this.position, this.interpolationFactor)
            );
        }
    }

    getDamageAnimation(disableFilter?: boolean) {
        if (Date.now() - this.lastGettingDamage < 200) return;

        this.lastGettingDamage = Date.now();
        const tick = 30;

        if (disableFilter) {
            this.game.addTween(
                new Tween({ color: { r: 555, g: 0, b: 0 } })
                    .to({ color: { r: 255, g: 255, b: 255 } }, tick * 2)
                    .onUpdate(d => {
                        this.container.tint = d.color;
                    })
            );
            return;
        }

        this.game.addTween(
            new Tween({ color: { r: 555, g: 0, b: 0 } })
                .to({ color: { r: 255, g: 255, b: 255 } }, tick)
                .onUpdate(d => {
                    this.container.tint = d.color;
                })
        );

        this.game.addTween(
            new Tween({ brightness: 1 })
                .delay(tick)
                .to({ brightness: 4 }, tick)
                .onUpdate(d => {
                    this.container.brightness = d.brightness;
                })
        );

        this.game.addTween(
            new Tween({ brightness: 4 })
                .delay(tick * 2)
                .to({ brightness: 1 }, tick)
                .onUpdate(d => {
                    this.container.brightness = d.brightness;
                })
            , () => this.container.brightness = 1
        );
    }

    staticRender(dt: number): void {
        if (this.game.app.settings.data.hitbox) this.renderHitbox();
        else if (this.drawedHitbox) this.renderHitbox(true);
    }

    drawedHitbox = false;

    renderHitbox(hide?: boolean): void {
        this.drawedHitbox = !hide;
        if (!hide && this.hitboxRadius > 0) {
            const screenRadius = Camera.unitToScreen(this.hitboxRadius);
            const { ctx } = this;
            ctx.save();
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 1.5;
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.arc(
                0, 0,
                screenRadius,
                0, P2
            );
            ctx.stroke();
            ctx.restore();
            ctx.globalAlpha = 1;
        }
    }

    destroy() {
        this.game.app.renderer.removeContainer(this.container);
    }
}
