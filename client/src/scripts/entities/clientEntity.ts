import { type GameEntity } from "@common/utils/entityPool";
import { EntityType } from "@common/constants";
import { Vec2, Vector } from "@common/utils/vector";
import { Game } from "@/scripts/game";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Tween } from "@tweenjs/tween.js";
import { MathNumeric, P2 } from "@common/utils/math.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { RenderContainer } from "@/scripts/utils/renderContainer.ts";

export abstract class ClientEntity<T extends EntityType = EntityType> implements GameEntity{
    readonly game: Game;

    readonly id: number;
    abstract readonly type: EntityType;

    ctx: CanvasRenderingContext2D;

    lastReceivePacket: number = 0;

    oldPosition: Vector = Vec2.new(0, 0);
    _position: Vector = Vec2.new(0, 0);
    hitboxRadius: number = 0;

    get position(): Vector {
        return this._position;
    }

    set position(position: Vector) {
        this.oldPosition = this.position;
        this._position = position;
    }

    oldDirection: Vector = Vec2.new(0, 0);
    _direction: Vector = Vec2.new(0, 0);

    get direction(): Vector {
        return this._direction;
    }

    set direction(direction: Vector) {
        this.oldDirection = this.direction;
        this._direction = direction;
    }

    lastGettingDamage: number = 0;

    container: RenderContainer;

    protected constructor(game: Game, id: number) {
        this.game = game;
        this.id = id;
        this.ctx = game.getCanvasCtx();

        this.container = new RenderContainer(
            this.ctx
        );

        this.container.renderFunc = this.render.bind(this);
        this.container.staticRenderFunc = this.staticRender.bind(this)

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
        this.interpolationFactor = MathNumeric.clamp(
            this.interpolationTick / this.game.serverDt
            , 0, 1
        );
    }


    updateContainerPosition(n?: number): void {
        if (n) {
            this.container.position =
                Vec2.targetEasing(
                    this.container.position,
                    Camera.vecToScreen(this.position),
                    n
                )
        } else {
            this.container.position = Camera.vecToScreen(
                Vec2.lerp(this.oldPosition, this.position, this.interpolationFactor)
            );
        }
    }

    getDamageAnimation(disableFilter?: boolean) {
        if (Date.now() - this.lastGettingDamage < 200) return

        this.lastGettingDamage = Date.now();
        const tick = 30;

        if (disableFilter){
            this.game.addTween(
                new Tween({ color: { r: 255, g: 0, b: 0 } })
                    .to({ color: { r: 255, g: 255, b: 255 } }, tick * 2 )
                    .onUpdate(d => {
                        this.container.tint = d.color;
                    })
            )
            return;
        }

        this.game.addTween(
            new Tween({ color: { r: 255, g: 0, b: 0 } })
                .to({ color: { r: 255, g: 255, b: 255 } }, tick )
                .onUpdate(d => {
                    this.container.tint = d.color;
                })
        )

        this.game.addTween(
            new Tween({ brightness: 1 })
                .delay(tick)
                .to({ brightness: 3 }, tick )
                .onUpdate(d => {
                    this.container.brightness = d.brightness;
                })
        )

        this.game.addTween(
            new Tween({ brightness: 3 })
                .delay(tick * 2)
                .to({ brightness: 1 }, tick )
                .onUpdate(d => {
                    this.container.brightness = d.brightness;
                })
            ,() => this.container.brightness = 1
        )
    }

    staticRender(dt: number): void {
        if (this.game.app.settings.data.hitbox) this.renderHitbox();
        else if (this.drawedHitbox) this.renderHitbox(true);
    }

    drawedHitbox: boolean = false;

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
            )
            ctx.stroke()
            ctx.restore();
            ctx.globalAlpha = 1;
        }
    }

    destroy() {
        this.game.app.renderer.removeContainer(this.container);
    }
}
