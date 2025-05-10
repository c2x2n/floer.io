import $ from "jquery";
import { Vec2 } from "@common/utils/vector.ts";
import { PetalDefinition, Petals } from "@common/definitions/petals.ts";
import { RenderContainer } from "@/scripts/utils/render.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { MathGraphics, P2, PI } from "@common/utils/math.ts";
import { MobDefinition, Mobs } from "@common/definitions/mobs.ts";
import { getAssets, getGameAssetsName } from "@/assets/assets.ts";
import { petalAssets } from "@/assets/petals.ts";
import { mobAssets } from "@/assets/mobs.ts";

const defaultCenter = Vec2.new(0, -4);
const defaultRadius = 8;
const defaultBoxSize = 50;

function ICON_drawPetalPiece(
    ctx: CanvasRenderingContext2D,
    xOffset: number,
    yOffset: number,
    displaySize: number,
    petal: PetalDefinition,
    rotation: number,
    silhouette?: boolean
) {
    const container = new RenderContainer(ctx);
    container.radius = Camera.unitToScreen(displaySize / defaultBoxSize / 2);

    container.position = Vec2.new(
        xOffset,
        yOffset
    );
    container.rotation = (petal.images?.slotRotation ?? 0) + (rotation ?? 0)
    container.noCustoming = true;

    if (silhouette) container.brightness = 0;

    container.renderFunc = () => {
        const assets = getAssets("petal", petal);

        if (assets) assets(container);
    }
    container.render(0);
}

export function ICON_drawPetal(
    ctx: CanvasRenderingContext2D,
    petal: PetalDefinition,
    fontSize: number = 11,
    nonMore?: boolean,
    silhouette?: boolean
) {
    const displaySize = petal.images?.slotDisplaySize ?? 25;
    const offsetX = petal.images?.centerXOffset ?? 0;
    const offsetY = petal.images?.centerYOffset ?? 0;
    const cx = fontSize ? defaultCenter.x : 0;
    const cy = fontSize ? defaultCenter.y : 0;

    if (!nonMore && !petal.equipment && petal.isDuplicate) {
        let radiansNow = 0;
        const count = petal.pieceAmount;
        let radians = 0;

        for (let i = 0; i < count; i++) {
            const { x, y } =
                MathGraphics.getPositionOnCircle(
                    radiansNow, defaultRadius, Vec2.new(offsetX, offsetY)
                );
            ICON_drawPetalPiece(ctx, cx + x, cy + y, displaySize, petal, radians, silhouette)
            radiansNow += P2 / count;
            radians += petal.images?.slotRevolution ?? 0
        }
    } else {
        ICON_drawPetalPiece(
            ctx,
            cx + offsetX,
            cy + offsetY,
            displaySize,
            petal,
            0,
            silhouette
        )
    }

    if (!fontSize) return;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${fontSize}px Ubuntu`;
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = fontSize / 10;
    ctx.strokeText(
        petal.displayName,
        0,
        15
    )
    ctx.fillText(
        petal.displayName,
        0,
        15
    )
}

export function ICON_drawMob(
    ctx: CanvasRenderingContext2D,
    mob: MobDefinition,
    silhouette?: boolean
) {
    const displaySize = mob.images?.slotDisplaySize ?? 80;
    const offsetX = mob.images?.centerXOffset?? 0;
    const offsetY = mob.images?.centerYOffset?? 0;
    const cx = 0;
    const cy = 0;
    const container = new RenderContainer(ctx);
    container.radius = Camera.unitToScreen(displaySize / defaultBoxSize / 2);
    const { radius } = container;

    if (mob.hasSegments) {
        ctx.save();

        ctx.translate(radius * 1.4, radius * 1.4);
        ICON_drawMob(ctx, Mobs.fromString(mob.segmentDefinitionIdString), silhouette);

        ctx.restore();
    }
    container.position = Vec2.new(
        cx + offsetX,
        cy + offsetY
    );
    container.rotation = PI * 1.25;
    container.noCustoming = true;

    if (silhouette) container.brightness = 0;
    container.renderFunc = () => {
        const assets = getAssets("mob", mob);
        if (assets) assets(container);
    }

    container.render(0);
}

export function loadStyleSheet() {
    let styleSheet = "";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const DIM = Math.max(screen.width, screen.height);
    canvas.height = DIM * 0.1;
    canvas.width = DIM * 0.1;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    const scale = Math.max(canvas.width / 50, 1);
    ctx.scale(scale, scale);

    for (const definition of Petals.definitions) {
        const name = getGameAssetsName(definition);

        if (petalAssets.hasOwnProperty(name)) {
            ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            let fontSize = 12;
            if (definition.images?.fontSizeMultiplier) {
                fontSize *= definition.images.fontSizeMultiplier;
            }
            ICON_drawPetal(ctx, definition, fontSize);
            const dataURL = canvas.toDataURL('image/png');
            styleSheet += `.petal-${definition.idString} {
                background-image: url(${dataURL})
            }`

            ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            ICON_drawPetal(ctx, definition, 0, false, true);
            const silhouetteDataURL = canvas.toDataURL('image/png');
            styleSheet += `.petal-${definition.idString}-silhouette{
                position: relative;
            }

            .petal-${definition.idString}-silhouette::before {
                background-image: url(${silhouetteDataURL});
                opacity: 0.1;
                width: 100%;
                height: 100%;
                position: absolute;
                content: "";
                top: 0;
                left: 0;
                background-size: 100% 100%;
            }`

            ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            ICON_drawPetal(ctx, definition, 0, true);
            const noTextDataURL = canvas.toDataURL('image/png');
            styleSheet += `.petal-${definition.idString}-bkg {
                background-image: url(${noTextDataURL})
            }`
        } else {
            console.log(`[!] ${definition.idString} doesnt have an asset. Skipping...`)
        }
    }

    for (const definition of Mobs.definitions) {
        const name = getGameAssetsName(definition);

        if (mobAssets.hasOwnProperty(name)) {
            ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            ICON_drawMob(ctx, definition);
            const dataURL = canvas.toDataURL('image/png');
            styleSheet += `.mob-${definition.idString} {
                background-image: url(${dataURL})
            }`

            ctx.clearRect(-canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
            ICON_drawMob(ctx, definition, true);
            const silhouetteDataURL = canvas.toDataURL('image/png');
            styleSheet += `.mob-${definition.idString}-silhouette{
                position: relative;
            }

            .mob-${definition.idString}-silhouette::before {
                background-image: url(${silhouetteDataURL});
                opacity: 0.1;
                width: 100%;
                height: 100%;
                position: absolute;
                content: "";
                top: 0;
                left: 0;
                background-size: 100% 100%;
            }`
        } else {
            console.log(`[!] ${definition.idString} doesnt have an asset. Skipping...`)
        }
    }

    $("head").append(`<style>${styleSheet}</style>`);
}
