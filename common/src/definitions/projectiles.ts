import { Definitions, ObjectDefinition } from "./definitions";
import { Modifiers, PlayerModifiers } from "../typings";
import { EntityType } from "../constants";
import { MobDefinition } from "./mobs";

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
    definition: ProjectileDefinition
    despawnTime: number
    speed: number
    damage?: number
    health?: number
    hitboxRadius: number
    modifiersWhenOn?: Partial<PlayerModifiers>
    modifiersWhenDamage?: {
        modifier: Partial<PlayerModifiers>
        duration: number
    }
    poison?: {
        damagePerSecond: number
        duration: number
    }
    velocityAtFirst?: number
    spawner?: SpawnerType
    customDefinition?: any
    tracking?: {
        enabled: boolean
        turnSpeed: number
        detectionRange: number
        preferClosest?: boolean
    }
}

export type SpawnerType = {
    amount: number
    type: EntityType.Projectile
    spawn: ProjectileParameters
} | {
    amount: number
    type: EntityType.Mob
    spawn: MobDefinition
};
