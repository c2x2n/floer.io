import { Modifiers, PlayerModifiers } from "./typings";

export enum EntityType {
    Player,
    Petal,
    Mob,
    Loot,
    Projectile
}

export const GameConstants = {
    defaultModifiers: (): Modifiers => ({
        healPerSecond: 0,
        speed: 1,
        selfPoison: 0
    }),
    maxPosition: 2048,
    player: {
        maxChatLength: 40,
        radius: 1.2,
        defaultBodyDamage: 25,
        defaultHealth: 125,
        maxSpeed: 3.5,
        defaultName: "Player",
        maxNameLength: 20,
        spawnMaxX: 100,
        spawnMaxY: 50,
        defaultSlot: 10,
        defaultPrepareSlot: 10,
        defaultEquippedPetals: ["basic", "basic", "basic", "basic", "basic"],
        defaultPreparationPetals: [],
        defaultPetalDistance: 3.5,
        defaultPetalAttackingDistance: 6.5,
        defaultPetalDefendingDistance: 1.9,
        overleveledTime: 30,
        defaultModifiers: (): PlayerModifiers => ({
            healing: 1,
            maxHealth: 150,
            healPerSecond: 0.1,
            speed: 1,
            revolutionSpeed: 2.4,
            zoom: 45,
            damageAvoidanceChance: 0,
			damageAvoidanceByDamage: false,
            selfPoison: 0
        }),
    },
    petal: {
        rotationRadius: 0.5
    },
    game: {
        width: 2048,
        height: 120
    },
    loot: {
        radius: 0.5,
        spawnRadius: 3,
        despawnTime: 50
    },
    mob: {
        maxHealth: 100000,
        walkingReload: 2,
        walkingTime: 1
    },
    maxTokenLength: 20
};

export const Zones:
{
    [key: string]: {
        x: number
        width: number
        displayColor: string
        backgroundColor: string
        borderColor: string
        density: number
        levelAtLowest: number
        levelAtHighest: number
        spawning: Record<string, number>
    }
} = {
    "Easy": {
        x: 0,
        width: 600,
        displayColor: "#1da25e",
        backgroundColor: "#1ea761",
        borderColor: "#1b9657",
        levelAtLowest: 0,
        levelAtHighest: 15,
        density: 0.8,
        spawning: {
            "ladybug": 10,
            "rock": 20,
            "boulder": 1,
            "massive_ladybug": 0.1,
            "bee": 10,
            "worker_ant": 10,
            "baby_ant": 5,
            "soldier_ant": 2,
            "centipede": 1
        }
    },
    "Medium": {
        x: 600,
        width: 600,
        displayColor: "#92a728",
        backgroundColor: "#decf7c",
        borderColor: "#c7ba6f",
        density: 0.9,
        levelAtLowest: 15,
        levelAtHighest: 30,
        spawning: {
            "ladybug": 10,
            "shiny_ladybug": 0.1,
            "beetle": 5,
            "cactus": 35,
            "mega_cactus": 5,
            "mega_beetle": 0.1,
            "bee": 10,
            "worker_ant": 5,
            "baby_ant": 5,
            "soldier_ant": 5,
            "passive_bee": 1,
            "centipede": 6,
            "desert_centipede": 6
        }
    },
    "Hard": {
        x: 1200,
        width: 500,
        displayColor: "#923a28",
        backgroundColor: "#b36658",
        borderColor: "#742d2d",
        density: 0.75,
        levelAtLowest: 30,
        levelAtHighest: 45,
        spawning: {
            "ladybug": 10,
            "dark_ladybug": 20,
            "massive_dark_ladybug": 0.01,
            "hornet": 5,
            "leg_hornet": 0.1,
            "mega_hornet": 0.01,
            "spider": 10,
            "mega_spider": 0.01,
            "beetle": 10,
            "mega_beetle": 0.01,
            "mantis": 3,
            "mega_mantis": 0.01,
            "rock": 5,
            "boulder": 20,
            "worker_ant": 7,
            "baby_ant": 7,
            "soldier_ant": 15,
            "passive_bee": 5,
            "centipede": 1,
            "desert_centipede": 1,
            "evil_centipede": 7
        }
    },
    "???": {
        x: 1700,
        width: 2048 - 1700,
        displayColor: "#a4aaa6",
        backgroundColor: "#4d5e55",
        borderColor: "#484646",
        density: 0.825,
        levelAtLowest: 45,
        levelAtHighest: 999,
        spawning: {
            "dark_ladybug": 20,
            "massive_dark_ladybug": 1,
            "hornet": 20,
            "leg_hornet": 10,
            "mega_hornet": 1,
            "spider": 15,
            "mega_spider": 1,
            "beetle": 15,
            "mega_beetle": 1,
            "boulder": 20,
            "worker_ant": 7,
            "baby_ant": 7,
            "soldier_ant": 20,
            "mantis": 7,
            "mega_mantis": 1,
            "passive_bee": 10,
            "centipede": 1,
            "desert_centipede": 1,
            "evil_centipede": 2
        }
    }
}
