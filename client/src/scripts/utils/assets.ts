import { ObjectDefinition } from "@common/utils/definitions.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { PetalDefinition } from "@common/definitions/petal.ts";
import { RenderContainer } from "@/scripts/utils/renderContainer.ts";
import { Camera } from "@/scripts/render/camera.ts";
import { petalAssets } from "@/assets/petal.ts";
import { MathGraphics, P2 } from "@common/utils/math.ts";

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
    radians?: number
) {
    const container = new RenderContainer(ctx);
    container.radius = Camera.unitToScreen(displaySize / defaultBoxSize / 2);

    const { x, y } = defaultCenter;
    container.position = Vec2.new(
        x + xOffset,
        y + yOffset
    );
    container.rotation = (petal.images?.slotRotation ?? 0) + (radians ?? 0)
    container.noCustoming = true;

    container.renderFunc = () => {
        const name = getGameAssetsName(petal);
        if (petalAssets.hasOwnProperty(name)) petalAssets[name](container)
    }
    container.render(0);
}

export function ICON_drawPetal(
    ctx: CanvasRenderingContext2D,
    petal: PetalDefinition
) {
    const displaySize = petal.images?.slotDisplaySize ?? 25;
    const offsetX = petal.images?.centerXOffset ?? 0;
    const offsetY = petal.images?.centerYOffset ?? 0;

    if (!petal.equipment && petal.isDuplicate) {
        let radiansNow = 0;
        const count = petal.pieceAmount;
        let radians = 0;

        for (let i = 0; i < count; i++) {
            const { x, y } =
                MathGraphics.getPositionOnCircle(
                    radiansNow, defaultRadius, Vec2.new(offsetX, offsetY)
                );
            ICON_drawPetalPiece(ctx, x, y, displaySize, petal, radians)
            radiansNow += P2 / count;
            radians += petal.images?.slotRevolution ?? 0
        }
    } else {
        ICON_drawPetalPiece(ctx, offsetX, offsetY, displaySize, petal)
    }
}
