import { Game } from "@/scripts/game.ts";
import $ from "jquery";
import { Vec2 } from "@common/utils/vector.ts";
import { P2, MathGraphics, MathNumeric } from "@common/utils/math.ts";
import { AttributeParameters, PetalDefinition, Petals, SavedPetalDefinitionData } from "@common/definitions/petal.ts";
import { UI } from "@/ui.ts";
import { RarityName, Rarity } from "@common/definitions/rarity.ts";
import { getGameAssetsFile } from "@/scripts/utils/pixi.ts";
import { PlayerModifiers } from "@common/typings.ts";
import { AttributeName } from "@common/definitions/attribute.ts";
import { GameConstants } from "@common/constants";

const defaultCenter = Vec2.new(25, 21);

interface DraggingData{
    item: JQuery | null,
    container: PetalContainer | null
}

interface showingParameters{
    startsWith?: string
    value?: string
    endsWith?: string
    fontSize?: number
    color?: string
}

interface showingConfig {
    displayName: string
    color: string
    startsWith?: string
    endsWith?: string
    noValue?: boolean
    percent?: boolean
}

type AttributeShowingFunction<K extends AttributeName> = (data: Required<AttributeParameters>[K]) => (showingConfig & { value: string })[];

let draggingData: DraggingData = {
    item: null, container: null
};

const defaultRadius = 8;
const defaultBoxSize = 50;

let mouseSelectingPetal: PetalContainer | undefined = undefined;

let mouseDeletingPetal: boolean = false;

const showingConfig: { [key: string] : showingConfig } =
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

const attributesShowingConfig: { [K in AttributeName] : AttributeShowingFunction<K>} =
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
            if (typeof data === 'number') {
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
            }
            return [];
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
        /*revive: (data) => {
            return [...(data.reviveHpMulti !== undefined ? [{
                displayName: "Revive HP",
                value: data.reviveHpMulti.toString()+"%",
                color: "#58fd48"
            }]:[]),
            ...(data.reviveShieldMulti !== undefined ? [{
                displayName: "Revive Shield",
                value: data.reviveShieldMulti.toString()+"%",
                color: "#d2eb34"
            }] : []),
            ]
        }*/
    }

export function renderPetalPiece(
    xOffset: number, yOffset: number, displaySize: number, petal: PetalDefinition, rotated?: number
) {
    const sizePercent = displaySize;
    const size = sizePercent / 100 * defaultBoxSize / 2;
    const center = Vec2.sub(defaultCenter, Vec2.new(size, size));
    const rotatedDegree =
        MathGraphics.radiansToDegrees(petal.images?.slotRotation ?? 0) + (rotated ?? 0);

    const piece = $(`<img alt='' class='piece-petal' src=
        '/img/game/petal/${getGameAssetsFile(petal)}'>`
    );
    piece.css("width", `${ sizePercent }%`);
    piece.css("height", `${ sizePercent }%`);
    const { x, y } = center;

    piece.css("top", `${ (y + yOffset) / defaultBoxSize * 100 }%`);
    piece.css("left", `${ (x + xOffset) / defaultBoxSize * 100 }%`);
    piece.css("transform", `rotate(${rotatedDegree}deg)`)

    return piece;
}

