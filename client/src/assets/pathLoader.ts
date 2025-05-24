import { RenderContainer } from "../scripts/render/misc";

export interface PathLoaderArguments {
    containerToDraw: RenderContainer
    pathS: string
    scale?: number
    fill?: string
    stroke?: {
        width: number
        color: string
    }
    closed?: boolean
}

export function loadPathFromSVG(
    loader: PathLoaderArguments
) {
    const { containerToDraw, pathS } = loader;
    let { radius } = containerToDraw;
    const { ctx } = containerToDraw;
    const path = new Path2D(pathS);
    if (loader.closed) path.closePath();
    radius *= loader.scale ?? 1;

    if (loader.fill) ctx.fillStyle = containerToDraw.getRenderColor(loader.fill);
    if (loader.stroke) {
        ctx.strokeStyle = containerToDraw.getRenderColor(loader.stroke.color);
        ctx.lineWidth = loader.stroke.width;
    }
    ctx.beginPath();
    const offset = radius;
    const scale = radius / 100;
    ctx.translate(-offset, -offset);
    ctx.scale(scale, scale);

    if (loader.fill) ctx.fill(path);
    if (loader.stroke) ctx.stroke(path);

    ctx.scale(1 / scale, 1 / scale);
    ctx.translate(offset, offset);
}
