import { P2 } from "../../../common/src/engine/maths/constants";

export function drawPolygon(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, sides: number) {
    const angle = P2 / sides;
    ctx.beginPath();
    ctx.moveTo(radius, 0);
    for (let i = 0; i < sides; i++) {
        ctx.lineTo(radius, 0);
        ctx.rotate(angle);
    }
    ctx.closePath();
}
