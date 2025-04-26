export type MobSpawner = Record<string, number>

export enum ZoneName {
    SpawnZone = "SpawnZone",
    Ladies = "Ladies",
    Medium = "Medium",
    Cactus = "Cactus",
    Hard = "Hard",
    Harder = "Harder",
    Nightmare = "Nightmare",
    Nightmarer = "Nightmarer",
    Abyss = "Abyss"
}

export type SpecialSpawn = {
    timer: number
    spawn: MobSpawner
}

export type ZoneData = {
    displayName: string
    x: number
    y?: number
    width: number
    height?: number
    displayColor: string
    backgroundColor: string
    borderColor: string
    density: number
    highestLevel: number
    normalSpawning: MobSpawner
    specialSpawning?: SpecialSpawn[]
};

export const Zones:
    {
        [K in ZoneName]: ZoneData
    } = {
    [ZoneName.SpawnZone]: {
        displayName: "Easy",
        x: 1000,
        y: 0,
        width: 600,
        height: 300,
        displayColor: "#1da25e",
        backgroundColor: "#1ea761",
        borderColor: "#1b9657",
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
    [ZoneName.Ladies]: {
        displayName: "Ladies",
        x: 0,
        y: 0,
        width: 600,
        height: 400,
        displayColor: "#1da25e",
        backgroundColor: "#1ea761",
        borderColor: "#1b9657",
        highestLevel: 15,
        density: 0.2,
        normalSpawning: {
            "ladybug": 10,
            "rock": 20,
            "massive_ladybug": 0.1,
        }
    },
    [ZoneName.Medium]: {
        displayName: "Medium",
        x: 1000,
        y: 300,
        width: 500,
        height: 866 - 300,
        displayColor: "#92a728",
        backgroundColor: "#decf7c",
        borderColor: "#c7ba6f",
        density: 1.2,
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
    [ZoneName.Cactus]: {
        displayName: "Cacti",
        x: 600,
        y: 0,
        width: 400,
        height: 866,
        displayColor: "#bfb295",
        backgroundColor: "#eddfbf",
        borderColor: "#7c7563",
        density: 0.5,
        highestLevel: 30,
        normalSpawning: {
            "shiny_ladybug": 1,
            "massive_shiny_ladybug": 0.0000001,
            "cactus": 35,
            "mega_cactus": 5,
            "soldier_ant": 5,
            "desert_centipede": 1,
        }
    },
    [ZoneName.Harder]: {
        displayName: "Harder",
        x: 0,
        y: 400,
        width: 600,
        height: 666 - 400,
        displayColor: "#923a28",
        backgroundColor: "#b36658",
        borderColor: "#742d2d",
        density: 0.4,
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
    [ZoneName.Nightmarer]: {
        displayName: "!!!",
        x: 0,
        y: 666,
        width: 600,
        height: 866 - 666,
        displayColor: "#a4aaa6",
        backgroundColor: "#4d5e55",
        borderColor: "#484646",
        density: 0.825,
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
                timer: 60000 * 60,
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
    },
    [ZoneName.Hard]: {
        displayName: "Hard",
        x: 1600,
        y: 0,
        width: 400,
        height: 300,
        displayColor: "#923a28",
        backgroundColor: "#b36658",
        borderColor: "#742d2d",
        density: 0.75,
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
    },
    [ZoneName.Abyss]: {
        displayName: `αBYsS`,
        x: 1500,
        y: 300,
        width: 500,
        height: 866 - 300,
        displayColor: "#5785ba",
        backgroundColor: "#5785ba",
        borderColor: "#466c97",
        density: 0.825,
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
