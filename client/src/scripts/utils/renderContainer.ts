import { Vector, Vec2 } from "@common/utils/vector.ts";
import { MathNumeric } from "@common/utils/math.ts";

export type ColorLike = Color | string | number;
export type RenderFunc = (dt: number) => void;

export interface Color {
    r: number
    g: number
    b: number
}

function getColor(color: ColorLike): Color {
    if (typeof color === "string") {
        return {
            r: parseInt(color.substring(1, 3), 16),
            g: parseInt(color.substring(3, 5), 16),
            b: parseInt(color.substring(5, 7), 16)
        }
    } else if (typeof color === "number") {
        return getColor("#" + color.toString(16).padStart(6, "0"))
    }

    return color
}

export interface Dot { x: number, y: number, size?: number }

export class RenderContainer {
    alpha: number = 1;
    rotation: number = 0;
    scale: number = 1;

    radius: number = 0;

    position: Vector = Vec2.new(0, 0);
    tint: Color = {
        r: 255,
        g: 255,
        b: 255
    };
    brightness: number = 1;

    visible: boolean = true;

    renderFunc?: RenderFunc;
    staticRenderFunc?: RenderFunc;

    lastRenderTime: number = 0;
    lastTransingTime: number = Date.now();
    readonly createdTime: number = Date.now();
    dotsData?: Dot[];
    noCustoming: boolean = false;

    zIndex: number = 0;

    constructor(public ctx: CanvasRenderingContext2D) {}

    render(dt: number) {
        const { alpha, rotation, position, visible, scale, ctx } = this;

        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        ctx.globalAlpha = visible ? alpha : 0;

        ctx.save()

        if (this.renderFunc) this.renderFunc(dt);

        ctx.restore()

        ctx.globalAlpha = 1;

        ctx.scale(1 / scale, 1 / scale);
        ctx.rotate(-rotation);

        if (this.staticRenderFunc) this.staticRenderFunc(dt);

        ctx.translate(-position.x, -position.y);

        this.lastRenderTime = Date.now();
    }

    getAlpha(alpha: number): number {
        return MathNumeric.clamp(this.alpha * alpha, 0, 1);
    }

    getRenderColor(color: ColorLike): string {
        color = getColor(color);

        // Tint and apply brightness.
        color = {
            r: Math.round(color.r * this.tint.r / 255 * this.brightness),
            g: Math.round(color.g * this.tint.g / 255 * this.brightness),
            b: Math.round(color.b * this.tint.b / 255 * this.brightness)
        }

        // Clamp to avoid errors
        color = {
            r: MathNumeric.clamp(color.r, 0, 255),
            g: MathNumeric.clamp(color.g, 0, 255),
            b: MathNumeric.clamp(color.b, 0, 255)
        }

        return `rgb(${color.r}, ${color.g}, ${color.b})`
    }
}
