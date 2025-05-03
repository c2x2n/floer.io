import { Game } from "@/scripts/game.ts";
import $ from "jquery";
import { Vec2 } from "@common/utils/vector.ts";
import { P2, MathGraphics, MathNumeric } from "@common/utils/math.ts";
import { AttributeParameters, PetalDefinition, Petals, SavedPetalDefinitionData } from "@common/definitions/petal.ts";
import { UI } from "@/ui.ts";
import { Rarity } from "@common/definitions/rarity.ts";
import { PlayerModifiers } from "@common/typings.ts";
import { AttributeName } from "@common/definitions/attribute.ts";
import { ActionType } from "@common/constants";

const defaultCenter = Vec2.new(25, 21);

interface EasingData {
    x: number,
    y: number,
    w: number,
    opacity: number,
    angle: number,
    fontSize: number
}

interface DraggingData {
    item: JQuery | null,
    container: PetalContainer | null
}

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

type AttributeShowingFunction<K extends AttributeName> =
    (data: Required<AttributeParameters>[K]) => (DefinitionShowingConfig & { value: string })[];

let draggingData: DraggingData = {
    item: null, container: null
};

const defaultRadius = 8;
const defaultBoxSize = 50;
const draggingBoxSize = 68;

let mouseSelectingPetal: PetalContainer | undefined = undefined;

let mouseDeletingPetal: boolean = false;

const definitionShowingConfigs: { [key: string] : DefinitionShowingConfig } =
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

const attributesShowingConfigs: { [K in AttributeName] : AttributeShowingFunction<K>} =
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

export function renderPetal(petal: PetalDefinition, baseFs: number = 13.2) {
    const petal_box = $<HTMLDivElement>(
        `<div class="petal"></div>`
    );

    const rarity = Rarity.fromString(petal.rarity);
    petal_box.css("background", rarity.color);
    petal_box.css("border-color", rarity.border);
    const piece = $(`<div class='petal-${petal.idString} piece-petal'></div>`)
    piece.css("background-size", `100% 100%`);
    piece.css("width", "100%")
    piece.css("height", "100%")

    petal_box.append(piece)

    return petal_box;
}

export class Inventory{
    equippedPetals: PetalContainer[] = [];
    preparationPetals: PetalContainer[] = [];

    slot: number = 0;

    keyboardSelectingPetal?: PetalContainer;

    readonly ui: UI;

    get inventory(): PetalContainer[] {
        return this.equippedPetals.concat(this.preparationPetals);
    }

    isDraggingReturningToSlot: boolean = false;

    swingAngle: number = 0;
    swingProgress: number = 0;

    inventoryAnimation() {
        if (draggingData.item && draggingData.container && !this.isDraggingReturningToSlot) {
            const petalElement = draggingData.item.find('.petal');

            const sizeNow = petalElement.width() || 50;

            petalElement.css('--x', `${
                parseFloat(draggingData.item.css('--x')) * sizeNow / draggingBoxSize
            }px`);

            const { clientX, clientY } = this.game.input.mousePosition;

            const where = draggingData.item.offset();

            let currentX: number;
            let currentY: number;

            if (!where) {
                currentX = clientX;
                currentY = clientY;
            } else {
                currentX = MathNumeric.targetEasing(where.left, clientX);
                currentY = MathNumeric.targetEasing(where.top, clientY);
            }

            // Follow
            draggingData.item.css(
                "transform", `translate(
                        ${currentX}px,
                        ${currentY}px
                    ) translate(-10%, -10%)`
            );
            draggingData.item.css('width',
                `${MathNumeric.targetEasing(sizeNow, draggingBoxSize, 4)}px`
            );
            draggingData.item.css('height',
                `${MathNumeric.targetEasing(sizeNow, draggingBoxSize, 4)}px`
            );

            let swingProgress = this.swingProgress;
            swingProgress = (swingProgress + 0.015) % 1;
            let swingAngle: number;

            // Use sine function for smooth pendulum motion
            const t = Math.sin(swingProgress * Math.PI * 2);
            // Apply cubic easing to the sine wave
            const easedT = Math.sign(t) * Math.pow(Math.abs(t), 0.8);
            swingAngle = 10 * easedT;

            // Apply rotation to the petal inside the dragging container
            if (petalElement.length) {
                petalElement.css('transform', `translate(-50%, -50%) rotate(${swingAngle}deg)`);
            }

            this.swingProgress = swingProgress;
        }

        window.requestAnimationFrame(this.inventoryAnimation.bind(this));
    };

