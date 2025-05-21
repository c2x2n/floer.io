import { ServerGame } from "../../game";
import { PetalDefinition } from "../../../../common/src/definitions/petals";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { Rarity } from "../../../../common/src/definitions/rarities";
import { P2 } from "../../../../common/src/engine/maths/constants";
import { ServerLoot } from "../serverLoot";
import { Geometry } from "../../../../common/src/engine/maths/geometry";
import { GameConstants } from "../../../../common/src/constants";

export function spawnLoot(
    game: ServerGame,
    loots: PetalDefinition[],
    position: VectorAbstract,
    bypassLimitations = false
): void {
    const spawnedLoots = loots.concat([]);

    loots.forEach(loot => {
        const rarityDefinition = Rarity.fromString(loot.rarity);
        if ((rarityDefinition.isUnique && game.gameHas(loot)) && !bypassLimitations) {
            spawnedLoots.splice(spawnedLoots.indexOf(loot), 1);
        }

        if ((rarityDefinition.petalMaxCount
            && (
                game.rarityPetalCount(rarityDefinition.idString)
                + spawnedLoots.filter(e => e.rarity === loot.rarity).length - 1)
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
                Geometry.getPositionOnCircle(radiansNow, GameConstants.loot.spawnRadius, position), loot
            );

            radiansNow += everyOccupiedRadians;
        });
    } else {
        const loot = spawnedLoots[0];

        new ServerLoot(game, position, loot);
    }
}
