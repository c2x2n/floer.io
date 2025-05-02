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

        styleSheet += `.petal-${definition.idString} {
            background-image: url("/img/game/petal/${name}.svg")
        }`
    }

    $("head").append(`<style>${styleSheet}</style>`);
}
