import { AssetsBunch } from "./assets";
import { P2 } from "../../../common/src/maths/constants";
import { Numeric } from "../../../common/src/maths/numeric";

const web = new Image();
web.src = "img/game/web.svg";

export const projectileAssets: AssetsBunch = {
    missile: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();
        ctx.beginPath();

        ctx.fillStyle = containerToDraw.getRenderColor("#333333");
        ctx.strokeStyle = containerToDraw.getRenderColor("#333333");
        ctx.lineWidth = radius * 0.3;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.moveTo(radius, 0);
        ctx.lineTo(-radius, radius * 0.6);
        ctx.lineTo(-radius, -radius * 0.6);
        ctx.lineTo(radius, 0);
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },
    pollen: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.beginPath();

        ctx.fillStyle = containerToDraw.getRenderColor("#ffe763");
        ctx.lineWidth = containerToDraw.radius ** 0.5;
        ctx.strokeStyle = containerToDraw.getRenderColor("#cfbb50");

        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
    },
    dandelion: containerToDraw => {
        const { ctx, radius } = containerToDraw;
        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#333333");

        ctx.roundRect(
            -radius,
            -radius * 0.3,
            radius,
            radius * 0.6,
            1.5
        );
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#ffffff");
        ctx.strokeStyle = containerToDraw.getRenderColor("#cfcfcf");
        ctx.lineWidth = 2;
        ctx.arc(
            radius * 0.3,
            0,
            radius * 0.6,
            0, P2
        );
        ctx.fill();
        ctx.stroke();
    },
    peas: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.fillStyle = containerToDraw.getRenderColor("#8ac255");
        ctx.strokeStyle = containerToDraw.getRenderColor("#74a348");
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, P2);

        ctx.fill();
        ctx.stroke();
    },
    red_peas: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        const time = (Date.now() - containerToDraw.createdTime) / 1000;

        if (containerToDraw.dotsData && containerToDraw.dotsData.length >= 4) {
            ctx.lineWidth = time * 4;

            const one = containerToDraw.dotsData[0];
            const two = containerToDraw.dotsData[1];
            const three = containerToDraw.dotsData[2];
            const four = containerToDraw.dotsData[3];

            const oldBrightness = containerToDraw.brightness;

            containerToDraw.brightness = Numeric.remap(time, 1, 2, 1, 10);

            ctx.strokeStyle = containerToDraw.getRenderColor("#6e2a25");

            ctx.globalAlpha = containerToDraw.getAlpha(
                Numeric.remap(time, 0, 2, 0.5, 1)
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

            ctx.rotate(P2 / 4);

            ctx.fill();
            ctx.stroke();
        }

        ctx.restore();
    },
    poison_peas: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.fillStyle = containerToDraw.getRenderColor("#ce74d8");
        ctx.strokeStyle = containerToDraw.getRenderColor("#a760b0");
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, P2);

        ctx.fill();
        ctx.stroke();
    },
    web: containerToDraw => {
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
    default: containerToDraw => {
        projectileAssets.missile(containerToDraw);
    },
    myt_big_missile: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        const time = (Date.now() - containerToDraw.createdTime) / 1000;

        const fireWave = 0.8 + Math.sin(time * 10) * 0.2;

        const fireAngle = Math.sin(time * 5) * 0.1;

        // 根据导弹的旋转角度确定方向
        // 使用容器的rotation属性
        const rotationAngle = containerToDraw.rotation;

        // 保存当前上下文状态
        ctx.save();

        ctx.beginPath();

        ctx.fillStyle = containerToDraw.getRenderColor("#333333");
        ctx.strokeStyle = containerToDraw.getRenderColor("#222222");
        ctx.lineWidth = radius * 0.1;

        ctx.beginPath();
        ctx.roundRect(-radius * 0.2, -radius * 0.5, radius * 1.5, radius, radius * 0.3);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#555555");
        ctx.roundRect(-radius * 0.7, -radius * 0.4, radius * 0.5, radius * 0.8, radius * 0.2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#444444");
        ctx.moveTo(radius * 1.3, 0);
        ctx.lineTo(radius * 0.8, -radius * 0.4);
        ctx.lineTo(radius * 0.8, radius * 0.4);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#FF3333");
        ctx.arc(radius * 0.4, 0, radius * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.save();

        ctx.rotate(fireAngle);

        ctx.beginPath();
        const outerFireColor = Math.sin(time * 3) > 0 ? "#FF6600" : "#FF4500";
        ctx.fillStyle = containerToDraw.getRenderColor(outerFireColor);

        const flameLength = radius * (1.5 * fireWave);
        ctx.moveTo(-radius * 0.7, -radius * 0.3);
        ctx.lineTo(-radius * 0.7 - flameLength, 0);
        ctx.lineTo(-radius * 0.7, radius * 0.3);
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();

        const innerFireColor = Math.sin(time * 8) > 0 ? "#FFCC00" : "#FFDD33";
        ctx.fillStyle = containerToDraw.getRenderColor(innerFireColor);

        const innerFlameLength = radius * (1.2 * fireWave);
        ctx.moveTo(-radius * 0.7, -radius * 0.15);
        ctx.lineTo(-radius * 0.7 - innerFlameLength, 0);
        ctx.lineTo(-radius * 0.7, radius * 0.15);
        ctx.closePath();
        ctx.fill();

        const particleCount = 3 + Math.floor(Math.random() * 3);
        ctx.fillStyle = containerToDraw.getRenderColor("#FFFF66");

        for (let i = 0; i < particleCount; i++) {
            const particleSize = radius * 0.08 * Math.random();
            const particleX = -radius * 0.7 - radius * (0.5 + Math.random() * 0.6 * fireWave);
            const particleY = (Math.random() - 0.5) * radius * 0.4;

            ctx.beginPath();
            ctx.arc(particleX, particleY, particleSize, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        ctx.restore();
    }
};