    constructor(private readonly game: Game) {
        this.ui = game.ui;

        window.requestAnimationFrame(this.inventoryAnimation.bind(this));


        $(document).on("mousedown", (ev) => {
            this.swingAngle = 0;
            this.swingProgress = 0;
        });

        $(document).on("mouseup", (ev) => {
            // DO NOT let users swap petals if a swap anim is in progress... need a lot more effort if you want two animations and swaps
            // happen simultaneously AND not break the animation WHEN not fucking up the logics
            if (this.isDraggingReturningToSlot) return;
            if (draggingData.item && draggingData.container) {
                this.processInventoryChanges(draggingData);
            }
        })
    }

    /**
     * Animate the petal element when its going from one place to another.
     * position, size, opacity, angle and font size are handled in the process.
     * @param petalEl The petal element to animate
     * @param destination An object containing the destination position, size, opacity, angle. Ideally font size and border size should follow the size scaling so it does not need to be included
     * @param resolve A function to run once the animation is finished
     * @param from - [OPTIONAL] An object containing the starting position, size, opacity, angle. These will be parsed from petalEl if this param is not passed
     */
    // TODO: Font size is still incorrect sometimes
    // Make sure all of them are successfully obtained from the correct petal  element
    // some need to use find('.petal') some do not
    animatePetalToPosition(petalEl: JQuery<HTMLElement>,destination: EasingData = {
        x: 0, // x and y cant be 0 under normal circumstances...
        y: 0,
        w: 50, // 50 for main, 35 for secondary
        opacity: 0.85, // should be consistent
        angle: 0,
        fontSize: 13.2, // 12 for main, 8 for secondary
    }, resolve?: Function, from?: EasingData) {
        const currentOffset = petalEl.offset();
        if (!currentOffset) {
            petalEl.remove();
            resolve?.();
            return false;
        }

        from = (from ??
            {
                x: currentOffset.left,
                y: currentOffset.top,
                w: petalEl.width() || draggingBoxSize,
                opacity: parseFloat(petalEl.css('opacity')) || 1,
                angle: this.swingAngle || 0,
                fontSize: parseFloat(petalEl.css('--x')) || 13.2*1.4,
            }) as EasingData;

        const duration = 250;
        let st = performance.now();

        const animate = (ct: number) => {
            if (!from || !petalEl || !petalEl.parent().length) {
                resolve?.();
                return;
            }

            const elapsed = ct - st;
            const progress = Math.min(elapsed / duration, 1);

            // ease-out-quint for position
            const easeOutQuint = 1 - Math.pow(1 - progress, 5);
            const curX = from.x + (destination.x - from.x) * easeOutQuint;
            const curY = from.y + (destination.y - from.y) * easeOutQuint;

            // ease-out-cubic for angle, size, opac
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentAngle = from.angle * (1 - easeOutCubic);
            const currentW = MathNumeric.targetEasing(
                petalEl.width() ?? destination.w, destination.w, 4
            );
            const currentOpacity = MathNumeric.targetEasing(from.opacity, destination.opacity, 4);

            const scale = currentW / destination.w;

            // scale font
            const updateFontSz = destination.fontSize * (scale);
            const petalElement = petalEl.find('.petal');
            if (petalElement.length) {
                petalElement.css('--x', `${updateFontSz}px`);
            }


            petalEl.css("opacity", currentOpacity);
            petalEl.css("transform", `translate(${curX}px, ${curY}px)`);

            petalEl.css("width", `${currentW}px`);
            petalEl.css("height", `${currentW}px`);

            if (petalElement.length) {
                petalElement.css('transform', `translate(-50%, -50%) rotate(${currentAngle}deg)`);
                petalElement.css('border-width', '4px'); // prevent changing, dunno why it was scaled
            }

            if (progress < 1) {
                window.requestAnimationFrame(animate);
            } else {
                petalEl.remove();
                resolve?.();
                this.isDraggingReturningToSlot = false;
            }
        };

        window.requestAnimationFrame(animate);
        this.isDraggingReturningToSlot = true;
    }

