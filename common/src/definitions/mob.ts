import { Definitions, ObjectDefinition } from "../utils/definitions";
import { Projectile, ProjectileParameters } from "./projectile";
import { RarityName } from "./rarity";
import { Modifiers } from "../typings";
import { EntityType } from "../constants";

export enum MobCategory{
    Fixed,
    Unactive,
    Enemy,
    Passive
}


export type MobDefinition = ObjectDefinition & {
    readonly damage: number
    readonly health: number
    readonly hitboxRadius: number
    readonly lootTable: Record<string, number>
    readonly rarity: RarityName;
    readonly exp: number
    readonly images?: {
        width?: number
        height?: number
        mouth?: boolean
        mouthXPosition?: number
        mouthYPosition?: number
        legs?: boolean
        rotation?: number
    }
    readonly movement?: {
        readonly reachingAway?: boolean
        readonly sandstormLike?: boolean
    }
    readonly skill?: {
        readonly healUnder?: number
    }
    readonly modifiers?: Partial<Modifiers>
    readonly hideInformation?: boolean
    readonly despawnTime?: number
    readonly noSpawnMessage?: boolean
} & MobSegmentType & MobCategoryType & MobShootType;

export type MobCategoryType =  {
    readonly category: MobCategory.Fixed
    readonly pop?: Record<string, number[]>
    readonly onGround?: boolean
} | (({
    readonly category: MobCategory.Unactive
} | {
    readonly category: MobCategory.Enemy | MobCategory.Passive
    readonly aggroRadius: number
}) & {
    readonly speed: number
});


export type MobShootType = {
    readonly shootable?: false
} | {
    readonly shootable: true
    readonly shoot: ProjectileParameters;
    readonly shootSpeed:
        number | { min: number, max: number }
    readonly turningHead?: boolean
}

export type MobSegmentType = {
    readonly hasSegments?: false
} | {
    readonly hasSegments?: true
    readonly notCollideWithSegments?: boolean
    readonly sharingHealth?: boolean
    readonly segmentAmount: number
    readonly segmentDefinitionIdString: string
}

