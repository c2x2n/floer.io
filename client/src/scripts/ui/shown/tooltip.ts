import { Rarity } from "../../../../../common/src/definitions/rarities";
import { AttributeNames, AttributeParameters, PetalDefinition, Petals } from "../../../../../common/src/definitions/petals";
import { Modifiers, PlayerModifiers } from "../../../../../common/src/typings/modifier";
import { renderPetal } from "../../inventory";
import $ from "jquery";
import { MobDefinition, Mobs } from "../../../../../common/src/definitions/mobs";
import { Gallery } from "../../gallery";
import Big from "big.js";

const tooltipTemplate = $("<div class='tooltip information'></div>");

interface InformationLineParameters {
    startsWith?: string
    value?: string
    endsWith?: string
    fontSize?: number
    color?: string
}

interface DefinitionShowingConfig {
    displayName: string
    color: string
    startsWith?: string
    endsWith?: string
    noValue?: boolean
    percent?: boolean
    noSubtract?: boolean
}

type AttributeShowingFunction<K extends AttributeNames> =
    (data: Required<AttributeParameters>[K]) => Array<DefinitionShowingConfig & { value: string }>;

const petalDefinitionShowingConfigs: Record<string, DefinitionShowingConfig>
    = {
        damage: {
            displayName: "Damage",
            color: "#fd6565"
        },
        health: {
            displayName: "Health",
            color: "#58fd48"
        },
        healing: {
            displayName: "Healing",
            color: "#58fd48"
        },
        maxHealth: {
            displayName: "Flower Max Health",
            color: "#58fd48",
            startsWith: "+"
        },
        healPerSecond: {
            displayName: "Heal",
            color: "#58fd48",
            endsWith: "/s"
        },
        revolutionSpeed: {
            displayName: "Rotation",
            color: "#58fd48",
            startsWith: "+",
            endsWith: "rad/s"
        },
        speed: {
            displayName: "Speed",
            color: "#58fd48",
            percent: true
        },
        zoom: {
            displayName: "Extra Zoom",
            color: "#58fd48"
        },
        bodyDamage: {
            displayName: "Body Damage",
            color: "#ff6666",
            percent: true
        },
        knockbackReduction: {
            displayName: "Knockback Reduction",
            color: "#6666ff",
            percent: true,
            noSubtract: true
        },
        bodyDamageReduction: {
            displayName: "Collision Damage Resistance",
            color: "#6666ff",
            percent: true,
            noSubtract: true
        },
        undroppable: {
            displayName: "Undroppable",
            color: "#656548",
            noValue: true
        },
        unstackable: {
            displayName: "Unstackable",
            color: "#656548",
            noValue: true
        },
        consumesOnUse: {
            displayName: "Consumes once used",
            color: "#d41518",
            noValue: true
        },
        damageAvoidanceChance: {
            displayName: "Flower Evasion",
            color: "#3399ff",
            percent: false,
            startsWith: ""
        },
        selfPoison: {
            displayName: "Self Poison",
            color: "#ce76db",
            endsWith: "/s"
        },
        conditionalHeal: {
            displayName: "Emergency Heal",
            color: "#58fd48",
            noValue: true
        },
        true_damage: {
            displayName: "True Damage",
            color: "#fd6565",
            noValue: true
        }
    };

const attributesShowingConfigs: { [K in AttributeNames]: AttributeShowingFunction<K> }
    = {
        absorbing_heal: data => {
            return [{
                displayName: "Heal",
                value: data.toString(),
                color: "#58fd48"
            }];
        },
        absorbing_shield: data => {
            return [{
                displayName: "Shield",
                value: data.toString(),
                color: "#d2eb34"
            }];
        },
        boost: data => {
            if (data > 0) {
                return [{
                    displayName: "Dynamic",
                    value: data.toString(),
                    color: "#58fd48"
                }];
            } else {
                return [{
                    displayName: "Knockback",
                    value: Math.abs(data).toString(),
                    color: "#ff9966"
                }];
            }
        },
        shoot: () => [],
        peas_shoot: () => [],
        around_circle_shoot: () => [],
        place_projectile: () => [],
        spawner: data => {
            return [{
                displayName: "Content",
                value: data.displayName,
                color: "#6161f0"
            }];
        }
    };