export function renderPetal(petal: PetalDefinition, baseFs: number = 13.2) {
    const petal_box = $<HTMLDivElement>(
        `<div class="petal" petalName="${petal.displayName}"></div>`
    );
    if (petal.images?.fontSizeMultiplier) {
        const fsApplied = baseFs * petal.images.fontSizeMultiplier;
        petal_box.css("--x", `${fsApplied}px`);
    };

    const rarity = Rarity.fromString(petal.rarity);
    const displaySize = petal.images?.slotDisplaySize ?? 25;
    const offsetX = petal.images?.centerXOffset ?? 0;
    const offsetY = petal.images?.centerYOffset ?? 0;

    petal_box.css("background", rarity.color);
    petal_box.css("border-color", rarity.border);

    if (!petal.equipment && petal.isDuplicate) {
        let radiansNow = 0;
        const count = petal.pieceAmount;
        let degree = 0;

        for (let i = 0; i < count; i++) {
            const { x, y } = MathGraphics.getPositionOnCircle(radiansNow, defaultRadius)
            petal_box.append(
                renderPetalPiece(x + offsetX, y + offsetY, displaySize, petal, degree)
            );

            radiansNow += P2 / count;
            degree += MathGraphics.radiansToDegrees(petal.images?.slotRevolution ?? 0);
        }
    } else {
        petal_box.append(
            renderPetalPiece(offsetX, offsetY, displaySize, petal)
        );
    }

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

    deletedPetalIndex: number = -1;
    switchedPetalIndex: number = -1;
    switchedToPetalIndex: number = -1;

    isReturningToSlot: boolean = false;

    swingAngle: number = 0;
    swingAnimationId: number | null = null;
    swingProgress: number = 0; // Track animation progress from 0 to 1

    constructor(private readonly game: Game) {
        this.ui = game.ui;

        let targetX = 0;
        let targetY = 0;
        let currentX = 0;
        let currentY = 0;
        const followSpeed = 0.12;
        let followAnimationId: number | null = null;

        const updateFollowAnimation = () => {
            if (!draggingData.item || this.isReturningToSlot) {
                followAnimationId = null; // Ensure ID is cleared if stopped this way
                return;
            }

            // Smoothly interpolate between current position and target position
            currentX += (targetX - currentX) * followSpeed;
            currentY += (targetY - currentY) * followSpeed;

            draggingData.item.css("transform", `translate(${currentX}px, ${currentY}px)`);

            followAnimationId = window.requestAnimationFrame(updateFollowAnimation);
        };

        $(document).on("mousemove", (ev) => {
            if (draggingData.item && !this.isReturningToSlot) {
                const { clientX, clientY } = ev;

                targetX = clientX;
                targetY = clientY;

                // If this is the first movement, initialize current position and start animation
                if (currentX === 0 && currentY === 0) {
                    currentX = clientX;
                    currentY = clientY;

                    if (!followAnimationId) {
                        followAnimationId = window.requestAnimationFrame(updateFollowAnimation);
                    }
                }
            }
        })

        $(document).on("mousedown", (ev) => {
            this.swingAngle = 0;
            this.swingProgress = 0;
            // DO NOT let users swap petals if a swap anim is in progress... need a lot more effort if you want two animations and swaps
            // happen simultaneously AND not break the animation WHEN not fucking up the logics
            if (this.isReturningToSlot || followAnimationId) {
                return;
            }

            // Reset position tracking when starting a new drag
            if (draggingData.item) {
                const { clientX, clientY } = ev;
                currentX = clientX;
                currentY = clientY;
                targetX = clientX;
                targetY = clientY;

                // Start the follow animation
                if (!followAnimationId) {
                    followAnimationId = window.requestAnimationFrame(updateFollowAnimation);
                }

                if (this.swingAnimationId) window.cancelAnimationFrame(this.swingAnimationId);

                const petalElement = draggingData.item.find('.petal');
                if (petalElement.length) {

                    let originalSize = 50;
                    // find the width of original slot... should be 50 // 35 anyways
                    if (draggingData.container?.ui_slot) {
                        originalSize = draggingData.container?.ui_slot.width() || 50;
                    }

                    // Target size for the dragging petal
                    let targetSize = 70;
                    if (draggingData.item.width()) {
                        targetSize = draggingData.item.width() || 70;
                    }

                    // Start with original size and no rotation
                    petalElement.css('transform', 'translate(-50%, -50%) rotate(0deg)');
                    draggingData.item.css('width', `${originalSize}px`);
                    draggingData.item.css('height', `${originalSize}px`);

                    // Animation start time
                    let startTime = performance.now();
                    const growthDuration = 250; // ms
                    let initialSwingSpeed = 0.005; // Start slower
                    const scale = targetSize / originalSize;
                    const finalFontSize = parseFloat(petalElement.css('--x'))*scale || parseFloat(petalElement.css('font-size')); // px

                    const animateCombined = (currentTime: number) => {
                        const elapsed = currentTime - startTime;
                        const growthProgress = Math.min(elapsed / growthDuration, 1);

                        // ease-out-cubic
                        const easeOutCubic = 1 - Math.pow(1 - growthProgress, 3);
                        const currentSize = originalSize + ((targetSize - originalSize) * easeOutCubic);

                        // Scale font size proportionally by updating the CSS variable
                        const fontScale = currentSize / targetSize;
                        const newFontSize = finalFontSize * fontScale;
                        petalElement.css('--x', `${newFontSize}px`);

                        // Gradually increase swing speed as growth progresses
                        const targetSwingSpeed = 0.015;
                        const currentSwingSpeed = initialSwingSpeed + (targetSwingSpeed - initialSwingSpeed) * easeOutCubic;

                        // gradually increase swing speed
                        this.swingProgress = (this.swingProgress + currentSwingSpeed) % 1;

                        // Calculate swing angle with eased amplitude
                        const t = Math.sin(this.swingProgress * Math.PI * 2);
                        const easedT = Math.sign(t) * Math.pow(Math.abs(t), 0.8);

                        // Scale the swing angle based on growth progress
                        const swingFactor = Math.min(growthProgress * 1.5, 1);
                        const currentSwingAngle = 10 * easedT * swingFactor;

                        // Apply size to the container and rotation to the petal
                        draggingData.item?.css('width', `${currentSize}px`);
                        draggingData.item?.css('height', `${currentSize}px`);
                        petalElement.css('transform', `translate(-50%, -50%) rotate(${currentSwingAngle}deg)`);

                        if (growthProgress < 1) {
                            window.requestAnimationFrame(animateCombined);
                        } else {
                            // growth complete, run infinity reg animation
                            this.swingAngle = currentSwingAngle; // connect with current angle

                            const updateSwingAnimationSynchronized = () => {
                                if (draggingData.item) {
                                    this.swingProgress = (this.swingProgress + 0.015) % 1;

                                    // Use sine function for smooth pendulum motion
                                    const t = Math.sin(this.swingProgress * Math.PI * 2);
                                    // Apply cubic easing to the sine wave
                                    const easedT = Math.sign(t) * Math.pow(Math.abs(t), 0.8);
                                    this.swingAngle = 10 * easedT;

                                    // Apply rotation to the petal inside the dragging container
                                    const petalElement = draggingData.item.find('.petal');
                                    if (petalElement.length) {
                                        petalElement.css('transform', `translate(-50%, -50%) rotate(${this.swingAngle}deg)`);
                                    }

                                    this.swingAnimationId = window.requestAnimationFrame(updateSwingAnimationSynchronized);
                                }
                            };

                            this.swingAnimationId = window.requestAnimationFrame(updateSwingAnimationSynchronized);
                        }
                    };

                    // Start the combined animation
                    window.requestAnimationFrame(animateCombined);
                } else {
                    // Fallback to regular swing if no petal element found
                    this.swingAnimationId = window.requestAnimationFrame(this.updateSwingAnimation);
                }
            }
        });

        $(document).on("mouseup", (ev) => {
            // DO NOT let users swap petals if a swap anim is in progress... need a lot more effort if you want two animations and swaps
            // happen simultaneously AND not break the animation WHEN not fucking up the logics
            if (this.isReturningToSlot) {
                return;
            }
            if (draggingData.item && draggingData.container) {
                // Stop the swing animation
                if (this.swingAnimationId) {
                    window.cancelAnimationFrame(this.swingAnimationId);
                    this.swingAnimationId = null;
                }

                // Stop the follow animation
                if (followAnimationId) {
                    window.cancelAnimationFrame(followAnimationId);
                    followAnimationId = null;
                }

                // Reset position tracking
                currentX = 0;
                currentY = 0;
                targetX = 0;
                targetY = 0;

                this.processInventoryChanges(draggingData);
            }
        })
    }

    /**
     * Animate the petal element when its going from one place to another.
     * position, size, opacity, angle and font size are handled in the process.
     * @param petalEl The petal element to animate
     * @param destination An object containing the destination position, size, opacity, angle. Ideally font size and border size should follow the size scaling so it does not need to be included
     * @param runWhenFinished A function to run once the animation is finished
     * @param fromIfAny [OPTIONAL] An object containing the starting position, size, opacity, angle. These will be parsed from petalEl if this param is not passed
     */
    // TODO: Font size is still incorrect sometimes
    // Make sure all of them are successfully obtained from the correct petal  element
    // some need to use find('.petal') some do not
    animatePetalToPosition(petalEl: JQuery<HTMLElement>,destination: object = {
        x: 0, // x and y cant be 0 under normal circumstances...
        y: 0,
        w: 50, // 50 for main, 35 for secondary
        opac: 0.85, // should be consistent
        angle: 0,
        fontSz: 13.2, // 12 for main, 8 for secondary
    }, runWhenFinished?: () => void, fromIfAny?: object) {
        const currentOffset = petalEl.offset();
        //const {clientX, clientY} = ev;
        if (!currentOffset) {
            // If offset fails, cleanup and run callback
            petalEl.remove();
            runWhenFinished?.();
            return false;
       }
       const actPetalEl = petalEl.find('.petal');
        let from = fromIfAny
            // if an fromIfAny OBJECT is passed, use it
            ? fromIfAny as {x: number, y: number, w: number, opac: number, angle: number, fontSz: number}
            // otherwise, parse it from petalEl
            : {
                x: currentOffset.left,
                y: currentOffset.top,
                w: petalEl.width() || 70,
                opac: parseFloat(petalEl.css('opacity')) || 1,
                angle: this.swingAngle || 0,
                fontSz: parseFloat(petalEl.css('--x')) || 13.2*1.4,
            };
        if (actPetalEl.length && !fromIfAny) {
            from.fontSz = parseFloat(actPetalEl.css('--x')) || 999;
        }
        const dest = destination as {x: number, y: number, w: number, opac: number, angle: number, fontSz: number};

        const duration = 250; // ms
        let st = performance.now();

        // stop swing
        if (this.swingAnimationId) {
            window.cancelAnimationFrame(this.swingAnimationId);
            this.swingAnimationId = null;
        }

        const animate = (ct: number) => {
            // is this really needed? idk but ill leave this
            if (!petalEl || !petalEl.parent().length) {
                runWhenFinished?.(); // Still run callback if element disappears
                return;
            }
            const elapsed = ct - st;
            const progress = Math.min(elapsed / duration, 1);

            // ease-out-quint for position
            const easeOutQuint = 1 - Math.pow(1 - progress, 5);
            const curX = from.x + (dest.x - from.x) * easeOutQuint;
            const curY = from.y + (dest.y - from.y) * easeOutQuint;

            // ease-out-cubic for angle, size, opac
            const easeOutCubic = 1 - Math.pow(1 - progress, 3);
            const currentAngle = from.angle * (1 - easeOutCubic);
            const currentW = from.w - ((from.w - dest.w) * easeOutCubic);
            const currentOpacity = from.opac - ((from.opac - dest.opac) * easeOutCubic);

            const SCALE = currentW / dest.w;

            // scale font
            const updateFontSz = dest.fontSz * (SCALE);
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
                // animation complete
                petalEl.remove();
                runWhenFinished?.();
                this.isReturningToSlot = false;
            }
        };

        window.requestAnimationFrame(animate);
        this.isReturningToSlot = true;
    }

    updateSwingAnimation = () => {
        if (!draggingData.item || this.isReturningToSlot) {
            this.swingAnimationId = null; // Clear ID if stopped
            return;
        }
        // duplicated check but lazy to remove L
        if (draggingData.item) {
            // Update swing progress
            let swingProgress = this.swingProgress;
            let swingAngle = this.swingAngle;
            swingProgress = (swingProgress + 0.015) % 1;

            // Use sine function for smooth pendulum motion
            const t = Math.sin(swingProgress * Math.PI * 2);
            // Apply cubic easing to the sine wave
            const easedT = Math.sign(t) * Math.pow(Math.abs(t), 0.8);
            swingAngle = 10 * easedT;

            // Apply rotation to the petal inside the dragging container
            const petalElement = draggingData.item.find('.petal');
            if (petalElement.length) {
                petalElement.css('transform', `translate(-50%, -50%) rotate(${swingAngle}deg)`);
            }

            this.swingAnimationId = window.requestAnimationFrame(this.updateSwingAnimation);
        }
    };

    processInventoryChanges = (draggingData: any) => {
        // Ensure container exists before processing
        if (!draggingData.container) {
            console.warn("[ProcessInventoryChanges] No draggingData.container found. Aborting.");
            // Reset interaction state variables even if aborting
            mouseSelectingPetal = undefined;
            mouseDeletingPetal = false;
            this.keyboardSelectingPetal = undefined;
            this.updatePetalRows(); // Update UI to clear any hover states etc.
            return;
        }

        const originalIndex = this.inventory.indexOf(draggingData.container);
        // Case 1: Swapping to a different slot
        if (mouseSelectingPetal && mouseSelectingPetal != draggingData.container) {
            const targetIndex = this.inventory.indexOf(mouseSelectingPetal);

            const trans = mouseSelectingPetal.petalDefinition;
            mouseSelectingPetal.petalDefinition = draggingData.container.petalDefinition;
            draggingData.container.petalDefinition = trans;

            this.switchedPetalIndex = originalIndex;
            this.switchedToPetalIndex = targetIndex;
            this.deletedPetalIndex = -1; // Ensure delete index is reset

            let dest1 = this.findDestinationSlot(this.switchedToPetalIndex);
            let dest2 = this.findDestinationSlot(this.switchedPetalIndex);

            // Create a clone of the target petal for the second animation
            let targetPetalEl: JQuery<HTMLElement> | null = null;
            let targetPetalClone: JQuery<HTMLElement> | null = null;
            let fromSlotDetails = undefined;
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
                            opac: mouseSelectingPetal.ui_slot.css('opacity') || 0.85,
                            angle: mouseSelectingPetal.ui_slot.css('opacity') || 0,
                            fontSz: parseFloat(targetPetalEl.css('--x')) || (13.2)
                        }

                        // Hide the original petal in the target slot
                       // targetPetalEl.css('opacity', 0);
                    }
                }
            }

            let i = 0;
            const toEmpty = targetPetalClone ? 2 : 1;
            let animationsRemaining = !toEmpty ? 2 : 1;

            const onAnimationComplete = () => {
                animationsRemaining--;
                if (animationsRemaining === 0) {
                    // All animations complete, clean up
                    if (targetPetalClone) targetPetalClone.remove();
                    draggingData.item = null;

                    // Reset interaction state variables
                    mouseSelectingPetal = undefined;
                    mouseDeletingPetal = false;
                    this.keyboardSelectingPetal = undefined;

                    // Update UI to show the swapped petals
                    this.updatePetalRows();
                }
            };

            for (let dest of [dest1, dest2]) {
                if (dest) {
                    let destOffset = dest.offset();
                    if(destOffset) {
                        // DO NOT run if swapping to emptyslot to prevent callback running
                        if (i === 1 && toEmpty < 2) return;
                        // For first iteration, animate the dragged item
                        // For second iteration, animate the target clone
                        let petalToAnimate = i === 0 ? draggingData.item : targetPetalClone;
                        let fromObj = i === 1? fromSlotDetails : undefined;
                        // on iteration 1, fromObj is undefined, method will parse from draggingData.item
                        // on iteration 2, method uses provided obj parsed earlier from targetPetalEl
                        const scale = petalToAnimate.width() / (dest.width() || 50); // 35
                        const innerPetal = petalToAnimate.find('.petal');
                        let rnFontSz = 13.2*scale;
                        if  (innerPetal) {
                            rnFontSz = parseFloat(innerPetal.css('--x'));
                        }
                        const FINALFONTSZ = rnFontSz / scale;

                        if (petalToAnimate) {
                            this.animatePetalToPosition(petalToAnimate, {
                                x: (destOffset.left + (dest.width() || 0) / 2)+1,
                                y: (destOffset.top + (dest.height() || 0) / 2)+1,
                                w: dest.width() || 50, // 35 if secondary
                                opac: 0.92, // value chosen to best blend petal colour and slot colour...
                                angle: 0, // should always be 0
                                fontSz: FINALFONTSZ || 13.2, // 8 for secondary
                            }, onAnimationComplete, fromObj);
                        } else {
                            // If we don't have a petal to animate for this iteration, still decrement
                            console.warn(`[ProcessInventoryChanges] No petal to animate for destination ${i+1}. Skipping.`);
                            onAnimationComplete();
                        }
                    } else {
                        console.warn(`[ProcessInventoryChanges] No offset found for dest${i+1}. Skipping animation.`);
                        onAnimationComplete();
                    }
                } else {
                    console.warn(`[ProcessInventoryChanges] No destination slot ${i+1} found. Skipping animation.`);
                    onAnimationComplete();
                }
                i++;
            }

            // Return early to prevent the final updatePetalRows call
            // We'll call it in the onAnimationComplete callback instead
            return;
    } else if (mouseDeletingPetal) {

        draggingData.container.petalDefinition = null;
        this.deletedPetalIndex = originalIndex;
        this.switchedPetalIndex = -1; // Ensure swap indices are reset
        this.switchedToPetalIndex = -1;

        // Animate deletion - shrink to 0 size and fade opacity to 0.5
        if (draggingData.item && this.ui.deletePetal) {
            const deleteOffset = this.ui.deletePetal.offset();
            if (deleteOffset) {
                this.animatePetalToPosition(draggingData.item, {
                    x: (deleteOffset.left + (this.ui.deletePetal.width() || 0) / 2)+1,
                    y: (deleteOffset.top + (this.ui.deletePetal.height() || 0) / 2)+1,
                    w: 0.1, // shrink to almost nothing
                    opac: 0.2, // fade to almost nothing
                    angle: 0,
                    fontSz: 0.025, // starts at like 17. something, close enough to 16.8 (dragging petal fsz)
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
        // Reset switch/delete indices as no action occurred
        this.switchedPetalIndex = -1;
        this.switchedToPetalIndex = -1;
        this.deletedPetalIndex = -1;

        // Animate return to original slot
        if (draggingData.item && draggingData.container && draggingData.container.ui_slot) {
            const originalSlot = draggingData.container.ui_slot;
            const slotOffset = originalSlot.offset();

            if (slotOffset) {
                const scale = draggingData.item.width() / (originalSlot.width() || 50); // 35
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
                    opac: 0.92,
                    angle: 0,
                    fontSz: FINALFONTSZ || 13.2,
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

        // Reset interaction state variables AFTER processing
        mouseSelectingPetal = undefined;
        mouseDeletingPetal = false;
        this.keyboardSelectingPetal = undefined; // Reset keyboard selection as well

        // Update UI based on the changes (or lack thereof)
        this.updatePetalRows();
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
        for (let i = 0; i < this.equippedPetals.length; i++) {
            this.switchSlot(i)
            this.game.sendInput();
        }
    }

    switchSlot(slot: number) {
        if (slot < 0 || slot >= this.equippedPetals.length) return;
        this.switchedPetalIndex = slot;
        this.switchedToPetalIndex = slot + this.equippedPetals.length;
    }

    deleteSlot(slot: number) {
        if (slot < 0 || slot >= this.inventory.length) return;
        this.deletedPetalIndex = slot;
    }

    setSlotAmount(slot: number, prepare: number){
        this.equippedPetals = [];
        this.preparationPetals = [];
        for (let i = 0; i < slot; i++) {
            this.equippedPetals.push(new PetalContainer())
        }

        for (let i = 0; i < prepare; i++) {
            this.preparationPetals.push(new PetalContainer())
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
        if (this.isReturningToSlot) return;

        this.updatePetalRows();
    }

    updatePetalRows() {
        mouseSelectingPetal = undefined;

        this.renderPetalRow(this.equippedPetals, this.ui.equippedPetalRow);
        this.renderPetalRow(this.preparationPetals, this.ui.preparationPetalRow);

        if (this.game.running) {
            this.ui.hud.append(this.ui.petalColumn);
            this.ui.preparationPetalRow.append(this.ui.deletePetal);

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
                mouseSelectingPetal = undefined;
            })

            row.append(petal_slot);

            if (petalContainer.petalDefinition) {
                if (draggingData.item && draggingData.container == petalContainer) return;
                const FONTSZ = parseFloat(petalContainer.ui_slot.css('--x'));
                const petal =
                    renderPetal(petalContainer.petalDefinition, FONTSZ);

                petal_slot.append(petal);

                petal.on("mousedown", (ev) => {
                    if (!this.game.running) return;
                    if (draggingData.item) return;

                    const dragging = $(`<div class="dragging-petal"></div>`);
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
            this.switchedPetalIndex = this.inventory.indexOf(this.keyboardSelectingPetal);
            this.switchedToPetalIndex = slot;
            return;
        }
        if (!this.preparationPetals[slot].petalDefinition) return;
        this.switchedPetalIndex = slot;
        this.switchedToPetalIndex = slot + this.equippedPetals.length;
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
        if (!slot) return;
        const definition = container.petalDefinition;
        if (!definition) return;



        const box = this.ui.petalInformation.clone();

        $("body").append(box);
        container.informationBox = box;
        container.showingInformation = true;


        const offset = slot.offset();
        if (offset){
            box.css("left", offset.left + "px");
            box.css("top", offset.top - 10 + "px");
        }

        function addLine(args: showingParameters){
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

        function addAttribute(config: typeof showingConfig[string], value: string) {
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
            if (showingConfig.hasOwnProperty(definitionKey)) {
                const showing =
                    showingConfig[definitionKey];
                addAttribute(showing,
                    (definition[definitionKey as keyof PetalDefinition]
                        ?? "").toString()
                );
            }
        }

        if (definition.modifiers) {
            for (const modifiersDefinitionKey in definition.modifiers) {
                const showing =
                    showingConfig[modifiersDefinitionKey];
                let original = (definition.modifiers
                    [modifiersDefinitionKey as keyof PlayerModifiers]);
                if (!showing) continue;

                // 特殊处理conditionalHeal
                if (modifiersDefinitionKey === "conditionalHeal" && original) {
                    const conditionalHeal = original as {healthPercent: number, healAmount: number};
                    addAttribute(showing, "");
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
                    addAttribute(showing,
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

                    addAttribute(showing,
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
                    (attributesShowingConfig[attributesDefinitionKey] as AttributeShowingFunction<typeof attributesDefinitionKey>)
                    (data);
                config.forEach(e => {
                    addAttribute(e as showingConfig,
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
