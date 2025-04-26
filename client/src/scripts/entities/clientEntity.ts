import { type GameEntity } from "@common/utils/entityPool";
import { EntityType } from "@common/constants";
import { Vec2, Vector } from "@common/utils/vector";
import { Game } from "@/scripts/game";
import { Container, ColorMatrixFilter, Graphics } from "pixi.js";
import { EntitiesNetData } from "@common/packets/updatePacket.ts";
import { Tween } from "@tweenjs/tween.js";
import { MathNumeric } from "@common/utils/math.ts";
import { Camera } from "@/scripts/render/camera.ts";

export abstract class ClientEntity<T extends EntityType = EntityType> implements GameEntity{
    readonly game: Game;

    readonly id: number;
    abstract readonly type: EntityType;

    container = new Container();
    staticContainer: Container = new Container();
    hitboxGraphics = new Graphics();

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

    protected constructor(game: Game, id: number) {
        this.game = game;
        this.id = id;

        this.game.camera.addObject(this.container);
        this.game.camera.addObject(this.staticContainer);
        // Add hitboxGraphics to staticContainer instead of container
        // otherwise hitbox size will scale twice
        this.staticContainer.addChild(this.hitboxGraphics);
        this.hitboxGraphics.zIndex = 10;
    }

    updateFromData(_data: EntitiesNetData[T], _isNew: boolean): void {
        this.interpolationTick = 0;
        if (_isNew) {
            this.oldPosition = _data.position;
            this._position = _data.position;
        }
        this.render((Date.now() - this.lastReceivePacket) / 1000);
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
        // TODO: Either remove or make dev-only. BUT how?
        this.renderHitbox();
    }

    renderHitbox(): void {
        this.hitboxGraphics.clear();
        if (this.hitboxRadius > 0) {
            const screenRadius = Camera.unitToScreen(this.hitboxRadius);
            this.hitboxGraphics.circle(0, 0, screenRadius)
                .stroke({ width: 1.5, color: 0xff0000, alpha: 0.8 }); // red
        }
    }

    updateContainerPosition(n?: number): void {
        if (n) {
            this.container.position =
                Vec2.targetEasing(this.container.position, Camera.vecToScreen(this.position), n)
        } else {
            this.container.position = Camera.vecToScreen(
                Vec2.lerp(this.oldPosition, this.position, this.interpolationFactor)
            );
        }
        this.staticContainer.position = this.container.position;
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
        const filter = new ColorMatrixFilter();
        this.container.filters = [filter];

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
                    filter.brightness(d.brightness, false);
                })
        )

        this.game.addTween(
            new Tween({ brightness: 3 })
                .delay(tick * 2)
                .to({ brightness: 1 }, tick )
                .onUpdate(d => {
                    filter.brightness(d.brightness, false);
                })
            ,() => this.container.filters = []
        )
    }

    destroy() {
        this.game.camera.container.removeChild(this.container);
        this.game.camera.container.removeChild(this.staticContainer);
    }
}