export function createPetalTooltip(definition: PetalDefinition): JQuery {
    const box = tooltipTemplate.clone();

    function addLine(args: InformationLineParameters) {
        let {
            startsWith,
            endsWith,
            value,
            fontSize,
            color
        } = args;
        startsWith = startsWith ? `${startsWith}&nbsp;` : "";
        endsWith = endsWith ?? "";
        value = value ?? "";
        fontSize = fontSize ?? 13;
        color = color ?? "#FFFFFF";

        const line = $("<div></div>");
        line.css("display", "flex");

        const startS
            = $(`<p textin="${startsWith}"></p>`);

        const valueS
            = $(`<p textin="${value}"></p>`);

        const endS
            = $(`<p textin="${endsWith}"></p>`);

        startS.css("font-size", `${fontSize}px`);
        startS.css("color", color);

        valueS.css("font-size", `${fontSize}px`);
        valueS.css("color", "#FFFFFF");

        endS.css("font-size", `${fontSize}px`);
        endS.css("color", "#FFFFFF");

        line.append(startS);
        line.append(valueS);
        line.append(endS);

        box.append(line);
    }

    function addBr() {
        box.append($("<p class='br'></p>"));
    }

    function addData(config: typeof petalDefinitionShowingConfigs[string], value: string) {
        if (config.noValue) {
            addLine({
                startsWith: config.displayName,
                color: config.color
            });

            return;
        }

        addLine({
            startsWith: `${config.displayName
            }: `,
            value: (config.startsWith ?? "") + value,
            endsWith: config.endsWith ?? "",
            color: config.color
        });
    }

    addLine({
        value: definition.fullName ?? definition.displayName,
        fontSize: 25
    });

    const rarity = Rarity.fromStringSafe(definition.rarity);
    if (rarity) {
        addLine({
            startsWith: rarity.displayName,
            value: "",
            fontSize: 12,
            color: rarity.color
        });
    }

    addBr();

    if (definition.description) {
        addLine({
            value: definition.description,
            fontSize: 12
        });
    }

    addBr();

    for (const definitionKey in definition) {
        if (Object.prototype.hasOwnProperty.call(petalDefinitionShowingConfigs, definitionKey)) {
            const showing
                = petalDefinitionShowingConfigs[definitionKey];
            addData(showing,
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                (definition[definitionKey as keyof PetalDefinition] ?? "").toString()
            );
        }
    }

    if (definition.wearerAttributes) {
        for (const modifiersDefinitionKey in definition.wearerAttributes) {
            const showing
                = petalDefinitionShowingConfigs[modifiersDefinitionKey];
            const original = (definition.wearerAttributes[modifiersDefinitionKey as keyof PlayerModifiers]);
            if (!showing) continue;

            if (!original || typeof original != "number") {
                addData(showing,
                    ""
                );
            } else {
                let value = original;
                let startsWith = "";
                let endsWith = "";
                if (showing.percent) {
                    value = original * 100;
                    if (!showing.noSubtract) {
                        value = value - 100;
                    }
                    if (value > 0) startsWith = "+";
                    endsWith = "%";
                }

                addData(showing,
                    startsWith + value.toFixed(2) + endsWith
                );
            }
        }
    }

    if (definition.attributes) {
        let attributesDefinitionKey: AttributeNames;
        for (attributesDefinitionKey in definition.attributes) {
            const data = definition.attributes[attributesDefinitionKey];
            if (!data) continue;
            const config
                = (attributesShowingConfigs[attributesDefinitionKey] as AttributeShowingFunction<typeof attributesDefinitionKey>)(data);
            config.forEach(e => {
                addData(e as DefinitionShowingConfig,
                    e.value
                );
            });
        }
    }

    if (!definition.equipment && definition.reloadTime) {
        let content = `${definition.reloadTime}s`;
        if (definition.usable) {
            content += ` + ${definition.useTime}s`;
        }
        const reload = $(`<p textin="${content}"><p>`);

        reload.css("position", "absolute");
        reload.css("right", "7px");
        reload.css("top", "10px");

        box.append(reload);
    }

    const occupy = $("<div style='height: 1px; width: 200px'></div>");
    box.append(occupy);

    box.css("opacity", "0").animate({ opacity: 1 }, 100);

    return box;
}

const mobDefinitionShowingConfigs: Record<string, DefinitionShowingConfig>
= {
    damage: {
        displayName: "Damage",
        color: "#fd6565"
    },
    health: {
        displayName: "Health",
        color: "#58fd48"
    },
    speed: {
        displayName: "Speed",
        color: "#58fd48"
    }
};

