import { ServerPlayer } from "../entities/serverPlayer";
import { PetalBunch } from "./petalBunch";
import { Game } from "../game";
import { PetalDefinition, Petals, SavedPetalDefinitionData } from "../../../common/src/definitions/petals";
import { P2 } from "../../../common/src/utils/math";
import { VectorAbstract } from "../../../common/src/utils/vector";
import { GameConstants } from "../../../common/src/constants";
import { PetalEventManager } from "../utils/petalEvents";
import { Rarity } from "../../../common/src/definitions/rarities";
import { Random } from "../../../common/src/utils/random";

export class Inventory {
    position: VectorAbstract;

    readonly game: Game;
    readonly player: ServerPlayer;

    petalBunches: PetalBunch[] = [];

    equipped_petals: SavedPetalDefinitionData[] = [];
    inventory: SavedPetalDefinitionData[] = [];

    slot: number = GameConstants.player.defaultSlot;
    prepareSlot: number = GameConstants.player.defaultPrepareSlot;

    private totalDisplayedPetals = 0;

    private revolutionRadians = 0;
    _range = 0;

    get range(): number {
        return this._range;
    }

    set range(r: number) {
        this._range = r;
        this.petalBunches.forEach(e => e.updateRange(this._range));
    }

    eventManager = new PetalEventManager();

    absorbedBefore = new Set<{
        definition: PetalDefinition,
        time: number
    }>();

    constructor(player: ServerPlayer) {
        this.game = player.game;
        this.player = player;
        this.position = player.position;
    }

    loadConfigByData(data: SavedPetalDefinitionData[]): void{
        this.equipped_petals = []
        this.petalBunches = []
        this.inventory = []

        for (let i = 0; i < this.slot; i++) {
            this.equipped_petals.push(data[i]);
            this.petalBunches.push(new PetalBunch(this, data[i]));
            this.inventory.push(data[i]);
        }

        for (let i = 0; i < this.prepareSlot; i++) {
            this.inventory.push(data[i + this.slot]);
        }
    }

    loadConfigByString(equipped: string[], preparation: string[]): void{
        this.equipped_petals = []
        this.petalBunches = []
        this.inventory = []

        for (let i = 0; i < this.slot; i++) {
            this.equipped_petals.push(Petals.fromStringData(equipped[i]));
            this.petalBunches.push(new PetalBunch(this, Petals.fromStringData(equipped[i])));
            this.inventory.push(Petals.fromStringData(equipped[i]));
        }

        for (let i = 0; i < this.prepareSlot; i++) {
            this.inventory.push(Petals.fromStringData(preparation[i]));
        }
    }

    loadDefaultConfig(): void {
        this.equipped_petals = []
        this.petalBunches = []
        this.inventory = []

        let equippedPetals = GameConstants.player.defaultEquippedPetals;
        if (GameConstants.player.mutateDefaultPetals) {
            let rand = Math.random();
            if (rand<GameConstants.player.mutateDefaultPetals.chance) {
                equippedPetals = GameConstants.player.mutateDefaultPetals.equippedPetals;
                this.player.dirty.inventory = true;
            }
        }
        this.loadConfigByString(
            equippedPetals,
            GameConstants.player.defaultPreparationPetals
        )
    }

    changeSlotAmountTo(slot: number): void {
        if (this.slot === slot) return;
        if (this.slot > slot) {
            const offset = this.slot - slot;
            this.equipped_petals.splice(-offset, offset);
            this.petalBunches.splice(-offset, offset).forEach((petal) => {
                petal.destroy();
            });
            this.inventory.splice(this.slot - offset, offset);
        }else {
            const equipOffset = slot - this.slot;
            const prepare =
                this.inventory.splice(-this.prepareSlot, this.prepareSlot);
            for (let i = 0; i < equipOffset; i++) {
                this.equipped_petals.push(Petals.fromStringData(""));
                this.petalBunches.push(new PetalBunch(this, null));
                this.inventory.push(Petals.fromStringData(""));
            }

            this.inventory = this.inventory.concat(prepare);
        }

        this.slot = slot
        this.player.dirty.slot = true;
        this.player.dirty.inventory = true;
    }

    switchPetal(index1: number, index2: number) {
        if (index1 < 0 || index1 > this.inventory.length) return
        if (index2 < 0 || index2 > this.inventory.length) return
        if (this.inventory[index1] === this.inventory[index2]) return

        const trans = this.inventory[index1];

        this.updateInventory(index1, this.inventory[index2]);
        this.updateInventory(index2, trans);
    }

    delete(petalIndex: number) {
        if (petalIndex < 0 || petalIndex > this.inventory.length) return;
        const definition = this.inventory[petalIndex];

        if (definition) {
            this.player.addExp(Rarity.fromString(definition.rarity).expWhenAbsorb)
            this.absorbedBefore.add({
                definition: definition,
                time: Date.now()
            })
        }

        this.updateInventory(petalIndex, null);
    }

