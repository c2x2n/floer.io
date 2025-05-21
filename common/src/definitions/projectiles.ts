import { Definitions, ObjectDefinition } from "./definitions";
import { Modifiers, PlayerModifiers } from "../typings/modifier";
import { EntityType } from "../constants";
import { MobDefinition } from "./mobs";
import { EffectsOnHitDataType, PoisonDataType } from "../typings/effect";

export type ProjectileDefinition = ObjectDefinition & {
    readonly onGround?: boolean
    readonly doesNotDamage?: EntityType[]
    readonly showingCrossBackground?: number
};

export const Projectiles = new Definitions<ProjectileDefinition>([
    {
        idString: "dandelion",
        displayName: "Dandelion"
    }, {
        idString: "missile",
        displayName: "Missile"
    },
    {
        idString: "myt_big_missile",
        displayName: "Mecha Missile"
    }, {
        idString: "web",
        displayName: "Web",
        onGround: true
    }, {
        idString: "peas",
        displayName: "Peas"
    }, {
        idString: "poison_peas",
        displayName: "Peas"
    }, {
        idString: "red_peas",
        displayName: "Peas",
        showingCrossBackground: 4
    },
    {
        idString: "blueberries",
        displayName: "Blueberries"
    },
    {
        idString: "pollen",
        displayName: "Pollen",
        onGround: true
    }, {
        idString: "uranium",
        displayName: "Uranium",
        onGround: true
    }, {
        idString: "speas",
        displayName: "Grapes",
        usingAssets: "poison_peas",
        doesNotDamage: [EntityType.Player]
    }
] as ProjectileDefinition[]);

export interface ProjectileParameters {
    readonly definition: ProjectileDefinition
    readonly despawnTime: number
    readonly speed: number
    readonly hitboxRadius: number
    readonly damage?: number
    readonly health?: number
    readonly effectWhenOn?: Partial<PlayerModifiers>
    readonly effectsOnHit?: EffectsOnHitDataType
    readonly poison?: PoisonDataType
    readonly accelerationF?: number
    readonly spawner?: SpawnerType
}

export type SpawnerType = ({
    type: EntityType.Projectile
    spawn: ProjectileParameters
} | {
    type: EntityType.Mob
    spawn: MobDefinition
}) & {
    amount: number
};
