import { Definitions, ObjectDefinition } from "./definitions";
import { Projectiles, ProjectileParameters } from "./projectiles";
import { RarityName } from "./rarities";
import { Modifiers } from "../typings/modifier";
import { EntityType } from "../constants";
import { PoisonDataType } from "../typings/effect";

export enum MobCategory {
    Fixed,
    Unactive,
    Enemy,
    Passive
}

export type MobDefinition = ObjectDefinition & {
    readonly damage: number
    readonly health: number
    readonly hitboxRadius: number
    readonly description?: string
    readonly lootTable: Record<string, number>
    readonly rarity: RarityName
    readonly exp: number
    readonly images?: {
        mouth?: boolean
        legs?: boolean
        rotation?: number
        slotDisplaySize?: number
        centerXOffset?: number
        centerYOffset?: number
    }
    readonly movement?: {
        readonly reachingAway?: boolean
        readonly sandstormLike?: boolean
    }
    readonly modifiers?: Partial<Modifiers>
    readonly poison?: PoisonDataType
    readonly hideInformation?: boolean
    readonly despawnTime?: number
    readonly noSpawnMessage?: boolean
    readonly hideInGallery?: boolean
    readonly pop?: Record<string, number[]>
} & MobSegmentType & MobCategoryType & MobShootType;

export type MobCategoryType = {
    readonly category: MobCategory.Fixed
    readonly onGround?: boolean
} | (({
    readonly category: MobCategory.Unactive | MobCategory.Passive
} | {
    readonly category: MobCategory.Enemy
    readonly aggroRadius: number
}) & {
    readonly speed: number
});

export type MobShootType = {
    readonly shootable?: false
} | {
    readonly shootable: true
    readonly shoot: ProjectileParameters
    readonly shootSpeed:
        number | { min: number, max: number }
};

export type MobSegmentType = {
    readonly hasSegments?: false
} | {
    readonly hasSegments?: true
    readonly notCollideWithSegments?: boolean
    readonly sharingHealth?: boolean
    readonly segmentAmount: number
    readonly segmentDefinitionIdString: string
};

