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
        },
        critical_hit: data => {
            return [{
                displayName: "Critical Chance",
                value: `${data.chance * 100}%`,
                color: "#ff9900"
            }, {
                displayName: "Critical Multiplier",
                value: `${data.multiplier}x`,
                color: "#ff5500"
            }];
        },
        health_percent_damage: data => {
            return [{
                displayName: "Current Health Damage",
                value: `${data.percent * 100}%`,
                color: "#ff3333"
            },
            ...(data.maxDamage !== undefined
                ? [{
                    displayName: "Max Damage",
                    value: data.maxDamage.toString(),
                    color: "#ff6666"
                }]
                : [])
            ];
        },
        damage_avoidance: data => {
            return [{
                displayName: "Damage Avoidance",
                value: `${data.chance * 100}%`,
                color: "#3399ff"
            }];
        },
        area_poison: data => {
            return [{
                displayName: "Radiation Radius",
                value: `${data.radius}`,
                color: "#7FFF00"
            }, {
                displayName: "Radiation Damage",
                value: `${data.damagePerSecond}/s`,
                color: "#32CD32"
            }];
        },
        self_damage: data => {
            return [{
                displayName: "Self Damage",
                value: `${data}`,
                color: "#ff6666"
            }];
        },
        damage_heal: data => {
            return [{
                displayName: "Damage Heal",
                value: `${data.healPercent}%`,
                color: "#58fd48"
            }, ...(data.maximumHeal !== undefined
                ? [{
                    displayName: "Max Damage",
                    value: data.maximumHeal.toString(),
                    color: "#58fd48"
                }]
                : [])];
        },
        lightning: data => {
            return [{
                displayName: "Attenuation",
                value: `${data.attenuation * 100}%`,
                color: "#33ccff"
            }, {
                displayName: "Range",
                value: `${data.range}`,
                color: "#0099ff"
            }, {
                displayName: "Bounces",
                value: `${data.bounces}`,
                color: "#66ffff"
            }];
        },
        damage_reduction_percent: data => {
            return [{
                displayName: "Petal Resistance",
                value: `${data}%`,
                color: "#3344ff"
            }];
        },
        true_damage: data => {
            return [{
                displayName: "True Damage",
                value: `${data * 100}%`,
                color: "#fd6565"
            }];
        },
        random: (function() {
            let lastRandomTime = 0;
            let lastRandomResults: Array<{
                displayName: string
                value: string
                color: string
            }> | null = null;

            return (data: Array<{
                attribute: string
                weight: number
                value: any
            }>) => {
                const currentTime = Date.now();

                if (!lastRandomResults || currentTime - lastRandomTime > 1000) {
                    const results = [{
                        displayName: "Random Effect",
                        value: "",
                        color: "#9966cc"
                    }];

                    if (!data || data.length === 0) return results;

                    const randomIndex = Math.floor(Math.random() * data.length);
                    const randomAttr = data[randomIndex];

                    const attrName = randomAttr.attribute;
                    const totalWeight = data.reduce((sum, attr) => sum + attr.weight, 0);
                    const weightPercent = Math.round((randomAttr.weight / totalWeight) * 100);

                    const displayName = attrName.charAt(0).toUpperCase() + attrName.slice(1).replace(/_/g, " ");
                    results.push({
                        displayName: `-\u00A0\u00A0${displayName} (${weightPercent}%)`,
                        value: "",
                        color: "#7788dd"
                    });
                    const handler = attributesShowingConfigs[attrName as keyof typeof attributesShowingConfigs];
                    if (handler) {
                        const attrResults = handler(randomAttr.value);
                        if (attrResults.length > 0) {
                            for (let i = 0; i < attrResults.length; i++) {
                                const paramResult = attrResults[i];
                                results.push({
                                    displayName: `\u00A0\u00A0\u00A0\u00A0\u00A0${paramResult.displayName}`,
                                    value: paramResult.value,
                                    color: paramResult.color
                                });
                            }
                        }
                    }

                    if (data.length > 1) {
                        results.push({
                            displayName: `...still ${data.length - 1} more effects`,
                            value: "",
                            color: "#999999"
                        });
                    }

                    lastRandomResults = results;
                    lastRandomTime = currentTime;
                }

                return lastRandomResults;
            };
        })()
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
            value: config.startsWith ?? value,
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

            // 特殊处理conditionalHeal
            if (modifiersDefinitionKey === "conditionalHeal" && original) {
                const conditionalHeal = original as { healthPercent: number, healAmount: number };
                addData(showing, "");
                addLine({
                    startsWith: `HP < ${(conditionalHeal.healthPercent * 100).toFixed(0)}%: `,
                    value: `+${conditionalHeal.healAmount.toFixed(1)}`,
                    endsWith: "/s",
                    color: "#58fd48",
                    fontSize: 12
                });
                continue;
            }

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
                } else if (modifiersDefinitionKey === "damageAvoidanceChance") {
                    value = original * 100;
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
            value: config.startsWith ?? value,
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
                } else if (modifiersDefinitionKey === "damageAvoidanceChance") {
                    value = original * 100;
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
