import { ClientApplication } from "../../main";
import { ZoneName, Zones } from "../../../../common/src/definitions/zones";
import { Camera } from "./camera";
import { RenderContainer } from "./misc";
import { Geometry } from "../../../../common/src/engine/maths/geometry";
import { PI } from "../../../../common/src/engine/maths/constants";

export class Renderer {
    containers = new Set<RenderContainer>();

    addContainer(container: RenderContainer) {
        this.containers.add(container);
    }

    removeContainer(container: RenderContainer) {
        this.containers.delete(container);
    }

    ctx: CanvasRenderingContext2D;
    canvas: HTMLCanvasElement;

    constructor(
        private app: ClientApplication
    ) {
        this.canvas = app.game.getDOMCanvas();
        const ctx = this.canvas.getContext("2d");

        if (!ctx) throw new Error("Failed to get canvas context.");

        this.ctx = ctx;
    }

    render() {
        this.renderGame();

        this.renderOffscreen();
    }

    renderMouse() {
        if (!this.app.game.running || this.app.settings.data.keyboardMovement) return;

        const ctx = this.ctx;
        const canvas = this.canvas;

        ctx.save();

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.beginPath();
        ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 13;
        ctx.moveTo(canvas.width / 2, canvas.height / 2);
        const mousePosition = this.app.game.input.clientPosition;
        const { clientX, clientY } = mousePosition;
        ctx.lineTo(clientX, clientY);

        const angle = Geometry.angleBetweenPoints({
            x: clientX,
            y: clientY
        }, {
            x: canvas.width / 2,
            y: canvas.height / 2
        });

        const branchAngle = 35 * PI / 180;
        const branchLen = 40;

        ctx.lineTo(
            clientX - Math.cos(angle - branchAngle) * branchLen,
            clientY - Math.sin(angle - branchAngle) * branchLen
        );

        ctx.moveTo(clientX, clientY);
        ctx.lineTo(
            clientX - Math.cos(angle + branchAngle) * branchLen,
            clientY - Math.sin(angle + branchAngle) * branchLen
        );
        ctx.stroke();

        ctx.restore();
    }

    renderOffscreen() {
        if (!this.app.game.running) return;

        const ctx = this.ctx;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.beginPath();

        const { miniMap, leaderboard, expUI, bossbar } = this.app.game;
        miniMap.render(ctx);
        leaderboard.render(ctx);
        expUI.render(ctx);
        bossbar.render(ctx);
    }

    renderGame() {
        const ctx = this.ctx;
        const canvas = this.canvas;
        const { dt } = this.app.game;

        ctx.setTransform(1, 0, 0, 1, 0, 0);

        ctx.clearRect(
            0, 0,
            canvas.width, canvas.height
        );

        ctx.beginPath();

        const { XOffset, YOffset, scale, cameraPosition } = this.app.game.camera;

        ctx.translate(-cameraPosition.x + XOffset, -cameraPosition.y + YOffset);

        ctx.scale(scale, scale);

        this.drawWorldMap();

        this.renderMouse();

        this.app.game.particles.render(dt);

        if (!this.oldSortedContainer || this.oldContainer !== this.containers) {
            this.oldContainer = this.containers;

            this.oldSortedContainer
                = Array.from(this.containers)
                    .sort((a, b) => b.zIndex - a.zIndex);
        }

        this.oldSortedContainer
            = Array.from(this.containers)
                .sort((a, b) => a.zIndex - b.zIndex);

        for (const container of this.oldSortedContainer) {
            ctx.save();
            container.render(dt, !this.app.game.running);
            ctx.restore();
        }
    }

    oldContainer = new Set<RenderContainer>();
    oldSortedContainer?: RenderContainer[];

    zonePaths?: Path2D[];
    gridPath?: Path2D;
    borderPath?: Path2D;

    drawWorldMap() {
        const ctx = this.ctx;

        if (this.zonePaths) {
            let index = 0;
            for (const zone in Zones) {
                const data = Zones[zone as ZoneName];
                ctx.fillStyle = data.backgroundColor;
                ctx.fill(this.zonePaths[index]);
                index++;
            }
        }

        if (this.borderPath) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
            ctx.fill(this.borderPath);
        }

        if (this.gridPath) {
            ctx.lineWidth = 1;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
            ctx.beginPath();

            ctx.stroke(this.gridPath);
        }
    }

    initWorldMap() {
        const { gameHeight, gameWidth } = this.app.game;

        const borderDistance = 999;

        if (!this.zonePaths) {
            this.zonePaths = [];

            let index = 0;
            for (const zonesKey in Zones) {
                const data = Zones[zonesKey as ZoneName];
                this.zonePaths.push(new Path2D());
                const path = this.zonePaths[index];

                const y = (data.y ?? 0);
                const height = (data.height ?? gameHeight);

                const leftBorder = data.x <= 0;
                const rightBorder = (data.x + data.width) >= gameWidth;
                const topBorder = y <= 0;
                const bottomBorder = (height + y) >= gameHeight;

                const border = leftBorder || rightBorder || topBorder || bottomBorder;

                if (border) {
                    let borderX = data.x;
                    let borderY = y;
                    let borderWidth = data.width;
                    let borderHeight = height;

                    if (leftBorder) {
                        borderX -= borderDistance;
                        borderWidth += borderDistance;
                    }

                    if (rightBorder) {
                        borderWidth += data.width + borderDistance;
                    }

                    if (topBorder) {
                        borderY -= borderDistance;
                        borderHeight += borderDistance;
                    }

                    if (bottomBorder) {
                        borderHeight += height + borderDistance;
                    }

                    path.rect(
                        Camera.unitToScreen(borderX),
                        Camera.unitToScreen(borderY),
                        Camera.unitToScreen(borderWidth),
                        Camera.unitToScreen(borderHeight)
                    );
                }

                path.rect(
                    Camera.unitToScreen(data.x),
                    Camera.unitToScreen(y),
                    Camera.unitToScreen(data.width),
                    Camera.unitToScreen(height)
                );

                index++;
            }
        }

        if (!this.borderPath) {
            this.borderPath = new Path2D();
            const path = this.borderPath;

            path.rect(
                Camera.unitToScreen(-borderDistance),
                Camera.unitToScreen(-borderDistance),
                Camera.unitToScreen(gameWidth + borderDistance * 2),
                Camera.unitToScreen(borderDistance)
            );

            path.rect(
                Camera.unitToScreen(-borderDistance),
                Camera.unitToScreen(0),
                Camera.unitToScreen(borderDistance),
                Camera.unitToScreen(gameHeight + borderDistance * 2)
            );

            path.rect(
                Camera.unitToScreen(gameWidth),
                Camera.unitToScreen(0),
                Camera.unitToScreen(borderDistance),
                Camera.unitToScreen(gameHeight + borderDistance)
            );

            path.rect(
                Camera.unitToScreen(0),
                Camera.unitToScreen(gameHeight),
                Camera.unitToScreen(gameWidth),
                Camera.unitToScreen(borderDistance)
            );
        }

        if (!this.gridPath) {
            this.gridPath = new Path2D();
            const path = this.gridPath;

            const gridSize = Camera.unitToScreen(2.5);
            const gridWidth = Camera.unitToScreen(gameWidth);
            const gridHeight = Camera.unitToScreen(gameHeight);

            for (let x = 0; x <= gridWidth; x += gridSize) {
                path.moveTo(x, 0);
                path.lineTo(x, gridHeight);
            }

            for (let y = 0; y <= gridHeight; y += gridSize) {
                path.moveTo(0, y);
                path.lineTo(gridWidth, y);
            }
        }
    }
}
