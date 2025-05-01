import { AssetsDrawer } from "@/assets/asset.ts";

export const mobAssets: { [K: string]: AssetsDrawer } = {
    "rock": (containerToDraw) => {
        const { ctx, radius } = containerToDraw;

        const lines: { x: number, y: number }[] = [];
        for (let i = 0; i < 10; i++) {
            const angle = i * Math.PI * 2 / 10;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            lines.push({ x, y });
        }

        ctx.lineWidth = radius / 10;

        ctx.fillStyle = containerToDraw.getRenderColor('#777777');
        ctx.strokeStyle = containerToDraw.getRenderColor('#606060');

        ctx.beginPath();

        ctx.moveTo(lines[0].x, lines[0].y);

        for (let i = 0; i < lines.length; i++) {
            ctx.lineTo(lines[i].x, lines[i].y);
        }

        ctx.lineTo(lines[0].x, lines[0].y);
        ctx.fill();
        ctx.stroke();
    },

    "default": (containerToDraw) => {
        mobAssets["rock"](containerToDraw);
    },
}
