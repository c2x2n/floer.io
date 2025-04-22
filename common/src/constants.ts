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
    maxPosition: 4096,
    player: {
        maxChatLength: 40,
        radius: 1.2,
        defaultBodyDamage: 25,
        defaultHealth: 175,
        maxSpeed: 3.5,
        defaultName: "Player",
        maxNameLength: 20,
        spawnMaxX: 100,
        spawnMaxY: 50,
        defaultSlot: 10,
        defaultPrepareSlot: 10,
        defaultEquippedPetals: ["penta", "penta", "penta", "penta", "powder","penta", "penta", "penta", "penta","penta"],
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
            selfPoison: 0,
            yinYangs: 0,
            conditionalHeal: undefined
        }),
    },
    petal: {
        rotationRadius: 0.5
    },
    game: {
        width: 2566,
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
            "baby_ant": 20,
            "soldier_ant": 1,
            "centipede": 1,
        }
    },
    "Medium": {
        x: 600,
        width: 600,
        displayColor: "#92a728",
        backgroundColor: "#decf7c",
        borderColor: "#c7ba6f",
        density: 1.2,
        levelAtLowest: 15,
        levelAtHighest: 30,
        spawning: {
            "ladybug": 10,
            "shiny_ladybug": 1,
            "massive_shiny_ladybug": 0.01,
            "beetle": 5,
            "cactus": 35,
            "mega_cactus": 5,
            "ant_hole": 0.05,
            "bee": 10,
            "worker_ant": 5,
            "baby_ant": 5,
            "soldier_ant": 5,
            "centipede": 1,
            "desert_centipede": 1
        }
    },
    "Hard": {
        x: 1200,
        width: 800,
        displayColor: "#923a28",
        backgroundColor: "#b36658",
        borderColor: "#742d2d",
        density: 0.75,
        levelAtLowest: 30,
        levelAtHighest: 45,
        spawning: {
            "ladybug": 10,
            "dark_ladybug": 20,
            "ant_hole": 1,
            "massive_shiny_ladybug": 0.01,
            "hornet": 15,
            "leg_hornet": 1,
            "spider": 10,
            "beetle": 20,
            "mantis": 3,
            "rock": 5,
            "boulder": 10,
            "worker_ant": 7,
            "baby_ant": 7,
            "soldier_ant": 15,
            "centipede": 0.1,
            "desert_centipede": 0.1,
            "evil_centipede": 1
        }
    },
    "???": {
        x: 2000,
        width: 2566 - 2000,
        displayColor: "#a4aaa6",
        backgroundColor: "#4d5e55",
        borderColor: "#484646",
        density: 0.825,
        levelAtLowest: 45,
        levelAtHighest: 999,
        spawning: {
            "dark_ladybug": 20,
            "massive_dark_ladybug": 0.08,
            "massive_shiny_ladybug": 0.001,
            "hornet": 20,
            "leg_hornet": 5,
            "mega_hornet": 0.099,
            "spider": 15,
            "mega_spider": 0.06,
            "beetle": 20,
            "mega_beetle": 0.088,
            "boulder": 8,
            "myt_worker_ant": 0.04,
            "myt_baby_ant": 0.04,
            "myt_soldier_ant": 0.04,
            "worker_ant": 7,
            "baby_ant": 7,
            "soldier_ant": 15,
            "mantis": 7,
            "mega_mantis": 0.06,
            "passive_bee": 0.08,
            "desert_centipede": 0.05,
            "evil_centipede": 2,
            "myt_evil_centipede": 0.05,
            "ant_hole": 1,
            "myt_ant_hole": 0.01,
            "myt_boulder": 0.04,
        }
    }
}
