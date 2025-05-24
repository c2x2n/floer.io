import { ProjectileParameters } from "../../../../common/src/definitions/projectiles";
import ServerLivelyEntity from "../livelyEntity";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { ServerProjectile } from "../serverProjectile";
import { projectileMapped } from "./projectileMapped";

export default function spawnProjectile(source: ServerLivelyEntity, position: VectorAbstract, direction: VectorAbstract, parameters: ProjectileParameters): ServerProjectile {
    if (Object.prototype.hasOwnProperty.call(projectileMapped, parameters.definition.idString)) {
        return new projectileMapped[parameters.definition.idString](
            source, position, direction, parameters
        );
    } else {
        return new ServerProjectile(
            source,
            position,
            direction,
            parameters
        );
    }
}
