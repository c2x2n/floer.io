import { getDisplayedPieces, SavedPetalDefinitionData } from "../../../../common/src/definitions/petals";
import { ServerPetal } from "../../entity/serverPetal";
import { P2 } from "../../../../common/src/engine/maths/constants";
import { UVector2D } from "../../../../common/src/engine/physics/uvector";
import { Inventory } from "./inventory";
import { GameConstants } from "../../../../common/src/constants";
import { ServerPlayer } from "../../entity/serverPlayer";
import { PetalUsingAnimations } from "../../utils/attributeRealizes";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { Geometry } from "../../../../common/src/engine/maths/geometry";
import { Numeric } from "../../../../common/src/engine/maths/numeric";

export class PetalBunch {
    position: VectorAbstract;

    centerPosition: VectorAbstract;

    player: ServerPlayer;

    inventory: Inventory;

    readonly totalPieces: number = 0;
    readonly totalDisplayedPieces: number = 0;

    get displayedPieces(): number {
        return Math.min(this.totalDisplayedPieces, this.petals.filter(petal => !petal.hidden).length);
    }

    readonly definition: SavedPetalDefinitionData;
    petals: ServerPetal[] = [];

    rotationRadians = 0;

    constructor(inventory: Inventory, definition: SavedPetalDefinitionData) {
        this.inventory = inventory;

        const player = inventory.player;
        this.player = player;

        this.definition = definition;
        this.position = player.position;
        this.centerPosition = player.position;

        if (definition) {
            this.totalPieces = definition.equipment ? 1 : definition.pieceAmount;
            this.totalDisplayedPieces = getDisplayedPieces(definition);

            for (let i = 0; i < this.totalPieces; i++) {
                const petal = new ServerPetal(this, definition);
                this.petals.push(petal);
                if (player.joined && player.isActive()) petal.join();

                inventory.eventManager.loadPetal(petal);
            }
        }
    }

    range: number = GameConstants.player.defaultPetalDistance;
    nowRange: number = GameConstants.player.defaultPetalDistance;

    updateRange(newR: number) {
        if (!this.definition) return;
        if (this.definition.equipment) return;

        if (newR > GameConstants.player.defaultPetalDistance) {
            if (!this.definition.extendable) {
                if (this.nowRange < GameConstants.player.defaultPetalDistance) {
                    this.nowRange = GameConstants.player.defaultPetalDistance;
                }
                return;
            }
        } else {
            if (this.definition.swinging) {
                this.extraRange = 0;
                this.swingingBack = false;
            }
        }

        this.nowRange = newR;
    }

    extraRange = 0;
    swingingBack = false;

    tick(revolutionRadians: number, singleOccupiedRadians: number): void {
        if (!this.definition) return;
        if (this.definition.equipment) return;

        const target = this.nowRange + this.extraRange;

        if (this.player.isAttacking) {
            if (this.definition.moreExtendDistance) {
                this.extraRange = this.definition.moreExtendDistance;
            } else if (this.definition.swinging) {
                const morer = this.definition.swinging.distance;
                if (this.extraRange >= morer && !this.swingingBack) this.swingingBack = true;
                if (this.extraRange <= 0 && this.swingingBack) this.swingingBack = false;

                const target
                    = this.swingingBack ? -1 : 1;

                this.extraRange
                    += target * this.player.game.dt * morer / this.definition.swinging.time;
            }
        }

        this.range = Numeric.targetEasing(
            this.range,
            target,
            2
        );

        const radius = this.range;

        this.position = this.inventory.position;

        this.rotationRadians += 0.01;

        const firstPetalCenter = UVector2D.add(
            this.position,
            Geometry.getPositionOnCircle(revolutionRadians, radius)
        );

        this.centerPosition = firstPetalCenter;

        if (this.definition.isDuplicate) {
            const totalPieces = this.totalPieces;

            if (this.definition.isShowedInOne) {
                let rotationRadians = this.rotationRadians;
                const singleRotatedRadians = P2 / totalPieces;
                const definition = this.definition;

                this.petals.forEach(petal => {
                    petal.setPositionSafe(
                        Geometry.getPositionOnCircle(
                            rotationRadians,
                            definition.distanceToCenter ?? GameConstants.petal.rotationRadius,
                            firstPetalCenter
                        )
                    );

                    rotationRadians += singleRotatedRadians;
                });
            } else {
                let radiansNow = revolutionRadians;

                this.petals.forEach(petal => {
                    petal.setPositionSafe(
                        Geometry.getPositionOnCircle(radiansNow, radius, this.position)
                    );

                    radiansNow += singleOccupiedRadians;
                });
            }
        } else {
            this.petals[0].setPositionSafe(firstPetalCenter);
        }
    }

    destroy(): void {
        this.petals.forEach(petal => {
            petal.destroy();
            this.inventory.eventManager.removePetal(petal);
        });
    }
}
