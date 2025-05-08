import { Rarity } from "@common/definitions/rarities.ts";
import { AttributeNames, AttributeParameters, PetalDefinition, Petals } from "@common/definitions/petals.ts";
import { Modifiers, PlayerModifiers } from "@common/typings.ts";
import { MobContainer, PetalContainer, renderPetal } from "@/scripts/inventory.ts";
import $ from "jquery";
import { MobDefinition, Mobs } from "@common/definitions/mobs.ts";
import { Gallery } from "@/scripts/gallery.ts";
import Big from "big.js";

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
}

type AttributeShowingFunction<K extends AttributeNames> =
    (data: Required<AttributeParameters>[K]) => (DefinitionShowingConfig & { value: string })[];


const petalDefinitionShowingConfigs: { [key: string] : DefinitionShowingConfig } =
    {
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
        }
    }

const attributesShowingConfigs: { [K in AttributeNames] : AttributeShowingFunction<K>} =
    {
        absorbing_heal: (data) => {
            return [{
                displayName: "Heal",
                value: data.toString(),
                color: "#58fd48"
            }]
        },
        absorbing_shield: (data) => {
            return [{
                displayName: "Shield",
                value: data.toString(),
                color: "#d2eb34"
            }]
        },
        boost: (data) => {
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
        body_poison: (data) => {
            return [{
                displayName: "Body Poison",
                value: `${data.damagePerSecond * data.duration} (${data.damagePerSecond}/s)`,
                color: "#ce76db"
            }]
        },
        damage_reflection: (data) => {
            return [{
                displayName: "Damage Reflection",
                value: `${data * 100}%`,
                color: "#989898"
            }]
        },
        healing_debuff: (data) => {
            return [{
                displayName: "Healing Debuff",
                value: `-${100 - data.healing * 100}% `,
                color: "#989898"
            }, {
                displayName: "Duration",
                value: `${data.duration}s`,
                color: "#6161f0"
            },]
        },
        poison: (data) => {
            return [{
                displayName: "Poison",
                value: `${data.damagePerSecond * data.duration} (${data.damagePerSecond}/s)`,
                color: "#ce76db"
            }]
        },
        shoot: () => [],
        peas_shoot: () => [],
        around_circle_shoot: () => [],
        place_projectile: () => [],
        spawner: (data) => {
            return [{
                displayName: "Content",
                value: `${data.displayName}`,
                color: "#6161f0"
            },]
        },
        critical_hit: (data) => {
            return [{
                displayName: "Critical Chance",
                value: `${data.chance * 100}%`,
                color: "#ff9900"
            }, {
                displayName: "Critical Multiplier",
                value: `${data.multiplier}x`,
                color: "#ff5500"
            }]
        },
        health_percent_damage: (data) => {
            return [{
                displayName: "Current Health Damage",
                value: `${data.percent * 100}%`,
                color: "#ff3333"
            },
                ...(data.maxDamage !== undefined ? [{
                    displayName: "Max Damage",
                    value: data.maxDamage.toString(),
                    color: "#ff6666"
                }] : [])
            ]
        },
        damage_avoidance: (data) => {
            return [{
                displayName: "Damage Avoidance",
                value: `${data.chance * 100}%`,
                color: "#3399ff"
            }]
        },
        paralyze: (data) => {
            return [{
                displayName: "Paralyze",
                value: `${data.duration}s`,
                color: "#cc00cc"
            }, {
                displayName: "Speed Reduction",
                value: `${data.speedReduction * 100}%`,
                color: "#9966ff"
            }, {
                displayName: "Revolution Reduction",
                value: `${data.revolutionReduction ? data.revolutionReduction * 100 : 0}%`,
                color: "#9966ff"
            }]
        },
        area_poison: (data) => {
            return [{
                displayName: "Radiation Radius",
                value: `${data.radius}`,
                color: "#7FFF00"
            }, {
                displayName: "Radiation Damage",
                value: `${data.damagePerSecond}/s`,
                color: "#32CD32"
            }]
        },
        armor: (data) => {
            return [{
                displayName: "Armor",
                value: data.toString(),
                color: "#989898"
            }]
        },
        self_damage: (data) => {
            return [{
                displayName: "Self Damage",
                value: `${data}`,
                color: "#ff6666"
            }]
        },
        damage_heal: (data) => {
            return [{
                displayName: "Damage Heal",
                value: `${data.healPercent}%`,
                color: "#58fd48"
            }, ...(data.maximumHeal !== undefined ? [{
                displayName: "Max Damage",
                value: data.maximumHeal.toString(),
                color: "#58fd48"
            }] : [])]
        },
        lightning: (data) => {
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
            }]
        },
        damage_reduction_percent: (data) => {
            return [{
                displayName: "Petal Resistance",
                value: `${data}%`,
                color: "#3344ff"
            }]
        }
    }