    cleanUpAll(): void {
        draggingData.item = null;

        mouseSelectingPetal = undefined;
        mouseDeletingPetal = false;
        this.keyboardSelectingPetal = undefined;
        this.updatePetalRows();
    }

    processInventoryChanges(draggingData: DraggingData) {
        // Ensure container exists before processing
        if (!draggingData.container || !draggingData.item) {
            console.warn("[ProcessInventoryChanges] No draggingData.container found. Aborting.");
            // Reset interaction state variables even if aborting
            return this.cleanUpAll();
        }

        const originalIndex = this.inventory.indexOf(draggingData.container);
        // Case 1: Swapping to a different slot
        if (mouseSelectingPetal && mouseSelectingPetal != draggingData.container) {
            const targetIndex = this.inventory.indexOf(mouseSelectingPetal);

            const trans = mouseSelectingPetal.petalDefinition;
            mouseSelectingPetal.petalDefinition = draggingData.container.petalDefinition;
            draggingData.container.petalDefinition = trans;

            this.switchPetals(originalIndex, targetIndex);

            let dest1 = this.findDestinationSlot(targetIndex);
            let dest2 = this.findDestinationSlot(originalIndex);

            // Create a clone of the target petal for the second animation
            let targetPetalEl: JQuery<HTMLElement> | null = null;
            let targetPetalClone: JQuery<HTMLElement> | null = null;
            let fromSlotDetails: EasingData | undefined = undefined;
            if (mouseSelectingPetal.ui_slot) {
                targetPetalEl = mouseSelectingPetal.ui_slot.find('.petal');
                if (targetPetalEl.length) {
                    // Create a dragging-petal container for the clone
                    targetPetalClone = $('<div class="dragging-petal"></div>');
                    const innerPetalClone = targetPetalEl.clone();
                    targetPetalClone.append(innerPetalClone);

                    targetPetalEl.css('opacity', 0); // Hide the original petal

                    // Position the clone at the original target slot
                    const targetOffset = mouseSelectingPetal.ui_slot.offset();
                    if (targetOffset) {
                        targetPetalClone.css({
                            position: 'fixed',
                            //left: targetOffset.left + 'px',
                            // top: targetOffset.top + 'px',
                            width: (mouseSelectingPetal.ui_slot.width() || 50) + 'px',
                            height: (mouseSelectingPetal.ui_slot.height() || 50) + 'px',
                            zIndex: parseInt(draggingData.item.css('z-index'))-1, // Below the main dragged item
                            opacity: 1,
                            pointerEvents: 'none'
                        });

                        // Set initial font size on the inner clone
                        const targetFontSize = parseFloat(targetPetalEl.css('--x')) || 13.2;
                        innerPetalClone.css('--x', `${targetFontSize}px`);

                        // Add to body
                        $('body').append(targetPetalClone);

                        fromSlotDetails = {
                            x: targetOffset.left + (mouseSelectingPetal.ui_slot.width() || 0) / 2,
                            y: targetOffset.top + (mouseSelectingPetal.ui_slot.height() || 0) / 2,
                            w: (mouseSelectingPetal.ui_slot.width() || 50),
                            opacity: parseFloat(mouseSelectingPetal.ui_slot.css('opacity')) || 0.85,
                            angle: parseFloat(mouseSelectingPetal.ui_slot.css('opacity')) || 0,
                            fontSize: parseFloat(targetPetalEl.css('--x')) || (13.2)
                        }
                    }
                }
            }

            let i = 0;
            const toEmpty = targetPetalClone ? 2 : 1;
            let animationsRemaining = !toEmpty ? 2 : 1;

            const onAnimationComplete = (Iplus: boolean = false) => {
                if(Iplus) i++;
                animationsRemaining--;
                if (animationsRemaining === 0) {
                    // All animations complete, clean up
                    targetPetalClone?.remove();
                    this.cleanUpAll();
                }
            };

            for (let dest of [dest1, dest2]) {
                let destOffset = dest?.offset();
                // For first iteration, animate the dragged item
                // For second iteration, animate the target clone
                let petalToAnimate = i === 0 ? draggingData.item : targetPetalClone;

                if (i === 1 && toEmpty < 2 || !dest || !destOffset || !petalToAnimate) {
                    onAnimationComplete(true);
                    continue;
                }

                let fromObj = i === 1 ? fromSlotDetails : undefined;
                // on iteration 1, fromObj is undefined, method will parse from draggingData.item
                // on iteration 2, method uses provided obj parsed earlier from targetPetalEl
                const scale = (petalToAnimate.width() ?? 50) / (dest.width() ?? 50); // 35
                const innerPetal = petalToAnimate.find('.petal');
                let rnFontSz = 13.2*scale;
                if  (innerPetal) {
                    rnFontSz = parseFloat(innerPetal.css('--x'));
                }
                const finalFontSize = rnFontSz / scale;

                this.animatePetalToPosition(petalToAnimate, {
                    x: (destOffset.left + (dest.width() || 0) / 2)+1,
                    y: (destOffset.top + (dest.height() || 0) / 2)+1,
                    w: dest.width() || 50, // 35 if secondary
                    opacity: 0.92, // value chosen to best blend petal colour and slot colour...
                    angle: 0, // should always be 0
                    fontSize: finalFontSize || 13.2, // 8 for secondary
                }, onAnimationComplete, fromObj);
                i++
            }

            // Return early to prevent the final updatePetalRows call
            // We'll call it in the onAnimationComplete callback instead
            return;
        } else if (mouseDeletingPetal) {
            draggingData.container.petalDefinition = null;
            this.deleteSlot(originalIndex)

            // Animate deletion - shrink to 0 size and fade opacity to 0.5
            if (draggingData.item && this.ui.deletePetal) {
                const deleteOffset = this.ui.deletePetal.offset();
                if (deleteOffset) {
                    this.animatePetalToPosition(draggingData.item, {
                        x: (deleteOffset.left + (this.ui.deletePetal.width() || 0) / 2)+1,
                        y: (deleteOffset.top + (this.ui.deletePetal.height() || 0) / 2)+1,
                        w: 0.1, // shrink to almost nothing
                        opacity: 0.2, // fade to almost nothing
                        angle: 0,
                        fontSize: 0.025, // starts at like 17. something, close enough to 16.8 (dragging petal fsz)
                    }, () => {
                        draggingData.item = null; // It is already removed by the animation method
                    });
                    return; // Skip the immediate removal below
                }
            }
            // Fallback if animation can't be performed
            draggingData.item.remove();
            draggingData.item = null;

            // Case 3: Dropping back to original slot OR onto empty space (No data change needed)
        } else {
            // Animate return to original slot
            if (draggingData.item && draggingData.container && draggingData.container.ui_slot) {
                const originalSlot = draggingData.container.ui_slot;
                const slotOffset = originalSlot.offset();

                if (slotOffset) {
                    const scale = (draggingData.item.width() || 50) / (originalSlot.width() || 50); // 35
                    const innerPetal = draggingData.item.find('.petal');
                    let rnFontSz = 13.2*scale;
                    if  (innerPetal) {
                        rnFontSz = parseFloat(innerPetal.css('--x'));
                    }
                    const FINALFONTSZ = rnFontSz / scale;
                    this.animatePetalToPosition(draggingData.item, {
                        x: (slotOffset.left + (originalSlot.width() || 0) / 2)+1,
                        y: (slotOffset.top + (originalSlot.height() || 0) / 2)+1,
                        w: originalSlot.width() || 50,
                        opacity: 0.92,
                        angle: 0,
                        fontSize: FINALFONTSZ || 13.2,
                    }, () => {
                        draggingData.item = null; // It is already removed by the animation method

                        // Call updatePetalRows AFTER the animation completes to redraw the petal in its slot
                        this.updatePetalRows();
                    });
                    return; // Skip the immediate removal below
                }
            }
            // Fallback if animation can't be performed
            draggingData.item.remove();
            draggingData.item = null;

            // Update UI immediately if we didn't animate
            this.updatePetalRows();
            return; // Skip the updatePetalRows call at the end of processInventoryChanges
        }

        this.cleanUpAll();
    };

