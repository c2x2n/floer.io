import { AssetsDrawer } from "@/assets/asset.ts";
import { RenderContainer } from "@/scripts/utils/renderContainer.ts";
// 移除不再需要的导入
// import { loadPath, PathLoader } from "@/assets/petal.ts";
// import { P2 } from "@common/utils/math.ts";

// SVG 路径数据
const ladybugHeadPathS = "m 34.922494,3.9576593 c 7.88843,0 14.283271,6.3814447 14.283271,14.2533487 0,7.871924 -6.394841,14.253408 -14.283271,14.253408 -7.888435,0 -14.283276,-6.381484 -14.283276,-14.253408 0,-7.871904 6.394841,-14.2533487 14.283276,-14.2533487 z";
const ladybugBodyPathS = "m 26.689942,3.1151231 c 1.025874,0 3.620854,0.4174594 3.620854,0.4174594 0,0 1.799643,8.3626085 5.45483,12.4634625 3.085786,3.462078 13.213924,6.256938 13.213924,6.256938 0,0 1.116466,3.261075 1.116466,4.219162 0,12.899759 -10.479254,23.357139 -23.406074,23.357139 -12.926821,0 -23.4060862,-10.45738 -23.4060862,-23.357139 0,-12.899758 10.4792652,-23.357129 23.4060862,-23.357129 z";
// 不再需要固定点的 Path2D 对象
// const ladybugDot1PathS = "...";
// const ladybugDot2PathS = "...";
// const ladybugDot3PathS = "...";

// 创建 Path2D 对象 (一次性)
const ladybugHeadPath2D = new Path2D(ladybugHeadPathS);
const ladybugBodyPath2D = new Path2D(ladybugBodyPathS);
// const ladybugDot1Path2D = new Path2D(ladybugDot1PathS);
// const ladybugDot2Path2D = new Path2D(ladybugDot2PathS);
// const ladybugDot3Path2D = new Path2D(ladybugDot3PathS);

// SVG viewBox 大约 53x53
const SVG_WIDTH = 52.91669;
const SVG_HEIGHT = 53.014581;
const SVG_CENTER_X = SVG_WIDTH / 2;
const SVG_CENTER_Y = SVG_HEIGHT / 2;


interface LadybugDotsData {
    dots: { x: number, y: number }[];
    dotRadiusSVG: number;
}


interface RockVerticesData {
    vertices: { x: number, y: number }[];
}




