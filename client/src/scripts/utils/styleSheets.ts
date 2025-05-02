import { Petals } from "@common/definitions/petal.ts";
import { ICON_drawPetal, getGameAssetsName } from "@/scripts/utils/assets.ts";
import $ from "jquery";
import { petalAssets } from "@/assets/petal.ts";

export function loadStyleSheet() {
    let styleSheet = "";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    canvas.height = 50;
    canvas.width = 50;

    for (const definition of Petals.definitions) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const name = getGameAssetsName(definition);

        if (petalAssets.hasOwnProperty(name)) {
            ctx.save();
            ctx.translate(25, 25);
            ICON_drawPetal(ctx, definition)
            ctx.restore()
            const dataURL = canvas.toDataURL('image/png');
            styleSheet += `.petal-${definition.idString} {
                background-image: url(${dataURL})
            }`
        } else {
            console.log(`[!] ${definition.idString} doesnt have a asset. Skipping...`)
        }
    }

    $("head").append(`<style>${styleSheet}</style>`);
}