    findDestinationSlot(targetIndex: number) {
        let destinationElement: JQuery<HTMLElement> | null = null;
        if (targetIndex < 0) {
            console.warn(`Invalid targetIndex: ${targetIndex}`);
            return null;
        }
        if (targetIndex >= this.equippedPetals.length) {
            // is a secondary slot , >= : 10 is also a secondary slot
            destinationElement = this.preparationPetals[
            targetIndex - this.equippedPetals.length]?.ui_slot || null;
        } else {
            destinationElement = this.equippedPetals[targetIndex]?.ui_slot || null;
        }
        return destinationElement;
    }

    moveSelectSlot(offset: number) {
        const allActiveSlot = this.preparationPetals.filter((v) => v.petalDefinition);
        const lastestSlot = allActiveSlot[allActiveSlot.length - 1];

        const firstSlot = allActiveSlot[0];
        if (!firstSlot) return this.keyboardSelectingPetal = undefined;


        let index: number = -1;
        if (!this.keyboardSelectingPetal) {
            if (offset == 0) return;
            index = 0;
        } else {
            index = this.preparationPetals.indexOf(this.keyboardSelectingPetal);
            this.keyboardSelectingPetal.ui_slot?.removeClass("selecting-petal");
            index += offset;
        }

        if (index >= this.preparationPetals.length) {
            index = 0;
        }

        this.keyboardSelectingPetal = this.preparationPetals[index];

        if (index < 0) {
            this.keyboardSelectingPetal =
                this.preparationPetals[this.preparationPetals.length + index];
        }

        if (!this.keyboardSelectingPetal.petalDefinition) {
            if (offset > 0) {
                const finding = this.preparationPetals.find((v, i) => i > index && v.petalDefinition);
                if (!finding) {
                    this.keyboardSelectingPetal = firstSlot;
                } else {
                    this.keyboardSelectingPetal = finding;
                }
            } else if (offset < 0){
                const finding =
                    this.preparationPetals.filter((v, i) =>
                        i < index && v.petalDefinition);
                if (finding.length === 0) {
                    this.keyboardSelectingPetal = lastestSlot;
                } else {
                    this.keyboardSelectingPetal = finding[finding.length - 1];
                }
            }
        }

        this.keyboardSelectingPetal.ui_slot?.addClass("selecting-petal");
    }

