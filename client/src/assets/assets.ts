import { RenderContainer } from "../scripts/render/misc";
import { ObjectDefinition } from "../../../common/src/definitions/definitions";
import { projectileAssets } from "./projectiles";
import { mobAssets } from "./mobs";
import { petalAssets } from "./petals";

export type AssetsDrawer =
    (containerToDraw: RenderContainer) => void;

export type AssetsBunch = Record<string, AssetsDrawer>;

export function getGameAssetsName(
    reify: ObjectDefinition
): string {
    if (reify.usingAssets) return reify.usingAssets;
    return reify.idString;
}

export function getAssets(type: "mob" | "petal" | "projectile", definition: ObjectDefinition): AssetsDrawer | null {
    const name = getGameAssetsName(definition);

    let assetsBunch: AssetsBunch;

    switch (type) {
        case "mob":
            assetsBunch = mobAssets;
            break;
        case "petal":
            assetsBunch = petalAssets;
            break;
        case "projectile":
            assetsBunch = projectileAssets;
            break;
    }

    if (Object.prototype.hasOwnProperty.call(assetsBunch, name)) {
        return assetsBunch[name];
    }

    return null;
}
