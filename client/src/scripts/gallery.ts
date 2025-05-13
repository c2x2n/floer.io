import { UI } from "../ui";
import { PetalDefinition, Petals } from "../../../common/src/definitions/petals";
import { Rarity } from "../../../common/src/definitions/rarities";
import { renderPetal } from "./inventory";
import $ from "jquery";
import { applyTooltip, createMobTooltip, createPetalTooltip } from "./shown/tooltip";
import { MobDefinition, Mobs } from "../../../common/src/definitions/mobs";

export class Gallery {
    petalGallery: string[] = [];
    mobGallery: string[] = [];

    constructor(private ui: UI) {
        const petalGallery = localStorage.getItem("petalGallery");

        if (petalGallery) {
            const parsed = JSON.parse(petalGallery);
            if (parsed instanceof Array && parsed.length > 0 && typeof parsed[0] === "string") { this.petalGallery = parsed; }
        }

        const mobGallery = localStorage.getItem("mobGallery");

        if (mobGallery) {
            const parsed = JSON.parse(mobGallery);
            if (parsed instanceof Array && parsed.length > 0 && typeof parsed[0] === "string") { this.mobGallery = parsed; }
        }
    }

    saveData() {
        localStorage.setItem("petalGallery", JSON.stringify(this.petalGallery));
        localStorage.setItem("mobGallery", JSON.stringify(this.mobGallery));
    }

    addPetalGallery(definition: PetalDefinition) {
        if (this.petalGallery.includes(definition.idString)) return;

        this.petalGallery.push(definition.idString);

        this.saveData();
    }

    addMobGallery(definition: MobDefinition) {
        if (this.mobGallery.includes(definition.idString)) return;

        this.mobGallery.push(definition.idString);

        this.saveData();
    }

    renderPetalGallery() {
        this.ui.petalGalleryContents.empty();

        const sortedDefintions
            = Petals.definitions.concat([])
                .sort((a, b) =>
                    Rarity.fromString(a.rarity).level - Rarity.fromString(b.rarity).level
                );

        for (const definition of sortedDefintions) {
            const rarity = Rarity.fromString(definition.rarity);

            if (!rarity.hideInGallery) {
                if (this.petalGallery.includes(definition.idString)) {
                    const content = $('<div class="petal-gallery-content"></div>');
                    const petal = renderPetal(definition);

                    content.append(petal);
                    this.ui.petalGalleryContents.append(content);

                    applyTooltip(
                        content, createPetalTooltip(definition)
                    );
                } else {
                    this.ui.petalGalleryContents.append(
                        $(
                            `<div class="unknown petal-${definition.idString}-silhouette"></div>`
                        )
                    );
                }
            }
        }
    }

    renderMobGallery() {
        this.ui.mobGalleryContents.empty();

        const sortedDefintions
            = Mobs.definitions.concat([])
                .sort((a, b) =>
                    Rarity.fromString(a.rarity).level - Rarity.fromString(b.rarity).level
                );

        for (const definition of sortedDefintions) {
            const rarity = Rarity.fromString(definition.rarity);

            if (!rarity.hideInGallery && !definition.hideInGallery) {
                if (this.mobGallery.includes(definition.idString)) {
                    const content = $(`<div class="mob-gallery-content mob-${definition.idString}"></div>`);

                    content.css("background-color", rarity.color);
                    content.css("border-color", rarity.border);

                    this.ui.mobGalleryContents.append(content);

                    applyTooltip(
                        content, createMobTooltip(this, definition)
                    );
                } else {
                    const content = $(`<div class="unknown mob-${definition.idString}-silhouette"></div>`);
                    this.ui.mobGalleryContents.append(content);
                }
            }
        }
    }
}
