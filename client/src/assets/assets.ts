import { RenderContainer } from "@/scripts/utils/render.ts";
import { ObjectDefinition } from "@common/utils/definitions.ts";
import { projectileAssets } from "@/assets/projectiles.ts";
import { mobAssets } from "@/assets/mobs.ts";
import { petalAssets } from "@/assets/petals.ts";

export type AssetsDrawer =
    (containerToDraw: RenderContainer) => void;

export type AssetsBunch = { [K: string]: AssetsDrawer };


export function getGameAssetsName(
    reify: ObjectDefinition
): string {
    if (reify.usingAssets) return `${reify.usingAssets}`;
    return `${reify.idString}`;
}

export function getAssets(type: "mob" | "petal" | "projectile" , definition: ObjectDefinition): AssetsDrawer| null {
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

    if (assetsBunch.hasOwnProperty(name)) {
        return assetsBunch[name];
    }

    return null;
}