    transformAllSlot() {
        this.game.input.actionsToSend.add({
            type: ActionType.TransformLoadout
        })
    }

    switchPetals(index1: number, index2: number) {
        this.game.input.actionsToSend.add({
            type: ActionType.SwitchPetal,
            petalIndex: index1,
            petalToIndex: index2
        })
    }

    switchSlot(slot: number) {
        if (slot < 0 || slot >= this.equippedPetals.length) return;
        this.switchPetals(slot, slot + this.equippedPetals.length);
    }

    deleteSlot(index: number) {
        if (index < 0 || index >= this.inventory.length) return;
        this.game.input.actionsToSend.add({
            type: ActionType.DeletePetal,
            petalIndex: index
        })
    }

    setSlotAmount(slot: number, prepare: number){
        // this.equippedPetals = [];
        // this.preparationPetals = [];
        const orgEquipSlot = this.equippedPetals.length;
        if (slot >= orgEquipSlot){
            for (let i = 0; i < slot - orgEquipSlot; i++) {
                this.equippedPetals.push(new PetalContainer())
            }
        } else {
            for (let i = 0; i < orgEquipSlot - slot; i++) {
                this.equippedPetals.splice(i + slot)
            }
        }

        const orgPrepSlot = this.preparationPetals.length;
        if (prepare >= orgPrepSlot){
            for (let i = 0; i < prepare - orgPrepSlot; i++) {
                this.preparationPetals.push(new PetalContainer())
            }
        } else {
            for (let i = 0; i < orgPrepSlot - prepare; i++) {
                this.preparationPetals.splice(i + prepare)
            }
        }

        this.slot = slot;

        this.updatePetalRows();
    }

