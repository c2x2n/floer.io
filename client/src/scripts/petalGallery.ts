import { UI } from "@/ui.ts";
import { PetalDefinition, Petals } from "@common/definitions/petal.ts";
import { Rarity } from "@common/definitions/rarity.ts";
import { PetalContainer, renderPetal } from "@/scripts/inventory.ts";
import $ from "jquery";

export class Gallery{
    petalGallery: string[] = [];

    petalContainers: PetalContainer[] = [];

    constructor(private ui: UI) {
        const gallery = localStorage.getItem("petalGallery");

        if (gallery) {
            const parsed = JSON.parse(gallery);
            if (parsed instanceof Array && parsed.length > 0 && typeof parsed[0] === "string")
                this.petalGallery = parsed
        }
    }

    saveData() {
        localStorage.setItem("petalGallery", JSON.stringify(this.petalGallery));
    }

    addGallery(definition: PetalDefinition) {
        if (this.petalGallery.includes(definition.idString)) return;

        this.petalGallery.push(definition.idString);

        this.saveData();

        this.renderPetalGallery();
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

            if (!rarity.hideInPetalGallery) {
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
                        if (!petalContainer.showingInformation) this.ui.app.game.inventory.showInformation(petalContainer);
                    })

                    content.on("mouseout",(ev) => {
                        if (petalContainer.showingInformation) this.ui.app.game.inventory.unShowInformation(petalContainer);
                    })
                } else {
                    this.ui.petalGalleryContents.append($('<div class="unknown-petal"></div>'));
                }
            }
        }
    }
}