export function createMobTooltip(gallery: Gallery, definition: MobDefinition): JQuery {
    const box = tooltipTemplate.clone();

    function addLine(args: InformationLineParameters) {
        let {
            startsWith,
            endsWith,
            value,
            fontSize,
            color
        } = args;
        startsWith = startsWith ? `${startsWith}&nbsp;` : "";
        endsWith = endsWith ?? "";
        value = value ?? "";
        fontSize = fontSize ?? 13;
        color = color ?? "#FFFFFF";

        const line = $("<div></div>");
        line.css("display", "flex");

        const startS
            = $(`<p textin="${startsWith}"></p>`);

        const valueS
            = $(`<p textin="${value}"></p>`);

        const endS
            = $(`<p textin="${endsWith}"></p>`);

        startS.css("font-size", `${fontSize}px`);
        startS.css("color", color);

        valueS.css("font-size", `${fontSize}px`);
        valueS.css("color", "#FFFFFF");

        endS.css("font-size", `${fontSize}px`);
        endS.css("color", "#FFFFFF");

        line.append(startS);
        line.append(valueS);
        line.append(endS);

        box.append(line);
    }

    function addBr() {
        box.append($("<p class='br'></p>"));
    }

    function addData(config: typeof mobDefinitionShowingConfigs[string], value: string) {
        if (config.noValue) {
            addLine({
                startsWith: config.displayName,
                color: config.color
            });

            return;
        }

        addLine({
            startsWith: `${config.displayName
            }: `,
            value: (config.startsWith ?? "") + value,
            endsWith: config.endsWith ?? "",
            color: config.color
        });
    }

    addLine({
        value: definition.displayName,
        fontSize: 25
    });

    const rarity = Rarity.fromStringSafe(definition.rarity);
    if (rarity) {
        addLine({
            startsWith: rarity.displayName,
            value: "",
            fontSize: 12,
            color: rarity.color
        });
    }

    addBr();

    if (definition.description) {
        addLine({
            value: definition.description,
            fontSize: 12
        });
    }

    addBr();

    for (const definitionKey in definition) {
        if (Object.prototype.hasOwnProperty.call(mobDefinitionShowingConfigs, definitionKey)) {
            const showing
                = mobDefinitionShowingConfigs[definitionKey];
            addData(showing,
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                (definition[definitionKey as keyof MobDefinition]
                ?? "").toString()
            );
        }
    }

    if (definition.modifiers) {
        for (const modifiersDefinitionKey in definition.modifiers) {
            const showing
                = mobDefinitionShowingConfigs[modifiersDefinitionKey];
            const original = (definition.modifiers[modifiersDefinitionKey as keyof Modifiers]);
            if (!showing) continue;
            if (!(typeof original === "number")) continue;

            if (!original) {
                addData(showing,
                    ""
                );
            } else {
                let value = original;
                let startsWith = "";
                let endsWith = "";
                if (showing.percent) {
                    value = original * 100;
                    if (!showing.noSubtract) {
                        value = value - 100;
                    }
                    if (value > 0) startsWith = "+";
                    endsWith = "%";
                }

                addData(showing,
                    startsWith + value.toFixed(2) + endsWith
                );
            }
        }
    }

    if (definition.shootable) {
        if (definition.shoot.damage) {
            addLine({
                startsWith: "Missile Damage: ",
                value: definition.shoot.damage.toString(),
                color: "#fd6565"
            });
        }

        if (definition.shoot.health) {
            addLine({
                startsWith: "Missile Health: ",
                value: definition.shoot.health.toString(),
                color: "#58fd48"
            });
        }
    }

    const xp = definition.exp;
    const reload = $(`<p textin="${xp}◆"><p>`);

    reload.css("position", "absolute");
    reload.css("right", "7px");
    reload.css("top", "10px");

    box.append(reload);

    addBr();

    const loots = $("<div class=\"mob-loots\"></div>");

    const sortedLootTable = Object.keys(definition.lootTable).sort(
        (a, b) =>
            Rarity.fromString(Petals.fromString(a).rarity).level - Rarity.fromString(Petals.fromString(b).rarity).level
    );

    for (const lootTableKey of sortedLootTable) {
        const rate = Big(definition.lootTable[lootTableKey]).mul(100);
        const loot = Petals.fromStringSafe(lootTableKey);

        const lootDOM = $("<div class=\"mob-loot\"></div>");
        const rateDOM = $(`<p class="drop-rate" textin="${rate.toNumber()}%"></p>`);

        if (!loot) continue;

        if (gallery.petalGallery.includes(lootTableKey)) {
            lootDOM.append(renderPetal(loot));
        } else {
            lootDOM.append($(`<div class="unknown">
                <div textin="?"></div>
            </div>`));
        }
        lootDOM.append(rateDOM);
        loots.append(lootDOM);
    }

    box.append(loots);

    const occupy = $("<div style='height: 1px; width: 300px'></div>");
    box.append(occupy);

    box.css("opacity", "0").animate({ opacity: 1 }, 100);

    return box;
}

export function applyTooltip(follow: JQuery, tooltip: JQuery) {
    let on = false;

    follow.on("mouseover", () => {
        if (!follow.is(":visible")) return;
        $("body").append(tooltip);
        const offset = follow.offset();
        if (offset) {
            let left = offset.left;
            left = Math.max(left, 20 + (tooltip.width() ?? 0) * 0.35);
            tooltip.css("left", `${left}px`);
            tooltip.css("top", `${offset.top - 10}px`);
        }
        tooltip.css("opacity", "0");
        tooltip.animate({ opacity: 1 }, 100);
        on = true;
        const observer = setInterval(() => {
            if (!on || !follow.is(":visible")) {
                tooltip.animate({ opacity: 0 }, 200, () => {
                    tooltip.remove();
                });
                clearInterval(observer);
            }
        }, 100);
    });

    follow.on("mouseout", () => {
        on = false;
    });
}
