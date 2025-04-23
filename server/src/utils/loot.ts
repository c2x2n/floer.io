import { PetalDefinition } from "../../../common/src/definitions/petal";
import { Vector } from "../../../common/src/utils/vector";
import { ServerLoot } from "../entities/serverLoot";
import { MathGraphics, P2 } from "../../../common/src/utils/math";
import { Game } from "../game";
import { GameConstants } from "../../../common/src/constants";
import { Rarity } from "../../../common/src/definitions/rarity";

export function spawnLoot(game: Game, loots: PetalDefinition[], position: Vector, bypassLimitations: boolean = false): void {
    let spawnedLoots = loots.concat([]);

    loots.forEach(loot => {
        const rarityDefinition = Rarity.fromString(loot.rarity);
        if ((rarityDefinition.isUnique && game.gameHas(loot)) && !bypassLimitations) {
            spawnedLoots.splice(spawnedLoots.indexOf(loot), 1);
        }

        if ((rarityDefinition.petalMaxCount
            && (
                game.rarityPetalCount(rarityDefinition.idString) +
                spawnedLoots.filter(e => e.rarity === loot.rarity).length - 1)
            >= rarityDefinition.petalMaxCount) && !bypassLimitations) {
            spawnedLoots.splice(spawnedLoots.indexOf(loot), 1);
        }
    });

    if (spawnedLoots.length <= 0) return;

    if (spawnedLoots.length > 1) {
        let radiansNow = 0;
        const everyOccupiedRadians = P2 / spawnedLoots.length;
        spawnedLoots.forEach(loot => {
            new ServerLoot(game,
                MathGraphics.getPositionOnCircle(radiansNow, GameConstants.loot.spawnRadius, position), loot
            )

            radiansNow += everyOccupiedRadians;
        })
    } else {
        const loot = spawnedLoots[0];

        new ServerLoot(game, position, loot)
    }
}
