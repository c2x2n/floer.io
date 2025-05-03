import { Petals } from "@common/definitions/petal.ts";
import { ICON_drawPetal, getGameAssetsName } from "@/scripts/utils/assets.ts";
import $ from "jquery";
import { petalAssets } from "@/assets/petal.ts";

export function loadStyleSheet() {
    let styleSheet = "";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.height = 250;
    canvas.width = 250;
    ctx.scale(5, 5)

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

    $("head").append(`<style>${styleSheet}</style>`);
}