export const Mobs = new Definitions<MobDefinition>([
    {
        idString: "ladybug",
        displayName: "Ladybug",
        damage: 10,
        health: 10,
        category: MobCategory.Unactive,
        hitboxRadius: 1.5,
        speed: 0.5,
        lootTable: {
            rose: 0.11,
            fast: 0.5,
            bubble: 0.04,
            twin: 0.1,
            wing: 0.02
        },
        rarity: RarityName.common,
        exp: 1
    },
    {
        idString: "massive_ladybug",
        displayName: "Ladybug",
        damage: 20,
        health: 2500,
        category: MobCategory.Unactive,
        hitboxRadius: 6.2,
        speed: 0.5,
        usingAssets: "ladybug",
        lootTable: {
            rose: 1,
            tri_rose: 1,
            triplet: 0.25,
            epic_rose: 1,
            bubble: 1
        },
        rarity: RarityName.legendary,
        exp: 500
    },
    {
        idString: "massiver_ladybug",
        displayName: "Ladybug",
        damage: 0,
        health: 2000,
        category: MobCategory.Unactive,
        hitboxRadius: 50,
        speed: 0,
        usingAssets: "ladybug",
        lootTable: {
            rose: 1,
            tri_rose: 1,
            triplet: 0.25,
            epic_rose: 1,
            bubble: 1,
            penta: 0.000006,
            myt_tri_rose: 0.000005
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
        hitboxRadius: 50,
        speed: 0.5,
        usingAssets: "ladybug",
        lootTable: {
            rose: 1,
            tri_rose: 1,
            triplet: 0.25,
            epic_rose: 1,
            bubble: 1,
            penta: 0.000006,
            myt_tri_rose: 0.000005
        },
        rarity: RarityName.unique,
        exp: 500
    }, {
        idString: "shiny_ladybug",
        displayName: "Ladybug",
        damage: 10,
        health: 150,
        category: MobCategory.Passive,
        hitboxRadius: 2,
        speed: 0.5,
        lootTable: {
            rose: 1,
            twin: 0.39,
            tri_rose: 0.34,
            bubble: 0.16,
            wing: 0.16,
            epic_rose: 0.005,
            triplet: 0.01
        },
        rarity: RarityName.unusual,
        exp: 10
    }, {
        idString: "dark_ladybug",
        displayName: "Ladybug",
        damage: 10,
        health: 25,
        category: MobCategory.Passive,
        hitboxRadius: 1.8,
        speed: 0.5,
        lootTable: {
            tri_rose: 0.36,
            epic_rose: 0.002,
            yinyang: 0.009,
            bubble: 0.1,
            wing: 0.08,
            triplet: 0.002,
            shell: 0.002
        },
        rarity: RarityName.rare,
        exp: 5
    }, {
        idString: "bee",
        displayName: "Bee",
        damage: 50,
        health: 15,
        category: MobCategory.Unactive,
        description: "It stings. Don't touch it.",
        hitboxRadius: 1,
        speed: 0.5,
        lootTable: {
            fast: 0.12,
            stinger: 0.1,
            twin: 0.08,
            triangle: 0.002,
            bubble: 0.012,
            wing: 0.003,
            honey: 0.07
        },
        rarity: RarityName.common,
        exp: 2
    }, {
        idString: "cactus",
        displayName: "Cactus",
        damage: 35,
        health: 42,
        category: MobCategory.Fixed,
        hitboxRadius: 2,
        lootTable: {
            sand: 0.1,
            stinger: 0.1,
            triangle: 0.001,
            missile: 0.092,
            big_missile: 0.001,
            cactus: 0.06,
            poison_cactus: 0.001,
            tri_cactus: 0.00005
        },
        rarity: RarityName.unusual,
        exp: 2
    }, {
        idString: "mega_cactus",
        displayName: "Cactus",
        damage: 75,
        health: 1500,
        category: MobCategory.Fixed,
        hitboxRadius: 6,
        lootTable: {
            sand: 0.9,
            triangle: 0.07,
            missile: 0.8,
            big_missile: 0.1,
            cactus: 0.9,
            poison_cactus: 0.1,
            tri_cactus: 0.009
        },
        rarity: RarityName.legendary,
        usingAssets: "cactus",
        exp: 20
    }, {
        idString: "rock",
        displayName: "Rock",
        damage: 10,
        health: 16,
        category: MobCategory.Fixed,
        hitboxRadius: 2,
        lootTable: {
            fast: 0.05,
            twin: 0.024,
            rock: 0.005,
            stone: 0.1,
            heavy: 0.25
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
        speed: 0.05,
        hitboxRadius: 1.5,
        images: {
            slotDisplaySize: 70
        },
        lootTable: {
            square: 1
        },
        rarity: RarityName.unique,
        noSpawnMessage: true,
        exp: 2500
    }, {
        idString: "boulder",
        displayName: "Rock",
        damage: 20,
        health: 160,
        category: MobCategory.Fixed,
        hitboxRadius: 4,
        lootTable: {
            fast: 1,
            uranium: 0.00012,
            rock: 0.09,
            heaviest: 0.004,
            stone: 0.5,
            heavy: 0.9
        },
        rarity: RarityName.unusual,
        exp: 20,
        usingAssets: "rock"
    }, {
        idString: "beetle",
        displayName: "Beetle",
        damage: 40,
        health: 60,
        category: MobCategory.Enemy,
        aggroRadius: 10,
        hitboxRadius: 2,
        speed: 0.5,
        images: {
            mouth: true,
            slotDisplaySize: 90,
            centerXOffset: 5,
            centerYOffset: 5
        },
        lootTable: {
            iris: 0.09,
            salt: 0.06,
            triplet: 0.004,
            wing: 0.006,
            pincer: 0.0001
        },
        rarity: RarityName.unusual,
        exp: 5
    }, {
        idString: "leg_beetle",
        displayName: "Beetle",
        damage: 65,
        health: 4500,
        category: MobCategory.Passive,
        hitboxRadius: 5,
        speed: 0.7,
        images: {
            mouth: true,
            slotDisplaySize: 90,
            centerXOffset: 5,
            centerYOffset: 5
        },
        lootTable: {
            iris: 1,
            salt: 0.8,
            triplet: 0.8,
            wing: 0.6,
            powder: 0.03,
            leg_egg: 0.075
        },
        rarity: RarityName.legendary,
        exp: 500,
        usingAssets: "beetle"
    }, {
        idString: "hornet",
        displayName: "Hornet",
        damage: 50,
        health: 50,
        category: MobCategory.Enemy,
        shootable: true,
        shoot: {
            hitboxRadius: 0.6,
            damage: 10,
            health: 10,
            despawnTime: 3,
            speed: 0.7,
            definition: Projectiles.fromString("missile")
        },
        movement: {
            reachingAway: true
        },
        shootSpeed: 1.5,
        aggroRadius: 15,
        hitboxRadius: 2,
        speed: 0.6,
        lootTable: {
            dandelion: 0.14,
            bubble: 0.02,
            missile: 0.18,
            honey: 0.02,
            big_missile: 0.005,
            wing: 0.06,
            antennae: 0.0003
        },
        rarity: RarityName.rare,
        exp: 10
    }, {
        idString: "leg_hornet",
        displayName: "Hornet",
        damage: 105,
        health: 3750,
        category: MobCategory.Passive,
        movement: {
            reachingAway: true
        },
        shootable: true,
        shoot: {
            hitboxRadius: 1.85,
            damage: 25,
            health: 100,
            despawnTime: 3,
            speed: 0.9,
            definition: Projectiles.fromString("missile")
        },
        shootSpeed: 1.25,
        hitboxRadius: 5,
        speed: 0.8,
        lootTable: {
            dandelion: 1,
            bubble: 0.5,
            missile: 1,
            honey: 1,
            big_missile: 0.8,
            faster_wing: 0.025,
            wing: 0.5,
            antennae: 0.09
        },
        rarity: RarityName.legendary,
        exp: 500,
        usingAssets: "hornet"
    }, {
        idString: "mantis",
        displayName: "Mantis",
        damage: 30,
        health: 70,
        category: MobCategory.Enemy,
        movement: {
            reachingAway: true
        },
        shootable: true,
        images: {
            legs: true
        },
        shoot: {
            hitboxRadius: 0.5,
            damage: 10,
            health: 10,
            despawnTime: 3,
            speed: 0.7,
            definition: Projectiles.fromString("peas"),
            effectsOnHit: {
                modifier: {
                    armor: -3
                },
                duration: 5
            }
        },
        shootSpeed: 1.5,
        aggroRadius: 15,
        hitboxRadius: 2,
        speed: 0.5,
        lootTable: {
            peas: 0.1,
            poison_peas: 0.01,
            wing: 0.14
        },
        rarity: RarityName.rare,
        exp: 20,
        usingAssets: "mantis"
    }, {
        idString: "leg_mantis",
        displayName: "Mantis",
        damage: 50,
        health: 3750,
        category: MobCategory.Passive,
        movement: {
            reachingAway: true
        },
        shootable: true,
        shoot: {
            hitboxRadius: 1.25,
            damage: 15,
            health: 120,
            despawnTime: 3,
            speed: 1.2,
            definition: Projectiles.fromString("peas"),
            effectsOnHit: {
                modifier: {
                    armor: -15
                },
                duration: 5
            }
        },
        shootSpeed: 1.3,
        hitboxRadius: 4,
        speed: 0.8,
        lootTable: {
            peas: 1,
            poison_peas: 1,
            leg_poison_peas: 0.075,
            wing: 1
        },
        rarity: RarityName.legendary,
        exp: 500,
        usingAssets: "mantis"
    }, {
        idString: "spider",
        displayName: "Spider",
        damage: 20,
        health: 25,
        category: MobCategory.Enemy,
        aggroRadius: 10,
        hitboxRadius: 1,
        speed: 0.7,
        images: {
            legs: true,
            slotDisplaySize: 50
        },
        lootTable: {
            iris: 0.2,
            stinger: 0.24,
            triangle: 0.0024,
            web: 0.09,
            pincer: 0.001,
            faster: 0.04,
            tri_web: 0.0002
        },
        rarity: RarityName.rare,
        exp: 5
    }, {
        idString: "leg_spider",
        displayName: "Spider",
        damage: 35,
        health: 4000,
        category: MobCategory.Passive,
        hitboxRadius: 3,
        speed: 0.9,
        images: {
            legs: true,
            slotDisplaySize: 50
        },
        lootTable: {
            iris: 0.2,
            stinger: 0.8,
            triangle: 0.25,
            web: 0.9,
            pincer: 0.8,
            faster: 1,
            tri_web: 0.08,
            faster_wing: 0.05
        },
        rarity: RarityName.legendary,
        exp: 500,
        usingAssets: "spider"
    }, {
        idString: "soldier_ant",
        displayName: "Soldier Ant",
        damage: 10,
        health: 40,
        category: MobCategory.Enemy,
        aggroRadius: 10,
        hitboxRadius: 0.8,
        speed: 0.5,
        images: {
            mouth: true,
            slotDisplaySize: 50
        },
        lootTable: {
            sand: 0.09,
            iris: 0.12,
            twin: 0.8,
            wing: 0.05,
            faster: 0.04,
            faster_wing: 0.0001
        },
        rarity: RarityName.unusual,
        exp: 4
    }, {
        idString: "worker_ant",
        displayName: "Worker Ant",
        damage: 10,
        health: 25,
        category: MobCategory.Passive,
        hitboxRadius: 0.8,
        speed: 0.5,
        images: {
            mouth: true,
            slotDisplaySize: 50
        },
        lootTable: {
            sand: 0.06,
            fast: 0.46,
            leaf: 0.28,
            twin: 0.15,
            tri_leaf: 0.00008,
            corn: 0.0006
        },
        rarity: RarityName.unusual,
        exp: 4
    }, {
        idString: "queen_ant",
        displayName: "Queen Ant",
        damage: 20,
        health: 250,
        category: MobCategory.Enemy,
        aggroRadius: 25,
        hitboxRadius: 2,
        images: {
            mouth: true,
            slotDisplaySize: 80
        },
        speed: 0.5,
        lootTable: {
            sand: 0.8,
            fast: 1,
            twin: 1,
            wing: 0.31,
            egg: 0.06,
            triplet: 0.01,
            tri_stinger: 0.006
        },
        rarity: RarityName.epic,
        exp: 4
    }, {
        idString: "ant_hole",
        displayName: "Ant Hole",
        damage: 20,
        health: 300,
        category: MobCategory.Fixed,
        pop: {
            worker_ant: [1, 1, 0.9, 0.9, 0.9, 0.8, 0.8, 0, 0, 0, 0],
            baby_ant: [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.4, 0.25, 0.2, 0.15, 0, 0],
            soldier_ant: [0.95, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.2, 0.15, 0.1, 0.1, 0.1, 0, 0],
            queen_ant: [0.1]
        },
        onGround: true,
        hitboxRadius: 2,
        lootTable: {
            iris: 1,
            wing: 0.5,
            egg: 0.07,
            dice: 0.009
        },
        rarity: RarityName.rare,
        exp: 40
    }, {
        idString: "baby_ant",
        displayName: "Baby Ant",
        damage: 10,
        health: 10,
        category: MobCategory.Unactive,
        hitboxRadius: 0.8,
        speed: 0.5,
        images: {
            mouth: true,
            slotDisplaySize: 50
        },
        lootTable: {
            sand: 0.08,
            fast: 0.44,
            leaf: 0.26,
            twin: 0.18,
            triplet: 0.0006
        },
        rarity: RarityName.unusual,
        exp: 4
    }, {
        idString: "centipede",
        displayName: "Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 0.1,
        hitboxRadius: 1.5,
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            fast: 0.09,
            leaf: 0.05,
            twin: 0.12,
            triplet: 0.0001,
            peas: 0.03,
            poison_peas: 0.0006
        },
        rarity: RarityName.unusual,
        exp: 4,
        hasSegments: true,
        segmentAmount: 10,
        segmentDefinitionIdString: "centipede_body"
    }, {
        idString: "centipede_body",
        displayName: "Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 0.1,
        hitboxRadius: 1.5,
        hideInformation: true,
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            fast: 0.09,
            leaf: 0.05,
            twin: 0.12,
            triplet: 0.0001,
            peas: 0.03,
            poison_peas: 0.0006
        },
        rarity: RarityName.unusual,
        exp: 4,
        hideInGallery: true
    }, {
        idString: "desert_centipede",
        displayName: "Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 0.9,
        hitboxRadius: 1.5,
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            fast: 0.08,
            twin: 0.18,
            triplet: 0.005,
            powder: 0.00001,
            talisman: 0.0056
        },
        rarity: RarityName.unusual,
        exp: 4,
        hasSegments: true,
        segmentAmount: 10,
        segmentDefinitionIdString: "desert_centipede_body"
    }, {
        idString: "desert_centipede_body",
        displayName: "Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Unactive,
        speed: 0.9,
        hitboxRadius: 1.5,
        hideInformation: true,
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            fast: 0.08,
            twin: 0.18,
            triplet: 0.005,
            powder: 0.00001,
            talisman: 0.0056
        },
        rarity: RarityName.unusual,
        exp: 4,
        hideInGallery: true
    }, {
        idString: "evil_centipede",
        displayName: "Evil Centipede",
        damage: 10,
        health: 50,
        category: MobCategory.Enemy,
        aggroRadius: 12,
        speed: 0.5,
        hitboxRadius: 1.5,
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            iris: 0.82,
            peas: 0.58,
            chip: 0.028,
            poison_peas: 0.012,
            leg_poison_peas: 0.001
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
        aggroRadius: 12,
        speed: 0.5,
        hitboxRadius: 1.5,
        hideInformation: true,
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            iris: 0.82,
            peas: 0.58,
            chip: 0.28,
            poison_peas: 0.012,
            leg_poison_peas: 0.001
        },
        rarity: RarityName.rare,
        exp: 4,
        hideInGallery: true
    }, {
        idString: "leg_evil_centipede",
        displayName: "Evil Centipede",
        damage: 20,
        health: 2500,
        category: MobCategory.Enemy,
        aggroRadius: 12,
        speed: 0.7,
        hitboxRadius: 2.2,
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            iris: 1,
            peas: 0.85,
            chip: 0.28,
            poison_peas: 0.8,
            leg_poison_peas: 0.025
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
        health: 2000,
        category: MobCategory.Enemy,
        aggroRadius: 12,
        speed: 0.7,
        hitboxRadius: 2.2,
        hideInformation: true,
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            iris: 0.82,
            peas: 0.5,
            chip: 0.28,
            poison_peas: 0.5,
            leg_poison_peas: 0.02
        },
        rarity: RarityName.legendary,
        exp: 100,
        usingAssets: "evil_centipede_body",
        hideInGallery: true
    }, {
        idString: "mega_mantis",
        displayName: "Mantis",
        damage: 30,
        health: 1500,
        category: MobCategory.Enemy,
        images: {
            legs: true
        },
        movement: {
            reachingAway: true
        },
        shootable: true,
        shoot: {
            hitboxRadius: 2.8,
            damage: 15,
            health: 80,
            despawnTime: 3,
            speed: 12,
            definition: Projectiles.fromString("peas")
        },
        shootSpeed: 1,
        aggroRadius: 15,
        hitboxRadius: 4 * 2 / 0.7,
        speed: 1.2,
        lootTable: {
            peas: 0.24,
            poison_peas: 0.04,
            leg_poison_peas: 0.7,
            wing: 0.12,
            tri_triangle: 0.5,
            tri_wing: 0.004,
            myt_poison_peas: 0.1
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
            reachingAway: true
        },
        shootable: true,
        shoot: {
            hitboxRadius: 5.6,
            damage: 60,
            health: 2300,
            despawnTime: 5,
            speed: 15,
            definition: Projectiles.fromString("peas")
        },
        shootSpeed: 0.5,
        aggroRadius: 45,
        hitboxRadius: 21,
        speed: 1.2,
        lootTable: {},
        rarity: RarityName.ethereal,
        exp: 96000,
        usingAssets: "mantis"
    }, {
        idString: "mega_hornet",
        displayName: "Hornet",
        damage: 125,
        health: 25000,
        category: MobCategory.Enemy,
        movement: {
            reachingAway: true
        },
        shootable: true,
        shoot: {
            hitboxRadius: 3,
            damage: 20,
            health: 100,
            despawnTime: 3,
            speed: 9,
            definition: Projectiles.fromString("missile")
        },
        shootSpeed: 0.9,
        aggroRadius: 30,
        hitboxRadius: 5 / 0.6,
        speed: 1.2,
        lootTable: {
            dandelion: 1,
            bubble: 0.8,
            missile: 0.9,
            big_missile: 0.75,
            myt_big_missile: 0.5,
            wing: 0.3,
            tri_wing: 0.0002,
            myt_egg: 0.35,
            antennae: 0.1,
            myt_antennae: 0.035
        },
        rarity: RarityName.mythic,
        exp: 20000,
        usingAssets: "hornet"
    }, {
        idString: "mega_beetle",
        displayName: "Beetle",
        damage: 90,
        health: 38000,
        category: MobCategory.Enemy,
        aggroRadius: 20,
        hitboxRadius: 8,
        images: {
            mouth: true,
            slotDisplaySize: 90,
            centerXOffset: 5,
            centerYOffset: 5
        },
        speed: 0.9,
        lootTable: {
            iris: 1,
            salt: 0.24,
            triplet: 1,
            wing: 1,
            tri_wing: 0.45,
            powder: 0.5,
            leg_egg: 0.8
        },
        rarity: RarityName.mythic,
        exp: 10000,
        usingAssets: "beetle"
    },
    {
        idString: "giant_roach",
        displayName: "Roach",
        damage: 520,
        health: 225000 * 3,
        category: MobCategory.Passive,
        hitboxRadius: 21,
        speed: 3,
        lootTable: {
        },
        rarity: RarityName.phantasmagoric,
        exp: 232000,
        usingAssets: "roach"
    }, {
        idString: "massive_shiny_ladybug",
        displayName: "Ladybug",
        damage: 10,
        health: 400,
        category: MobCategory.Passive,
        hitboxRadius: 6,
        speed: 0.5,
        lootTable: {
            rose: 1,
            twin: 1,
            tri_rose: 1,
            bubble: 1,
            wing: 1,
            tri_wing: 0.6,
            epic_rose: 0.9,
            triplet: 1,
            penta: 0.5,
            myt_tri_rose: 0.009
        },
        rarity: RarityName.mythic,
        exp: 100000,
        usingAssets: "shiny_ladybug"
    },
    {
        idString: "sshiny",
        displayName: "Ladybug???",
        damage: 1,
        health: 725000,
        category: MobCategory.Passive,
        hitboxRadius: 7,
        speed: 0.5,
        lootTable: {
            fast: 1
        },
        rarity: RarityName.common,
        exp: 5,
        usingAssets: "shiny_ladybug",
        hideInGallery: true
    },
    {
        idString: "massive_dark_ladybug",
        displayName: "Ladybug",
        damage: 20,
        health: 1000,
        category: MobCategory.Passive,
        hitboxRadius: 8,
        speed: 0.5,
        usingAssets: "dark_ladybug",
        lootTable: {
            tri_rose: 0.7,
            epic_rose: 0.1,
            jelly: 0.3,
            bubble: 0.16,
            wing: 0.16,
            yinyang: 0.4,
            triplet: 0.8,
            penta: 0.002,
            myt_tri_rose: 0.45,
            shell: 0.5
        },
        rarity: RarityName.mythic,
        exp: 10000
    }, {
        idString: "mega_spider",
        displayName: "Spider",
        damage: 65,
        health: 25000,
        category: MobCategory.Enemy,
        aggroRadius: 50,
        hitboxRadius: 7,
        shootable: true,
        images: {
            legs: true,
            slotDisplaySize: 50
        },
        shoot: {
            hitboxRadius: 6,
            despawnTime: 5,
            speed: 0,
            definition: Projectiles.fromString("web"),
            effectWhenOn: {
                speed: 0.6
            }
        },
        shootSpeed: 0.5,
        speed: 1.3,
        lootTable: {
            iris: 0.22,
            stinger: 0.36,
            triangle: 0.024,
            tri_triangle: 0.024,
            web: 0.09,
            pincer: 0.09,
            tri_web: 0.4,
            faster: 0.4,
            faster_wing: 0.7,
            myt_tri_web: 0.25,
            tri_faster: 0.5,
            thirdeye: 0.03 / 100
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
        aggroRadius: 17,
        hitboxRadius: 20,
        shootable: true,
        images: {
            legs: true,
            slotDisplaySize: 50
        },
        shoot: {
            hitboxRadius: 6.5,
            despawnTime: 7,
            speed: 0,
            definition: Projectiles.fromString("web"),
            effectWhenOn: {
                speed: 0.6
            }
        },
        shootSpeed: 0.5,
        speed: 1.5,
        lootTable: {
            iris: 0.15,
            stinger: 0.12,
            triangle: 0.08,
            tri_triangle: 0.12,
            tri_stinger: 0.18,
            web: 0.1,
            pincer: 0.3,
            tri_web: 0.4,
            faster: 0.1,
            faster_wing: 0.2,
            pinger: 0.6,
            myt_tri_web: 0.7,
            tri_faster: 0.7,
            thirdeye: 1
        },
        rarity: RarityName.unique,
        exp: 62000,
        usingAssets: "spider"
    }, {
        idString: "myt_soldier_ant",
        displayName: "Soldier Ant",
        damage: 60,
        health: 1800,
        category: MobCategory.Enemy,
        aggroRadius: 20,
        hitboxRadius: 5,
        speed: 0.8,
        images: {
            mouth: true,
            slotDisplaySize: 50
        },
        lootTable: {
            sand: 0.66,
            fast: 0.44,
            iris: 0.12,
            twin: 0.8,
            wing: 0.16,
            tri_wing: 0.012,
            triplet: 0.012,
            faster_wing: 0.4,
            faster: 0.01,
            penta: 0.001,
            tri_faster: 0.1,
            egg: 0.6
        },
        rarity: RarityName.mythic,
        exp: 8000,
        usingAssets: "soldier_ant"
    }, {
        idString: "myt_worker_ant",
        displayName: "Worker Ant",
        damage: 40,
        health: 1000,
        category: MobCategory.Passive,
        hitboxRadius: 5,
        speed: 0.8,
        images: {
            mouth: true,
            slotDisplaySize: 50
        },
        lootTable: {
            sand: 0.66,
            fast: 0.92,
            leaf: 0.56,
            twin: 0.24,
            tri_leaf: 0.04,
            triplet: 0.52,
            penta: 0.005,
            corn: 0.5
        },
        rarity: RarityName.mythic,
        exp: 7000,
        usingAssets: "worker_ant"
    }, {
        idString: "myt_queen_ant",
        displayName: "Queen Ant",
        damage: 60,
        health: 5000,
        category: MobCategory.Enemy,
        hitboxRadius: 10,
        aggroRadius: 22,
        speed: 0.8,
        images: {
            mouth: true,
            slotDisplaySize: 80
        },
        lootTable: {
            twin: 1,
            triplet: 0.2,
            penta: 0.01,
            tri_stinger: 0.9,
            pinger: 0.7
        },
        rarity: RarityName.mythic,
        exp: 15000,
        usingAssets: "queen_ant"
    }, {
        idString: "myt_baby_ant",
        displayName: "Baby Ant",
        damage: 10,
        health: 1000,
        category: MobCategory.Unactive,
        hitboxRadius: 5,
        speed: 0.5,
        images: {
            mouth: true,
            slotDisplaySize: 50
        },
        lootTable: {
            sand: 0.66,
            fast: 0.88,
            leaf: 0.52,
            twin: 0.24,
            tri_leaf: 0.03,
            triplet: 0.12,
            penta: 0.005
        },
        rarity: RarityName.mythic,
        exp: 6000,
        usingAssets: "baby_ant"
    }, {
        idString: "myt_ant_hole",
        displayName: "Ant Hole",
        damage: 20,
        health: 10000,
        category: MobCategory.Fixed,
        pop: {
            worker_ant: [1, 1, 0.9, 0.9, 0.9, 0.8, 0.8, 0, 0, 0, 0],
            baby_ant: [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.4, 0.25, 0.2, 0.15, 0, 0],
            soldier_ant: [0.95, 0.9, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.2, 0.15, 0.1, 0.1, 0.1, 0, 0],
            myt_worker_ant: [1, 0.9, 0.8, 0, 0],
            myt_baby_ant: [1, 0.9, 0.7, 0.4, 0.2, 0.15, 0],
            myt_soldier_ant: [0.9, 0.8, 0.6, 0.45, 0.3, 0.15, 0.1, 0.1, 0, 0],
            myt_queen_ant: [0.1]
        },
        onGround: true,
        hitboxRadius: 10,
        lootTable: {
            sand: 0.66,
            fast: 0.92,
            leaf: 0.56,
            twin: 0.24,
            tri_leaf: 0.4,
            triplet: 0.0012,
            penta: 1,
            corn: 0.002
        },
        rarity: RarityName.mythic,
        exp: 25000,
        usingAssets: "ant_hole"
    }, {
        idString: "bee_hive",
        displayName: "Bee Hive",
        damage: 20,
        health: 10000,
        category: MobCategory.Fixed,
        pop: {
            bee: [1, 1, 0.95, 0.9, 0.9, 0.9, 0.9, 0.9, 0.8, 0.8, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.2, 0.15, 0.1, 0.1, 0.1, 0, 0, 0, 0, 0, 0],
            hornet: [1, 0.95, 0.9, 0.8, 0.7, 0.55, 0.4, 0.25, 0.2, 0.15, 0, 0, 1, 0.9, 0.7, 0.4, 0.2, 0.15, 0, 1, 0.9, 0.8, 0, 0],
            leg_hornet: [0.9, 0.8, 0.6, 0.45, 0.3, 0.15, 0.1, 0.1, 0, 0]
        },
        onGround: true,
        hitboxRadius: 10,
        lootTable: {
            sand: 0.66,
            fast: 0.92,
            leaf: 0.56,
            twin: 0.24
        },
        rarity: RarityName.legendary,
        exp: 1,
        hideInGallery: true
    }, {
        idString: "passive_bee",
        displayName: "Bee",
        damage: 100,
        health: 1000,
        category: MobCategory.Passive,
        hitboxRadius: 8,
        speed: 1.4,
        lootTable: {
            stinger: 0.9,
            bubble: 0.48,
            wing: 0.24,
            pinger: 0.24,
            tri_triangle: 0.17,
            pollen: 0.22,
            myt_pollen: 0.11,
            honey: 1
        },
        rarity: RarityName.mythic,
        exp: 10000,
        usingAssets: "bee"
    }, {
        idString: "myt_evil_centipede",
        displayName: "Devourer of Peas",
        damage: 50,
        health: 32500,
        category: MobCategory.Enemy,
        aggroRadius: 50,
        speed: 0.5,
        hitboxRadius: 3,
        shootable: true,
        shoot: {
            definition: Projectiles.fromString("red_peas"),
            health: 20,
            damage: 0,
            despawnTime: 2,
            hitboxRadius: 1,
            speed: 0.5,
            accelerationF: 150,
            spawner: {
                amount: 4,
                type: EntityType.Projectile,
                spawn: {
                    definition: Projectiles.fromString("poison_peas"),
                    health: 100,
                    damage: 10,
                    despawnTime: 3,
                    speed: 15,
                    poison: {
                        duration: 2,
                        damagePerSecond: 10
                    },
                    hitboxRadius: 0.5
                }
            }
        },
        shootSpeed: { min: 3, max: 6 },
        images: {
            slotDisplaySize: 80
        },
        lootTable: {
            iris: 1,
            peas: 0.2,
            chip: 0.8,
            poison_peas: 0.9,
            leg_poison_peas: 1,
            myt_poison_peas: 1
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
        speed: 0.5,
        hitboxRadius: 3,
        hideInformation: true,
        shootable: true,
        shoot: {
            definition: Projectiles.fromString("red_peas"),
            health: 20,
            damage: 0,
            despawnTime: 2,
            hitboxRadius: 1,
            speed: 0.5,
            accelerationF: 150,
            spawner: {
                amount: 4,
                type: EntityType.Projectile,
                spawn: {
                    definition: Projectiles.fromString("poison_peas"),
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
            slotDisplaySize: 80
        },
        lootTable: {
            iris: 0.82,
            peas: 0.028,
            chip: 0.028,
            poison_peas: 0.9,
            leg_poison_peas: 0.15
        },
        rarity: RarityName.mythic,
        exp: 1000,
        usingAssets: "evil_centipede_body",
        hideInGallery: true
    }, {
        idString: "myt_boulder",
        displayName: "Boulder",
        damage: 40,
        health: 10000,
        category: MobCategory.Fixed,
        hitboxRadius: 8,
        lootTable: {
            fast: 1,
            twin: 1,
            triplet: 0.4,
            uranium: 0.5,
            heaviest: 1
        },
        rarity: RarityName.mythic,
        exp: 10000,
        usingAssets: "rock"
    }, {
        idString: "sandstorm",
        displayName: "Sandstorm",
        damage: 40,
        health: 140,
        category: MobCategory.Unactive,
        hitboxRadius: 5,
        speed: 2,
        movement: {
            sandstormLike: true
        },
        lootTable: {
            sand: 0.5,
            fast: 0.2,
            triangle: 0.08,
            powder: 0.05,
            talisman: 0.01,
            stick: 0.001
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
        speed: 0.9,
        images: {
            rotation: 1
        },
        modifiers: {
            healPerSecond: 10
        },
        lootTable: {
            sand: 0.5,
            fast: 0.2,
            triangle: 0.08,
            powder: 0.05,
            starfish: 0.2
        },
        rarity: RarityName.rare,
        exp: 15
    }, {
        idString: "digger",
        displayName: "Digger",
        damage: 40,
        health: 1800,
        category: MobCategory.Enemy,
        aggroRadius: 25,
        hitboxRadius: 7.5,
        speed: 0.5,
        description: "Wrong game, bud.",
        images: {
            slotDisplaySize: 85
        },
        lootTable: {
            uranium: 0.04,
            cutter: 0.6,
            smasher: 0.4,
            disc: 0.4
        },
        rarity: RarityName.legendary,
        exp: 1000
    }
] satisfies MobDefinition[]);
