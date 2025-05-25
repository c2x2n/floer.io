import { ServerGame } from "../../game";
import { P2 } from "../../../../common/src/engine/maths/constants";
import { MobDefinition, Mobs } from "../../../../common/src/definitions/mobs";
import { ServerMob } from "../serverMob";
import { Random } from "../../../../common/src/engine/maths/random";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { Geometry } from "../../../../common/src/engine/maths/geometry";

export function spawnMob(game: ServerGame, definition: MobDefinition, position: VectorAbstract): ServerMob {
    // 1/1.5m chance to spawn as a square
    if (Math.random() < (1 / 1500000)) {
        definition = Mobs.fromString("square");
    }

    let mob: ServerMob;
    if (definition.hasSegments) {
        mob = spawnSegmentMobs(
            game,
            definition,
            position
        );
    } else {
        mob = new ServerMob(
            game,
            position,
            Geometry.radiansToDirection(Random.float(-P2, P2)),
            definition
        );
    }

    return mob;
}

export function spawnSegmentMobs(game: ServerGame, definition: MobDefinition, head_position: VectorAbstract): ServerMob {
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
        direction += Random.float(-0.1, 0.1);
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