export const mobAssets: { [K: string]: AssetsDrawer } = {
    "rock": (containerToDraw: RenderContainer) => {
        const { ctx, radius } = containerToDraw;

        let rockData = (containerToDraw as any)._rockVerticesData as RockVerticesData | undefined;

        if (!rockData) {
            const vertices: { x: number, y: number }[] = [];
            const n = 10;

            for (let i = 0; i < n; i++) {
                const angle = i * Math.PI * 2 / n;

                const randomFactor = 0.7 + Math.random() * 0.6;
                const currentRadius = radius * randomFactor;
                const x = Math.cos(angle) * currentRadius;
                const y = Math.sin(angle) * currentRadius;
                vertices.push({ x, y });
            }
            rockData = { vertices };
            (containerToDraw as any)._rockVerticesData = rockData;
        }

        const { vertices } = rockData;

        if (vertices.length < 3) return;

        ctx.save();

        ctx.lineWidth = radius / 10;
        ctx.fillStyle = containerToDraw.getRenderColor('#777777');
        ctx.strokeStyle = containerToDraw.getRenderColor('#606060');
        ctx.lineJoin = "round";

        ctx.beginPath();
        ctx.moveTo(vertices[0].x, vertices[0].y);

        for (let i = 1; i < vertices.length; i++) {
            ctx.lineTo(vertices[i].x, vertices[i].y);
        }

        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },

    "ladybug": (containerToDraw: RenderContainer /* | RenderContainerWithDots */ ) => {
        const { ctx, radius } = containerToDraw;

        let dotsData = (containerToDraw as any)._ladybugDotsData as LadybugDotsData | undefined;

        if (!dotsData) {

            const dots: { x: number, y: number }[] = [];
            const numDots = Math.floor(Math.random() * 4) + 2;
            const dotRadiusSVG = SVG_WIDTH * 0.06;

            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = SVG_WIDTH;
            tempCanvas.height = SVG_HEIGHT;
            const tempCtx = tempCanvas.getContext('2d');

            if (!tempCtx) {
                console.error("Failed to create temporary canvas context for dot check.");
                dotsData = { dots: [], dotRadiusSVG };
                (containerToDraw as any)._ladybugDotsData = dotsData;
            } else {

                let attempts = 0;
                const maxAttempts = numDots * 150;

                while (dots.length < numDots && attempts < maxAttempts) {
                    attempts++;

                    const svgX = Math.random() * SVG_WIDTH;
                    const svgY = Math.random() * SVG_HEIGHT;

                    const isInBody = tempCtx.isPointInPath(ladybugBodyPath2D, svgX, svgY);
                    const isInHead = tempCtx.isPointInPath(ladybugHeadPath2D, svgX, svgY);

                    if (isInBody && !isInHead) {
                        dots.push({ x: svgX, y: svgY });
                    }
                }

                if (attempts >= maxAttempts && dots.length < numDots) {
                    console.warn(`Ladybug dot generation reached max attempts (${maxAttempts}). Generated only ${dots.length}/${numDots} dots.`);
                }

                dotsData = { dots, dotRadiusSVG };
                (containerToDraw as any)._ladybugDotsData = dotsData;
            }
        }

        if (!dotsData) return;

        ctx.save();

        const scaleFactor = (radius * 2) / SVG_WIDTH;
        ctx.rotate(Math.PI / 4);
        ctx.scale(scaleFactor, scaleFactor);
        ctx.translate(-SVG_CENTER_X, -SVG_CENTER_Y);

        ctx.fillStyle = containerToDraw.getRenderColor("#000000");
        ctx.fill(ladybugHeadPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#eb4134");
        ctx.fill(ladybugBodyPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#000000");
        const { dots, dotRadiusSVG } = dotsData;
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.ellipse(dot.x, dot.y, dotRadiusSVG, dotRadiusSVG, 0, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.strokeStyle = containerToDraw.getRenderColor("#c3312b");
        ctx.lineWidth = 6.2;
        ctx.stroke(ladybugBodyPath2D);

        ctx.restore();
    },

    "bee": (containerToDraw: RenderContainer) => {
        const { ctx, radius } = containerToDraw;
        ctx.save();
        const beeStingerPathS = "m 382.44651,212.85589 c 0,0 1.04823,6.95319 2.30185,13.86555 1.29502,7.1406 2.75889,14.28795 0.30896,16.88564 -3.16731,3.35834 -9.80416,2.24154 -16.70766,1.09312 -8.47276,-1.40947 -17.09405,-3.37287 -17.09405,-3.37287 z";
        const beeBodyPathS = "m 287.06523,212.03153 c -28.07432,-28.85275 -33.33488,-64.55202 -16.20356,-81.22115 17.13132,-16.66912 53.17598,-12.50894 81.25029,16.34381 28.07432,28.85275 34.53838,65.75551 17.40706,82.42464 -17.13132,16.66913 -54.37948,11.30545 -82.45379,-17.5473 z";
        const beeAntenna1PathS = "m 218.21428,138.8514 c 0,-6.39747 5.18617,-11.58364 11.58364,-11.58364 4.22842,0 7.92768,2.26563 9.95006,5.64916 0.5527,0.92469 10.9013,-1.70873 19.37829,2.31087 5.33115,2.52792 12.43508,6.81659 14.52882,10.36386 0.82598,1.3994 0.48631,3.1732 -0.92323,4.29858 -1.40954,1.12539 -2.92559,0.6409 -4.55089,-0.43937 -3.01881,-2.00649 -6.75305,-6.47451 -12.02522,-8.29537 -7.30859,-2.52418 -14.78724,-1.73949 -14.79323,-1.63446 -0.34688,6.08584 -5.39191,10.91399 -11.5646,10.91399 -6.39747,0 -11.58364,-5.18617 -11.58364,-11.58363 z";
        const beeAntenna2PathS = "m 290.1786,89.49039 c 0.22397,6.16863 -4.41795,11.38551 -10.48719,11.95299 -0.10475,0.01 -0.61757,7.51199 2.17014,14.72418 2.01096,5.20264 6.61154,8.77229 8.72624,11.71632 1.13853,1.58503 1.67771,3.08251 0.6042,4.53195 -1.07351,1.44945 -2.8338,1.85325 -4.26226,1.07859 -3.6209,-1.96365 -8.16451,-8.90729 -10.8842,-14.14321 -4.32453,-8.32556 -2.06834,-18.7629 -3.01247,-19.28168 -3.45469,-1.89827 -5.85304,-5.51289 -6.00647,-9.73853 -0.23213,-6.39325 4.76245,-11.76419 11.15571,-11.99631 6.39325,-0.23213 11.76418,4.76246 11.99631,11.15571 z";
        const beeStripe1PathS = "m 276.98608,189.67929 c 0,0 -4.40295,-7.74385 -6.03118,-11.95009 -1.29462,-3.34443 -3.39005,-11.44032 -3.39005,-11.44032 l 38.95204,-38.64041 c 0,0 9.36763,1.69954 13.21268,3.40845 3.64416,1.61963 9.89691,5.59155 9.89691,5.59155 z";
        const beeStripe2PathS = "m 309.48608,222.4601 c 0,0 -6.30044,-3.93778 -8.71791,-5.82199 -3.08487,-2.40439 -9.14168,-8.34924 -9.14168,-8.34924 l 56.75,-56.75 c 0,0 6.02664,5.45594 8.56315,8.64845 2.26632,2.85244 5.93685,9.60155 5.93685,9.60155 z";
        const beeStripe3PathS = "m 333.62649,232.2101 l 38.46918,-38.67122 c 0,0 5.25681,21.24276 -7.51918,33 -12.54041,9.78876 -30.95,5.67122 -30.95,5.67122 z";
        
        const beeStingerPath2D = new Path2D(beeStingerPathS);
        const beeBodyPath2D = new Path2D(beeBodyPathS);
        const beeAntenna1Path2D = new Path2D(beeAntenna1PathS);
        const beeAntenna2Path2D = new Path2D(beeAntenna2PathS);
        const beeStripe1Path2D = new Path2D(beeStripe1PathS);
        const beeStripe2Path2D = new Path2D(beeStripe2PathS);
        const beeStripe3Path2D = new Path2D(beeStripe3PathS);
        
        const BEE_EFFECTIVE_WIDTH = 385 - 218;
        const BEE_EFFECTIVE_HEIGHT = 246 - 89;
        const BEE_EFFECTIVE_CENTER_X = (218 + 385) / 2;
        const BEE_EFFECTIVE_CENTER_Y = (89 + 246) / 2;
        
        const scaleFactor = 1.2 * (radius * 2) / BEE_EFFECTIVE_WIDTH;
        ctx.translate(0, 0);
        ctx.rotate(3 * Math.PI / 4);
        ctx.scale(scaleFactor, scaleFactor);
        ctx.translate(-BEE_EFFECTIVE_CENTER_X, -BEE_EFFECTIVE_CENTER_Y);

        
        ctx.fillStyle = containerToDraw.getRenderColor("#ffe763");
        ctx.fill(beeBodyPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#333333");
        ctx.fill(beeStripe1Path2D);
        ctx.fill(beeStripe2Path2D);
        ctx.fill(beeStripe3Path2D);
        ctx.fill(beeStingerPath2D);
        ctx.fill(beeAntenna1Path2D);
        ctx.fill(beeAntenna2Path2D);

        ctx.strokeStyle = containerToDraw.getRenderColor("#d3bd46");
        ctx.lineWidth = 11.5;
        ctx.stroke(beeBodyPath2D);

        ctx.restore();
    },

    "default": (containerToDraw) => {
        mobAssets["rock"](containerToDraw);
    },
}