    static loadContainers(petals: PetalContainer[], loadout: string[] | number[]){
        let index = 0;
        for (const equip of loadout) {
            if (index >= petals.length) break;
            if (typeof equip === 'number'){
                petals[index].loadFromId(equip);
            } else {
                petals[index].loadFromString(equip);
            }
            index ++;
        }
    }

    loadArrays(equips: string[] | number[], prepares: string[] | number[]) {
        Inventory.loadContainers(this.equippedPetals, equips);
        Inventory.loadContainers(this.preparationPetals, prepares);
    }

    loadInventoryData(inventory: SavedPetalDefinitionData[]) {
        let index = 0;
        for (const equip of inventory) {
            if (index >= this.equippedPetals.length) {
                const pindex = index - this.equippedPetals.length;

                if (pindex >= this.preparationPetals.length) break;

                if (equip) {
                    this.preparationPetals[pindex].petalDefinition = equip;
                } else {
                    this.preparationPetals[pindex].petalDefinition = null;
                }

                index ++;

                continue;
            }
            if (equip) {
                this.equippedPetals[index].petalDefinition = equip;
            } else {
                this.equippedPetals[index].petalDefinition = null;
            }
            index ++;
        }

        // we dont want this method to update the petal UI display yet
        if (this.isDraggingReturningToSlot) return;

        this.updatePetalRows();
    }

    oldInventory: PetalContainer[] = [];

    updatePetalRows() {
        mouseSelectingPetal = undefined;
        mouseDeletingPetal = false;

        this.renderPetalRow(this.equippedPetals, this.ui.equippedPetalRow);
        this.renderPetalRow(this.preparationPetals, this.ui.preparationPetalRow);

        if (this.oldInventory != this.inventory) {
            for (const cont of this.inventory) {
                if (cont.petalDefinition)
                    this.ui.gallery.addGallery(cont.petalDefinition);
            }
            this.oldInventory = this.inventory;
        }

        if (this.game.running) {
            this.ui.hud.append(this.ui.petalColumn);
            this.ui.preparationPetalRow.append(this.ui.deletePetal);

            $(".petal-information").remove();

            this.ui.deletePetal.on("mouseover",() => {
                mouseDeletingPetal = true;
            });

            this.ui.deletePetal.on("mouseout",() => {
                mouseDeletingPetal = false;
            });

            this.moveSelectSlot(0);
        } else {
            this.ui.main.append(this.ui.petalColumn);
            this.ui.deletePetal.remove();
        }
    }

