export type MobSpawner = Record<string, number>

export enum ZoneName {
    Easy = "Easy",
    Medium = "Medium",
    Hard = "Hard",
    Nightmare = "Nightmare"
}

export type SpecialSpawn = {
    timer: number
    spawn: MobSpawner
}
export type Zone = {
    displayName: string
    x: number
    width: number
    displayColor: string
    backgroundColor: string
    borderColor: string
    density: number
    spawningLevel: number
    highestLevel: number
    normalSpawning: MobSpawner
    specialSpawning?: SpecialSpawn[]
};
export const Zones:
    {
        [K in ZoneName]: Zone
    } = {
    [ZoneName.Easy]: {
        displayName: "Easy",
        x: 0,
        width: 600,
        displayColor: "#1da25e",
        backgroundColor: "#1ea761",
        borderColor: "#1b9657",
        spawningLevel: 0,
        highestLevel: 15,
        density: 0.8,
        normalSpawning: {
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
    [ZoneName.Medium]: {
        displayName: "Medium",
        x: 600,
        width: 600,
        displayColor: "#92a728",
        backgroundColor: "#decf7c",
        borderColor: "#c7ba6f",
        density: 1.2,
        spawningLevel: 15,
        highestLevel: 30,
        normalSpawning: {
            "ladybug": 10,
            "shiny_ladybug": 1,
            "massive_shiny_ladybug": 0.0000001,
            "beetle": 5,
            "cactus": 35,
            "mega_cactus": 5,
            "ant_hole": 0.05,
            "bee": 10,
            "worker_ant": 5,
            "baby_ant": 5,
            "soldier_ant": 5,
            "centipede": 1,
            "desert_centipede": 1,
        }
    },
    [ZoneName.Hard]: {
        displayName: "Hard",
        x: 1200,
        width: 800,
        displayColor: "#923a28",
        backgroundColor: "#b36658",
        borderColor: "#742d2d",
        density: 0.75,
        spawningLevel: 30,
        highestLevel: 45,
        normalSpawning: {
            "ladybug": 10,
            "dark_ladybug": 20,
            "massive_shiny_ladybug": 0.0000001,
            "ant_hole": 1,
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
    [ZoneName.Nightmare]: {
        displayName: "???",
        x: 2000,
        width: 2566 - 2000,
        displayColor: "#a4aaa6",
        backgroundColor: "#4d5e55",
        borderColor: "#484646",
        density: 0.825,
        spawningLevel: 45,
        highestLevel: 999,
        normalSpawning: {
            "dark_ladybug": 20,
            "hornet": 20,
            "leg_hornet": 0.9,
            "spider": 15,
            "beetle": 20,
            "boulder": 8,
            "worker_ant": 7,
            "baby_ant": 7,
            "soldier_ant": 15,
            "mantis": 7,
            "desert_centipede": 0.05,
            "evil_centipede": 2,
            "ant_hole": 1,
        },
        specialSpawning: [
            {
                timer: 1000000 * 60,
                spawn: {
                    "myt_worker_ant": 3,
                    "myt_baby_ant": 3,
                    "myt_soldier_ant": 3,
                    "myt_ant_hole": 0.1,
                    "myt_boulder": 1,
                    "myt_evil_centipede": 0.1,
                    "mega_hornet": 5,
                    "mega_spider": 5,
                    "mega_beetle": 5,
                    "mega_mantis": 5,
                    "passive_bee": 3,
                    "massive_dark_ladybug": 8,
                    "massive_shiny_ladybug": 0.01,
                    "giant_spider": 0.0001,
                }
            }
        ]
    }
}
