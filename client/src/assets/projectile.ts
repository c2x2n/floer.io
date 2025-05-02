import { AssetsDrawer } from "@/assets/asset.ts";
import { P2 } from "@common/utils/math.ts";

const web = new Image();
web.src = "img/game/projectile/web.svg";

export const projectileAssets: { [K: string]: AssetsDrawer } = {
    "missile": (containerToDraw) => {
        const { ctx, radius } = containerToDraw;

        ctx.save();
        ctx.beginPath();

        ctx.fillStyle = containerToDraw.getRenderColor("#333333");
        ctx.strokeStyle = containerToDraw.getRenderColor("#333333");
        ctx.lineWidth = 6;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.moveTo(radius, 0);
        ctx.lineTo(-radius, radius * .6);
        ctx.lineTo(-radius, -radius * .6);
        ctx.lineTo(radius, 0);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },
    "dandelion": (containerToDraw) => {
        const { ctx, radius } = containerToDraw;
        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#333333");

        ctx.roundRect(
            -radius * 0.5,
            -radius * 0.3,
            radius,
            radius * 0.6,
            1.5
        )
        ctx.fill()

        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#ffffff");
        ctx.strokeStyle = containerToDraw.getRenderColor("#cfcfcf");
        ctx.lineWidth = 2;
        ctx.arc(
            radius * 0.65,
            0,
            radius * 0.6,
            0, P2
        )
        ctx.fill()
        ctx.stroke()
    },
    "peas": (containerToDraw) => {
        const { ctx, radius } = containerToDraw;

        ctx.fillStyle = containerToDraw.getRenderColor("#8ac255");
        ctx.strokeStyle = containerToDraw.getRenderColor("#74a348");
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, P2);

        ctx.fill();
        ctx.stroke();
    },
    "poison_peas": (containerToDraw) => {
        const { ctx, radius } = containerToDraw;

        ctx.fillStyle = containerToDraw.getRenderColor("#ce74d8");
        ctx.strokeStyle = containerToDraw.getRenderColor("#a760b0");
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, P2);

        ctx.fill();
        ctx.stroke();
    },
    "web": (containerToDraw) => {
        if (!web.complete) return;

        const { ctx, radius } = containerToDraw;

        const Xy = radius;

        ctx.drawImage(
            web,
            -Xy,
            -Xy,
            Xy * 2,
            Xy * 2
        );
    },
    "default": (containerToDraw) => {
        projectileAssets["missile"](containerToDraw);
    },
}