    renderPetalRow(petals: PetalContainer[], row: JQuery) {
        row.children().remove();
        petals.forEach((petalContainer) => {
            const petal_slot = $(`<div class="petal-slot"></div>`);

            petalContainer.ui_slot = petal_slot;

            petalContainer.informationBox?.remove();
            petalContainer.showingInformation = false;

            petal_slot.on("mouseover",() => {
                mouseSelectingPetal = petalContainer;
            })

            petal_slot.on("mouseout",() => {
                if(mouseSelectingPetal === petalContainer) mouseSelectingPetal = undefined;
            })

            row.append(petal_slot);

            if (petalContainer.petalDefinition) {
                if (draggingData.item && draggingData.container == petalContainer) return;
                const fontSize = parseFloat(petalContainer.ui_slot.css('--x'));
                const petal =
                    renderPetal(petalContainer.petalDefinition, fontSize);

                petal_slot.append(petal);

                petal.on("mousedown", (ev) => {
                    if (!this.game.running) return;
                    if (draggingData.item) return;

                    const dragging = $(`<div class="dragging-petal"></div>`);

                    const scale = draggingBoxSize / (petal.width() ?? draggingBoxSize);
                    const finalFontSize = parseFloat(petal.css('--x')) || parseFloat(petal.css('font-size'));

                    dragging.css("--x",
                        (finalFontSize * scale).toString())
                    const {clientX, clientY} = ev;
                    draggingData = {
                        item: dragging,
                        container: petalContainer
                    }
                    dragging.css(
                        "transform",
                        `translateX(${clientX}px) translateY(${clientY}px)`
                    );

                    dragging.append(petal);
                    $("body").append(dragging);
                })

                petal.on("mouseover",(ev) => {
                    if (!petalContainer.showingInformation) this.showInformation(petalContainer);
                })

                petal.on("mouseout",(ev) => {
                    if (petalContainer.showingInformation) this.unShowInformation(petalContainer);
                })
            }
        })
    }

    equippedPetalsData(): SavedPetalDefinitionData[] {
        return this.equippedPetals.reduce(
            (pre, cur) => {
                if (cur.petalDefinition){
                    pre.push(cur.petalDefinition)
                } else {
                    pre.push(null);
                }
                return pre;
            },
            [] as SavedPetalDefinitionData[]
        )
    }


    switchSelectingSlotTo(slot: number) {
        if (slot < 0 || slot >= this.equippedPetals.length) return;
        if (this.keyboardSelectingPetal) {
            this.switchPetals(slot, this.inventory.indexOf(this.keyboardSelectingPetal))
            return;
        }
        if (!this.preparationPetals[slot].petalDefinition) return;
        this.switchPetals(slot, slot + this.equippedPetals.length);
        this.keyboardSelectingPetal = this.preparationPetals[slot];
        this.moveSelectSlot(0);
    }

    deleteSelectingSlot() {
        if (!this.keyboardSelectingPetal) return;
        this.deleteSlot(this.inventory.indexOf(this.keyboardSelectingPetal))
        this.moveSelectSlot(1);
    }

    showInformation(container: PetalContainer) {
        const slot = container.ui_slot;
        const definition = container.petalDefinition;
        if (!definition || !slot) return;

        const box = this.ui.petalInformation.clone();

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
            box.append($("<br>"));
        }

        function addData(config: typeof definitionShowingConfigs[string], value: string) {
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
            if (definitionShowingConfigs.hasOwnProperty(definitionKey)) {
                const showing =
                    definitionShowingConfigs[definitionKey];
                addData(showing,
                    (definition[definitionKey as keyof PetalDefinition]
                        ?? "").toString()
                );
            }
        }

        if (definition.modifiers) {
            for (const modifiersDefinitionKey in definition.modifiers) {
                const showing =
                    definitionShowingConfigs[modifiersDefinitionKey];
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
            let attributesDefinitionKey: AttributeName;
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

    unShowInformation(container: PetalContainer) {
        const boxToFade = container.informationBox;
        if (!container.showingInformation || !boxToFade) return;
        boxToFade.animate({ opacity: 0 }, 100);
        setTimeout(() => {
            boxToFade.remove();
            container.showingInformation = false;
            container.informationBox = undefined;
        }, 100)
    }
}

export class PetalContainer {
    ui_slot?: JQuery;
    petalDefinition: SavedPetalDefinitionData = null;
    showingInformation: boolean = false;
    informationBox?: JQuery;

    constructor() {}

    loadFromString(idString: string): this{
        this.petalDefinition = Petals.fromStringData(idString);
        return this;
    }

    loadFromId(id: number): this{
        this.petalDefinition = Petals.definitions[id];
        return this;
    }
}

