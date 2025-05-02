import { Petals } from "@common/definitions/petal.ts";
import { getGameAssetsName } from "@/scripts/utils/render.ts";
import $ from "jquery";
import { petalAssets } from "@/assets/petal.ts";
import { RenderContainer } from "@/scripts/utils/renderContainer.ts";
import { Vec2 } from "@common/utils/vector.ts";
import { Camera } from "@/scripts/render/camera.ts";

export function loadStyleSheet() {
    let styleSheet = "";

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    for (const definition of Petals.definitions) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const name = getGameAssetsName(definition);

        if (petalAssets.hasOwnProperty(name)) {
            const rad = Camera.unitToScreen(definition.hitboxRadius);
            canvas.height = rad * 2.5 * 10;
            canvas.width = rad * 2.5 * 10;

            ctx.save()

            const container = new RenderContainer(ctx);
            container.radius = rad;
            container.scale = 10;
            container.position = Vec2.new(canvas.height / 2, canvas.width / 2);
            container.noCustoming = true;
            container.renderFunc = () => {
                petalAssets[name](container);
            }
            container.render(0);

            ctx.restore()

            const dataURL = canvas.toDataURL('image/png');
            styleSheet += `.petal-${definition.idString} {
                background-image: url(${dataURL})
            }`
        } else {
            styleSheet += `.petal-${definition.idString} {
                background-image: url("/img/game/petal/${name}.svg")
            }`
        }
    }

    $("head").append(`<style>${styleSheet}</style>`);
}