export const Mobs = new Definitions<MobDefinition>([
    {
        idString: "ladybug",
        displayName: "Ladybug",
        damage: 10,
        health: 10,
        category: MobCategory.Unactive,
        hitboxRadius: 1.5,
        speed: 3,
        lootTable: {
            "rose": 0.11,
            "fast": 0.5,
            "bubble": 0.04,
            "twin": 0.1,
            "wing": 0.02
        },
        rarity: RarityName.common,
        exp: 1
    },
    {
        idString: "massive_ladybug",
        displayName: "Ladybug",
        damage: 20,
        health: 2000,
        category: MobCategory.Unactive,
        hitboxRadius: 6.2,
        speed: 3,
        usingAssets: "ladybug",
        lootTable: {
            "rose": 1,
            "tri_rose": 1,
            "triplet": 0.25,
            "epic_rose": 1,
            "bubble": 1,
            "leg_bubble": 0.06,
            "myt_tri_rose": 0.000001
        },
        rarity: RarityName.legendary,
        exp: 500
    },
    {
        idString: "massiver_ladybug",
        displayName: "Ladybug",
        damage: 20,
        health: 2000,
        category: MobCategory.Unactive,
        hitboxRadius: 50,
        speed: 3,
        usingAssets: "ladybug",
        lootTable: {
            "rose": 1,
            "tri_rose": 1,
            "triplet": 0.25,
            "epic_rose": 1,
            "bubble": 1,
            "leg_bubble": 0.06,
            "penta": 0.000006,
            "myt_tri_rose": 0.000005
        },
        rarity: RarityName.unique,
        exp: 500
    },
    {
        idString: "massiver_shiny_ladybug",
        displayName: "Ladybug",
        damage: 20,
        health: 2000,
        category: MobCategory.Passive,
        aggroRadius: 1000,
        hitboxRadius: 50,
        speed: 3,
        usingAssets: "ladybug",
        lootTable: {
            "rose": 1,
            "tri_rose": 1,
            "triplet": 0.25,
            "epic_rose": 1,
            "bubble": 1,
            "leg_bubble": 0.06,
            "penta": 0.000006,
            "myt_tri_rose": 0.000005
        },
        rarity: RarityName.unique,
        exp: 500
    },{
        idString: "shiny_ladybug",
        displayName: "Ladybug",
        damage: 10,
        health: 150,
        category: MobCategory.Passive,
        aggroRadius: 10,
        hitboxRadius: 2,
        speed: 3,
        lootTable: {
            "rose": 1,
            "twin": 0.39,
            "tri_rose": 0.34,
            "bubble": 0.16,
            "wing": 0.16,
            "leg_bubble": 0.00006,
            "epic_rose": 0.005,
            "triplet": 0.01
        },
        rarity: RarityName.unusual,
        exp: 10
    },{
        idString: "dark_ladybug",
        displayName: "Ladybug",
        damage: 10,
        health: 25,
        category: MobCategory.Passive,
        aggroRadius: 10,
        hitboxRadius: 1.8,
        speed: 3,
        lootTable: {
            "tri_rose": 0.36,
            "epic_rose": 0.002,
            "yinyang": 0.009,
            "bubble": 0.1,
            "wing": 0.08,
            "triplet": 0.002,
            "shell": 0.002
        },
        rarity: RarityName.rare,
        exp: 5
    },{
        idString: "bee",
        displayName: "Bee",
        damage: 50,
        health: 15,
        category: MobCategory.Unactive,
        hitboxRadius: 1,
        speed: 3,
        lootTable: {
            "fast": 0.12,
            "stinger": 0.1,
            "twin": 0.08,
            "triangle": 0.002,
            "bubble": 0.012,
            "wing": 0.003,
            "honey": 0.07
        },
        rarity: RarityName.common,
        exp: 2
    },{
        idString: "cactus",
        displayName: "Cactus",
        damage: 35,
        health: 42,
        category: MobCategory.Fixed,
        hitboxRadius: 2,
        lootTable: {
            "sand": 0.1,
            "stinger": 0.1,
            "triangle": 0.001,
            "missile": 0.092,
            "big_missile": 0.001,
            "cactus": 0.06,
            "poison_cactus": 0.001,
            "tri_cactus": 0.00005,
        },
        rarity: RarityName.unusual,
        exp: 2
    },{
        idString: "mega_cactus",
        displayName: "Cactus",
        damage: 75,
        health: 1500,
        category: MobCategory.Fixed,
        hitboxRadius: 6,
        lootTable: {
            "sand": 0.8,
            "triangle": 0.05,
            "missile": 0.5,
            "big_missile": 0.01,
            "cactus": 0.5,
            "poison_cactus": 0.06,
            "tri_cactus": 0.009,
        },
        rarity: RarityName.legendary,
        usingAssets: "cactus",
        exp: 20
    },{
        idString: "rock",
        displayName: "Rock",
        damage: 10,
        health: 16,
        category: MobCategory.Fixed,
        hitboxRadius: 2,
        lootTable: {
            "fast": 0.05,
            "twin": 0.024,
            "rock": 0.005
        },
        rarity: RarityName.common,
        exp: 2
    },
    {
        idString: "square",
        displayName: "Square",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 0.2,
        hitboxRadius: 1.5,
        lootTable: {
            "square": 1,
        },
        rarity: RarityName.unique,
        noSpawnMessage: true,
        exp: 2500
    },{
        idString: "boulder",
        displayName: "Boulder",
        damage: 20,
        health: 160,
        category: MobCategory.Fixed,
        hitboxRadius: 4,
        lootTable: {
            "fast": 1,
            "uranium": 0.00012,
            "rock": 0.09,
            "heaviest": 0.004
        },
        rarity: RarityName.unusual,
        exp: 20,
        usingAssets: "rock"
    },{
        idString: "beetle",
        displayName: "Beetle",
        damage: 40,
        health: 60,
        category: MobCategory.Enemy,
        aggroRadius: 20,
        hitboxRadius: 2,
        speed: 3,
        images: {
            mouth: true,
            mouthXPosition: 1.2
        },
        lootTable: {
            "iris": 0.09,
            "salt": 0.06,
            "triplet": 0.004,
            "wing": 0.006,
            "pincer": 0.0001
        },
        rarity: RarityName.unusual,
        exp: 5
    },{
        idString: "leg_beetle",
        displayName: "Beetle",
        damage: 50,
        health: 2000,
        category: MobCategory.Passive,
        aggroRadius: 20,
        hitboxRadius: 5,
        speed: 3.8,
        images: {
            mouth: true,
            mouthXPosition: 1.2
        },
        lootTable: {
            "iris": 1,
            "salt": 0.8,
            "triplet": 0.8,
            "wing": 0.6,
            "powder": 0.015,
            "leg_egg": 0.055,
            "tri_wing": 0.000001
        },
        rarity: RarityName.legendary,
        exp: 500,
        usingAssets: "beetle"
    },{
        idString: "hornet",
        displayName: "Hornet",
        damage: 50,
        health: 50,
        category: MobCategory.Enemy,
        shootable: true,
        turningHead: true,
        shoot: {
            hitboxRadius: 0.6,
            damage: 10,
            health: 10,
            despawnTime: 3,
            speed: 6,
            definition: Projectile.fromString("missile")
        },
        movement: {
            reachingAway: true,
        },
        shootSpeed: 1.5,
        aggroRadius: 30,
        hitboxRadius: 2,
        speed: 4,
        lootTable: {
            "dandelion": 0.14,
            "bubble": 0.02,
            "missile": 0.18,
            "honey": 0.02,
            "big_missile": 0.005,
            "wing": 0.06,
            "antennae": 0.0003,
        },
        rarity: RarityName.rare,
        exp: 10
    },{
        idString: "leg_hornet",
        displayName: "Hornet",
        damage: 75,
        health: 1250,
        category: MobCategory.Passive,
        movement: {
            reachingAway: true,
        },
        shootable: true,
        turningHead: true,
        shoot: {
            hitboxRadius: 1.85,
            damage: 20,
            health: 100,
            despawnTime: 3,
            speed: 8,
            definition: Projectile.fromString("missile")
        },
        shootSpeed: 1.25,
        aggroRadius: 30,
        hitboxRadius: 5,
        speed: 4,
        lootTable:  {
            "dandelion": 1,
            "bubble": 0.2,
            "missile": 1,
            "honey": 1,
            "big_missile": 0.8,
            "leg_bubble": 0.0009,
            "faster_wing": 0.025,
            "wing": 0.5,
            "antennae": 0.035,
            "myt_big_missile": 0.00000033,
            "myt_antennae": 0.00000033,
            "myt_egg": 0.00000033
        },
        rarity: RarityName.legendary,
        exp: 500,
        usingAssets: "hornet"
    },{
        idString: "mantis",
        displayName: "Mantis",
        damage: 30,
        health: 70,
        category: MobCategory.Enemy,
        movement: {
            reachingAway: true,
        },
        shootable: true,
        images: {
            width: 254.552,
        //    height: 163.995
            legs: true
        },
        shoot: {
            hitboxRadius: 0.5,
            damage: 10,
            health: 10,
            despawnTime: 3,
            speed: 7,
            definition: Projectile.fromString("peas")
        },
        shootSpeed: 1.5,
        aggroRadius: 30,
        hitboxRadius: 2,
        speed: 3,
        lootTable: {
            "peas": 0.1,
            "poison_peas": 0.01,
            "wing": 0.14,
        },
        rarity: RarityName.rare,
        exp: 20,
        usingAssets: "mantis"
    },{
        idString: "leg_mantis",
        displayName: "Mantis",
        damage: 30,
        health: 1500,
        category: MobCategory.Passive,
        movement: {
            reachingAway: true,
        },
        shootable: true,
        shoot: {
            hitboxRadius: 1.25,
            damage: 15,
            health: 30,
            despawnTime: 3,
            speed: 11.5,
            definition: Projectile.fromString("peas")
        },
        shootSpeed: 1.3,
        aggroRadius: 30,
        hitboxRadius: 4,
        speed: 3.5,
        lootTable: {
            "peas": 1,
            "poison_peas": 1,
            "leg_poison_peas": 0.02,
            "leg_bubble": 0.00006,
            "wing": 1,
            "tri_triangle": 0.0000005,
            "pinger": 0.0000005
        },
        rarity: RarityName.legendary,
        exp: 500,
        usingAssets: "mantis"
    },{
        idString: "spider",
        displayName: "Spider",
        damage: 20,
        health: 25,
        category: MobCategory.Enemy,
        aggroRadius: 20,
        hitboxRadius: 1,
        speed: 4,
        images: {
            legs: true
        },
        lootTable: {
            "iris": 0.2,
            "stinger": 0.24,
            "triangle": 0.0024,
            "web": 0.09,
            "pincer": 0.001,
            "faster": 0.04,
            "tri_web": 0.0002
        },
        rarity: RarityName.rare,
        exp: 5
    },{
        idString: "leg_spider",
        displayName: "Spider",
        damage: 25,
        health: 1050,
        category: MobCategory.Passive,
        aggroRadius: 20,
        hitboxRadius: 3,
        speed: 5,
        images: {
            legs: true
        },
        lootTable: {
            "iris": 0.2,
            "stinger": 0.8,
            "triangle": 0.12,
            "web": 0.9,
            "pincer": 0.8,
            "faster": 1,
            "tri_web": 0.03,
            "faster_wing": 0.02,
            "myt_tri_web": 0.0000005,
            "tri_faster": 0.0000005
        },
        rarity: RarityName.legendary,
        exp: 500,
        usingAssets: "spider"
    },{
        idString: "soldier_ant",
        displayName: "Soldier Ant",
        damage: 10,
        health: 40,
        category: MobCategory.Enemy,
        aggroRadius: 20,
        hitboxRadius: 0.8,
        speed: 3,
        images: {
            mouth: true
        },
        lootTable: {
            "sand": 0.09,
            "iris": 0.12,
            "twin": 0.8,
            "wing": 0.05,
            "faster": 0.04,
            "faster_wing": 0.0001
        },
        rarity: RarityName.unusual,
        exp: 4
    },{
        idString: "worker_ant",
        displayName: "Worker Ant",
        damage: 10,
        health: 25,
        category: MobCategory.Passive,
        aggroRadius: 10,
        hitboxRadius: 0.8,
        speed: 3,
        images: {
            mouth: true,
        },
        lootTable: {
            "sand": 0.06,
            "fast": 0.46,
            "leaf": 0.28,
            "twin": 0.15,
            "rice": 0.006,
            "tri_leaf": 0.00008,
            "corn": 0.0006
        },
        rarity: RarityName.unusual,
        exp: 4
    },{
        idString: "queen_ant",
        displayName: "Queen Ant",
        damage: 20,
        health: 250,
        category: MobCategory.Enemy,
        aggroRadius: 50,
        hitboxRadius: 1,
        images: {
            mouth: true,
        },
        speed: 3,
        lootTable: {
            "sand": 0.8,
            "fast": 1,
            "twin": 1,
            "wing": 0.31,
            "egg": 0.06,
            "triplet": 0.01,
            "tri_stinger": 0.006
        },
        rarity: RarityName.epic,
        exp: 4
    },{
        idString: "ant_hole",
        displayName: "Ant Hole",
        damage: 20,
        health: 300,
        category: MobCategory.Fixed,
        pop: {
            "worker_ant": [1, 1, 0.9, 0.9, 0.9, 0.8, 0.8, 0, 0, 0, 0],
            "baby_ant": [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.4, 0.25, 0.2, 0.15, 0, 0],
            "soldier_ant": [0.95, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.2, 0.15, 0.1, 0.1, 0.1, 0, 0],
            "queen_ant": [0.1]
        },
        onGround: true,
        hitboxRadius: 2,
        lootTable: {
            "iris": 1,
            "wing": 0.5,
            "egg": 0.07,
            "dice": 0.009
        },
        rarity: RarityName.rare,
        exp: 40
    },{
        idString: "baby_ant",
        displayName: "Baby Ant",
        damage: 10,
        health: 10,
        category: MobCategory.Unactive,
        hitboxRadius: 0.8,
        speed: 3,
        images: {
            mouth: true,
        },
        lootTable: {
            "sand": 0.08,
            "fast": 0.44,
            "leaf": 0.26,
            "twin": 0.18,
            "rice": 0.005,
            "triplet": 0.0006
        },
        rarity: RarityName.unusual,
        exp: 4
    },{
        idString: "centipede",
        displayName: "Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 1,
        hitboxRadius: 1.5,
        images: {
            width: 242.874,
        },
        lootTable: {
            "fast": 0.09,
            "leaf": 0.05,
            "twin": 0.12,
            "triplet": 0.0001,
            "peas": 0.03,
            "poison_peas": 0.0006
        },
        rarity: RarityName.unusual,
        exp: 4,
        hasSegments: true,
        segmentAmount: 10,
        segmentDefinitionIdString: "centipede_body"
    },{
        idString: "centipede_body",
        displayName: "Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 1,
        hitboxRadius: 1.5,
        hideInformation: true,
        lootTable:  {
            "fast": 0.09,
            "leaf": 0.05,
            "twin": 0.12,
            "triplet": 0.0001,
            "peas": 0.03,
            "poison_peas": 0.0006
        },
        rarity: RarityName.unusual,
        exp: 4
    },{
        idString: "desert_centipede",
        displayName: "Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 5,
        hitboxRadius: 1.5,
        images: {
            width: 242.874,
        },
        lootTable: {
            "fast": 0.08,
            "twin": 0.18,
            "triplet": 0.005,
            "powder": 0.00001,
            "talisman": 0.0056
        },
        rarity: RarityName.unusual,
        exp: 4,
        hasSegments: true,
        segmentAmount: 10,
        segmentDefinitionIdString: "desert_centipede_body"
    },{
        idString: "desert_centipede_body",
        displayName: "Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 5,
        hitboxRadius: 1.5,
        hideInformation: true,
        lootTable: {
            "fast": 0.08,
            "twin": 0.18,
            "triplet": 0.005,
            "powder": 0.00001,
            "talisman": 0.0056
        },
        rarity: RarityName.unusual,
        exp: 4
    },{
        idString: "evil_centipede",
        displayName: "Evil Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Enemy,
        aggroRadius: 25,
        speed: 3,
        hitboxRadius: 1.5,
        images: {
            width: 242.874
        },
        lootTable: {
            "iris": 0.82,
            "peas": 0.58,
            "chip": 0.028,
            "poison_peas": 0.012,
            "leg_poison_peas": 0.001
        },
        rarity: RarityName.rare,
        exp: 4,
        hasSegments: true,
        segmentAmount: 10,
        segmentDefinitionIdString: "evil_centipede_body"
    }, {
        idString: "evil_centipede_body",
        displayName: "Evil Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Enemy,
        aggroRadius: 25,
        speed: 3,
        hitboxRadius: 1.5,
        hideInformation: true,
        lootTable: {
            "iris": 0.82,
            "peas": 0.58,
            "chip": 0.28,
            "poison_peas": 0.012,
            "leg_poison_peas": 0.001
        },
        rarity: RarityName.rare,
        exp: 4
    },{
        idString: "leg_evil_centipede",
        displayName: "Evil Centipede",
        damage: 20,
        health: 1500,
        category: MobCategory.Enemy,
        aggroRadius: 25,
        speed: 3.5,
        hitboxRadius: 2.2,
        images: {
            width: 242.874,
        },
        lootTable: {
            "iris": 1,
            "peas": 0.85,
            "chip": 0.028,
            "poison_peas": 0.5,
            "leg_poison_peas": 0.01,
            "myt_poison_peas": 0.000001
        },
        rarity: RarityName.legendary,
        exp: 100,
        hasSegments: true,
        segmentAmount: 20,
        segmentDefinitionIdString: "leg_evil_centipede_body",
        usingAssets: "evil_centipede"
    }, {
        idString: "leg_evil_centipede_body",
        displayName: "Evil Centipede",
        damage: 20,
        health: 500,
        category: MobCategory.Enemy,
        aggroRadius: 25,
        speed: 3.5,
        hitboxRadius: 2.2,
        hideInformation: true,
        lootTable: {
            "iris": 0.82,
            "peas": 0.5,
            "chip": 0.028,
            "poison_peas": 0.2,
            "leg_poison_peas": 0.005
        },
        rarity: RarityName.legendary,
        exp: 100,
        usingAssets: "evil_centipede_body"
    },{
        idString: "mega_mantis",
        displayName: "Mantis",
        damage: 30,
        health: 1500,
        category: MobCategory.Enemy,
        images: {
            legs: true
        },
        movement: {
            reachingAway: true,
        },
        shootable: true,
        shoot: {
            hitboxRadius: 2.8,
            damage: 15,
            health: 80,
            despawnTime: 3,
            speed: 12,
            definition: Projectile.fromString("peas")
        },
        shootSpeed: 1,
        aggroRadius: 30,
        hitboxRadius: 4 * 2 / 0.7,
        speed: 4,
        lootTable: {
            "peas": 0.24,
            "poison_peas": 0.04,
            "leg_poison_peas": 0.7,
            "leg_bubble": 0.0024,
            "wing": 0.12,
            "tri_triangle": 0.5,
            "tri_wing": 0.004,
            "myt_poison_peas": 0.1
        },
        rarity: RarityName.mythic,
        exp: 14000,
        usingAssets: "mantis"
    },
    {
        idString: "giant_mantis",
        displayName: "Mantis",
        damage: 260,
        health: 225000,
        category: MobCategory.Enemy,
        movement: {
            reachingAway: true,
        },
        shootable: true,
        images: {
            width: 254.552,
          //  height: 163.995
        },
        shoot: {
            hitboxRadius: 5.6,
            damage: 60,
            health: 2300,
            despawnTime: 5,
            speed: 15,
            definition: Projectile.fromString("peas")
        },
        shootSpeed: 0.5,
        aggroRadius: 90,
        hitboxRadius: 21,
        speed: 4,
        lootTable: {
        },
        rarity: RarityName.ethereal,
        exp: 96000,
        usingAssets: "mantis"
    },{
        idString: "mega_hornet",
        displayName: "Hornet",
        damage: 125,
        health: 2500,
        category: MobCategory.Enemy,
        movement: {
            reachingAway: true,
        },
        shootable: true,
        turningHead: true,
        shoot: {
            hitboxRadius: 3,
            damage: 20,
            health: 100,
            despawnTime: 3,
            speed: 9,
            definition: Projectile.fromString("missile")
        },
        shootSpeed: 0.9,
        aggroRadius: 60,
        hitboxRadius: 5 / 0.6,
        speed: 4,
        lootTable:  {
            "dandelion": 1,
            "bubble": 0.8,
            "missile": 0.9,
            "big_missile": 0.75,
            "myt_big_missile": 0.5,
            "leg_bubble": 0.06,
            "wing": 0.3,
            "tri_wing": 0.0002,
            "myt_egg": 0.35,
            "antennae": 0.1,
            "myt_antennae": 0.035
        },
        rarity: RarityName.mythic,
        exp: 20000,
        usingAssets: "hornet"
    },{
        idString: "mega_beetle",
        displayName: "Beetle",
        damage: 90,
        health: 3800,
        category: MobCategory.Enemy,
        aggroRadius: 40,
        hitboxRadius: 8,
        images: {
            mouth: true,
            mouthXPosition: 1.2 / 2 / 1.5
        },
        speed: 3.35,
        lootTable: {
            "iris": 1,
            "salt": 0.24,
            "triplet": 1,
            "wing": 1,
            "tri_wing": 0.45,
            "powder": 0.5,
            "leg_egg": 0.8,
        },
        rarity: RarityName.mythic,
        exp: 10000,
        usingAssets: "beetle"
    },
    {
        idString: "giant_roach",
        displayName: "Roach",
        damage: 520,
        health: 225000*3,
        category: MobCategory.Passive,
        aggroRadius: 180,
        hitboxRadius: 21,
        images: {
            width: 235.000
        },
        speed: 7,
        lootTable: {
        },
        rarity: RarityName.phantasmagoric,
        exp: 232000,
        usingAssets: "roach"
    },{
        idString: "massive_shiny_ladybug",
        displayName: "Ladybug",
        damage: 10,
        health: 400,
        category: MobCategory.Passive,
        aggroRadius: 20,
        hitboxRadius: 6,
        speed: 3,
        lootTable: {
            "rose": 1,
            "twin": 1,
            "tri_rose": 1,
            "bubble": 1,
            "wing": 1,
            "tri_wing": 0.6,
            "leg_bubble": 0.012,
            "epic_rose": 0.9,
            "triplet": 1,
            "penta": 0.5,
            "myt_tri_rose": 0.009
        },
        rarity: RarityName.mythic,
        exp: 100000,
        usingAssets: "shiny_ladybug"
    },
    {
        idString: "sshiny",
        displayName: "Ladybug???",
        damage: 1,
        aggroRadius: 10,
        health: 725000,
        category: MobCategory.Passive,
        hitboxRadius: 7,
        speed: 4,
        lootTable: {
            'fast': 1,
        },
        rarity: RarityName.common,
        exp: 5,
        usingAssets: "shiny_ladybug"
    },
    {
        idString: "massive_dark_ladybug",
        displayName: "Ladybug",
        damage: 20,
        health: 1000,
        category: MobCategory.Passive,
        aggroRadius: 20,
        hitboxRadius: 8,
        speed: 3,
        usingAssets: "dark_ladybug",
        lootTable: {
            "tri_rose": 0.7,
            "epic_rose": 0.1,
            "jelly": 0.3,
            "bubble": 0.16,
            "wing": 0.16,
            "yinyang": 0.4,
            "leg_bubble": 0.2,
            "triplet": 0.8,
            "penta": 0.002,
            "myt_tri_rose": 0.45,
            "shell": 0.5
        },
        rarity: RarityName.mythic,
        exp: 10000
    },{
        idString: "mega_spider",
        displayName: "Spider",
        damage: 65,
        health: 2500,
        category: MobCategory.Enemy,
        aggroRadius: 100,
        hitboxRadius: 7,
        shootable: true,
        images: {
            legs: true
        },
        shoot: {
            hitboxRadius: 6,
            despawnTime: 5,
            speed: 0,
            definition: Projectile.fromString("web"),
            modifiersWhenOn: {
                speed: 0.6
            }
        },
        shootSpeed: 0.7,
        speed: 5,
        lootTable: {
            "iris": 0.22,
            "stinger": 0.36,
            "triangle": 0.024,
            "tri_triangle": 0.024,
            "web": 0.09,
            "pincer": 0.09,
            "tri_web": 0.4,
            "faster": 0.4,
            "faster_wing": 0.7,
            "myt_tri_web": 0.25,
            "tri_faster": 0.5,
            "thirdeye": 0.03/100
        },
        rarity: RarityName.mythic,
        exp: 10000,
        usingAssets: "spider"
    },
    {
        idString: "giant_spider",
        displayName: "Spider",
        damage: 130,
        health: 7500,
        category: MobCategory.Enemy,
        aggroRadius: 35,
        hitboxRadius: 20,
        shootable: true,
        images: {
            legs: true
        },
        shoot: {
            hitboxRadius: 6.5,
            despawnTime: 7,
            speed: 0,
            definition: Projectile.fromString("web"),
            modifiersWhenOn: {
                speed: 0.6
            }
        },
        shootSpeed: 0.7,
        speed: 4.5,
        lootTable: {
            "iris": 0.15,
            "stinger": 0.12,
            "triangle": 0.08,
            "tri_triangle": 0.12,
            "tri_stinger": 0.18,
            "web": 0.1,
            "pincer": 0.3,
            "tri_web": 0.4,
            "faster": 0.1,
            "faster_wing": 0.2,
            "pinger": 0.6,
            "myt_tri_web": 0.7,
            "tri_faster": 0.7,
            "thirdeye": 1,
        },
        rarity: RarityName.unique,
        exp: 62000,
        usingAssets: "spider"
    },{
        idString: "myt_soldier_ant",
        displayName: "Soldier Ant",
        damage: 60,
        health: 1800,
        category: MobCategory.Enemy,
        aggroRadius: 20,
        hitboxRadius: 5,
        speed: 3.25,
        images: {
            mouth: true
        },
        lootTable: {
            "sand": 0.66,
            "fast": 0.44,
            "iris": 0.12,
            "twin": 0.8,
            "wing": 0.16,
            "tri_wing": 0.012,
            "triplet": 0.012,
            "faster_wing": 0.4,
            "faster": 0.01,
            "penta": 0.001,
            "tri_faster": 0.1,
            "egg": 0.6
        },
        rarity: RarityName.mythic,
        exp: 8000,
        usingAssets: "soldier_ant"
    },{
        idString: "myt_worker_ant",
        displayName: "Worker Ant",
        damage: 40,
        health: 1000,
        category: MobCategory.Passive,
        hitboxRadius: 5,
        aggroRadius: 20,
        speed: 3,
        images: {
            mouth: true,
        },
        lootTable: {
            "sand": 0.66,
            "fast": 0.92,
            "leaf": 0.56,
            "twin": 0.24,
            "rice": 0.01,
            "tri_leaf": 0.04,
            "triplet": 0.52,
            "penta": 0.005,
            "corn": 0.5
        },
        rarity: RarityName.mythic,
        exp: 7000,
        usingAssets: "worker_ant"
    },{
        idString: "myt_queen_ant",
        displayName: "Queen Ant",
        damage: 60,
        health: 5000,
        category: MobCategory.Enemy,
        hitboxRadius: 10,
        aggroRadius: 45,
        speed: 3,
        images: {
            mouth: true,
        },
        lootTable: {
            "twin": 1,
            "triplet": 0.2,
            "penta": 0.01,
            "tri_stinger": 0.9,
            "pinger": 0.7
        },
        rarity: RarityName.mythic,
        exp: 15000,
        usingAssets: "queen_ant"
    },{
        idString: "myt_baby_ant",
        displayName: "Baby Ant",
        damage: 10,
        health: 1000,
        category: MobCategory.Unactive,
        hitboxRadius: 5,
        speed: 3,
        images: {
            mouth: true,
        },
        lootTable: {
            "sand": 0.66,
            "fast": 0.88,
            "leaf": 0.52,
            "twin": 0.24,
            "rice": 0.6,
            "tri_leaf": 0.03,
            "triplet": 0.12,
            "penta": 0.005
        },
        rarity: RarityName.mythic,
        exp: 6000,
        usingAssets: "baby_ant"
    },{
        idString: "myt_ant_hole",
        displayName: "Ant Hole",
        damage: 20,
        health: 10000,
        category: MobCategory.Fixed,
        pop: {
            "worker_ant": [1, 1, 0.9, 0.9, 0.9, 0.8, 0.8, 0, 0, 0, 0],
            "baby_ant": [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.4, 0.25, 0.2, 0.15, 0, 0],
            "soldier_ant": [0.95, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.2, 0.15, 0.1, 0.1, 0.1, 0, 0],
            "myt_worker_ant": [1, 0.9, 0.8, 0, 0],
            "myt_baby_ant": [1, 0.9, 0.7, 0.4, 0.2, 0.15, 0],
            "myt_soldier_ant": [0.9, 0.8, 0.6, 0.45, 0.3, 0.15, 0.1, 0.1, 0, 0],
            "myt_queen_ant": [0.1]
        },
        onGround: true,
        hitboxRadius: 10,
        lootTable: {
            "sand": 0.66,
            "fast": 0.92,
            "leaf": 0.56,
            "twin": 0.24,
            "rice": 0.01,
            "tri_leaf": 0.4,
            "triplet": 0.0012,
            "penta": 1,
            "corn": 0.002
        },
        rarity: RarityName.mythic,
        exp: 25000,
        usingAssets: "ant_hole"
    },{
        idString: "passive_bee",
        displayName: "Bee",
        damage: 100,
        health: 1000,
        aggroRadius: 10,
        category: MobCategory.Passive,
        hitboxRadius: 8,
        speed: 5,
        lootTable: {
            "stinger": 0.9,
            "bubble": 0.48,
            "leg_bubble": 0.0048,
            "wing": 0.24,
            "pinger": 0.24,
            "tri_triangle": 0.17,
            "pollen": 0.22,
            "myt_pollen": 0.11,
            "honey": 1
        },
        rarity: RarityName.mythic,
        exp: 10000,
        usingAssets: "bee"
    },{
        idString: "myt_evil_centipede",
        displayName: "Devourer of Peas",
        damage: 50,
        health: 22500,
        category: MobCategory.Enemy,
        aggroRadius: 50,
        speed: 3,
        hitboxRadius: 3,
        shootable: true,
        shoot: {
            definition: Projectile.fromString("red_peas"),
            health: 20,
            damage: 0,
            despawnTime: 2,
            hitboxRadius: 1,
            speed: 0.5,
            velocityAtFirst: 150,
            spawner: {
                amount: 4,
                type: EntityType.Projectile,
                spawn: {
                    definition: Projectile.fromString("poison_peas"),
                    health: 100,
                    damage: 10,
                    despawnTime: 3,
                    speed: 15,
                    poison: {
                        duration: 1,
                        damagePerSecond: 10
                    },
                    hitboxRadius: 0.5
                }
            }
        },
        shootSpeed: { min: 3, max: 6 },
        images: {
            width: 242.874,
            height: 226
        },
        lootTable: {
            "iris": 1,
            "peas": 0.2,
            "chip": 0.8,
            "poison_peas": 0.9,
            "leg_poison_peas": 0.04,
            "myt_poison_peas": 0.01
        },
        rarity: RarityName.mythic,
        exp: 1000,
        hasSegments: true,
        segmentAmount: 35,
        notCollideWithSegments: true,
        sharingHealth: true,
        segmentDefinitionIdString: "myt_evil_centipede_body",
        usingAssets: "evil_centipede"
    }, {
        idString: "myt_evil_centipede_body",
        displayName: "Devourer of Peas",
        damage: 50,
        health: 22500,
        category: MobCategory.Enemy,
        aggroRadius: 50,
        speed: 3,
        hitboxRadius: 3,
        hideInformation: true,
        shootable: true,
        shoot: {
            definition: Projectile.fromString("red_peas"),
            health: 20,
            damage: 0,
            despawnTime: 2,
            hitboxRadius: 1,
            speed: 0.5,
            velocityAtFirst: 150,
            spawner: {
                amount: 4,
                type: EntityType.Projectile,
                spawn: {
                    definition: Projectile.fromString("poison_peas"),
                    health: 100,
                    damage: 10,
                    despawnTime: 3,
                    speed: 15,
                    poison: {
                        duration: 1,
                        damagePerSecond: 10
                    },
                    hitboxRadius: 0.5
                }
            }
        },
        shootSpeed: { min: 3, max: 6 },
        images: {
            width: 242.874,
            height: 226
        },
        lootTable: {
            "iris": 0.82,
            "peas": 0.028,
            "chip": 0.028,
            "poison_peas": 0.9,
            "leg_poison_peas": 0.04,
            "myt_poison_peas": 0.01
        },
        rarity: RarityName.mythic,
        exp: 1000,
        usingAssets: "evil_centipede_body"
    },{
        idString: "myt_boulder",
        displayName: "Boulder",
        damage: 40,
        health: 10000,
        category: MobCategory.Fixed,
        hitboxRadius: 8,
        lootTable: {
            "fast": 1,
            "twin": 1,
            "triplet": 0.4,
            "uranium": 0.5,
            "heaviest": 1
        },
        rarity: RarityName.mythic,
        exp: 10000,
        usingAssets: "rock"
    },{
        idString: "sandstorm",
        displayName: "Sandstorm",
        damage: 40,
        health: 140,
        category: MobCategory.Unactive,
        hitboxRadius: 5,
        speed: 15,
        images: {
            width: 150,
            height: 150,
        },
        movement: {
            sandstormLike: true
        },
        lootTable: {
            "sand": 0.5,
            "fast": 0.2,
            "triangle": 0.08,
            "powder": 0.05,
            "talisman": 0.01,
            "stick": 0.001
        },
        rarity: RarityName.rare,
        exp: 15,
        usingAssets: "sandstorm"
    }, {
        idString: "starfish",
        displayName: "Starfish",
        damage: 40,
        health: 140,
        category: MobCategory.Enemy,
        aggroRadius: 15,
        hitboxRadius: 5,
        speed: 5,
        images: {
            rotation: 1
        },
        skill: {
            healUnder: 0.5
        },
        modifiers: {
            healPerSecond: 10
        },
        lootTable: {
            "sand": 0.5,
            "fast": 0.2,
            "triangle": 0.08,
            "powder": 0.05,
            "starfish": 0.2,
        },
        rarity: RarityName.rare,
        exp: 15,
    }, {
        idString: "myt_starfish",
        displayName: "Starfish",
        damage: 150,
        health: 7400,
        category: MobCategory.Enemy,
        aggroRadius: 55,
        hitboxRadius: 13,
        speed: 5,
        images: {
            rotation: 1
        },
        skill: {},
        modifiers: {
            healPerSecond: 50
        },
        lootTable: {
            "sand": 1,
            "fast": 1,
            "triangle": 1,
            "powder": 0.5,
            "starfish": 1,
        },
        rarity: RarityName.mythic,
        exp: 500,
        usingAssets: "starfish"
    }
] satisfies MobDefinition[]);
