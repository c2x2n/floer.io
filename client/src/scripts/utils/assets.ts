import { ObjectDefinition } from "@common/utils/definitions.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { PetalDefinition } from "@common/definitions/petal.ts";
import { RenderContainer } from "@/scripts/utils/renderContainer.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { petalAssets } from "@/assets/petal.ts";
import { MathGraphics, P2, PI } from "@common/utils/math.ts";
import { MobDefinition, Mobs } from "@common/definitions/mob.ts";
import { mobAssets } from "@/assets/mob.ts";

export function getGameAssetsName(
    reify: ObjectDefinition
): string {
    if (reify.usingAssets) return `${reify.usingAssets}`;
    return `${reify.idString}`;
}

export function getGameAssetsFile(
    reify: ObjectDefinition
): string {
    return `${getGameAssetsName(reify)}.svg`;
}

export function getGameAssetsPath(
    type: string, reify: string  | ObjectDefinition
): string {
    if (typeof reify === "string") return `${type}_${reify}.svg`;
    return `${type}_${getGameAssetsFile(reify)}`;
}

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
        const name = getGameAssetsName(petal);
        if (petalAssets.hasOwnProperty(name)) petalAssets[name](container)
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
        const name = getGameAssetsName(mob);
        if (mobAssets.hasOwnProperty(name)) mobAssets[name](container);
    }

    container.render(0);
}
