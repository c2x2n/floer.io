import { Petals } from "@common/definitions/petals.ts";
import { ICON_drawPetal, getGameAssetsName, ICON_drawMob } from "@/scripts/utils/assets.ts";
import $ from "jquery";
import { petalAssets } from "@/assets/petals.ts";
import { mobAssets } from "@/assets/mobs.ts";
import { Mobs } from "@common/definitions/mobs.ts";

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
