import { Definitions, ObjectDefinition } from "../utils/definitions";
import { Modifiers, PlayerModifiers } from "../typings";
import { EntityType } from "../constants";

export type ProjectileDefinition = ObjectDefinition & {
    readonly onGround?: boolean;
    readonly doesNotDamage?: EntityType[];
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
    modifiers?: Partial<Modifiers>
    velocityAtFirst?: number
    spawnDelay?: number
    spawner?: boolean
    customDefinition?: any
}
