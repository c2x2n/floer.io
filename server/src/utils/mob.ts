import { MobDefinition, Mobs } from "../../../common/src/definitions/mob";
import { Vec2, Vector } from "../../../common/src/utils/vector";
import { Game } from "../game";
import { Random } from "../../../common/src/utils/random";
import { MathGraphics, P2 } from "../../../common/src/utils/math";
import { ServerMob } from "../entities/serverMob";

export function spawnSegmentMobs(game: Game, definition: MobDefinition, head_position: Vector): ServerMob{
    const hitboxRadius = definition.hitboxRadius;
    let direction = Random.float(-P2, P2);
    let positionNow = head_position;

    let last: ServerMob = new ServerMob(game,
        positionNow,
        Vec2.radiansToDirection(-direction),
        definition
    );

    if (!definition.hasSegments) return last;

    let segmentCount = definition.segmentAmount;
    if (Random.float(0, 1) < 0.0001) segmentCount = 100;

    const head = last;

    for (let i = 0; i < segmentCount - 1; i++) {
        direction += Random.float(-0.1, 0.1)
        positionNow = MathGraphics.getPositionOnCircle(
            direction,
            hitboxRadius * 2,
            positionNow
        );

        positionNow = game.clampPosition(positionNow, hitboxRadius, hitboxRadius);

        last = new ServerMob(game,
            positionNow,
            Vec2.radiansToDirection(-direction),
            Mobs.fromString(definition.segmentDefinitionIdString),
            last
        );
    }

    return head;
}
