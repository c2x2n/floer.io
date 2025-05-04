import { Petals } from "@common/definitions/petal.ts";
import { ICON_drawPetal, getGameAssetsName, ICON_drawMob } from "@/scripts/utils/assets.ts";
import $ from "jquery";
import { petalAssets } from "@/assets/petal.ts";
import { mobAssets } from "@/assets/mob.ts";
import { Mobs } from "@common/definitions/mob.ts";

export function loadStyleSheet() {
    let styleSheet = "";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.height = screen.width * 0.1;
    canvas.width = screen.width * 0.1;
    ctx.scale(screen.width * 0.1 / 50, screen.width * 0.1 / 50)

    for (const definition of Petals.definitions) {
        const name = getGameAssetsName(definition);

        if (petalAssets.hasOwnProperty(name)) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(25, 25);
            let fontSize = 12;
            if (definition.images?.fontSizeMultiplier) {
                fontSize *= definition.images.fontSizeMultiplier;
            }
            ICON_drawPetal(ctx, definition, fontSize);
            const dataURL = canvas.toDataURL('image/png');
            styleSheet += `.petal-${definition.idString} {
                background-image: url(${dataURL})
            }`
            ctx.restore();

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(25, 25);
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
            ctx.restore();

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(25, 25);
            ICON_drawPetal(ctx, definition, 0, true);
            const noTextDataURL = canvas.toDataURL('image/png');
            styleSheet += `.petal-${definition.idString}-bkg {
                background-image: url(${noTextDataURL})
            }`
            ctx.restore();
        } else {
            console.log(`[!] ${definition.idString} doesnt have an asset. Skipping...`)
        }
    }

    for (const definition of Mobs.definitions) {
        const name = getGameAssetsName(definition);

        if (mobAssets.hasOwnProperty(name)) {
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(25, 25);
            ICON_drawMob(ctx, definition);
            const dataURL = canvas.toDataURL('image/png');
            styleSheet += `.mob-${definition.idString} {
                background-image: url(${dataURL})
            }`
            ctx.restore();

            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.translate(25, 25);
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
            ctx.restore();
        } else {
            console.log(`[!] ${definition.idString} doesnt have an asset. Skipping...`)
        }
    }

    $("head").append(`<style>${styleSheet}</style>`);
}