export function showPetalInformation(container: PetalContainer) {
    const slot = container.ui_slot;
    const definition = container.petalDefinition;
    if (!definition || !slot) return;

    const box = $<HTMLDivElement>("<div class='information'></div>").clone();

    $("body").append(box);
    container.informationBox = box;
    container.showingInformation = true;

    const offset = slot.offset();
    if (offset){
        box.css("left", offset.left + "px");
        box.css("top", offset.top - 10 + "px");
    }

    function addLine(args: InformationLineParameters){
        let {
            startsWith,
            endsWith,
            value,
            fontSize,
            color
        } = args;
        startsWith = startsWith ? startsWith + "&nbsp;" : "";
        endsWith = endsWith ?? "";
        value = value ?? "";
        fontSize = fontSize ?? 13;
        color = color ?? "#FFFFFF";

        const line = $(`<div></div>`);
        line.css("display", "flex");

        const startS =
            $(`<p textStroke="${startsWith}">${startsWith}</p>`);

        const valueS =
            $(`<p textStroke="${value}">${value}</p>`);

        const endS =
            $(`<p textStroke="${endsWith}">${endsWith}</p>`);

        startS.css("font-size", fontSize + "px")
        startS.css("color", color)

        valueS.css("font-size", fontSize + "px")
        valueS.css("color", "#FFFFFF");

        endS.css("font-size", fontSize + "px");
        endS.css("color", "#FFFFFF");

        line.append(startS);
        line.append(valueS);
        line.append(endS);

        box.append(line);
    }

    function addBr(){
        box.append($("<p class='br'></p>"));
    }

    function addData(config: typeof petalDefinitionShowingConfigs[string], value: string) {
        if (config.noValue) {
            addLine({
                startsWith: config.displayName,
                color: config.color
            })

            return;
        }

        addLine({
            startsWith: config.displayName
                + `: `,
            value: `${config.startsWith ?? ""}` + value,
            endsWith: config.endsWith ?? "",
            color: config.color
        })
    }

    addLine({
        value: definition.displayName,
        fontSize: 25
    })

    const rarity = Rarity.fromStringSafe(definition.rarity);
    if (rarity) {
        addLine({
            startsWith: rarity.displayName,
            value: "",
            fontSize: 12,
            color: rarity.color
        })
    }

    addBr();

    if (definition.description) {
        addLine({
            value: definition.description,
            fontSize: 12
        })
    }

    addBr();

    for (const definitionKey in definition) {
        if (petalDefinitionShowingConfigs.hasOwnProperty(definitionKey)) {
            const showing =
                petalDefinitionShowingConfigs[definitionKey];
            addData(showing,
                (definition[definitionKey as keyof PetalDefinition]
                    ?? "").toString()
            );
        }
    }

    if (definition.modifiers) {
        for (const modifiersDefinitionKey in definition.modifiers) {
            const showing =
                petalDefinitionShowingConfigs[modifiersDefinitionKey];
            let original = (definition.modifiers
                [modifiersDefinitionKey as keyof PlayerModifiers]);
            if (!showing) continue;

            // 特殊处理conditionalHeal
            if (modifiersDefinitionKey === "conditionalHeal" && original) {
                const conditionalHeal = original as {healthPercent: number, healAmount: number};
                addData(showing, "");
                addLine({
                    startsWith: "HP < " + (conditionalHeal.healthPercent * 100).toFixed(0) + "%: ",
                    value: "+" + conditionalHeal.healAmount.toFixed(1),
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
                    value = original * 100 - 100;
                    if (value > 0) startsWith = "+"
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
            if (!data) return attributesDefinitionKey;
            const config =
                (attributesShowingConfigs[attributesDefinitionKey] as AttributeShowingFunction<typeof attributesDefinitionKey>)
                (data);
            config.forEach(e => {
                addData(e as DefinitionShowingConfig,
                    e.value
                );
            })
        }
    }

    if (!definition.equipment && definition.reloadTime) {
        let content = definition.reloadTime + "s";
        if (definition.usable) {
            content += " + " + definition.useTime + "s";
        }
        const reload = $(`<p textStroke="${content}">${content}<p>`);

        reload.css("position", "absolute");
        reload.css("right", "7px");
        reload.css("top", "10px");

        box.append(reload);
    }

    const occupy = $("<div style='height: 1px; width: 200px'></div>");
    box.append(occupy)

    box.css("opacity", "0").animate({ opacity: 1 }, 100);
}

const mobDefinitionShowingConfigs: { [key: string] : DefinitionShowingConfig } =
{
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
    },
}

export function showMobInformation(gallery: Gallery, container: MobContainer) {
    const slot = container.ui_slot;
    const definition = container.mobDefinition;
    if (!definition || !slot) return;

    const box =
        $<HTMLDivElement>("<div class='information'></div>").clone();

    $("body").append(box);
    container.informationBox = box;
    container.showingInformation = true;

    const offset = slot.offset();
    if (offset){
        box.css("left", offset.left + "px");
        box.css("top", offset.top - 10 + "px");
    }

    function addLine(args: InformationLineParameters){
        let {
            startsWith,
            endsWith,
            value,
            fontSize,
            color
        } = args;
        startsWith = startsWith ? startsWith + "&nbsp;" : "";
        endsWith = endsWith ?? "";
        value = value ?? "";
        fontSize = fontSize ?? 13;
        color = color ?? "#FFFFFF";

        const line = $(`<div></div>`);
        line.css("display", "flex");

        const startS =
            $(`<p textStroke="${startsWith}">${startsWith}</p>`);

        const valueS =
            $(`<p textStroke="${value}">${value}</p>`);

        const endS =
            $(`<p textStroke="${endsWith}">${endsWith}</p>`);

        startS.css("font-size", fontSize + "px")
        startS.css("color", color)

        valueS.css("font-size", fontSize + "px")
        valueS.css("color", "#FFFFFF");

        endS.css("font-size", fontSize + "px");
        endS.css("color", "#FFFFFF");

        line.append(startS);
        line.append(valueS);
        line.append(endS);

        box.append(line);
    }

    function addBr(){
        box.append($("<p class='br'></p>"));
    }

    function addData(config: typeof mobDefinitionShowingConfigs[string], value: string) {
        if (config.noValue) {
            addLine({
                startsWith: config.displayName,
                color: config.color
            })

            return;
        }

        addLine({
            startsWith: config.displayName
                + `: `,
            value: `${config.startsWith ?? ""}` + value,
            endsWith: config.endsWith ?? "",
            color: config.color
        })
    }

    addLine({
        value: definition.displayName,
        fontSize: 25
    })

    const rarity = Rarity.fromStringSafe(definition.rarity);
    if (rarity) {
        addLine({
            startsWith: rarity.displayName,
            value: "",
            fontSize: 12,
            color: rarity.color
        })
    }

    addBr();

    if (definition.description) {
        addLine({
            value: definition.description,
            fontSize: 12
        })
    }

    addBr();

    for (const definitionKey in definition) {
        if (mobDefinitionShowingConfigs.hasOwnProperty(definitionKey)) {
            const showing =
                mobDefinitionShowingConfigs[definitionKey];
            addData(showing,
                (definition[definitionKey as keyof MobDefinition]
                    ?? "").toString()
            );
        }
    }

    if (definition.modifiers) {
        for (const modifiersDefinitionKey in definition.modifiers) {
            const showing =
                mobDefinitionShowingConfigs[modifiersDefinitionKey];
            let original = (definition.modifiers
                [modifiersDefinitionKey as keyof Modifiers]);
            if (!showing) continue;

            if (!original) {
                addData(showing,
                    ""
                );
            } else {
                let value = original;
                let startsWith = "";
                let endsWith = "";
                if (showing.percent) {
                    value = original * 100 - 100;
                    if (value > 0) startsWith = "+"
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
        if (definition.shoot.damage) addLine({
            startsWith: "Missile Damage: ",
            value: definition.shoot.damage.toString(),
            color: "#fd6565"
        })

        if (definition.shoot.health) addLine({
            startsWith: "Missile Health: ",
            value: definition.shoot.health.toString(),
            color: "#58fd48"
        })
    }

    const xp = definition.exp;
    const reload = $(`<p textStroke="${xp}◆">${xp}◆<p>`);

    reload.css("position", "absolute");
    reload.css("right", "7px");
    reload.css("top", "10px");

    box.append(reload);

    addBr()

    const loots = $(`<div class="mob-loots"></div>`)

    const sortedLootTable = Object.keys(definition.lootTable).sort(
        (a, b) =>
            Rarity.fromString(Petals.fromString(a).rarity).level - Rarity.fromString(Petals.fromString(b).rarity).level
    )

    for (const lootTableKey of sortedLootTable) {
        const rate = Big(definition.lootTable[lootTableKey]).mul(100);
        const loot = Petals.fromStringSafe(lootTableKey);

        const lootDOM = $(`<div class="mob-loot"></div>`)
        const rateDOM = $(`<p class="drop-rate" textStroke="${rate}%">${rate}%</p>`);

        if (!loot) continue;

        if (gallery.petalGallery.includes(lootTableKey)) {
            lootDOM.append(renderPetal(loot))
        } else {
            lootDOM.append($(`<div class="unknown">
                <div textStroke="?">?</div>
            </div>`))
        }
        lootDOM.append(rateDOM)
        loots.append(lootDOM)
    }

    box.append(loots)

    const occupy = $("<div style='height: 1px; width: 300px'></div>");
    box.append(occupy);

    box.css("opacity", "0").animate({ opacity: 1 }, 100);
}

export function unShowInformation(container: PetalContainer | MobContainer) {
    const boxToFade = container.informationBox;
    if (!container.showingInformation || !boxToFade) return;
    boxToFade.animate({ opacity: 0 }, 100);
    setTimeout(() => {
        boxToFade.remove();
        container.showingInformation = false;
        container.informationBox = undefined;
    }, 100)
}
