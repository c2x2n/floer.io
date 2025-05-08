import { UI } from "@/ui.ts";
import { PetalDefinition, Petals } from "@common/definitions/petals.ts";
import { Rarity } from "@common/definitions/rarities.ts";
import { MobContainer, PetalContainer, renderPetal } from "@/scripts/inventory.ts";
import $ from "jquery";
import { showMobInformation, showPetalInformation, unShowInformation } from "@/scripts/shown/information.ts";
import { MobDefinition, Mobs } from "@common/definitions/mobs.ts";

export class Gallery{
    petalGallery: string[] = [];
    mobGallery: string[] = [];

    petalContainers: PetalContainer[] = [];
    mobContainers: MobContainer[] = [];

    constructor(private ui: UI) {
        const petalGallery = localStorage.getItem("petalGallery");

        if (petalGallery) {
            const parsed = JSON.parse(petalGallery);
            if (parsed instanceof Array && parsed.length > 0 && typeof parsed[0] === "string")
                this.petalGallery = parsed
        }

        const mobGallery = localStorage.getItem("mobGallery");

        if (mobGallery) {
            const parsed = JSON.parse(mobGallery);
            if (parsed instanceof Array && parsed.length > 0 && typeof parsed[0] === "string")
                this.mobGallery = parsed
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
        this.petalContainers = [];

        const sortedDefintions =
            Petals.definitions.concat([])
                .sort((a, b) =>
                    Rarity.fromString(a.rarity).level -Rarity.fromString(b.rarity).level
                )

        for (const definition of sortedDefintions) {
            const rarity = Rarity.fromString(definition.rarity);

            if (!rarity.hideInGallery) {
                if (this.petalGallery.includes(definition.idString)) {
                    const petalContainer = new PetalContainer();

                    const content = $('<div class="petal-gallery-content"></div>');

                    const petal = renderPetal(definition);

                    petalContainer.ui_slot = content;
                    petalContainer.petalDefinition = definition;

                    content.append(petal);
                    this.ui.petalGalleryContents.append(content);
                    this.petalContainers.push(petalContainer);

                    content.on("mouseover",(ev) => {
                        if (!petalContainer.showingInformation) showPetalInformation(petalContainer);
                    })

                    content.on("mouseout",(ev) => {
                        if (petalContainer.showingInformation) unShowInformation(petalContainer);
                    })
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
        this.mobContainers = [];

        const sortedDefintions =
            Mobs.definitions.concat([])
                .sort((a, b) =>
                    Rarity.fromString(a.rarity).level -Rarity.fromString(b.rarity).level
                )

        for (const definition of sortedDefintions) {
            const rarity = Rarity.fromString(definition.rarity);

            if (!rarity.hideInGallery && !definition.hideInGallery) {
                if (this.mobGallery.includes(definition.idString)) {
                    const container = new MobContainer();
                    container.mobDefinition = definition;

                    const content = $(`<div class="mob-gallery-content mob-${definition.idString}"></div>`);

                    content.css("background-color", rarity.color);
                    content.css("border-color", rarity.border);

                    container.ui_slot = content;

                    content.on("mouseover",(ev) => {
                        if (!container.showingInformation) showMobInformation(this, container);
                    })

                    content.on("mouseout",(ev) => {
                        if (container.showingInformation) unShowInformation(container);
                    })

                    this.ui.mobGalleryContents.append(content);
                    this.mobContainers.push(container);
                } else {
                    const content = $(`<div class="unknown mob-${definition.idString}-silhouette"></div>`);
                    this.ui.mobGalleryContents.append(content);
                }
            }
        }
    }
}
