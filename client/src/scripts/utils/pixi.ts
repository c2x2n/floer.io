import { Sprite, Assets, Texture, type ColorSource } from "pixi.js";
import { Vec2, Vector } from "@common/utils/vector";
import { Camera } from "@/scripts/render/camera.ts";
import { ObjectDefinition } from "@common/utils/definitions.ts";

export function getGameAssetsName(
    reify: ObjectDefinition
): string {
    if (reify.usingAssets) return `${reify.usingAssets}`;
    return `${reify.idString}`;
}

export function getGameAssetsFile(
    reify: ObjectDefinition
): string {
    return `${getGameAssetsName(reify)}.svg`;
}

export function getGameAssetsPath(
    type: string, reify: string  | ObjectDefinition
): string {
    if (typeof reify === "string") return `${type}_${reify}.svg`;
    return `${type}_${getGameAssetsFile(reify)}`;
}

let fullLoaded = false;
export let unloadedSprites: Map<GameSprite, string> | undefined;

export class GameSprite extends Sprite {
    static getTexture(frame: string): Texture {
        if (!Assets.cache.has(frame)) {
            console.warn(`Texture not found: "${frame}"`);
            frame = "_missing_texture";
        }
        return Texture.from(frame);
    }

    constructor(frame?: string) {
        super(frame ? GameSprite.getTexture(frame) : undefined);
        if (!fullLoaded && frame) {
            (unloadedSprites ??= new Map<GameSprite, string>()).set(this, frame);
        }

        this.anchor.set(0.5);
        this.setPos(0, 0);
    }

    setFrame(frame: string, force?: boolean): this {
        if (!fullLoaded && !force) {
            // @ts-expect-error technically this shouldn't be undefined, but there isn't a way around it so
            this.texture = undefined;
            (unloadedSprites ??= new Map<GameSprite, string>()).set(this, frame);
            return this;
        }

        this.texture = GameSprite.getTexture(frame);
        return this;
    }

    setAnchor(anchor: Vector): this {
        this.anchor.copyFrom(anchor);
        return this;
    }

    setPivot(pivot: Vector): this {
        this.pivot.copyFrom(pivot);
        return this;
    }

    setPos(x: number, y: number): this {
        this.position.set(x, y);
        return this;
    }

    setVPos(pos: Vector): this {
        this.position.set(pos.x, pos.y);
        return this;
    }

    setVisible(visible: boolean): this {
        this.visible = visible;
        return this;
    }

    setAngle(angle?: number): this {
        this.angle = angle ?? 0;
        return this;
    }

    setRotation(rotation?: number): this {
        this.rotation = rotation ?? 0;
        return this;
    }

    setScale(scale?: number): this {
        this.scale = Vec2.new(scale ?? 1, scale ?? 1);
        return this;
    }

    setScaleByUnitRadius(radius: number): this {
        this.scale = GameSprite.getScaleByUnitRadius(radius)
        return this;
    }

    static getScaleByUnitRadius(radius: number): Vector {
        const scale = Camera.unitToScreen(radius) / 100
        return Vec2.new(scale, scale);
    }

    setTint(tint: ColorSource): this {
        this.tint = tint;
        return this;
    }

    setZIndex(zIndex: number): this {
        this.zIndex = zIndex;
        return this;
    }

    setAlpha(alpha: number): this {
        this.alpha = alpha;
        return this;
    }
}

export async function loadAssets(): Promise<void> {
    // imports all svg assets from public dir
    // and sets an alias with the file name
    // so for example you can just do:
    // new Sprite("player.svg")
    // instead of:
    // new Sprite("/img/player.svg")

    const promises: Array<ReturnType<typeof Assets["load"]>> = [];
    const imgs = import.meta.glob("/public/img/game/**/*.svg");

    for (const file in imgs) {
        const path = file.split("/");
        const name = path[path.length - 2] + "_" + path[path.length - 1];

        promises.push(Assets.load({
            alias: name,
            src: file.replace("/public", ""),
        }));
    }

    await Promise.all(promises);

    fullLoaded = true;

    if (unloadedSprites) unloadedSprites.forEach((v, k) => { k.setFrame(v); });
}

