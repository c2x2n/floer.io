import { AssetsDrawer } from "@/assets/asset.ts";
import { MathNumeric, P2 } from "@common/utils/math.ts";

const web = new Image();
web.src = "img/game/projectile/web.svg";

export const projectileAssets: { [K: string]: AssetsDrawer } = {
    "missile": (containerToDraw) => {
        const { ctx, radius } = containerToDraw;

        ctx.save();
        ctx.beginPath();

        ctx.fillStyle = containerToDraw.getRenderColor("#333333");
        ctx.strokeStyle = containerToDraw.getRenderColor("#333333");
        ctx.lineWidth = radius * 0.3;

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
            -radius,
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
            radius * 0.3,
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
    "red_peas": (containerToDraw) => {
        const { ctx, radius } = containerToDraw;


        const time = (Date.now() - containerToDraw.createdTime) / 1000;

        if (containerToDraw.dotsData && containerToDraw.dotsData.length >= 4) {
            ctx.lineWidth = time * 4;

            const one = containerToDraw.dotsData[0];
            const two = containerToDraw.dotsData[1];
            const three = containerToDraw.dotsData[2];
            const four = containerToDraw.dotsData[3];

            const oldBrightness = containerToDraw.brightness;

            containerToDraw.brightness = MathNumeric.remap(time, 1, 2, 1, 10);

            ctx.strokeStyle = containerToDraw.getRenderColor("#6e2a25");

            ctx.globalAlpha = containerToDraw.getAlpha(
                MathNumeric.remap(time, 0, 2, 0.5, 1)
            );
            ctx.beginPath();
            ctx.moveTo(one.x, one.y);
            ctx.lineTo(three.x, three.y);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(two.x, two.y);
            ctx.lineTo(four.x, four.y);
            ctx.stroke();

            ctx.globalAlpha = containerToDraw.getAlpha(1);

            containerToDraw.brightness = oldBrightness;
        }

        ctx.lineWidth = 2.5;

        ctx.save();

        ctx.fillStyle = containerToDraw.getRenderColor("#9c1c1e");
        ctx.strokeStyle = containerToDraw.getRenderColor("#6e2a25");

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();

            ctx.arc(radius * 0.57, 0, radius / 4 + time * radius / 4, 0, P2);

            ctx.rotate(P2 / 4)

            ctx.fill();
            ctx.stroke();
        }



        ctx.restore();
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
