import { AssetsBunch } from "./assets";
import { Dot, RenderContainer } from "../scripts/render/misc";
import { Random } from "../../../common/src/engine/maths/random";
import { halfPI, P2, PI } from "../../../common/src/engine/maths/constants";
import { loadPathFromSVG } from "./pathLoader";
import { Geometry } from "../../../common/src/engine/maths/geometry";
import { Numeric } from "../../../common/src/engine/maths/numeric";

const ladybugHeadPathS = "m 34.922494,3.9576593 c 7.88843,0 14.283271,6.3814447 14.283271,14.2533487 0,7.871924 -6.394841,14.253408 -14.283271,14.253408 -7.888435,0 -14.283276,-6.381484 -14.283276,-14.253408 0,-7.871904 6.394841,-14.2533487 14.283276,-14.2533487 z";
const ladybugBodyPathS = "m 26.689942,3.1151231 c 1.025874,0 3.620854,0.4174594 3.620854,0.4174594 0,0 1.799643,8.3626085 5.45483,12.4634625 3.085786,3.462078 13.213924,6.256938 13.213924,6.256938 0,0 1.116466,3.261075 1.116466,4.219162 0,12.899759 -10.479254,23.357139 -23.406074,23.357139 -12.926821,0 -23.4060862,-10.45738 -23.4060862,-23.357139 0,-12.899758 10.4792652,-23.357129 23.4060862,-23.357129 z";

const ladybugHeadPath2D = new Path2D(ladybugHeadPathS);
const ladybugBodyPath2D = new Path2D(ladybugBodyPathS);

const SVG_WIDTH = 52.91669;
const SVG_HEIGHT = 53.014581;
const SVG_CENTER_X = SVG_WIDTH / 2;
const SVG_CENTER_Y = SVG_HEIGHT / 2;

const antMouth = "M 24.145651,31.5464 C 74.799999,17.975588 125.36958,22.806032 175.85439,46.037719";

const spiderLeg1 = "m 99.950255,117.36744 c 47.815485,17.97492 78.557055,37.67751 92.224685,59.10776 M 99.950255,117.36744 C 59.693398,93.371009 33.478978,67.953665 21.306993,41.115408";
const spiderLeg2 = "m 99.950255,117.36744 c 31.092575,29.06285 51.735135,59.18223 61.927685,90.35813 M 99.950255,117.36744 C 79.262333,84.399205 65.014339,50.779333 57.206274,16.507825";
const spiderLeg3 = "M 99.950255,117.36744 C 86.286006,153.81167 79.061687,189.60426 78.277298,224.74522 M 99.950255,117.36744 C 102.09667,80.633021 102.06589,44.118908 99.857943,7.8250999";
const spiderLeg4 = "M 99.950255,117.36744 C 49.81462,139.0878 19.106235,158.84237 7.8250999,176.63115 M 99.950255,117.36744 C 143.1957,90.178277 169.36722,64.716788 178.46482,40.982971";

