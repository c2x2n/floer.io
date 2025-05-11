import { Game } from "../game";
import { PetalDefinition } from "../../../common/src/definitions/petals";
import { Vec2, VectorAbstract } from "../../../common/src/utils/vector";
import { Rarity } from "../../../common/src/definitions/rarities";
import { Geometry, P2 } from "../../../common/src/utils/math";
import { ServerLoot } from "../entities/serverLoot";
import { GameConstants } from "../../../common/src/constants";
import { MobDefinition, Mobs } from "../../../common/src/definitions/mobs";
import { ServerMob } from "../entities/serverMob";
import { Random } from "../../../common/src/utils/random";

export function spawnLoot(game: Game, loots: PetalDefinition[], position: VectorAbstract, bypassLimitations: boolean = false): void {
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
                Geometry.getPositionOnCircle(radiansNow, GameConstants.loot.spawnRadius, position), loot
            )

            radiansNow += everyOccupiedRadians;
        })
    } else {
        const loot = spawnedLoots[0];

        new ServerLoot(game, position, loot)
    }
}

export function spawnSegmentMobs(game: Game, definition: MobDefinition, head_position: VectorAbstract): ServerMob {
    const hitboxRadius = definition.hitboxRadius;
    let direction = Random.float(-P2, P2);
    let positionNow = head_position;

    let last: ServerMob = new ServerMob(game,
        positionNow,
        Geometry.radiansToDirection(-direction),
        definition
    );

    if (!definition.hasSegments) return last;

    let segmentCount = definition.segmentAmount;
    if (Random.float(0, 1) < 0.01) segmentCount = 100;

    const head = last;

    for (let i = 0; i < segmentCount - 1; i++) {
        direction += Random.float(-0.1, 0.1)
        positionNow = Geometry.getPositionOnCircle(
            direction,
            hitboxRadius * 2,
            positionNow
        );

        positionNow = game.clampPosition(positionNow, hitboxRadius, hitboxRadius);

        last = new ServerMob(game,
            positionNow,
            Geometry.radiansToDirection(-direction),
            Mobs.fromString(definition.segmentDefinitionIdString),
            last
        );
    }

    return head;
}