    updateInventory(index: number, petal: SavedPetalDefinitionData){
        this.inventory[index] = petal;
        this.updateEquipment(index, petal);

        this.player.dirty.inventory = true;
    }

    updateEquipment(index: number, petal?: SavedPetalDefinitionData) {
        if (index >= this.petalBunches.length) return;
        if (petal === undefined) {
            petal = this.inventory[index];
        }
        this.petalBunches[index].destroy();
        this.petalBunches[index] = new PetalBunch(this, petal);
        this.equipped_petals[index] = petal;
        this.player.updateModifiers();
    }

    pickUp(petal: PetalDefinition): boolean {
        if (this.player.destroyed) return false;

        const emptySlot =
            this.inventory.find(e => e === null)

        if (emptySlot === null) {
            const index = this.inventory.indexOf(emptySlot);
            this.updateInventory(index, petal);

            return true
        }

        return false;
    }

    drop(amount: number): PetalDefinition[] {
        let fullDroppable: { fromInventory: boolean, item: PetalDefinition }[] = [];

        let droppableFromInventory =
            this.inventory.filter(
                e => e && !e.undroppable
            ) as PetalDefinition[];

        droppableFromInventory.forEach((petal) => {
            fullDroppable.push({ fromInventory: true, item: petal });
        })

        this.absorbedBefore.forEach(e => {
            if ((Date.now() - e.time) / 1000 < 30) {
                if (e.definition.undroppable) return;
                fullDroppable.push({ fromInventory: false, item: e.definition});
            }
        })

        let sortByRarity = new Map<number,
            typeof fullDroppable[number][]>();

        fullDroppable.forEach(e => {
            const level = Rarity.fromString(e.item.rarity).level;
            if (!sortByRarity.has(level)){
                sortByRarity.set(level, []);
            }
            sortByRarity.get(level)?.push(e);
        });

        let highestRarityPetals =
            sortByRarity.get(Array.from(sortByRarity.keys()).sort((a, b) => b - a)[0]);

        let droppedPetals: typeof fullDroppable[number][] = [];

        if (highestRarityPetals) {
            if (highestRarityPetals.length > amount) {
                for (let i = 0; i < amount; i++) {
                    const index = Random.int(0, highestRarityPetals.length - 1);
                    droppedPetals.push(highestRarityPetals[
                        index
                    ]);
                    highestRarityPetals.splice(index, 1);
                }
                amount = 0;
            } else {
                amount -= highestRarityPetals.length;
                for (let i = 0; i < highestRarityPetals.length; i++) {
                    droppedPetals.push(highestRarityPetals[i]);
                    fullDroppable.splice(fullDroppable.indexOf(highestRarityPetals[i]), 1);
                }
            }
        }

        droppedPetals = droppedPetals.concat(fullDroppable.sort((a, b) => {
            return Rarity.fromString(b.item.rarity).level - Rarity.fromString(a.item.rarity).level
        }).splice(0, amount));

        droppedPetals.forEach(e => {
            if (e.fromInventory) this.inventory[this.inventory.indexOf(e.item)] = null;
        })

        return droppedPetals.map(e => e.item as PetalDefinition);
    }

    tick(): void {
        this.position = this.player.position;
        this.totalDisplayedPetals = 0;

        this.petalBunches.forEach(petalBunch => {
            this.totalDisplayedPetals += petalBunch.displayedPieces;
        });

        let finalRevSpeed = this.player.modifiers.revolutionSpeed;

        if (this.player.modifiers.controlRotation) {
            // Use player's MOUSE direction to determine the angle
            this.revolutionRadians = Math.atan2(
                this.player.direction.mouseDirection.y,
                this.player.direction.mouseDirection.x
            );
        } else {
            const yyEffects = this.getYinYangEffects(this.player.modifiers.yinYangAmount);

            if (yyEffects==='rev') {
                finalRevSpeed = -finalRevSpeed;
            } else if (yyEffects==='stop') {
                finalRevSpeed = 0;
            } else if (typeof yyEffects === 'number') {
                // this will be either 8 or 9 or 10
                finalRevSpeed *= (yyEffects/4)**2
            } // no else: default return def = normal rotation, no actions taken

            this.revolutionRadians += finalRevSpeed * this.game.dt;
        }

        let revolutionRadians = this.revolutionRadians;
        const singleOccupiedRadians = P2 / this.totalDisplayedPetals;

        this.petalBunches.forEach(petalBunch => {
            petalBunch.tick(revolutionRadians, singleOccupiedRadians);
            revolutionRadians += singleOccupiedRadians * petalBunch.displayedPieces;
        });
    }

    getYinYangEffects(n: number) {
        if ([1,4,7].includes(n)) {
            return "rev";
        } else if ([2,5].includes(n)) {
            return "stop";
        } else if (n>=8) {
            return n;
        }
        return 'def';
    }
}
