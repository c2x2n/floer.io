import { ZoneDefinition, ZoneName, Zones } from "../../common/src/definitions/zones";
import { UVec2D } from "../../common/src/physics/utils";
import { Random } from "../../common/src/utils/random";
import { Game } from "./game";
import { CircleHitbox, RectHitbox } from "../../common/src/utils/hitbox";
import { EntityType } from "../../common/src/constants";
import VectorAbstract from "../../common/src/physics/vectorAbstract";

export class ZonesManager {
    zones = new Map<ZoneName, Zone>();
    constructor(private game: Game) {
        Object.keys(ZoneName).forEach(name => {
            const zoneName = name as ZoneName;
            this.zones.set(zoneName, new Zone(this.game, Zones[zoneName]));
        });
    }

    inWhichZone(position: VectorAbstract): Zone | undefined {
        for (const zone of this.zones.values()) {
            if (zone.hitbox.isPointInside(position)) return zone;
        }
        return;
    }
}

const lagDowner = 1;

export class Zone {
    public hitbox: RectHitbox;

    get y(): number {
        return this.data.y ?? 0;
    }

    get height(): number {
        return this.data.height ?? this.game.height;
    }

    get maxMobCount(): number {
        return this.data.density / 15 * this.data.width * this.height / 20 / lagDowner;
    }

    constructor(private game: Game, public data: ZoneDefinition) {
        this.hitbox = new RectHitbox(
            UVec2D.new(data.x, this.y), UVec2D.new(data.x + data.width, this.y + this.height)
        );
    }

    public randomPoint(): VectorAbstract {
        const randomX
            = Random.int(this.data.x, this.data.x + this.data.width);
        const randomY
            = Random.int(this.y, this.y + this.height);
        return {
            x: randomX,
            y: randomY
        };
    }

    public randomSafePosition(hitboxRadius: number): VectorAbstract {
        let collidedNumber = 0;
        let position = this.randomPoint();
        let attempt = 0;
        do {
            position = this.randomPoint();

            collidedNumber = 0;

            const hitbox = new CircleHitbox(hitboxRadius + 5, position);

            const collided
                = this.game.grid.intersectsHitbox(hitbox);

            for (const collidedElement of collided) {
                if (hitbox.collidesWith(collidedElement.hitbox)) collidedNumber++;
            }

            attempt += 1;
            if (attempt >= 50) {
                console.log("Too many attempts. Chose the last position.");
                break;
            }
        } while (collidedNumber != 0 && attempt < 50);

        return position;
    }

    public countEntity(type?: EntityType): number {
        const collided = this.game.grid.intersectsHitbox(this.hitbox);

        let count = 0;

        for (const collidedElement of collided) {
            if (type) {
                if (collidedElement.type == type) count++;
                else count++;
            }
        }

        return count;
    }
}
