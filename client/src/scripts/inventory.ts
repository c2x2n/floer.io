import { Game } from "@/scripts/game.ts";
import $ from "jquery";
import { Numeric, P2 } from "@common/utils/math.ts";
import { PetalDefinition, Petals, SavedPetalDefinitionData } from "@common/definitions/petals.ts";
import { UI } from "@/ui.ts";
import { Rarity } from "@common/definitions/rarities.ts";
import { ActionType } from "@common/constants";
import { applyTooltip, createPetalTooltip } from "@/scripts/shown/tooltip.ts";
import { PetalData, PetalState } from "@common/net/packets/updatePacket.ts";

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

let draggingData: DraggingData = {
    item: null, container: null
};

const draggingBoxSize = 68;

let mouseSelectingPetal: PetalContainer | undefined = undefined;

let mouseDeletingPetal: boolean = false;

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

    petalData: PetalData[] = [];

    inventoryAnimation() {
        if (draggingData.item && draggingData.container && !this.isDraggingReturningToSlot) {
            const petalElement = draggingData.item.find('.petal');

            const sizeNow = petalElement.width() || 50;

            petalElement.css('--x', `${
                parseFloat(draggingData.item.css('--x')) * sizeNow / draggingBoxSize
            }px`);

            const { clientX, clientY } = this.game.input.clientPosition;

            const where = draggingData.item.offset();

            let currentX: number;
            let currentY: number;

            if (!where) {
                currentX = clientX;
                currentY = clientY;
            } else {
                currentX = Numeric.targetEasing(where.left, clientX);
                currentY = Numeric.targetEasing(where.top, clientY);
            }

            // Follow
            draggingData.item.css(
                "transform", `translate(
                        ${currentX}px,
                        ${currentY}px
                    ) translate(-10%, -10%)`
            );
            draggingData.item.css('width',
                `${Numeric.targetEasing(sizeNow, draggingBoxSize, 4)}px`
            );
            draggingData.item.css('height',
                `${Numeric.targetEasing(sizeNow, draggingBoxSize, 4)}px`
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

        if (this.petalData.length) {
            let index = 0;
            this.petalData.forEach((data) => {
                if (index >= this.equippedPetals.length) return;

                const container = this.equippedPetals[index];

                if (container.canvas && container.ui_slot) {
                    const canvas = container.canvas;
                    const ctx = canvas.getContext("2d");
                    const petal = canvas.parentElement;
                    if (petal) {
                        const e = $(petal);
                        canvas.width = e.width() ?? 50;
                        canvas.height = e.height() ?? 50;
                    }

                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.fillStyle = "rgba(0, 0, 0, 0.25)";
                        ctx.beginPath()
                        if (this.game.running) {
                            if (container.state != data.state) {
                                container.percent = data.percent;
                                container.state = data.state;
                            }
                            container.percent = Numeric.targetEasing(container.percent, data.percent, 4);
                            if (data.state === PetalState.Reloading) {
                                ctx.moveTo(canvas.width / 2, canvas.height / 2);
                                const start = P2 * (1 - container.percent) * 5;

                                ctx.arc(
                                    canvas.width / 2, canvas.height / 2,
                                    canvas.width,
                                    start, start + P2 * container.percent
                                )

                                ctx.closePath()

                                ctx.fill()
                            } else if (data.state === PetalState.Normal) {
                                ctx.rect(
                                    0, 0, canvas.width, canvas.height * (1 - container.percent)
                                )

                                ctx.fill()
                            }
                        }
                    }
                }

                index ++;
            })
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

        $(document).on("touchstart", (ev) => {
            this.swingAngle = 0;
            this.swingProgress = 0;
        })

        $(document).on("mouseup", (ev) => {
            // DO NOT let users swap petals if a swap anim is in progress... need a lot more effort if you want two animations and swaps
            // happen simultaneously AND not break the animation WHEN not fucking up the logics
            if (this.isDraggingReturningToSlot) return;
            if (draggingData.item && draggingData.container) {
                this.processInventoryChanges(draggingData);
            }
        })

        $(document).on("touchmove", (ev) => {
            const position = {
                x: ev.touches[0].clientX,
                y: ev.touches[0].clientY
            }

            mouseSelectingPetal = undefined;

            const eqpetals = $(".equipped-petals-row > .petal-slot");
            const pppetals = $(".preparation-petals-row > .petal-slot");

            const here = document.elementsFromPoint(position.x, position.y);

            if (here.includes(this.ui.deletePetal[0])) {
                mouseDeletingPetal = true;
                return;
            }

            eqpetals.toArray().forEach((e) => {
                if (here.includes(e)) {
                    const find = this.equippedPetals.find(v => {
                        if (!v.ui_slot) return false;
                        return v.ui_slot[0] === e
                    });
                    if (find) mouseSelectingPetal = find;
                }
            })

            pppetals.toArray().forEach((e) => {
                if (here.includes(e)) {
                    const find = this.preparationPetals.find(v => {
                        if (!v.ui_slot) return false;
                        return v.ui_slot[0] === e
                    });
                    if (find) mouseSelectingPetal = find;
                }
            })
        })

        $(document).on("touchend", (ev) => {
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
            const currentW = Numeric.targetEasing(
                petalEl.width() ?? destination.w, destination.w, 4
            );
            const currentOpacity = Numeric.targetEasing(from.opacity, destination.opacity, 4);

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
        const originalEquipSlot = this.equippedPetals.length;
        if (slot >= originalEquipSlot){
            for (let i = 0; i < slot - originalEquipSlot; i++) {
            this.equippedPetals.push(new PetalContainer())
            }
        } else {
            for (let i = 0; i < originalEquipSlot - slot; i++) {
                this.equippedPetals.splice(i + slot)
            }
        }

        const originalPrepSlot = this.preparationPetals.length;
        if (prepare >= originalPrepSlot){
            for (let i = 0; i < prepare - originalPrepSlot; i++) {
            this.preparationPetals.push(new PetalContainer())
            }
        } else {
            for (let i = 0; i < originalPrepSlot - prepare; i++) {
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
                    this.ui.gallery.addPetalGallery(cont.petalDefinition);
            }
            this.oldInventory = this.inventory;
        }

        if (this.game.running) {
            this.ui.hud.append(this.ui.petalColumn);
            this.ui.preparationPetalRow.append(this.ui.deletePetal);

            $(".information").remove();

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

                const canvas = document.createElement("canvas");

                petal_slot.append(petal);
                petal.append(canvas);
                petalContainer.canvas = canvas;

                applyTooltip(
                    petal, createPetalTooltip(petalContainer.petalDefinition)
                )

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

                petal.on("touchstart", (ev) => {
                    if (!this.game.running) return;
                    if (draggingData.item) return;
                    if (!ev.touches.length) return;

                    const dragging = $(`<div class="dragging-petal"></div>`);

                    const scale = draggingBoxSize / (petal.width() ?? draggingBoxSize);
                    const finalFontSize = parseFloat(petal.css('--x')) || parseFloat(petal.css('font-size'));

                    dragging.css("--x",
                        (finalFontSize * scale).toString())
                    const {clientX, clientY} = ev.touches[0];
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

                    ev.preventDefault();
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
}

export class PetalContainer {
    ui_slot?: JQuery;
    petalDefinition: SavedPetalDefinitionData = null;
    canvas?: HTMLCanvasElement;
    percent: number = 1;
    state: PetalState = PetalState.Normal;

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

