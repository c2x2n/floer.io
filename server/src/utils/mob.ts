import { MobDefinition, Mobs } from "../../../common/src/definitions/mob";
import { Vec2, Vector } from "../../../common/src/utils/vector";
import { Game } from "../game";
import { Random } from "../../../common/src/utils/random";
import { MathGraphics, P2 } from "../../../common/src/utils/math";
import { ServerMob } from "../entities/serverMob";

export function spawnSegmentMobs(game: Game, definition: MobDefinition, head_position: Vector){
    if (!definition.hasSegments) return ;
    const hitboxRadius = definition.hitboxRadius;
    let direction = Random.float(-P2, P2);
    let positionNow = head_position;

    let last: ServerMob = new ServerMob(game,
        positionNow,
        Vec2.radiansToDirection(-direction),
        definition
    );

    for (let i = 0; i < definition.segmentAmount - 1; i++) {
        positionNow = MathGraphics.getPositionOnCircle(
            direction + Random.float(-0.1, 0.1),
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
}
