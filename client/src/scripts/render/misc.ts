import { UVector2D } from "../../../../common/src/physics/uvector";
import VectorAbstract from "../../../../common/src/physics/vectorAbstract";
import { Numeric } from "../../../../common/src/maths/numeric";

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
        };
    } else if (typeof color === "number") {
        return getColor(`#${color.toString(16).padStart(6, "0")}`);
    }

    return color;
}

export interface Dot { x: number, y: number, size?: number }

export class RenderContainer {
    alpha = 1;
    rotation = 0;
    scale = 1;

    radius = 0;

    position: VectorAbstract = UVector2D["new"](0, 0);
    tint: Color = {
        r: 255,
        g: 255,
        b: 255
    };

    brightness = 1;

    visible = true;

    renderFunc?: RenderFunc;
    staticRenderFunc?: RenderFunc;

    lastRenderTime = 0;
    transing = 0;
    readonly createdTime: number = Date.now();
    dotsData?: Dot[];
    noCustoming = false;
    zIndex = 0;

    constructor(public ctx: CanvasRenderingContext2D) {}

    render(dt: number, noStatic?: boolean) {
        const { alpha, rotation, position, visible, scale, ctx } = this;

        ctx.translate(position.x, position.y);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);

        ctx.globalAlpha = visible ? alpha : 0;

        ctx.save();

        if (this.renderFunc) this.renderFunc(dt);

        ctx.restore();

        ctx.globalAlpha = 1;

        ctx.scale(1 / scale, 1 / scale);
        ctx.rotate(-rotation);

        if (this.staticRenderFunc && !noStatic) this.staticRenderFunc(dt);

        ctx.translate(-position.x, -position.y);

        this.lastRenderTime = Date.now();
    }

    getAlpha(alpha: number): number {
        return Numeric.clamp(this.alpha * alpha, 0, 1);
    }

    getRenderColor(color: ColorLike): string {
        color = getColor(color);

        // Tint and apply brightness.
        color = {
            r: Math.round(color.r * this.tint.r / 255 * this.brightness),
            g: Math.round(color.g * this.tint.g / 255 * this.brightness),
            b: Math.round(color.b * this.tint.b / 255 * this.brightness)
        };

        // Clamp to avoid errors
        color = {
            r: Numeric.clamp(color.r, 0, 255),
            g: Numeric.clamp(color.g, 0, 255),
            b: Numeric.clamp(color.b, 0, 255)
        };

        return `rgb(${color.r}, ${color.g}, ${color.b})`;
    }
}
