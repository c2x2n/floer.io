import { Definitions, ObjectDefinition } from "../utils/definitions";
import { Modifiers, PlayerModifiers } from "../typings";
import { EntityType } from "../constants";
import { MobDefinition } from "./mob";

export type ProjectileDefinition = ObjectDefinition & {
    readonly onGround?: boolean;
    readonly doesNotDamage?: EntityType[];
    readonly showingXBackground?: number;
};

export const Projectile = new Definitions<ProjectileDefinition>([
    {
        idString: "dandelion",
        displayName: "Dandelion",
    },{
        idString: "missile",
        displayName: "Missile",
    },{
        idString: "web",
        displayName: "Web",
        onGround: true
    },{
        idString: "peas",
        displayName: "Peas",
    },{
        idString: "poison_peas",
        displayName: "Peas",
    },{
        idString: "red_peas",
        displayName: "Peas",
        showingXBackground: 4
    },
    {
        idString: "blueberries",
        displayName: "Blueberries",
    },
    {
        idString: "pollen",
        displayName: "Pollen",
        onGround: true
    },{
        idString: "uranium",
        displayName: "Uranium",
        onGround: true
    },{
        idString: "speas",
        displayName: "Grapes",
        usingAssets: "poison_peas",
        doesNotDamage: [EntityType.Player],
    },
] as ProjectileDefinition[]);


export interface ProjectileParameters {
    definition: ProjectileDefinition;
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
}

export type SpawnerType = {
    amount: number
    type: EntityType.Projectile
    spawn: ProjectileParameters
} | {
    amount: number
    type: EntityType.Mob
    spawn: MobDefinition
}