export const mobAssets: AssetsBunch = {
    rock: (containerToDraw: RenderContainer) => {
        const { ctx, radius } = containerToDraw;

        let rockData = containerToDraw.dotsData;

        if (!rockData) {
            const vertices: Array<{ x: number, y: number }> = [];
            const n = 10;

            for (let i = 0; i < n; i++) {
                const angle = i * Math.PI * 2 / n;

                const randomFactor = 0.7 + Math.random() * 0.6;
                const currentRadius = radius * randomFactor;
                const x = Math.cos(angle) * currentRadius;
                const y = Math.sin(angle) * currentRadius;
                vertices.push({ x, y });
            }
            rockData = vertices;
            containerToDraw.dotsData = rockData;
        }

        const vertices = rockData;

        if (vertices.length < 3) return;

        ctx.save();

        ctx.lineWidth = radius / 10;
        ctx.fillStyle = containerToDraw.getRenderColor("#777777");
        ctx.strokeStyle = containerToDraw.getRenderColor("#606060");
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

    ladybug: (containerToDraw: RenderContainer /* | RenderContainerWithDots */) => {
        const { ctx, radius } = containerToDraw;

        let dotsData = containerToDraw.dotsData;

        if (!dotsData) {
            const dots: Dot[] = [];
            const numDots
                = Math.floor(
                    Math.random() * Math.log(containerToDraw.radius * 0.5) + Math.random() * 2) + 2;

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = SVG_WIDTH;
            tempCanvas.height = SVG_HEIGHT;
            const tempCtx = tempCanvas.getContext("2d");

            if (!tempCtx) {
                console.error("Failed to create temporary canvas context for dot check.");
            } else {
                let attempts = 0;
                const maxAttempts = numDots * 150;

                while (dots.length < numDots && attempts < maxAttempts) {
                    attempts++;

                    const size
                        = Random.float(
                            Math.max(Math.log(containerToDraw.radius * 0.7)
                                , 5)
                            , Math.log(containerToDraw.radius) * 2
                        );

                    const svgX
                        = Random.float(-SVG_WIDTH, SVG_WIDTH);
                    const svgY
                        = Random.float(-SVG_HEIGHT, SVG_HEIGHT);

                    const isInBody
                        = tempCtx.isPointInPath(ladybugBodyPath2D, svgX, svgY);

                    if (isInBody) {
                        dots.push({ x: svgX, y: svgY, size });
                    }
                }

                if (attempts >= maxAttempts && dots.length < numDots) {
                    console.warn(`Ladybug dot generation reached max attempts (${maxAttempts}). Generated only ${dots.length}/${numDots} dots.`);
                }

                dotsData = dots;
                containerToDraw.dotsData = dotsData;
            }
        }

        if (!dotsData) return;

        ctx.save();

        const scaleFactor = (radius * 2) / SVG_WIDTH;
        ctx.rotate(Math.PI / 4);

        ctx.scale(scaleFactor, scaleFactor);

        ctx.translate(-SVG_CENTER_X, -SVG_CENTER_Y);

        ctx.save();

        ctx.fillStyle = containerToDraw.getRenderColor("#000000");
        ctx.fill(ladybugHeadPath2D);

        ctx.clip(ladybugBodyPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#eb4134");
        ctx.fill(ladybugBodyPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#000000");
        const dots = dotsData;
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.ellipse(dot.x, dot.y, dot.size ?? 2, dot.size ?? 2, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();

        ctx.strokeStyle = containerToDraw.getRenderColor("#c3312b");
        ctx.lineWidth = 6.2;
        ctx.stroke(ladybugBodyPath2D);

        ctx.restore();
    },

    dark_ladybug: (containerToDraw: RenderContainer /* | RenderContainerWithDots */) => {
        const { ctx, radius } = containerToDraw;

        let dotsData = containerToDraw.dotsData;

        if (!dotsData) {
            const dots: Dot[] = [];
            const numDots
                = Math.floor(
                    Math.random() * Math.log(containerToDraw.radius * 0.5) + Math.random() * 2) + 2;

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = SVG_WIDTH;
            tempCanvas.height = SVG_HEIGHT;
            const tempCtx = tempCanvas.getContext("2d");

            if (!tempCtx) {
                console.error("Failed to create temporary canvas context for dot check.");
            } else {
                let attempts = 0;
                const maxAttempts = numDots * 150;

                while (dots.length < numDots && attempts < maxAttempts) {
                    attempts++;

                    const size
                        = Random.float(
                            Math.max(Math.log(containerToDraw.radius * 0.7)
                                , 5)
                            , Math.log(containerToDraw.radius) * 2
                        );

                    const svgX
                        = Random.float(-SVG_WIDTH, SVG_WIDTH);
                    const svgY
                        = Random.float(-SVG_HEIGHT, SVG_HEIGHT);

                    const isInBody
                        = tempCtx.isPointInPath(ladybugBodyPath2D, svgX, svgY);

                    if (isInBody) {
                        dots.push({ x: svgX, y: svgY, size });
                    }
                }

                if (attempts >= maxAttempts && dots.length < numDots) {
                    console.warn(`Ladybug dot generation reached max attempts (${maxAttempts}). Generated only ${dots.length}/${numDots} dots.`);
                }

                dotsData = dots;
                containerToDraw.dotsData = dotsData;
            }
        }

        if (!dotsData) return;

        ctx.save();

        const scaleFactor = (radius * 2) / SVG_WIDTH;
        ctx.rotate(Math.PI / 4);

        ctx.scale(scaleFactor, scaleFactor);

        ctx.translate(-SVG_CENTER_X, -SVG_CENTER_Y);

        ctx.save();

        ctx.fillStyle = containerToDraw.getRenderColor("#000000");
        ctx.fill(ladybugHeadPath2D);

        ctx.clip(ladybugBodyPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#962922");
        ctx.fill(ladybugBodyPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#be342a");
        const dots = dotsData;
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.ellipse(dot.x, dot.y, dot.size ?? 2, dot.size ?? 2, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();

        ctx.strokeStyle = containerToDraw.getRenderColor("#7a2218");
        ctx.lineWidth = 6.2;
        ctx.stroke(ladybugBodyPath2D);

        ctx.restore();
    },

    shiny_ladybug: (containerToDraw: RenderContainer /* | RenderContainerWithDots */) => {
        const { ctx, radius } = containerToDraw;

        let dotsData = containerToDraw.dotsData;

        if (!dotsData) {
            const dots: Dot[] = [];
            const numDots
                = Math.floor(
                    Math.random() * Math.log(containerToDraw.radius * 0.5) + Math.random() * 2) + 2;

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = SVG_WIDTH;
            tempCanvas.height = SVG_HEIGHT;
            const tempCtx = tempCanvas.getContext("2d");

            if (!tempCtx) {
                console.error("Failed to create temporary canvas context for dot check.");
            } else {
                let attempts = 0;
                const maxAttempts = numDots * 150;

                while (dots.length < numDots && attempts < maxAttempts) {
                    attempts++;

                    const size
                        = Random.float(
                            Math.max(Math.log(containerToDraw.radius * 0.7)
                                , 5)
                            , Math.log(containerToDraw.radius) * 2
                        );

                    const svgX
                        = Random.float(-SVG_WIDTH, SVG_WIDTH);
                    const svgY
                        = Random.float(-SVG_HEIGHT, SVG_HEIGHT);

                    const isInBody
                        = tempCtx.isPointInPath(ladybugBodyPath2D, svgX, svgY);

                    if (isInBody) {
                        dots.push({ x: svgX, y: svgY, size });
                    }
                }

                if (attempts >= maxAttempts && dots.length < numDots) {
                    console.warn(`Ladybug dot generation reached max attempts (${maxAttempts}). Generated only ${dots.length}/${numDots} dots.`);
                }

                dotsData = dots;
                containerToDraw.dotsData = dotsData;
            }
        }

        if (!dotsData) return;

        ctx.save();

        const scaleFactor = (radius * 2) / SVG_WIDTH;
        ctx.rotate(Math.PI / 4);

        ctx.scale(scaleFactor, scaleFactor);

        ctx.translate(-SVG_CENTER_X, -SVG_CENTER_Y);

        ctx.save();

        ctx.fillStyle = containerToDraw.getRenderColor("#000000");
        ctx.fill(ladybugHeadPath2D);

        ctx.clip(ladybugBodyPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#ebeb35");
        ctx.fill(ladybugBodyPath2D);

        ctx.fillStyle = containerToDraw.getRenderColor("#000000");
        const dots = dotsData;
        dots.forEach(dot => {
            ctx.beginPath();
            ctx.ellipse(dot.x, dot.y, dot.size ?? 2, dot.size ?? 2, 0, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.restore();

        ctx.strokeStyle = containerToDraw.getRenderColor("#bcbe2d");
        ctx.lineWidth = 6.2;
        ctx.stroke(ladybugBodyPath2D);

        ctx.restore();
    },

    bee: (containerToDraw: RenderContainer) => {
        const { ctx, radius } = containerToDraw;
        ctx.save();
        const beeStingerPathS = "m 382.44651,212.85589 c 0,0 1.04823,6.95319 2.30185,13.86555 1.29502,7.1406 2.75889,14.28795 0.30896,16.88564 -3.16731,3.35834 -9.80416,2.24154 -16.70766,1.09312 -8.47276,-1.40947 -17.09405,-3.37287 -17.09405,-3.37287 z";
        const beeBodyPathS = "m 287.06523,212.03153 c -28.07432,-28.85275 -33.33488,-64.55202 -16.20356,-81.22115 17.13132,-16.66912 53.17598,-12.50894 81.25029,16.34381 28.07432,28.85275 34.53838,65.75551 17.40706,82.42464 -17.13132,16.66913 -54.37948,11.30545 -82.45379,-17.5473 z";
        const beeStripe1PathS = "m 276.98608,189.67929 c 0,0 -4.40295,-7.74385 -6.03118,-11.95009 -1.29462,-3.34443 -3.39005,-11.44032 -3.39005,-11.44032 l 38.95204,-38.64041 c 0,0 9.36763,1.69954 13.21268,3.40845 3.64416,1.61963 9.89691,5.59155 9.89691,5.59155 z";
        const beeStripe2PathS = "m 309.48608,222.4601 c 0,0 -6.30044,-3.93778 -8.71791,-5.82199 -3.08487,-2.40439 -9.14168,-8.34924 -9.14168,-8.34924 l 56.75,-56.75 c 0,0 6.02664,5.45594 8.56315,8.64845 2.26632,2.85244 5.93685,9.60155 5.93685,9.60155 z";
        const beeStripe3PathS = "m 333.62649,232.2101 l 38.46918,-38.67122 c 0,0 5.25681,21.24276 -7.51918,33 -12.54041,9.78876 -30.95,5.67122 -30.95,5.67122 z";

        const beeStingerPath2D = new Path2D(beeStingerPathS);
        const beeBodyPath2D = new Path2D(beeBodyPathS);
        const beeStripe1Path2D = new Path2D(beeStripe1PathS);
        const beeStripe2Path2D = new Path2D(beeStripe2PathS);
        const beeStripe3Path2D = new Path2D(beeStripe3PathS);

        const BEE_EFFECTIVE_WIDTH = 385 - 218;
        const BEE_EFFECTIVE_HEIGHT = 246 - 89;
        const BEE_EFFECTIVE_CENTER_X = (218 + 385) / 2;
        const BEE_EFFECTIVE_CENTER_Y = (89 + 246) / 2;

        const scaleFactor = 1.2 * (radius * 2) / BEE_EFFECTIVE_WIDTH;
        ctx.translate(radius * 0.2, 0);
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

        ctx.strokeStyle = containerToDraw.getRenderColor("#d3bd46");
        ctx.lineWidth = 11.5;
        ctx.stroke(beeBodyPath2D);

        const beeAntenna1PathS = "m 218.21428,138.8514 c 0,-6.39747 5.18617,-11.58364 11.58364,-11.58364 4.22842,0 7.92768,2.26563 9.95006,5.64916 0.5527,0.92469 10.9013,-1.70873 19.37829,2.31087 5.33115,2.52792 12.43508,6.81659 14.52882,10.36386 0.82598,1.3994 0.48631,3.1732 -0.92323,4.29858 -1.40954,1.12539 -2.92559,0.6409 -4.55089,-0.43937 -3.01881,-2.00649 -6.75305,-6.47451 -12.02522,-8.29537 -7.30859,-2.52418 -14.78724,-1.73949 -14.79323,-1.63446 -0.34688,6.08584 -5.39191,10.91399 -11.5646,10.91399 -6.39747,0 -11.58364,-5.18617 -11.58364,-11.58363 z";
        const beeAntenna2PathS = "m 290.1786,89.49039 c 0.22397,6.16863 -4.41795,11.38551 -10.48719,11.95299 -0.10475,0.01 -0.61757,7.51199 2.17014,14.72418 2.01096,5.20264 6.61154,8.77229 8.72624,11.71632 1.13853,1.58503 1.67771,3.08251 0.6042,4.53195 -1.07351,1.44945 -2.8338,1.85325 -4.26226,1.07859 -3.6209,-1.96365 -8.16451,-8.90729 -10.8842,-14.14321 -4.32453,-8.32556 -2.06834,-18.7629 -3.01247,-19.28168 -3.45469,-1.89827 -5.85304,-5.51289 -6.00647,-9.73853 -0.23213,-6.39325 4.76245,-11.76419 11.15571,-11.99631 6.39325,-0.23213 11.76418,4.76246 11.99631,11.15571 z";

        const beeAntenna1Path2D = new Path2D(beeAntenna1PathS);
        const beeAntenna2Path2D = new Path2D(beeAntenna2PathS);

        ctx.fillStyle = containerToDraw.getRenderColor("#333333");
        ctx.fill(beeAntenna1Path2D);
        ctx.fill(beeAntenna2Path2D);

        ctx.restore();
    },

    centipede: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, -radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#8ac255");
        ctx.strokeStyle = containerToDraw.getRenderColor("#709d45");
        ctx.lineWidth = radius / 5;

        ctx.beginPath();
        ctx.arc(
            0, 0, radius
            , 0, P2
        );

        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#333333";
        ctx.fillStyle = "#333333";
        ctx.lineWidth /= 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(radius * 0.55, radius * 0.25);
        ctx.arcTo(radius * 1.1, radius * 0.25, radius * 1.7, radius * 1.2, radius);

        ctx.stroke();

        ctx.beginPath();
        ctx.arc(radius * 1.4, radius * 0.78, radius * 0.15, 0, P2);

        ctx.fill();

        ctx.scale(1, -1);

        ctx.beginPath();
        ctx.moveTo(radius * 0.55, radius * 0.25);
        ctx.arcTo(radius * 1.1, radius * 0.25, radius * 1.7, radius * 1.2, radius);

        ctx.stroke();

        ctx.beginPath();
        ctx.arc(radius * 1.4, radius * 0.78, radius * 0.15, 0, P2);

        ctx.fill();

        ctx.restore();
    },

    centipede_body: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, -radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#8ac255");
        ctx.strokeStyle = containerToDraw.getRenderColor("#709d45");
        ctx.lineWidth = radius / 5;

        ctx.beginPath();
        ctx.arc(
            0, 0, radius
            , 0, P2
        );

        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },

    desert_centipede: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, -radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#d3c66d");
        ctx.strokeStyle = containerToDraw.getRenderColor("#aca05b");
        ctx.lineWidth = radius / 5;

        ctx.beginPath();
        ctx.arc(
            0, 0, radius
            , 0, P2
        );

        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#333333";
        ctx.fillStyle = "#333333";
        ctx.lineWidth /= 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(radius * 0.55, radius * 0.25);
        ctx.arcTo(radius * 1.1, radius * 0.25, radius * 1.7, radius * 1.2, radius);

        ctx.stroke();

        ctx.beginPath();
        ctx.arc(radius * 1.4, radius * 0.78, radius * 0.15, 0, P2);

        ctx.fill();

        ctx.scale(1, -1);

        ctx.beginPath();
        ctx.moveTo(radius * 0.55, radius * 0.25);
        ctx.arcTo(radius * 1.1, radius * 0.25, radius * 1.7, radius * 1.2, radius);

        ctx.stroke();

        ctx.beginPath();
        ctx.arc(radius * 1.4, radius * 0.78, radius * 0.15, 0, P2);

        ctx.fill();

        ctx.restore();
    },

    desert_centipede_body: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, -radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#d3c66d");
        ctx.strokeStyle = containerToDraw.getRenderColor("#aca05b");
        ctx.lineWidth = radius / 5;

        ctx.beginPath();
        ctx.arc(
            0, 0, radius
            , 0, P2
        );

        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },

    evil_centipede: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, -radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#8e5eb0");
        ctx.strokeStyle = containerToDraw.getRenderColor("#784b93");
        ctx.lineWidth = radius / 5;

        ctx.beginPath();
        ctx.arc(
            0, 0, radius
            , 0, P2
        );

        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = "#333333";
        ctx.fillStyle = "#333333";
        ctx.lineWidth /= 2;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(radius * 0.55, radius * 0.25);
        ctx.arcTo(radius * 1.1, radius * 0.25, radius * 1.7, radius * 1.2, radius);

        ctx.stroke();

        ctx.beginPath();
        ctx.arc(radius * 1.4, radius * 0.78, radius * 0.15, 0, P2);

        ctx.fill();

        ctx.scale(1, -1);

        ctx.beginPath();
        ctx.moveTo(radius * 0.55, radius * 0.25);
        ctx.arcTo(radius * 1.1, radius * 0.25, radius * 1.7, radius * 1.2, radius);

        ctx.stroke();

        ctx.beginPath();
        ctx.arc(radius * 1.4, radius * 0.78, radius * 0.15, 0, P2);

        ctx.fill();

        ctx.restore();
    },

    evil_centipede_body: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, -radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = "#333333";

        ctx.beginPath();
        ctx.arc(0, radius * 0.85, radius / 2.5, 0, P2);
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#8e5eb0");
        ctx.strokeStyle = containerToDraw.getRenderColor("#784b93");
        ctx.lineWidth = radius / 5;

        ctx.beginPath();
        ctx.arc(
            0, 0, radius
            , 0, P2
        );

        ctx.fill();
        ctx.stroke();

        ctx.restore();
    },
    ant_hole: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.fillStyle = containerToDraw.getRenderColor("#b58500");
        ctx.beginPath();
        ctx.arc(
            0, 0, radius,
            0, P2
        );
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#946d00");
        ctx.beginPath();
        ctx.arc(
            0, 0, radius * 0.68,
            0, P2
        );
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#6b4f00");
        ctx.beginPath();
        ctx.arc(
            0, 0, radius * 0.33,
            0, P2
        );
        ctx.fill();

        ctx.restore();
    },
    bee_hive: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.rotate(halfPI);

        ctx.fillStyle = containerToDraw.getRenderColor("#ffd363");
        ctx.beginPath();
        ctx.roundRect(
            -radius, -radius,
            radius * 2, radius * 2, 20
        );
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#d3ae4d");
        ctx.beginPath();
        ctx.roundRect(
            -radius * 0.68, -radius * 0.68,
            radius * 0.68 * 2, radius * 0.68 * 2, 20
        );
        ctx.fill();

        ctx.fillStyle = containerToDraw.getRenderColor("#a2852e");
        ctx.beginPath();
        ctx.roundRect(
            -radius * 0.33, -radius * 0.33,
            radius * 0.33 * 2, radius * 0.33 * 2, 20
        );
        ctx.fill();

        ctx.restore();
    },

    baby_ant: containerToDraw => {
        const { ctx, radius } = containerToDraw;
        ctx.save();

        ctx.lineCap = "round";

        ctx.save();

        ctx.translate(radius * 0.74, radius * 0.23);

        ctx.rotate(
            Geometry.degreesToRadians(containerToDraw.transing)
        );

        loadPathFromSVG({
            containerToDraw,
            pathS: antMouth,
            stroke: {
                color: "#292929",
                width: 40
            }
        });

        ctx.restore();

        ctx.scale(1, -1);

        ctx.translate(radius * 0.74, radius * 0.23);

        ctx.rotate(
            Geometry.degreesToRadians(containerToDraw.transing)
        );

        loadPathFromSVG({
            containerToDraw,
            pathS: antMouth,
            stroke: {
                color: "#292929",
                width: 40
            }
        });

        ctx.restore();

        ctx.fillStyle = containerToDraw.getRenderColor("#555555");
        ctx.strokeStyle = containerToDraw.getRenderColor("#454545");

        ctx.lineWidth = radius / 2;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, P2);
        ctx.fill();
        ctx.stroke();
    },

    worker_ant: containerToDraw => {
        const { ctx, radius } = containerToDraw;
        ctx.save();

        ctx.lineCap = "round";

        ctx.save();

        ctx.translate(radius * 1.2, radius * 0.23);

        ctx.rotate(
            Geometry.degreesToRadians(containerToDraw.transing)
        );

        loadPathFromSVG({
            containerToDraw,
            pathS: antMouth,
            stroke: {
                color: "#292929",
                width: 40
            }
        });

        ctx.restore();

        ctx.scale(1, -1);

        ctx.translate(radius * 1.2, radius * 0.23);

        ctx.rotate(
            Geometry.degreesToRadians(containerToDraw.transing)
        );

        loadPathFromSVG({
            containerToDraw,
            pathS: antMouth,
            stroke: {
                color: "#292929",
                width: 40
            }
        });

        ctx.restore();

        ctx.fillStyle = containerToDraw.getRenderColor("#555555");
        ctx.strokeStyle = containerToDraw.getRenderColor("#454545");

        ctx.lineWidth = radius / 2 * 0.85;

        ctx.beginPath();
        ctx.arc(-radius * 0.7, 0, radius * 0.75, 0, P2);
        ctx.fill();
        ctx.stroke();

        ctx.lineWidth = radius / 2;

        ctx.beginPath();
        ctx.arc(radius * 0.4, 0, radius, 0, P2);
        ctx.fill();
        ctx.stroke();
    },

    soldier_ant: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        const rotation = Geometry.degreesToRadians(containerToDraw.transing);

        ctx.save();
        ctx.lineCap = "round";
        ctx.save();
        ctx.translate(radius * 1.2, radius * 0.23);
        ctx.rotate(rotation);
        loadPathFromSVG({
            containerToDraw,
            pathS: antMouth,
            stroke: {
                color: "#292929",
                width: 40
            }
        });
        ctx.restore();

        ctx.scale(1, -1);

        ctx.translate(radius * 1.2, radius * 0.23);

        ctx.rotate(
            rotation
        );

        loadPathFromSVG({
            containerToDraw,
            pathS: antMouth,
            stroke: {
                color: "#292929",
                width: 40
            }
        });

        ctx.restore();

        ctx.fillStyle = containerToDraw.getRenderColor("#555555");
        ctx.strokeStyle = containerToDraw.getRenderColor("#454545");

        ctx.lineWidth = radius / 2 * 0.85;

        ctx.beginPath();
        ctx.arc(-radius * 0.7, 0, radius * 0.75, 0, P2);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "#FFFFFF";
        ctx.globalAlpha = containerToDraw.getAlpha(0.5);

        ctx.beginPath();
        ctx.ellipse(
            -radius * 0.8,
            -radius * 0.55,
            radius * 0.9,
            radius * 0.5,
            rotation * 3 + 0.12,
            0,
            P2
        );
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(
            -radius * 0.8,
            radius * 0.55,
            radius * 0.9,
            radius * 0.5,
            -rotation * 3 - 0.12,
            0,
            P2
        );
        ctx.fill();

        ctx.globalAlpha = containerToDraw.getAlpha(1);

        ctx.fillStyle = containerToDraw.getRenderColor("#555555");
        ctx.strokeStyle = containerToDraw.getRenderColor("#454545");

        ctx.lineWidth = radius / 2;

        ctx.beginPath();
        ctx.arc(radius * 0.4, 0, radius, 0, P2);
        ctx.fill();
        ctx.stroke();
    },

    queen_ant: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        const rotation = Geometry.degreesToRadians(containerToDraw.transing);

        ctx.save();

        ctx.lineCap = "round";

        ctx.save();

        ctx.translate(radius * 0.95, radius * 0.35);

        ctx.rotate(
            rotation
        );

        loadPathFromSVG({
            containerToDraw,
            pathS: antMouth,
            stroke: {
                color: "#292929",
                width: 20
            }
        });

        ctx.restore();

        ctx.scale(1, -1);

        ctx.translate(radius * 0.95, radius * 0.35);

        ctx.rotate(
            rotation
        );

        loadPathFromSVG({
            containerToDraw,
            pathS: antMouth,
            stroke: {
                color: "#292929",
                width: 20
            }
        });

        ctx.restore();

        ctx.fillStyle = containerToDraw.getRenderColor("#555555");
        ctx.strokeStyle = containerToDraw.getRenderColor("#454545");

        ctx.lineWidth = radius / 5;

        ctx.beginPath();
        ctx.arc(-radius * 0.8, 0, radius * 0.85, 0, P2);
        ctx.fill();
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.75, 0, P2);
        ctx.fill();
        ctx.stroke();

        ctx.save();

        ctx.fillStyle = "#FFFFFF";
        ctx.globalAlpha = containerToDraw.getAlpha(0.5);

        ctx.beginPath();
        ctx.ellipse(
            -radius * 0.3,
            -radius * 0.5,
            radius,
            radius * 0.45,
            rotation + 0.3,
            0,
            P2
        );
        ctx.fill();

        ctx.beginPath();
        ctx.ellipse(
            -radius * 0.3,
            radius * 0.5,
            radius,
            radius * 0.45,
            -rotation - 0.3,
            0,
            P2
        );
        ctx.fill();

        ctx.restore();

        ctx.beginPath();
        ctx.arc(radius * 0.8, 0, radius * 0.6, 0, P2);
        ctx.fill();
        ctx.stroke();
    },

    cactus: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        const x = Math.floor(Math.log(radius)) * 3;

        ctx.save();

        for (let i = 0; i < x; i++) {
            ctx.beginPath();

            ctx.fillStyle = "#2f271e";

            ctx.moveTo(radius * 1.2, 0);

            ctx.lineTo(radius * 0.9, radius * 0.05);

            ctx.lineTo(radius * 0.9, -radius * 0.05);
            ctx.lineTo(radius * 1.2, 0);
            ctx.fill();

            ctx.rotate(P2 / x);
        }

        ctx.restore();

        ctx.beginPath();

        ctx.fillStyle = containerToDraw.getRenderColor("#32a955");
        ctx.strokeStyle = containerToDraw.getRenderColor("#2f8340");
        ctx.lineWidth = radius / 10;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.moveTo(radius, 0);

        let radiansNow = 0;

        for (let i = 0; i < x + 1; i++) {
            const position = Geometry.getPositionOnCircle(
                radiansNow, radius
            );

            const besPosition = Geometry.getPositionOnCircle(
                radiansNow - P2 / x / 2, radius * 0.93
            );

            ctx.bezierCurveTo(
                besPosition.x, besPosition.y,
                besPosition.x, besPosition.y,
                position.x, position.y
            );

            radiansNow += P2 / x;
        }
        ctx.moveTo(radius, 0);

        ctx.fill();
        ctx.stroke();
    },
    spider: containerToDraw => {
        const { ctx, radius } = containerToDraw;
        const rotation = Geometry.degreesToRadians(containerToDraw.transing);
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.scale(2, 2);
        ctx.translate(0, -radius * 0.14);

        ctx.save();

        ctx.rotate(-rotation / 1.8);

        loadPathFromSVG({
            containerToDraw,
            pathS: spiderLeg1,
            stroke: {
                color: "#333333",
                width: 15
            }
        });

        ctx.restore();

        ctx.save();

        ctx.rotate(rotation);

        loadPathFromSVG({
            containerToDraw,
            pathS: spiderLeg2,
            stroke: {
                color: "#333333",
                width: 15
            }
        });

        ctx.restore();

        ctx.save();

        ctx.rotate(rotation / 2);

        loadPathFromSVG({
            containerToDraw,
            pathS: spiderLeg3,
            stroke: {
                color: "#333333",
                width: 15
            }
        });

        ctx.restore();

        ctx.save();

        ctx.rotate(-rotation / 1.2);

        loadPathFromSVG({
            containerToDraw,
            pathS: spiderLeg4,
            stroke: {
                color: "#333333",
                width: 15
            }
        });

        ctx.restore();

        ctx.restore();

        ctx.fillStyle = containerToDraw.getRenderColor("#4f412e");
        ctx.strokeStyle = containerToDraw.getRenderColor("#403525");
        ctx.lineWidth = radius / 3;
        ctx.beginPath();
        ctx.arc(0, 0, radius * 0.9, 0, P2);
        ctx.fill();
        ctx.stroke();
    },

    hornet: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        ctx.save();

        ctx.scale(-1, 1);
        ctx.scale(0.4, 0.4);
        ctx.translate(radius * 2.5, 0);

        ctx.fillStyle = containerToDraw.getRenderColor("#333333");
        ctx.strokeStyle = containerToDraw.getRenderColor("#333333");
        ctx.lineWidth = radius * 0.3;

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.beginPath();

        ctx.moveTo(radius, 0);
        ctx.lineTo(-radius, radius * 0.6);
        ctx.lineTo(-radius, -radius * 0.6);
        ctx.lineTo(radius, 0);
        ctx.fill();
        ctx.stroke();

        ctx.restore();

        const body = new Path2D();

        body.ellipse(
            0, 0,
            radius, radius * 0.7,
            0, 0, P2
        );

        ctx.save();
        ctx.clip(body);

        ctx.fillStyle = containerToDraw.getRenderColor("#ffd363");

        ctx.fill(body);

        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#333333");
        ctx.rect(
            radius * 0.35,
            -radius,
            radius * 0.3,
            radius * 2
        );
        ctx.fill();

        ctx.rect(
            -radius * 0.25,
            -radius,
            radius * 0.3,
            radius * 2
        );
        ctx.fill();

        ctx.rect(
            -radius * 0.85,
            -radius,
            radius * 0.3,
            radius * 2
        );
        ctx.fill();

        ctx.strokeStyle = containerToDraw.getRenderColor("#d3ae4d");
        ctx.lineWidth = radius / 3 + 1;
        ctx.stroke(body);

        ctx.restore();

        ctx.save();

        ctx.scale(0.4, 0.5);
        ctx.translate(radius * 2.7, 0);
        ctx.rotate(halfPI);

        loadPathFromSVG({
            containerToDraw,
            pathS: "m 60.348807,176.48637 q 0.224848,0.67878 0.551515,1.30666 0.326666,0.63637 0.750908,1.20485 0.42,0.57273 0.924848,1.07333 0.509091,0.50061 1.081818,0.91637 0.576969,0.41575 1.213332,0.73818 0.636363,0.32242 1.310908,0.53879 0.674545,0.21636 1.378787,0.3309 0.704247,0.11455 1.412727,0.11031 0.44545,0 0.89091,-0.0424 0.44545,-0.0424 0.88242,-0.13151 0.43697,-0.0891 0.86546,-0.22061 0.42424,-0.12727 0.84,-0.29697 0.41151,-0.16969 0.80606,-0.38182 0.39454,-0.21212 0.76363,-0.45818 0.36909,-0.24606 0.72121,-0.53454 0.3394,-0.28 0.65758,-0.59394 0.31818,-0.31394 0.60242,-0.66606 0.28424,-0.35212 0.5303,-0.71697 0.24606,-0.36909 0.45819,-0.76364 0.21212,-0.39454 0.38181,-0.80606 0.1697,-0.41151 0.29697,-0.84 0.13152,-0.42424 0.22061,-0.86545 0.0891,-0.44121 0.12727,-0.88242 0.0382,-0.44122 0.0467,-0.89091 0,-94.673869 -63.267231,-157.945342 Q 14.29311,15.168332 13.720383,14.748333 13.143414,14.332575 12.511293,14.005909 11.87493,13.683485 11.200385,13.462879 10.52584,13.242273 9.8258412,13.123485 9.1258411,13.004697 8.4131141,13.00894 q -0.712726,0 -1.416968,0.101818 -0.7,0.110303 -1.378787,0.322424 -0.678788,0.212121 -1.315151,0.534545 -0.398788,0.199394 -0.776363,0.436969 -0.381818,0.237576 -0.729697,0.509091 -0.356363,0.275757 -0.678787,0.585454 -0.322424,0.305455 -0.615151,0.644848 -0.29697,0.339394 -0.55151497,0.7 -0.258788,0.364848 -0.479394,0.755151 -0.22060503,0.381818 -0.40303003,0.793333 -0.182424,0.407272 -0.322424,0.831514 -0.144242,0.424242 -0.241818,0.861212 -0.09757,0.432727 -0.156969,0.878181 -0.05515,0.441212 -0.06788,0.890908 -0.0085,0.445455 0.02121,0.890909 0.0297,0.445454 0.106061,0.882424 0.07636,0.436969 0.195151,0.873938 0.118788,0.43697 0.275757,0.848485 0.15697,0.411514 0.360606,0.814545 Q 30.253097,86.194951 60.353076,176.49064 m 77.852674,-0.004 q -0.22484,0.67878 -0.55151,1.30666 -0.32667,0.63637 -0.75091,1.20485 -0.42,0.57273 -0.92485,1.07333 -0.50909,0.50061 -1.08181,0.91637 -0.57697,0.41575 -1.21334,0.73818 -0.63636,0.32242 -1.31091,0.53879 -0.67454,0.21636 -1.37878,0.3309 -0.70424,0.11455 -1.41273,0.11031 -0.44545,0 -0.89091,-0.0424 -0.44545,-0.0424 -0.88242,-0.13151 -0.43697,-0.0891 -0.86545,-0.22061 -0.42425,-0.12727 -0.84,-0.29697 -0.41152,-0.16969 -0.80606,-0.38182 -0.39455,-0.21212 -0.76364,-0.45818 -0.36909,-0.24606 -0.72121,-0.53454 -0.3394,-0.28 -0.65758,-0.59394 -0.31818,-0.31394 -0.60242,-0.66606 -0.28424,-0.35212 -0.5303,-0.71697 -0.24606,-0.36909 -0.45818,-0.76364 -0.21213,-0.39454 -0.38182,-0.80606 -0.1697,-0.41151 -0.29697,-0.84 -0.13152,-0.42424 -0.22061,-0.86545 -0.0891,-0.44121 -0.12727,-0.88242 -0.0382,-0.44122 -0.0467,-0.89091 0,-94.673869 63.26723,-157.945342 0.50485,-0.500606 1.07758,-0.920605 0.57697,-0.415758 1.20909,-0.742424 0.63636,-0.322424 1.31091,-0.54303 0.67454,-0.220606 1.37454,-0.339394 0.7,-0.118788 1.41273,-0.114545 0.71272,0 1.41697,0.101818 0.7,0.110303 1.37878,0.322424 0.67879,0.212121 1.31515,0.534545 0.39879,0.199394 0.77637,0.436969 0.38181,0.237576 0.72969,0.509091 0.35637,0.275757 0.67879,0.585454 0.32242,0.305455 0.61515,0.644848 0.29697,0.339394 0.55152,0.7 0.25878,0.364848 0.47939,0.755151 0.22061,0.381818 0.40303,0.793333 0.18242,0.407272 0.32242,0.831514 0.14425,0.424242 0.24182,0.861212 0.0976,0.432727 0.15697,0.878181 0.0551,0.441212 0.0679,0.890908 0.008,0.445455 -0.0212,0.890909 -0.0297,0.445454 -0.10606,0.882424 -0.0764,0.436969 -0.19515,0.873938 -0.11879,0.43697 -0.27576,0.848485 -0.15697,0.411514 -0.36061,0.814545 -30.01513,60.030262 -60.11511,150.325951",
            fill: "#333333",
            stroke: {
                width: 3,
                color: "#333333"
            }
        });

        ctx.restore();

        ctx.restore();
    },

    mantis: containerToDraw => {
        const { ctx, radius } = containerToDraw;
        const rotation
            = Numeric.clamp(
                0.5 - Geometry.degreesToRadians(containerToDraw.transing) / 6,
                0.05, 0.5
            );
        ctx.save();

        ctx.save();

        ctx.strokeStyle = "#333333";
        ctx.lineWidth = radius / 10;

        ctx.rotate(PI + rotation * 1.5);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        for (let i = 0; i < 4; i++) {
            ctx.beginPath();

            ctx.moveTo(0, -radius * 0.9);
            ctx.lineTo(0, radius * 0.9);

            ctx.stroke();

            ctx.rotate(-rotation);
        }

        ctx.restore();

        ctx.fillStyle = containerToDraw.getRenderColor("#9acc46");
        ctx.strokeStyle = containerToDraw.getRenderColor("#78a62e");
        ctx.lineWidth = radius / 8;
        ctx.beginPath();
        ctx.ellipse(
            0, 0,
            radius, radius * 0.62,
            0, 0, P2
        );

        ctx.fill();
        ctx.stroke();

        ctx.save();

        ctx.translate(-radius * 0.1, radius * 0.1);
        ctx.scale(1, 1.1);

        loadPathFromSVG({
            containerToDraw,
            pathS: "m 91.363589,62.344598 q -12.334392,0.01471 -22.325587,1.82675 -10.007784,1.819567 -21.263291,6.080993 -0.28111,0.104541 -0.575566,0.182006 -0.290382,0.07764 -0.588075,0.130592 -0.299655,0.05085 -0.600287,0.07102 -0.298522,0.01824 -0.602231,0.01022 -0.301607,-0.01022 -0.604343,-0.04754 -0.298502,-0.04092 -0.591953,-0.110355 -0.295545,-0.06737 -0.584062,-0.161054 -0.282199,-0.09953 -0.561574,-0.221474 -0.27319,-0.12374 -0.535135,-0.27769 -0.259992,-0.151829 -0.507018,-0.323644 -0.244799,-0.177836 -0.474725,-0.373489 -0.225678,-0.19962 -0.434198,-0.423136 -0.206554,-0.221406 -0.390167,-0.456322 -0.185464,-0.241087 -0.345902,-0.497617 -0.160439,-0.256543 -0.2939,-0.526413 -0.133446,-0.269881 -0.241909,-0.555198 -0.10844,-0.285328 -0.184128,-0.57361 -0.07569,-0.28827 -0.128467,-0.590037 -0.05278,-0.301756 -0.0731,-0.598314 -0.02032,-0.296558 -0.0097,-0.602236 0.01045,-0.301608 0.0475,-0.604345 0.04097,-0.298495 0.110321,-0.591953 0.06739,-0.295544 0.163164,-0.586025 0.09549,-0.282342 0.219369,-0.559609 0.123745,-0.273199 0.277693,-0.535134 0.149889,-0.262072 0.321678,-0.509129 0.177836,-0.244789 0.377456,-0.470471 0.199783,-0.229728 0.419244,-0.438366 0.221402,-0.206552 0.458266,-0.388081 0.241079,-0.185461 0.497616,-0.345898 0.256537,-0.160437 0.526405,-0.293901 0.269893,-0.133454 0.555205,-0.241917 12.301533,-4.653596 23.422198,-6.675305 11.067104,-2.007252 24.499444,-2.028798 0.303993,3.53e-4 0.602927,0.02908 0.304986,0.03101 0.598712,0.09223 0.295977,0.05518 0.586737,0.142778 0.290776,0.08767 0.568324,0.203349 0.277548,0.115736 0.545962,0.259712 0.268406,0.143975 0.515731,0.307615 0.25125,0.16787 0.48958,0.355693 0.232011,0.193703 0.446867,0.411302 0.215173,0.209426 0.40864,0.443042 0.189831,0.233057 0.358574,0.485792 0.168739,0.252735 0.308523,0.516721 0.143831,0.264136 0.258482,0.547618 0.117037,0.273357 0.204798,0.566153 0.08793,0.288704 0.148991,0.586674 0.0571,0.293755 0.08957,0.594815 0.02831,0.300913 0.03005,0.602931 0.0019,0.302031 -0.02908,0.602932 -0.03082,0.300902 -0.09218,0.598713 -0.05517,0.295977 -0.140681,0.584771 -0.08551,0.288806 -0.205455,0.570292 -0.113617,0.275581 -0.257603,0.543991 -0.142027,0.270498 -0.309725,0.517702 -0.167871,0.251254 -0.355687,0.489577 -0.193543,0.227964 -0.409202,0.444901 -0.211438,0.213004 -0.446696,0.408942 -0.231115,0.191914 -0.48385,0.360663 -0.250626,0.166764 -0.518677,0.306407 -0.262119,0.146004 -0.545658,0.260602 -0.27538,0.114869 -0.566021,0.200714 -0.288838,0.09201 -0.584699,0.151101 -0.295868,0.05906 -0.596915,0.09154 -0.300913,0.02839 -0.602947,0.0301 m -2.909827,71.156009 q -13.352179,-0.93665 -24.302303,-3.71197 -10.972043,-2.79039 -22.911004,-8.29124 -0.273014,-0.12788 -0.535142,-0.27771 -0.263923,-0.15604 -0.506728,-0.33179 -0.242832,-0.17573 -0.466225,-0.38142 -0.227644,-0.20174 -0.434196,-0.42314 -0.204587,-0.21929 -0.388083,-0.45826 -0.183495,-0.23897 -0.337599,-0.50142 -0.160446,-0.25654 -0.289691,-0.53034 -0.133446,-0.26989 -0.239933,-0.55309 -0.106468,-0.28324 -0.180051,-0.57347 -0.07751,-0.29446 -0.122148,-0.59594 -0.04885,-0.29755 -0.06495,-0.59803 -0.01821,-0.29852 -0.0076,-0.60419 0.01043,-0.30164 0.05354,-0.60211 0.03887,-0.29653 0.110321,-0.59195 0.07146,-0.29538 0.171025,-0.57761 0.09774,-0.28837 0.223596,-0.56353 0.125843,-0.27516 0.279651,-0.53302 0.153785,-0.2579 0.33391,-0.5087 0.173617,-0.24087 0.37729,-0.46642 0.203671,-0.22556 0.423132,-0.4342 0.21907,-0.20906 0.458266,-0.38809 0.238804,-0.17945 0.501417,-0.3376 0.256538,-0.16044 0.530341,-0.28969 0.269885,-0.13346 0.553096,-0.23994 0.283218,-0.10642 0.575293,-0.17384 0.294458,-0.0775 0.592002,-0.12637 0.299513,-0.0467 0.600003,-0.0628 0.300488,-0.016 0.604206,-0.008 0.30371,0.008 0.602085,0.0536 0.298368,0.045 0.593913,0.1124 0.291333,0.0713 0.57761,0.17103 0.286401,0.0957 0.563541,0.2236 10.910698,5.02852 20.782612,7.53589 9.886114,2.5099 22.141197,3.36974 0.301177,0.0227 0.599403,0.0718 0.298085,0.0533 0.591245,0.1307 0.29317,0.0775 0.568891,0.18703 0.285984,0.10786 0.556791,0.24172 0.272772,0.13596 0.526275,0.29779 0.253533,0.16179 0.491979,0.34557 0.240431,0.18587 0.459771,0.39138 0.219226,0.20959 0.42152,0.43494 0.194007,0.22919 0.371252,0.47399 0.177036,0.24893 0.325011,0.51317 0.148085,0.26016 0.273244,0.53385 0.122942,0.27967 0.219124,0.56462 0.09412,0.28686 0.163471,0.58105 0.06529,0.29403 0.103736,0.59733 0.03872,0.29515 0.0485,0.60154 0.008,0.30021 -0.01278,0.60351 -0.02465,0.29906 -0.07379,0.5973 -0.04911,0.29822 -0.128725,0.59334 -0.08143,0.28896 -0.187056,0.5689 -0.109819,0.28388 -0.24157,0.55271 -0.138076,0.27474 -0.299903,0.52825 -0.157907,0.25769 -0.343597,0.49408 -0.183744,0.23846 -0.393329,0.45769 -0.207638,0.22131 -0.434951,0.42151 -0.229173,0.19401 -0.473975,0.37127 -0.246826,0.17507 -0.511051,0.32303 -0.262284,0.15005 -0.535963,0.27522 -0.277583,0.12097 -0.560542,0.21926 -0.288846,0.092 -0.585122,0.16332 -0.292074,0.0674 -0.595239,0.1018 -0.297261,0.0407 -0.601544,0.0484 -0.302309,0.0108 -0.603501,-0.0128 M 138.37004,67.781378 q -8.29441,16.710298 -8.59704,25.373303 -0.29858,8.663149 6.8153,25.914229 0.1187,0.28365 0.20467,0.57023 0.086,0.28659 0.14489,0.58654 0.0593,0.29178 0.0876,0.59269 0.0263,0.30289 0.0281,0.6049 0.003,0.30007 -0.0271,0.60505 -0.0307,0.29683 -0.0901,0.59673 -0.0612,0.29373 -0.14673,0.58255 -0.0917,0.29062 -0.20546,0.57027 -0.11769,0.27546 -0.26168,0.54386 -0.13975,0.26447 -0.30971,0.5177 -0.16788,0.25125 -0.35964,0.48535 -0.19175,0.2341 -0.40726,0.44699 -0.21517,0.21322 -0.4448,0.40249 -0.23924,0.1917 -0.4879,0.36056 -0.25063,0.16676 -0.51672,0.30852 -0.26819,0.1437 -0.54763,0.25848 -0.28365,0.1187 -0.56812,0.20269 -0.2887,0.0879 -0.58653,0.14491 -0.29783,0.057 -0.59678,0.0875 -0.30104,0.0324 -0.6049,0.0281 -0.30007,0.003 -0.60293,-0.029 -0.30105,-0.0268 -0.59674,-0.0901 -0.29176,-0.0591 -0.58464,-0.14475 -0.28655,-0.0916 -0.57028,-0.20546 -0.27545,-0.1177 -0.54386,-0.26167 -0.26447,-0.13978 -0.51573,-0.30764 -0.25126,-0.16787 -0.48326,-0.36158 -0.23815,-0.19192 -0.44896,-0.40936 -0.21509,-0.20949 -0.40501,-0.44248 -0.1897,-0.23711 -0.35857,-0.4858 -0.16873,-0.25273 -0.31048,-0.51882 -0.14373,-0.26819 -0.25849,-0.54762 -8.12627,-19.71014 -7.73337,-31.032654 0.3929,-11.322529 9.86768,-30.415791 0.1319,-0.272891 0.29582,-0.528384 0.1558,-0.255733 0.34359,-0.494081 0.18586,-0.240434 0.3935,-0.461738 0.20553,-0.219343 0.43237,-0.415839 0.22762,-0.199895 0.47624,-0.377272 0.24278,-0.17519 0.507,-0.323156 0.26245,-0.15411 0.53386,-0.273243 0.27774,-0.125028 0.56476,-0.223209 0.28687,-0.09405 0.58314,-0.16543 0.29404,-0.06532 0.59131,-0.106029 0.30134,-0.04059 0.60155,-0.04846 0.30639,-0.01022 0.6035,0.01277 0.30525,0.0228 0.60151,0.06988 0.29822,0.04913 0.58718,0.130546 0.29513,0.07958 0.57506,0.185222 0.28388,0.109786 0.55271,0.241584 0.2729,0.131903 0.5284,0.295818 0.25771,0.157906 0.49815,0.343744 0.24043,0.185848 0.4577,0.393324 0.21726,0.207475 0.41781,0.43448 0.1979,0.225522 0.37529,0.474141 0.17716,0.24488 0.32316,0.506998 0.1541,0.262447 0.27522,0.535953 0.12503,0.277737 0.22334,0.560693 0.0939,0.290938 0.16333,0.585125 0.0673,0.292054 0.10598,0.591291 0.0406,0.301335 0.0484,0.601541 0.0108,0.306396 -0.0128,0.60349 -0.0208,0.303306 -0.0698,0.601529 -0.0492,0.298233 -0.12859,0.589274 -0.0795,0.295133 -0.18523,0.57508 -0.10978,0.283869 -0.24156,0.552702",
            fill: "#78a62e"
        });

        ctx.restore();

        ctx.lineWidth = radius / 8;

        ctx.beginPath();

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.moveTo(radius * 0.1, 0);
        ctx.lineTo(-radius * 0.75, 0);
        ctx.stroke();

        ctx.save();

        ctx.scale(0.5, 0.5);
        ctx.translate(radius * 1.9, 0);
        ctx.rotate(halfPI);

        loadPathFromSVG({
            containerToDraw,
            pathS: "m 60.348807,176.48637 q 0.224848,0.67878 0.551515,1.30666 0.326666,0.63637 0.750908,1.20485 0.42,0.57273 0.924848,1.07333 0.509091,0.50061 1.081818,0.91637 0.576969,0.41575 1.213332,0.73818 0.636363,0.32242 1.310908,0.53879 0.674545,0.21636 1.378787,0.3309 0.704247,0.11455 1.412727,0.11031 0.44545,0 0.89091,-0.0424 0.44545,-0.0424 0.88242,-0.13151 0.43697,-0.0891 0.86546,-0.22061 0.42424,-0.12727 0.84,-0.29697 0.41151,-0.16969 0.80606,-0.38182 0.39454,-0.21212 0.76363,-0.45818 0.36909,-0.24606 0.72121,-0.53454 0.3394,-0.28 0.65758,-0.59394 0.31818,-0.31394 0.60242,-0.66606 0.28424,-0.35212 0.5303,-0.71697 0.24606,-0.36909 0.45819,-0.76364 0.21212,-0.39454 0.38181,-0.80606 0.1697,-0.41151 0.29697,-0.84 0.13152,-0.42424 0.22061,-0.86545 0.0891,-0.44121 0.12727,-0.88242 0.0382,-0.44122 0.0467,-0.89091 0,-94.673869 -63.267231,-157.945342 Q 14.29311,15.168332 13.720383,14.748333 13.143414,14.332575 12.511293,14.005909 11.87493,13.683485 11.200385,13.462879 10.52584,13.242273 9.8258412,13.123485 9.1258411,13.004697 8.4131141,13.00894 q -0.712726,0 -1.416968,0.101818 -0.7,0.110303 -1.378787,0.322424 -0.678788,0.212121 -1.315151,0.534545 -0.398788,0.199394 -0.776363,0.436969 -0.381818,0.237576 -0.729697,0.509091 -0.356363,0.275757 -0.678787,0.585454 -0.322424,0.305455 -0.615151,0.644848 -0.29697,0.339394 -0.55151497,0.7 -0.258788,0.364848 -0.479394,0.755151 -0.22060503,0.381818 -0.40303003,0.793333 -0.182424,0.407272 -0.322424,0.831514 -0.144242,0.424242 -0.241818,0.861212 -0.09757,0.432727 -0.156969,0.878181 -0.05515,0.441212 -0.06788,0.890908 -0.0085,0.445455 0.02121,0.890909 0.0297,0.445454 0.106061,0.882424 0.07636,0.436969 0.195151,0.873938 0.118788,0.43697 0.275757,0.848485 0.15697,0.411514 0.360606,0.814545 Q 30.253097,86.194951 60.353076,176.49064 m 77.852674,-0.004 q -0.22484,0.67878 -0.55151,1.30666 -0.32667,0.63637 -0.75091,1.20485 -0.42,0.57273 -0.92485,1.07333 -0.50909,0.50061 -1.08181,0.91637 -0.57697,0.41575 -1.21334,0.73818 -0.63636,0.32242 -1.31091,0.53879 -0.67454,0.21636 -1.37878,0.3309 -0.70424,0.11455 -1.41273,0.11031 -0.44545,0 -0.89091,-0.0424 -0.44545,-0.0424 -0.88242,-0.13151 -0.43697,-0.0891 -0.86545,-0.22061 -0.42425,-0.12727 -0.84,-0.29697 -0.41152,-0.16969 -0.80606,-0.38182 -0.39455,-0.21212 -0.76364,-0.45818 -0.36909,-0.24606 -0.72121,-0.53454 -0.3394,-0.28 -0.65758,-0.59394 -0.31818,-0.31394 -0.60242,-0.66606 -0.28424,-0.35212 -0.5303,-0.71697 -0.24606,-0.36909 -0.45818,-0.76364 -0.21213,-0.39454 -0.38182,-0.80606 -0.1697,-0.41151 -0.29697,-0.84 -0.13152,-0.42424 -0.22061,-0.86545 -0.0891,-0.44121 -0.12727,-0.88242 -0.0382,-0.44122 -0.0467,-0.89091 0,-94.673869 63.26723,-157.945342 0.50485,-0.500606 1.07758,-0.920605 0.57697,-0.415758 1.20909,-0.742424 0.63636,-0.322424 1.31091,-0.54303 0.67454,-0.220606 1.37454,-0.339394 0.7,-0.118788 1.41273,-0.114545 0.71272,0 1.41697,0.101818 0.7,0.110303 1.37878,0.322424 0.67879,0.212121 1.31515,0.534545 0.39879,0.199394 0.77637,0.436969 0.38181,0.237576 0.72969,0.509091 0.35637,0.275757 0.67879,0.585454 0.32242,0.305455 0.61515,0.644848 0.29697,0.339394 0.55152,0.7 0.25878,0.364848 0.47939,0.755151 0.22061,0.381818 0.40303,0.793333 0.18242,0.407272 0.32242,0.831514 0.14425,0.424242 0.24182,0.861212 0.0976,0.432727 0.15697,0.878181 0.0551,0.441212 0.0679,0.890908 0.008,0.445455 -0.0212,0.890909 -0.0297,0.445454 -0.10606,0.882424 -0.0764,0.436969 -0.19515,0.873938 -0.11879,0.43697 -0.27576,0.848485 -0.15697,0.411514 -0.36061,0.814545 -30.01513,60.030262 -60.11511,150.325951",
            fill: "#333333"
        });

        ctx.restore();

        ctx.restore();
    },

    beetle: containerToDraw => {
        const { ctx, radius } = containerToDraw;
        const rotation = Geometry.degreesToRadians(containerToDraw.transing) / 1.2;

        ctx.save();

        ctx.translate(0, radius * 0.11);

        ctx.save();

        ctx.translate(0, -radius * 0.14);
        ctx.scale(0.9, 0.9);

        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        ctx.save();
        ctx.translate(radius * 1.1, radius * 0.22);
        ctx.rotate(rotation);
        loadPathFromSVG({
            containerToDraw,
            pathS: "M 13.473229,41.68771 Q 109.57226,-15.893057 186.38903,41.791806 109.55321,22.528603 13.450099,80.113442 Z",
            fill: "#333333",
            stroke: {
                color: "#333333",
                width: 20
            }
        });
        ctx.restore();

        ctx.translate(radius * 1.1, -radius * 0.22);

        ctx.scale(1, -1);
        ctx.rotate(rotation);
        loadPathFromSVG({
            containerToDraw,
            pathS: "M 13.473229,41.68771 Q 109.57226,-15.893057 186.38903,41.791806 109.55321,22.528603 13.450099,80.113442 Z",
            fill: "#333333",
            stroke: {
                color: "#333333",
                width: 20
            }
        });

        ctx.restore();

        loadPathFromSVG({
            containerToDraw,
            pathS: "M 107.13147,11.617372 Q 205.74505,9.5852643 207.26913,83.545445 208.79321,157.50563 110.17964,159.53775 11.566063,161.56986 10.041979,87.609665 8.517894,13.649483 107.13147,11.617372",
            fill: "#905db0",
            stroke: {
                color: "#754b8f",
                width: 15
            }
        });

        loadPathFromSVG({
            containerToDraw,
            pathS: "m 57.891579,78.084945 q 50.426601,-8.6256 101.173631,-2.08225 0.42224,0.0514 0.83232,0.14766 0.42054,0.096 0.81835,0.23165 0.40038,0.13305 0.78593,0.30819 0.38811,0.17251 0.75616,0.38728 0.36796,0.20954 0.71306,0.45358 0.34521,0.24926 0.66483,0.5252 0.31973,0.28118 0.61382,0.58903 0.28888,0.30797 0.54692,0.64274 0.25803,0.33475 0.48267,0.699 0.22463,0.36422 0.41544,0.737 0.18575,0.38335 0.33774,0.77523 0.14951,0.39979 0.25992,0.80823 0.11044,0.40844 0.18179,0.82553 0.0714,0.41709 0.0985,0.84295 0.0274,0.42585 0.0148,0.84467 -0.0122,0.41882 -0.0663,0.84373 -0.0514,0.42224 -0.14766,0.83232 -0.096,0.42054 -0.23165,0.81836 -0.1356,0.40304 -0.31078,0.78859 -0.16996,0.38544 -0.38472,0.75349 -0.20954,0.36796 -0.45358,0.71306 -0.24926,0.34521 -0.5252,0.66483 -0.28115,0.31973 -0.58903,0.61382 -0.31063,0.28633 -0.64274,0.54692 -0.33744,0.25547 -0.69899,0.48267 -0.35646,0.22185 -0.73701,0.41544 -0.38334,0.18575 -0.77523,0.33774 -0.39979,0.14951 -0.80823,0.25995 -0.40844,0.11045 -0.82553,0.1818 -0.41709,0.0714 -0.84295,0.0985 -0.42585,0.0274 -0.84467,0.0148 -0.41882,-0.0122 -0.84372,-0.0663 -48.17389,-6.21182 -96.056198,1.97941 -0.417091,0.0714 -0.840274,0.10102 -0.423183,0.0296 -0.847128,0.0226 -0.423938,-0.007 -0.843725,-0.0663 -0.419788,-0.0594 -0.834885,-0.14499 -0.415091,-0.0856 -0.815685,-0.22911 -0.400594,-0.14348 -0.791157,-0.30808 -0.390564,-0.16459 -0.756052,-0.38205 -0.365297,-0.20699 -0.713061,-0.45358 -0.345137,-0.24405 -0.667391,-0.52253 -0.317063,-0.27859 -0.611154,-0.58647 -0.288878,-0.30797 -0.552142,-0.64263 -0.258031,-0.33475 -0.485124,-0.6911 -0.227219,-0.36156 -0.415549,-0.74223 -0.190896,-0.37801 -0.340292,-0.77256 -0.152059,-0.39712 -0.265058,-0.80289 -0.110521,-0.41367 -0.184498,-0.8281 -0.0688,-0.41976 -0.101015,-0.84028 -0.02959,-0.42318 -0.01997,-0.84979 0.01221,-0.42404 0.06632,-0.84372 0.05145,-0.42225 0.144995,-0.83489 0.09351,-0.41264 0.229105,-0.81568 0.135599,-0.40305 0.305523,-0.78849 0.169962,-0.38544 0.384619,-0.75873 0.206987,-0.36529 0.453573,-0.71305 0.244049,-0.34514 0.519974,-0.66473 0.281185,-0.31972 0.589035,-0.61382 0.307965,-0.28887 0.640068,-0.54947 0.337296,-0.26073 0.696327,-0.48523 0.359008,-0.22452 0.739566,-0.41811 0.375442,-0.18823 0.772563,-0.34029 0.397118,-0.15206 0.802887,-0.26506 0.413673,-0.11052 0.825531,-0.1818 M 78.460992,56.602291 q 0.006,0.303341 -0.003,0.606985 -0.01,0.303674 -0.0322,0.604955 -0.0226,0.301307 -0.0609,0.597713 -0.0355,0.304191 -0.0896,0.600919 -0.0541,0.29672 -0.12125,0.591099 -0.0672,0.294353 -0.15272,0.586523 -0.0776,0.294612 -0.1764,0.579159 -0.0961,0.287103 -0.20532,0.571906 -0.10934,0.279557 -0.23181,0.556759 -0.12247,0.27719 -0.26343,0.546946 -0.14093,0.269755 -0.28466,0.531688 -0.1437,0.261952 -0.31633,0.516642 -0.17262,0.2547 -0.33762,0.50139 -0.16494,0.24671 -0.36149,0.48356 -0.18864,0.23935 -0.38532,0.47098 -0.19944,0.22385 -0.40944,0.44269 -0.21002,0.21886 -0.43068,0.42744 -0.22067,0.20861 -0.44947,0.40428 -0.22878,0.19567 -0.46827,0.38113 -0.23946,0.18542 -0.48705,0.35797 -0.2476,0.17252 -0.50317,0.33737 -0.25559,0.16486 -0.52207,0.309 -0.2665,0.14415 -0.53307,0.28304 -0.26661,0.13893 -0.55196,0.25466 -0.27213,0.12332 -0.56029,0.23129 -0.28038,0.10519 -0.56618,0.20003 -0.29106,0.0949 -0.57973,0.17677 -0.29402,0.0767 -0.58828,0.14292 -0.2969,0.0637 -0.594039,0.11689 -0.302453,0.0481 -0.59992,0.0856 -0.29746,0.0375 -0.603128,0.0569 -0.305671,0.0192 -0.603782,0.0255 -0.298089,0.006 -0.604311,-6e-4 -0.306226,-0.007 -0.604959,-0.0322 -0.298754,-0.0255 -0.603049,-0.0661 -0.301529,-0.0333 -0.598249,-0.0871 -0.29672,-0.0541 -0.591099,-0.12125 -0.29439,-0.0672 -0.583853,-0.15017 -0.297275,-0.0802 -0.581829,-0.17899 -0.287104,-0.0961 -0.57191,-0.20532 -0.279557,-0.10934 -0.556755,-0.23181 -0.27719,-0.12247 -0.54172,-0.26354 -0.272196,-0.13305 -0.536914,-0.28455 -0.264726,-0.15154 -0.516645,-0.31633 -0.25448,-0.16219 -0.498714,-0.33504 -0.249597,-0.17798 -0.486237,-0.36407 -0.239351,-0.18864 -0.465745,-0.38543 -0.229106,-0.19933 -0.447929,-0.40933 -0.218859,-0.21002 -0.424766,-0.42812 -0.205914,-0.21812 -0.406952,-0.45204 -0.201032,-0.23391 -0.381124,-0.46826 -0.182759,-0.23687 -0.357973,-0.48705 -0.17255,-0.2476 -0.33737,-0.50317 -0.164857,-0.255591 -0.306337,-0.51951 -0.14148,-0.263911 -0.285698,-0.535627 Q 54.954021,62.085672 54.846274,61.807982 54.720255,61.53327 54.614986,61.247691 54.507128,60.964767 54.41229,60.678955 54.32,60.390483 54.235523,60.099226 q -0.07671,-0.29402 -0.142923,-0.588273 -0.06369,-0.296905 -0.114219,-0.591487 -0.04809,-0.302453 -0.08829,-0.60248 -0.03514,-0.300123 -0.05426,-0.600568 -0.02182,-0.303008 -0.02811,-0.606338 -0.0063,-0.303341 6.02e-4,-0.604315 0.007,-0.300974 0.03218,-0.604958 0.02515,-0.30397 0.06606,-0.603046 0.04095,-0.299051 0.08977,-0.595689 0.04882,-0.29661 0.118584,-0.593663 0.06972,-0.297053 0.152725,-0.586523 0.07764,-0.294612 0.176397,-0.579159 0.09613,-0.287103 0.208022,-0.569346 0.106675,-0.28211 0.22918,-0.559319 0.122468,-0.27719 0.263542,-0.541715 0.138262,-0.272308 0.287214,-0.534356 0.151504,-0.264725 0.313697,-0.519204 0.162194,-0.25448 0.33504,-0.498717 0.172847,-0.244234 0.364076,-0.486234 0.188641,-0.239351 0.385418,-0.465745 0.19933,-0.229106 0.409339,-0.447928 0.210019,-0.21886 0.428121,-0.42477 0.21812,-0.205914 0.45203,-0.406949 0.233914,-0.201032 0.468268,-0.381124 0.236873,-0.182759 0.487051,-0.357973 0.2476,-0.172513 0.505841,-0.334818 0.258252,-0.162267 0.516841,-0.308889 0.258585,-0.146585 0.538294,-0.283145 0.279743,-0.136561 0.546736,-0.254554 0.274712,-0.125982 0.560295,-0.231288 0.282923,-0.107858 0.568732,-0.202696 0.288471,-0.09229 0.582399,-0.174178 0.293946,-0.08193 0.588273,-0.142922 0.294353,-0.06103 0.59405,-0.116883 0.299717,-0.05585 0.594687,-0.08548 0.302675,-0.03765 0.603131,-0.05692 0.303008,-0.02182 0.606335,-0.02811 0.303341,-0.0063 0.606985,0.0032 0.303674,0.0096 0.604958,0.03218 0.301307,0.02256 0.60038,0.06351 0.29905,0.04095 0.595681,0.08977 0.296607,0.04882 0.593667,0.118585 0.29705,0.06972 0.58652,0.152725 0.29461,0.07764 0.57916,0.176397 0.2871,0.09613 0.56935,0.208022 0.28211,0.106674 0.55931,0.229142 0.27719,0.122469 0.54439,0.266094 0.26717,0.143626 0.53169,0.284662 0.26454,0.141074 0.5192,0.313698 0.2547,0.172624 0.50139,0.337629 0.24667,0.164931 0.48356,0.361487 0.23935,0.18864 0.46841,0.387985 0.22641,0.196741 0.44526,0.406771 0.21886,0.21002 0.42744,0.430685 0.20861,0.220672 0.40428,0.449474 0.19567,0.228773 0.38113,0.468261 0.18542,0.239462 0.35797,0.48705 0.17252,0.2476 0.33482,0.505841 0.16231,0.258253 0.31155,0.519401 0.14925,0.261137 0.28049,0.535739 0.13123,0.274601 0.25721,0.549294 0.12602,0.274712 0.23129,0.560295 0.1052,0.280372 0.2027,0.568736 0.0922,0.288472 0.17155,0.579836 0.0792,0.291357 0.14292,0.588277 0.0637,0.296905 0.11688,0.594043 0.0532,0.297127 0.0881,0.59725 0.0348,0.300123 0.0569,0.603131 0.0218,0.303008 0.0255,0.603775 m 1.21931,59.170241 q 0.006,0.30334 -6e-4,0.60432 -0.007,0.30097 -0.0322,0.60496 -0.0255,0.29872 -0.0661,0.60304 -0.0359,0.29898 -0.0898,0.59569 -0.0514,0.29931 -0.11859,0.59367 -0.0672,0.29435 -0.15013,0.58385 -0.083,0.28947 -0.17899,0.58183 -0.096,0.29235 -0.20802,0.56934 -0.112,0.27701 -0.22914,0.55932 -0.11715,0.2823 -0.26354,0.54172 -0.1464,0.2594 -0.28722,0.53435 -0.14081,0.27497 -0.3137,0.51921 -0.17284,0.24423 -0.33504,0.49872 -0.17798,0.24959 -0.36407,0.48623 -0.18864,0.23935 -0.38542,0.46574 -0.19937,0.22911 -0.40934,0.44793 -0.21002,0.21886 -0.42812,0.42477 -0.21812,0.20591 -0.45203,0.40695 -0.23392,0.20103 -0.46826,0.38112 -0.23691,0.1828 -0.48706,0.35798 -0.2476,0.17251 -0.50584,0.33482 -0.25825,0.16226 -0.51684,0.30888 -0.25858,0.14659 -0.5383,0.28315 -0.2797,0.1366 -0.54673,0.25455 -0.27472,0.12599 -0.5603,0.23129 -0.28292,0.10786 -0.56873,0.2027 -0.28847,0.0923 -0.5824,0.17418 -0.29395,0.0819 -0.58827,0.14292 -0.29436,0.061 -0.59149,0.11422 -0.29712,0.0532 -0.59981,0.0908 -0.30268,0.0377 -0.600567,0.0542 -0.297903,0.0163 -0.606338,0.0281 -0.308445,0.0115 -0.606981,-0.003 -0.298496,-0.0148 -0.602292,-0.0296 -0.303748,-0.0148 -0.603046,-0.0661 -0.299309,-0.0514 -0.595685,-0.0898 -0.296425,-0.0383 -0.593666,-0.11859 -0.297275,-0.0802 -0.58652,-0.15272 -0.294612,-0.0776 -0.579163,-0.1764 -0.287103,-0.0961 -0.569346,-0.20802 -0.282109,-0.10667 -0.559318,-0.22914 -0.277191,-0.12247 -0.541712,-0.26354 -0.272308,-0.13827 -0.534359,-0.28722 -0.264725,-0.1515 -0.519201,-0.3137 -0.25448,-0.16219 -0.501388,-0.33759 -0.246897,-0.17543 -0.483566,-0.36148 -0.236651,-0.18609 -0.468413,-0.38799 -0.226405,-0.19674 -0.445257,-0.40677 -0.21886,-0.21002 -0.427441,-0.43069 -0.208614,-0.22067 -0.404282,-0.44947 -0.195668,-0.22877 -0.381124,-0.46826 -0.185422,-0.2395 -0.357972,-0.48705 -0.172514,-0.2476 -0.334818,-0.50584 -0.162268,-0.25825 -0.311553,-0.51941 -0.149248,-0.26113 -0.280482,-0.53573 -0.131235,-0.2746 -0.257217,-0.5493 -0.125982,-0.27471 -0.231288,-0.56029 -0.105157,-0.28037 -0.200032,-0.56617 -0.09491,-0.29106 -0.174178,-0.5824 -0.07927,-0.29136 -0.142923,-0.58828 -0.06369,-0.2969 -0.116883,-0.59404 -0.05064,-0.29979 -0.08814,-0.59725 -0.03751,-0.29746 -0.05693,-0.60313 -0.01923,-0.30568 -0.02552,-0.60378 -0.0059,-0.29809 0.0032,-0.60698 0.0092,-0.30889 0.03218,-0.60496 0.02293,-0.29609 0.06351,-0.60038 0.04065,-0.3043 0.08707,-0.59825 0.04623,-0.29395 0.121248,-0.5911 0.07498,-0.29717 0.152724,-0.58652 0.07764,-0.29461 0.176398,-0.57916 0.09613,-0.28714 0.205322,-0.57191 0.109337,-0.27956 0.231805,-0.55676 0.122468,-0.27719 0.266094,-0.54439 0.133047,-0.27219 0.281962,-0.53424 0.151504,-0.26473 0.316324,-0.51665 0.164857,-0.25192 0.337629,-0.50138 0.172772,-0.24945 0.361487,-0.48357 0.18864,-0.23935 0.387981,-0.46841 0.196741,-0.2264 0.406771,-0.44526 0.21002,-0.21886 0.430688,-0.42744 0.220672,-0.20861 0.449471,-0.40428 0.228773,-0.19567 0.468261,-0.38112 0.239499,-0.18543 0.487051,-0.35798 0.247599,-0.17251 0.503174,-0.33737 0.255589,-0.16485 0.522067,-0.309 0.266464,-0.14414 0.533072,-0.28303 0.266574,-0.13893 0.551961,-0.25466 0.272123,-0.12332 0.560295,-0.23129 0.280372,-0.1052 0.566173,-0.20004 0.291061,-0.0949 0.579732,-0.17676 0.29402,-0.0767 0.588277,-0.14293 0.296905,-0.0636 0.59671,-0.11433 0.297127,-0.0532 0.597254,-0.0881 0.300123,-0.0348 0.603131,-0.0569 0.303008,-0.0218 0.603775,-0.0255 0.300788,-0.003 0.604314,6e-4 0.303674,0.01 0.604963,0.0322 0.301307,0.0226 0.603037,0.0661 0.30153,0.0329 0.59825,0.0871 0.29672,0.0541 0.59111,0.12125 0.29435,0.0672 0.58652,0.15273 0.29461,0.0776 0.57916,0.17639 0.2871,0.0961 0.57191,0.20533 0.27956,0.10933 0.55676,0.2318 0.27719,0.12247 0.54427,0.26084 0.26709,0.13841 0.53436,0.28722 0.26727,0.14884 0.51664,0.31636 0.24934,0.16752 0.49872,0.33504 0.24933,0.16752 0.48623,0.36407 0.23935,0.18864 0.46575,0.38543 0.2291,0.19933 0.44792,0.40933 0.21886,0.21002 0.42734,0.42545 0.20606,0.22334 0.40439,0.45471 0.19566,0.22877 0.38112,0.46826 0.18542,0.23946 0.35797,0.48705 0.17255,0.2476 0.33737,0.50317 0.16486,0.25559 0.309,0.52207 0.14414,0.26647 0.28303,0.53307 0.13893,0.26657 0.25467,0.55197 0.12332,0.27212 0.22862,0.55773 0.11041,0.28022 0.2027,0.56873 0.0922,0.28847 0.17677,0.57974 0.0767,0.29402 0.14292,0.58827 0.0637,0.2969 0.11688,0.59405 l 0.0856,0.59991 q 0.0348,0.30013 0.0542,0.60057 0.0218,0.30301 0.0281,0.60634 M 120.22035,48.343866 q 0.006,0.303341 -6e-4,0.604311 -0.01,0.303674 -0.0322,0.604963 -0.0277,0.301454 -0.0661,0.603046 -0.0359,0.298976 -0.0898,0.595685 -0.0514,0.299309 -0.11859,0.593666 -0.0672,0.29439 -0.15272,0.58652 -0.0856,0.292133 -0.1764,0.579162 -0.0909,0.28703 -0.20802,0.569347 -0.11714,0.282331 -0.22914,0.559318 -0.112,0.277005 -0.26355,0.541712 -0.1515,0.264725 -0.28721,0.534355 -0.13571,0.269645 -0.3137,0.519205 -0.17798,0.249597 -0.33504,0.498717 -0.17798,0.249597 -0.36407,0.486237 -0.18864,0.239351 -0.38542,0.465746 -0.19937,0.229105 -0.40934,0.447924 -0.21002,0.21886 -0.43068,0.427441 -0.22067,0.208614 -0.44947,0.404282 -0.22878,0.195668 -0.46827,0.381127 -0.23946,0.185422 -0.48705,0.357973 -0.2476,0.17255 -0.50584,0.334818 -0.25825,0.162305 -0.5194,0.311552 -0.26114,0.149248 -0.53574,0.280483 -0.2746,0.131234 -0.54929,0.257216 -0.27472,0.126019 -0.5603,0.231288 -0.28037,0.105195 -0.56617,0.200033 -0.29106,0.09491 -0.5824,0.174178 -0.29136,0.07927 -0.58828,0.142922 -0.2969,0.06369 -0.59404,0.116883 -0.29713,0.05319 -0.59725,0.08814 -0.30012,0.03477 -0.60313,0.05693 -0.30301,0.02182 -0.60378,0.02552 -0.30079,0.0034 -0.60698,-0.0032 -0.30623,-0.0067 -0.60496,-0.03218 -0.29872,-0.02552 -0.59771,-0.06092 -0.29898,-0.03588 -0.60092,-0.08966 -0.30193,-0.05393 -0.5911,-0.121247 -0.28914,-0.06728 -0.58652,-0.152725 -0.29461,-0.07764 -0.57916,-0.176397 -0.2871,-0.09613 -0.57191,-0.205322 -0.277,-0.112001 -0.5542,-0.234469 -0.27719,-0.122468 -0.5495,-0.26073 -0.26965,-0.13571 -0.52913,-0.287325 -0.26472,-0.151542 -0.5192,-0.313698 -0.25448,-0.162194 -0.50139,-0.337592 -0.24689,-0.175436 -0.48356,-0.361524 -0.23665,-0.186088 -0.468418,-0.387981 -0.2264,-0.196741 -0.44526,-0.406775 -0.21886,-0.21002 -0.42743,-0.430681 -0.20862,-0.220672 -0.40429,-0.449474 -0.19567,-0.228773 -0.38112,-0.468261 -0.18542,-0.239462 -0.35797,-0.487055 -0.17252,-0.247599 -0.33482,-0.505841 -0.16231,-0.258252 -0.31155,-0.519397 -0.14925,-0.261137 -0.28304,-0.533071 -0.13379,-0.271938 -0.25466,-0.551966 -0.12332,-0.272122 -0.23129,-0.560295 -0.1052,-0.280371 -0.2027,-0.568728 -0.0923,-0.288472 -0.1741,-0.577169 -0.0767,-0.29402 -0.14292,-0.588277 -0.0637,-0.296905 -0.11433,-0.596713 -0.0532,-0.297127 -0.0881,-0.597254 -0.0351,-0.300123 -0.0569,-0.603128 -0.0218,-0.303008 -0.0255,-0.603778 -0.003,-0.300789 6e-4,-0.604315 0.004,-0.303526 0.0322,-0.604962 0.0251,-0.30397 0.0661,-0.603046 0.0329,-0.301529 0.0871,-0.598245 0.0541,-0.29672 0.12125,-0.591106 0.0672,-0.294353 0.15272,-0.586516 0.0776,-0.294612 0.1764,-0.579163 0.0961,-0.287103 0.20532,-0.57191 0.10934,-0.279557 0.23181,-0.556758 0.12247,-0.277191 0.26084,-0.544276 0.13841,-0.267092 0.28721,-0.534355 0.14884,-0.267277 0.31633,-0.516641 0.16752,-0.249339 0.33504,-0.498717 0.16752,-0.249338 0.36407,-0.486237 0.18864,-0.239352 0.38542,-0.465746 0.19933,-0.229105 0.40934,-0.447925 0.21002,-0.218859 0.42801,-0.43 0.22079,-0.203361 0.45214,-0.401722 0.228778,-0.195668 0.468268,-0.381124 0.23946,-0.185422 0.48705,-0.357973 0.2476,-0.172513 0.50317,-0.33737 0.25559,-0.164857 0.52207,-0.309 0.26646,-0.144143 0.53307,-0.283035 0.26661,-0.138928 0.55196,-0.254664 0.27213,-0.123319 0.5603,-0.231288 0.27767,-0.107747 0.56617,-0.200032 0.28847,-0.09229 0.57973,-0.176768 0.29402,-0.07671 0.58828,-0.142922 0.2969,-0.06369 0.59404,-0.116883 l 0.59992,-0.08559 q 0.30012,-0.03477 0.60057,-0.05423 0.30301,-0.02182 0.60633,-0.02811 0.30334,-0.0063 0.60432,5.99e-4 0.30098,0.007 0.60496,0.03218 0.30397,0.02515 0.60305,0.06606 0.29905,0.04095 0.59824,0.08707 0.29917,0.04616 0.59111,0.121248 0.29195,0.07509 0.58385,0.150136 0.29728,0.08019 0.58183,0.178986 0.2871,0.09613 0.57191,0.205322 0.277,0.112 0.55419,0.234469 0.27719,0.122468 0.54684,0.258178 0.26964,0.13571 0.5318,0.289877 0.26472,0.151504 0.5192,0.313698 0.25448,0.162194 0.49872,0.33504 0.24423,0.172846 0.48623,0.364076 0.23935,0.18864 0.46575,0.385422 0.2291,0.19933 0.44792,0.409331 0.21886,0.210019 0.42477,0.428124 0.20592,0.21812 0.40695,0.452034 0.20103,0.233914 0.38113,0.468261 0.18276,0.23691 0.35797,0.487051 0.17251,0.2476 0.33482,0.505841 0.16227,0.258252 0.30889,0.516841 0.14658,0.258585 0.28314,0.538298 0.13656,0.279706 0.25711,0.544068 0.12058,0.264356 0.22873,0.562962 0.10819,0.298644 0.2027,0.568732 0.0945,0.270126 0.1741,0.577169 0.0796,0.307077 0.14559,0.59084 0.066,0.283775 0.11167,0.594151 0.0456,0.310369 0.0908,0.599817 0.0452,0.28947 0.0542,0.600568 0.009,0.311108 0.0281,0.606334 m 1.52408,73.960193 q 0.006,0.30334 -0.003,0.60698 -0.01,0.30363 -0.0322,0.60496 -0.0226,0.3013 -0.0635,0.60038 -0.0329,0.30152 -0.0871,0.59824 -0.0541,0.29672 -0.12124,0.59111 -0.0672,0.29435 -0.15273,0.58652 -0.0776,0.29461 -0.17639,0.57916 -0.0961,0.2871 -0.20533,0.5719 -0.112,0.27701 -0.23447,0.5542 -0.12246,0.27719 -0.26073,0.54951 -0.13571,0.26964 -0.28732,0.52912 -0.15151,0.26473 -0.3137,0.51921 -0.16219,0.25448 -0.33759,0.50139 -0.17544,0.24689 -0.36149,0.48356 -0.18609,0.23665 -0.38798,0.46841 -0.19674,0.22641 -0.40677,0.44526 -0.21002,0.21886 -0.43069,0.42744 -0.22067,0.20861 -0.44947,0.40428 -0.22878,0.19567 -0.46826,0.38113 -0.23947,0.18542 -0.48706,0.35797 -0.2476,0.17251 -0.50584,0.33482 -0.25825,0.1623 -0.5194,0.31155 -0.26114,0.14925 -0.53574,0.28048 -0.2746,0.13124 -0.54662,0.25977 -0.27205,0.12853 -0.56296,0.22874 -0.28038,0.10519 -0.56618,0.20003 -0.29106,0.0949 -0.57973,0.17677 -0.29402,0.0767 -0.58828,0.14292 -0.2969,0.0637 -0.59671,0.11433 -0.29712,0.0532 -0.59725,0.0881 -0.30012,0.0348 -0.60313,0.0569 -0.30301,0.0218 -0.60378,0.0255 -0.30078,0.003 -0.60431,-6e-4 -0.30353,-0.004 -0.60496,-0.0322 -0.30397,-0.0251 -0.60304,-0.0661 -0.30153,-0.0329 -0.59826,-0.0871 -0.29672,-0.0541 -0.5911,-0.12125 -0.29435,-0.0672 -0.58652,-0.15272 -0.29461,-0.0776 -0.57916,-0.1764 -0.2871,-0.0961 -0.57191,-0.20532 -0.27956,-0.10934 -0.55675,-0.23181 -0.27719,-0.12246 -0.54428,-0.26087 -0.26709,-0.13841 -0.53436,-0.28722 -0.26727,-0.14884 -0.51664,-0.31632 -0.24934,-0.16752 -0.49872,-0.33504 -0.24933,-0.16752 -0.48623,-0.36408 -0.23935,-0.18864 -0.46574,-0.38542 -0.22911,-0.19929 -0.44793,-0.40933 -0.21886,-0.21002 -0.42744,-0.43069 -0.20861,-0.22067 -0.40428,-0.44947 -0.195668,-0.22877 -0.381128,-0.46826 -0.18542,-0.23946 -0.35797,-0.48705 -0.17252,-0.2476 -0.33737,-0.50318 -0.16486,-0.25558 -0.309,-0.52206 -0.14415,-0.2665 -0.28304,-0.53307 -0.13893,-0.26658 -0.25466,-0.55197 -0.12332,-0.27212 -0.23129,-0.56029 -0.10516,-0.28037 -0.20003,-0.56617 -0.0923,-0.28848 -0.17677,-0.57973 -0.0767,-0.29402 -0.14292,-0.58828 -0.0637,-0.2969 -0.11688,-0.59405 l -0.0856,-0.59991 q -0.0351,-0.30013 -0.0569,-0.60313 -0.0192,-0.30046 -0.0255,-0.60378 -0.006,-0.30334 6e-4,-0.60432 0.007,-0.30097 0.0322,-0.60496 0.0251,-0.30397 0.0661,-0.60304 0.0333,-0.30153 0.0871,-0.59825 0.0541,-0.29672 0.12125,-0.5911 0.0672,-0.29436 0.15272,-0.58652 0.0776,-0.29461 0.1764,-0.57916 0.0961,-0.2871 0.20532,-0.57191 l 0.23181,-0.55676 q 0.12513,-0.27464 0.26354,-0.54172 0.1356,-0.27486 0.28721,-0.53435 0.15151,-0.26473 0.3137,-0.51921 0.16219,-0.25447 0.33504,-0.49871 0.17285,-0.24424 0.36408,-0.48624 0.18864,-0.23935 0.385418,-0.46574 0.19933,-0.22911 0.40933,-0.44793 0.21002,-0.21886 0.42812,-0.42477 0.21812,-0.20591 0.45204,-0.40695 0.23391,-0.20103 0.46826,-0.38112 0.23687,-0.18276 0.48705,-0.35797 0.2476,-0.17252 0.50584,-0.33482 0.25825,-0.16231 0.51684,-0.30889 0.25859,-0.14659 0.5383,-0.28315 0.27974,-0.1366 0.54407,-0.2571 0.26435,-0.12059 0.56296,-0.22874 0.29864,-0.10819 0.56873,-0.20269 0.27013,-0.0945 0.57973,-0.17677 0.30963,-0.0823 0.58828,-0.14292 0.27867,-0.0607 0.59671,-0.11434 0.31807,-0.0536 0.59469,-0.0855 0.30268,-0.0377 0.60313,-0.0569 0.30301,-0.0218 0.60634,-0.0281 0.30334,-0.006 0.60431,6e-4 0.30098,0.007 0.60496,0.0322 0.30397,0.0251 0.60305,0.0661 0.29905,0.0409 0.59568,0.0898 0.29661,0.0488 0.59367,0.11858 0.29705,0.0697 0.58652,0.15273 0.29461,0.0776 0.57916,0.17643 0.2871,0.0961 0.56935,0.20802 0.28211,0.10668 0.55932,0.22918 0.27719,0.12247 0.54171,0.26355 0.27231,0.13826 0.53436,0.28721 0.26472,0.15147 0.5192,0.3137 0.25448,0.16219 0.49872,0.33504 0.24423,0.17284 0.48623,0.36407 0.24201,0.1912 0.46575,0.38543 0.2291,0.19933 0.44793,0.40933 0.21886,0.21002 0.42743,0.43068 0.20862,0.22068 0.40429,0.44948 0.19566,0.22877 0.38112,0.46826 0.18542,0.23946 0.35797,0.48705 0.17252,0.2476 0.33482,0.50584 0.1623,0.25825 0.31155,0.51941 0.14925,0.26113 0.28048,0.53573 0.13124,0.2746 0.25722,0.5493 0.12602,0.27471 0.23129,0.56029 0.10519,0.28037 0.20003,0.56617 0.0923,0.28847 0.17418,0.5824 0.0819,0.29395 0.14292,0.58827 0.061,0.29436 0.11689,0.59405 0.0558,0.29972 0.0881,0.59725 0.0322,0.29757 0.0569,0.60313 0.0244,0.30556 0.0255,0.60378 m 40.54,-67.429504 q 0.006,0.303341 -0.003,0.606982 -0.01,0.303674 -0.0322,0.604962 -0.0226,0.301307 -0.0635,0.600376 -0.041,0.29905 -0.0898,0.595685 -0.0488,0.296609 -0.12114,0.596337 -0.0723,0.299716 -0.15013,0.583849 -0.0776,0.294612 -0.1764,0.579159 -0.0961,0.287103 -0.20802,0.56935 -0.10668,0.282109 -0.22918,0.559318 -0.12247,0.27719 -0.2661,0.544383 -0.14362,0.267166 -0.28466,0.531684 -0.14104,0.264541 -0.3137,0.519205 -0.17262,0.254701 -0.33759,0.501388 -0.16493,0.246711 -0.36407,0.486233 -0.19911,0.239536 -0.38543,0.465748 -0.18631,0.22622 -0.40677,0.44526 -0.22045,0.21904 -0.43068,0.42744 -0.21021,0.20839 -0.44947,0.40427 -0.23136,0.19837 -0.46827,0.38113 -0.23946,0.18542 -0.48961,0.36067 -0.2476,0.17252 -0.50584,0.33482 -0.2557,0.15961 -0.51684,0.30889 -0.2638,0.1467 -0.53574,0.28048 -0.2719,0.13379 -0.54662,0.25977 -0.27471,0.12598 -0.56297,0.22874 -0.28825,0.10275 -0.56873,0.20269 -0.28048,0.1 -0.57984,0.17156 -0.29938,0.0716 -0.58828,0.14292 -0.28891,0.0713 -0.59404,0.11688 -0.30515,0.0455 -0.59725,0.0882 -0.29214,0.0426 -0.60313,0.0569 -0.31104,0.0144 -0.60378,0.0255 -0.29276,0.0115 -0.60698,-0.003 -0.31422,-0.0144 -0.6023,-0.0296 -0.28806,-0.0148 -0.60304,-0.0661 -0.31499,-0.051 -0.59825,-0.0871 -0.28329,-0.0359 -0.5911,-0.12125 -0.30782,-0.0852 -0.58908,-0.15006 -0.28122,-0.0648 -0.57917,-0.1764 -0.2979,-0.11159 -0.56934,-0.20802 -0.27142,-0.0964 -0.55676,-0.23181 -0.28529,-0.13537 -0.54427,-0.26084 -0.25896,-0.12546 -0.53436,-0.28721 -0.27538,-0.16172 -0.5192,-0.31366 -0.24383,-0.15195 -0.50139,-0.33763 -0.25758,-0.18568 -0.48357,-0.36149 -0.22596,-0.17584 -0.46841,-0.38798 -0.24242,-0.21217 -0.44526,-0.40678 -0.20284,-0.19463 -0.42744,-0.43068 -0.22463,-0.23606 -0.40428,-0.449471 -0.17965,-0.213423 -0.38112,-0.468264 -0.20144,-0.25485 -0.35798,-0.487055 -0.15649,-0.232213 -0.33481,-0.505841 -0.17832,-0.273602 -0.30897,-0.522067 -0.13068,-0.248451 -0.28307,-0.533068 -0.15235,-0.284625 -0.25721,-0.549299 -0.10487,-0.264688 -0.23129,-0.560291 -0.12643,-0.295611 -0.19748,-0.568839 -0.071,-0.273196 -0.17677,-0.579729 -0.0767,-0.29402 -0.14292,-0.588277 -0.0662,-0.294242 -0.11689,-0.594047 -0.0506,-0.29979 -0.0881,-0.597253 -0.0325,-0.302787 -0.0543,-0.605795 -0.0192,-0.300456 -0.0255,-0.603778 -0.009,-0.300641 6e-4,-0.604315 0.01,-0.303674 0.0322,-0.604962 0.0226,-0.301307 0.0635,-0.600379 0.0355,-0.304192 0.0896,-0.600912 0.0541,-0.29672 0.12125,-0.591106 0.0672,-0.294353 0.15014,-0.58385 0.0776,-0.294611 0.17639,-0.579162 0.0961,-0.287104 0.20533,-0.57191 0.11189,-0.28222 0.23439,-0.559426 0.12247,-0.27719 0.26354,-0.541712 0.13305,-0.272197 0.28455,-0.536918 0.15151,-0.264725 0.31633,-0.516642 0.16219,-0.254479 0.33504,-0.498716 0.1754,-0.246934 0.36407,-0.486238 0.18609,-0.236651 0.38543,-0.465745 0.19932,-0.229106 0.40933,-0.447928 0.21002,-0.21886 0.42812,-0.42477 0.21812,-0.205914 0.44948,-0.404282 0.23136,-0.198369 0.47082,-0.383791 0.23946,-0.185422 0.48449,-0.355309 0.25015,-0.175177 0.50317,-0.337371 0.25826,-0.162267 0.52207,-0.308963 0.26635,-0.149396 0.53563,-0.285698 0.27194,-0.133786 0.54941,-0.252001 0.27471,-0.125982 0.56029,-0.231288 0.28292,-0.107858 0.56873,-0.202696 0.28847,-0.09225 0.57717,-0.174103 0.29402,-0.07668 0.58828,-0.142923 0.29946,-0.06632 0.59671,-0.114331 0.29716,-0.05319 0.59982,-0.09084 0.30012,-0.03477 0.60056,-0.05423 0.30046,-0.01923 0.60634,-0.02811 0.30589,-0.0089 0.60175,0.0031 0.29587,0.01258 0.60496,0.03218 0.30912,0.0196 0.60561,0.0634 0.2965,0.04361 0.59569,0.08977 0.29916,0.04616 0.59366,0.118584 0.2945,0.07242 0.58652,0.152725 0.29202,0.0803 0.57916,0.176397 0.28711,0.09613 0.56935,0.208022 0.28222,0.11189 0.55932,0.22918 0.27708,0.117253 0.54171,0.263541 0.27231,0.138263 0.53436,0.287215 0.26472,0.151504 0.5192,0.313697 0.25448,0.162194 0.49872,0.33504 0.24423,0.172847 0.48623,0.364076 0.24202,0.191193 0.46575,0.385422 0.22911,0.19933 0.44792,0.409331 0.21886,0.210019 0.42477,0.428121 0.20592,0.21812 0.40696,0.452038 0.20103,0.233914 0.38112,0.46826 0.18013,0.234358 0.35797,0.487051 0.17784,0.252704 0.33482,0.505841 0.15694,0.253148 0.309,0.522071 0.15206,0.268905 0.28563,0.530401 0.13356,0.261471 0.25466,0.551962 0.1211,0.290506 0.23129,0.560295 0.10516,0.280371 0.19748,0.568843 0.0923,0.288472 0.17677,0.579729 0.0845,0.291246 0.14292,0.588276 0.0585,0.297016 0.11688,0.594043 0.0585,0.297017 0.0881,0.597251 0.0325,0.302786 0.0517,0.603238 0.0218,0.303008 0.0307,0.603671 m 1.21931,59.170245 q 0.003,0.30078 -0.006,0.60442 -0.01,0.30367 -0.0296,0.60229 -0.02,0.29864 -0.0634,0.6056 -0.0434,0.30697 -0.0898,0.59569 -0.0514,0.29931 -0.11858,0.59367 -0.0672,0.29435 -0.15273,0.58652 -0.0856,0.29213 -0.17639,0.57915 -0.0909,0.28703 -0.20803,0.56935 -0.11714,0.28234 -0.22918,0.55933 -0.112,0.277 -0.26354,0.54171 -0.1515,0.26472 -0.28721,0.53435 -0.13571,0.26965 -0.31366,0.51921 -0.17799,0.2496 -0.33763,0.50138 -0.15964,0.25182 -0.36149,0.48357 -0.20192,0.23177 -0.38542,0.46574 -0.18354,0.23399 -0.40933,0.44793 -0.22582,0.21394 -0.43069,0.42744 -0.20488,0.2135 -0.44947,0.40428 -0.2446,0.19079 -0.46826,0.38113 -0.22367,0.19037 -0.48706,0.35797 -0.26339,0.16759 -0.50584,0.33482 -0.24246,0.16718 -0.52207,0.309 -0.27959,0.14181 -0.53039,0.28562 -0.25082,0.14381 -0.55197,0.25466 -0.3012,0.11086 -0.56029,0.23129 -0.25911,0.12044 -0.56884,0.19748 -0.30971,0.077 -0.57974,0.17677 -0.27001,0.0998 -0.58827,0.14292 -0.31828,0.0432 -0.59405,0.11689 -0.27578,0.0737 -0.59725,0.0881 -0.30278,0.0325 -0.60579,0.0543 -0.30046,0.0192 -0.60111,0.0281 -0.30334,0.006 -0.60699,-0.003 -0.30367,-0.01 -0.60495,-0.0322 -0.30131,-0.0226 -0.60038,-0.0635 -0.30153,-0.0329 -0.60092,-0.0896 -0.29406,-0.0515 -0.5911,-0.12125 -0.29436,-0.0672 -0.58386,-0.15014 -0.29461,-0.0776 -0.57916,-0.17639 -0.28714,-0.0961 -0.5719,-0.20532 -0.27956,-0.10934 -0.55676,-0.23181 -0.27719,-0.12247 -0.54439,-0.26609 -0.27219,-0.13305 -0.53168,-0.28467 -0.26473,-0.1515 -0.51921,-0.31369 -0.25448,-0.1622 -0.50138,-0.3376 -0.2469,-0.17543 -0.48623,-0.36407 -0.23935,-0.18864 -0.46575,-0.38542 -0.22641,-0.19674 -0.44526,-0.40678 -0.21886,-0.21002 -0.42744,-0.43068 -0.20861,-0.22067 -0.40428,-0.44947 -0.19837,-0.23136 -0.38113,-0.46827 -0.18542,-0.23946 -0.36063,-0.48961 -0.17252,-0.2476 -0.33482,-0.50584 -0.15964,-0.2557 -0.30889,-0.51684 -0.14669,-0.2638 -0.28303,-0.53306 -0.13379,-0.27194 -0.25467,-0.55197 -0.12602,-0.27472 -0.23129,-0.56029 -0.10785,-0.28293 -0.20269,-0.56874 -0.0923,-0.28847 -0.17411,-0.57717 -0.0767,-0.29402 -0.14292,-0.58827 -0.0637,-0.29691 -0.11433,-0.59672 -0.0532,-0.29713 -0.0881,-0.59725 -0.0348,-0.30012 -0.0569,-0.60313 -0.0218,-0.30301 -0.0255,-0.60378 -0.003,-0.30078 6e-4,-0.60431 0.01,-0.30367 0.0322,-0.60496 0.0251,-0.30397 0.0661,-0.60305 0.0329,-0.30153 0.0871,-0.59824 0.0541,-0.29672 0.12125,-0.59111 0.0672,-0.29439 0.15006,-0.58908 0.0803,-0.29202 0.17644,-0.57916 0.0961,-0.2871 0.20802,-0.56934 0.11192,-0.28223 0.2318,-0.55676 0.11992,-0.27453 0.26084,-0.54428 0.14097,-0.26975 0.28722,-0.53436 0.14629,-0.26461 0.3137,-0.5192 0.16741,-0.25459 0.33504,-0.49872 0.16763,-0.24412 0.36407,-0.48623 0.19648,-0.24209 0.38543,-0.46575 0.18897,-0.22363 0.40933,-0.44793 0.22034,-0.22426 0.42812,-0.42476 0.20777,-0.20048 0.45204,-0.40696 0.24427,-0.20646 0.46826,-0.38112 0.224,-0.17466 0.48705,-0.35797 0.26306,-0.18328 0.50584,-0.33482 0.24279,-0.1515 0.52207,-0.309 0.2793,-0.1575 0.53307,-0.28303 0.25378,-0.12558 0.54929,-0.25722 0.2955,-0.13168 0.5603,-0.23129 0.28037,-0.10519 0.56884,-0.19748 0.28847,-0.0923 0.57973,-0.17677 0.29125,-0.0845 0.58828,-0.14292 0.2969,-0.0637 0.59404,-0.11688 0.29724,-0.048 0.59725,-0.0882 0.30279,-0.0325 0.60324,-0.0516 0.30301,-0.0218 0.60634,-0.0281 0.30064,-0.009 0.60431,6e-4 0.30368,0.01 0.60496,0.0322 0.30131,0.0226 0.60038,0.0635 0.30419,0.0355 0.60091,0.0897 0.29672,0.0541 0.59111,0.12125 0.29435,0.0672 0.58385,0.15013 0.29461,0.0776 0.57916,0.17644 0.2871,0.0961 0.57191,0.20532 0.27967,0.11455 0.55686,0.23702 0.27719,0.12247 0.54684,0.25818 0.26964,0.13571 0.5318,0.28987 0.26472,0.15151 0.5192,0.3137 0.25448,0.1622 0.49872,0.33504 0.24423,0.17285 0.48623,0.36408 0.24202,0.19119 0.46575,0.38542 0.22374,0.19418 0.44792,0.40933 0.22415,0.21512 0.42477,0.42812 0.20059,0.21298 0.40429,0.44948 0.19836,0.23136 0.38379,0.47082 0.18276,0.23691 0.35531,0.48449 0.17517,0.25015 0.33481,0.50584 0.16231,0.25825 0.31156,0.5194 0.14939,0.26636 0.28314,0.5383 0.13379,0.2719 0.25711,0.54407 0.12332,0.27212 0.22873,0.56296 0.10538,0.2908 0.2027,0.56873 0.0923,0.28848 0.1741,0.57717 0.0767,0.29402 0.14293,0.58828 0.0663,0.29949 0.11433,0.59671 0.0532,0.29713 0.0908,0.59982 0.0348,0.30012 0.0543,0.60056 0.0192,0.30046 0.0281,0.60634",
            fill: "#754b8f"
        });

        ctx.restore();
    },

    square: containerToDraw => {
        const { ctx, radius } = containerToDraw;
        ctx.beginPath();
        ctx.fillStyle = containerToDraw.getRenderColor("#ffe869");
        ctx.strokeStyle = containerToDraw.getRenderColor("#cfbc55");
        ctx.lineWidth = containerToDraw.radius / 5;
        ctx.rect(-radius, -radius, radius * 2, radius * 2);
        ctx.fill();
        ctx.stroke();
    },
    digger: containerToDraw => {
        const { ctx, radius } = containerToDraw;

        ctx.save();

        const rotationSpeed = 3;
        const currentTime = Date.now();
        const elapsedTime = (currentTime - containerToDraw.createdTime) / 1000;
        const rotation = (elapsedTime * rotationSpeed) % (Math.PI * 2);

        ctx.save();
        ctx.rotate(rotation);

        const spikeCount = 8;
        const outerRadius = radius * 0.85;
        const innerRadius = radius * 0.85;
        const spikeLength = radius * 0.3;

        ctx.fillStyle = containerToDraw.getRenderColor("#000000");

        ctx.beginPath();

        const firstSpikeX = (outerRadius + spikeLength) * Math.cos(0.5 / spikeCount * P2);
        const firstSpikeY = (outerRadius + spikeLength) * Math.sin(0.5 / spikeCount * P2);

        ctx.moveTo(firstSpikeX, firstSpikeY);

        for (let i = 0; i < spikeCount; i++) {
            const currentAngle = ((i + 0.5) / spikeCount) * P2;
            const nextAngle = ((i + 1.5) / spikeCount) * P2;

            const spikeX = (outerRadius + spikeLength) * Math.cos(currentAngle);
            const spikeY = (outerRadius + spikeLength) * Math.sin(currentAngle);

            const arcX = outerRadius * Math.cos((i + 1) / spikeCount * P2);
            const arcY = outerRadius * Math.sin((i + 1) / spikeCount * P2);

            const nextSpikeX = (outerRadius + spikeLength) * Math.cos(nextAngle);
            const nextSpikeY = (outerRadius + spikeLength) * Math.sin(nextAngle);

            ctx.quadraticCurveTo(arcX, arcY, nextSpikeX, nextSpikeY);
        }

        ctx.arc(0, 0, innerRadius, 0, P2, true);
        ctx.closePath();
        ctx.fill();

        ctx.restore();

        ctx.save();

        ctx.rotate(-containerToDraw.rotation);

        const bodyColor = containerToDraw.getRenderColor("#888888");
        const borderColor = containerToDraw.getRenderColor("#555555");

        ctx.beginPath();
        ctx.fillStyle = bodyColor;
        ctx.lineWidth = radius * 0.1;
        ctx.strokeStyle = borderColor;
        ctx.arc(
            0, 0,
            radius * 0.85,
            0, P2
        );
        ctx.fill();
        ctx.stroke();

        const mouthX = radius * 0.22;
        const mouthY = radius * 0.32;

        ctx.beginPath();
        ctx.lineWidth = radius * 0.05;
        ctx.strokeStyle = "#111111";
        ctx.moveTo(-mouthX, mouthY);
        ctx.bezierCurveTo(0, mouthY - radius * 0.15, 0, mouthY - radius * 0.15, mouthX, mouthY);
        ctx.stroke();

        const eyeCenterX = radius * 0.22;
        const eyeCenterY = -radius * 0.17;

        const eyeWidth = radius * 0.18;
        const eyeHeight = radius * 0.3;

        ctx.beginPath();
        ctx.fillStyle = "#111111";
        ctx.rect(
            -eyeCenterX - eyeWidth / 2, eyeCenterY - eyeHeight / 2,
            eyeWidth, eyeHeight
        );
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = "#111111";
        ctx.rect(
            eyeCenterX - eyeWidth / 2, eyeCenterY - eyeHeight / 2,
            eyeWidth, eyeHeight
        );
        ctx.fill();
        const eyeRotation = containerToDraw.rotation;
        const eyeTransing = containerToDraw.transing;

        const direction = eyeTransing + (eyeRotation * 30);
        const radians = Geometry.degreesToRadians(direction);

        const maxEyeMovement = 0.7;

        const eyeInsideWidth = eyeWidth * 0.6;
        const eyeInsideHeight = eyeHeight * 0.4;

        const ellRadius = Math.sqrt(
            (eyeInsideWidth * Math.sin(radians)) ** 2
            + (eyeInsideHeight * Math.cos(radians)) ** 2
        );

        let eyeOffsetX = eyeInsideWidth * eyeInsideHeight * Math.cos(radians) / ellRadius;
        let eyeOffsetY = eyeInsideWidth * eyeInsideHeight * Math.sin(radians) / ellRadius;

        const offsetLength = Math.sqrt(eyeOffsetX * eyeOffsetX + eyeOffsetY * eyeOffsetY);

        if (offsetLength > eyeWidth * maxEyeMovement) {
            const scale = eyeWidth * maxEyeMovement / offsetLength;
            eyeOffsetX *= scale;
            eyeOffsetY *= scale;
        }

        const eyeballWidth = eyeWidth * 0.8;
        const eyeballHeight = eyeHeight * 0.7;

        ctx.save();
        ctx.beginPath();
        ctx.rect(
            -eyeCenterX - eyeWidth / 2, eyeCenterY - eyeHeight / 2,
            eyeWidth, eyeHeight
        );
        ctx.clip();

        ctx.beginPath();
        ctx.fillStyle = "#eeeeee";
        ctx.rect(
            -eyeCenterX + eyeOffsetX - eyeballWidth / 2,
            eyeCenterY + eyeOffsetY - eyeballHeight / 2,
            eyeballWidth, eyeballHeight
        );
        ctx.fill();
        ctx.lineWidth = 0.5;
        ctx.strokeStyle = "#111111";
        ctx.stroke();
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.rect(
            eyeCenterX - eyeWidth / 2, eyeCenterY - eyeHeight / 2,
            eyeWidth, eyeHeight
        );
        ctx.clip();

        ctx.beginPath();
        ctx.fillStyle = "#eeeeee";
        ctx.rect(
            eyeCenterX + eyeOffsetX - eyeballWidth / 2,
            eyeCenterY + eyeOffsetY - eyeballHeight / 2,
            eyeballWidth, eyeballHeight
        );
        ctx.fill();
        ctx.stroke();
        ctx.restore();

        ctx.restore();

        ctx.restore();
    }
};
