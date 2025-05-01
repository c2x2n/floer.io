import { Petals } from "@common/definitions/petal.ts";
import { getGameAssetsName } from "@/scripts/utils/render.ts";
import $ from "jquery";

export function loadStyleSheet() {
    let styleSheet = "";

    for (const definition of Petals.definitions) {
        styleSheet += `.petal-${definition.idString} {
            background-image: url("/img/game/petal/${getGameAssetsName(definition)}.svg");
        }`
    }

    $("head").append(`<style>${styleSheet}</style>`);
}
