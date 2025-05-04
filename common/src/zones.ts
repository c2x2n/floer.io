export type MobSpawner = Record<string, number>

export enum ZoneName {
    SpawnZone = "SpawnZone",
    Medium = "Medium",
    // Cactus = "Cactus",
    Hard = "Hard",
    // Harder = "Harder",
    Nightmare = "Nightmare",
    // Dungeon = "Dungeon",
    // Abyss = "Abyss"
}

export type SpecialSpawn = {
    timer: number | { min: number, max: number }
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
        x: 0,
        width: 600,
        displayColor: "#1da25e",
        backgroundColor: "#1ea761",
        highestLevel: 15,
        density: 0.825,
        normalSpawning: {
            "ladybug": 10,
            "rock": 20,
            "boulder": 1,
            "massive_ladybug": 0.05,
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
        density: 1.25,
        highestLevel: 30,
        normalSpawning: {
            "ladybug": 10,
            "shiny_ladybug": 1,
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
        density: 0.85,
        highestLevel: 45,
        normalSpawning: {
            "ladybug": 10,
            "dark_ladybug": 20,
            "ant_hole": 1,
            "hornet": 15,
            "spider": 10,
            "beetle": 20,
            "mantis": 3,
            "rock": 5,
            "boulder": 15,
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
        density: 0.875,
        highestLevel: 999,
        normalSpawning: {
            "dark_ladybug": 30,
            "hornet": 20,
            "leg_hornet": 0.08,
            "leg_beetle": 0.1,
            "leg_spider": 0.1,
            "leg_mantis": 0.08,
            "leg_evil_centipede": 0.01,
            "spider": 15,
            "beetle": 20,
            "boulder": 10,
            "worker_ant": 7,
            "baby_ant": 7,
            "soldier_ant": 15,
            "mantis": 7,
            "evil_centipede": 2,
            "ant_hole": 1,
        },
        specialSpawning: [
            // {
            //     timer: 1000000 * 60,
            //     spawn: {
            //         "myt_worker_ant": 3,
            //         "myt_baby_ant": 3,
            //         "myt_soldier_ant": 3,
            //         "myt_ant_hole": 0.1,
            //         "myt_boulder": 1,
            //         "myt_evil_centipede": 0.1,
            //         "mega_hornet": 5,
            //         "mega_spider": 5,
            //         "mega_beetle": 5,
            //         "mega_mantis": 5,
            //         "passive_bee": 3,
            //         "massive_dark_ladybug": 8,
            //         "massive_shiny_ladybug": 0.01,
            //         "giant_spider": 0.0001,
            //     }
            // }
            {
                timer: { min: 30 * 60, max: 45 * 60 },
                spawn: {
                    "myt_evil_centipede": 0.1
                }
            }
        ]
    }
}

// export const Zones:
//     {
//         [K in ZoneName]: ZoneData
//     } = {
//     [ZoneName.SpawnZone]: {
//         displayName: "Easy",
//         x: 1000,
//         y: 0,
//         width: 600,
//         height: 200,
//         displayColor: "#1da25e",
//         backgroundColor: "#1ea761",
//         highestLevel: 15,
//         density: 0.8,
//         normalSpawning: {
//             "ladybug": 10,
//             "rock": 20,
//             "boulder": 1,
//             "massive_ladybug": 0.1,
//             "bee": 10,
//             "baby_ant": 20,
//             "soldier_ant": 1,
//             "centipede": 1,
//         }
//     },
//     [ZoneName.Medium]: {
//         displayName: "Medium",
//         x: 1600,
//         y: 0,
//         width: 500,
//         height: 200,
//         displayColor: "#92a728",
//         backgroundColor: "#decf7c",
//         density: 1,
//         highestLevel: 30,
//         normalSpawning: {
//             "ladybug": 10,
//             "shiny_ladybug": 0.5,
//             "massive_shiny_ladybug": 0.0000001,
//             "beetle": 5,
//             "cactus": 35,
//             "mega_cactus": 5,
//             "ant_hole": 0.05,
//             "bee": 10,
//             "worker_ant": 5,
//             "baby_ant": 5,
//             "soldier_ant": 5,
//             "centipede": 1,
//             "desert_centipede": 1,
//             "sandstorm": 5
//         }
//     },
//     [ZoneName.Cactus]: {
//         displayName: "Cacti",
//         x: 600,
//         y: 0,
//         width: 400,
//         height: 200,
//         displayColor: "#bfb295",
//         backgroundColor: "#eddfbf",
//         density: 0.5,
//         highestLevel: 30,
//         normalSpawning: {
//             "shiny_ladybug": 0.1,
//             "cactus": 35,
//             "mega_cactus": 5,
//             "soldier_ant": 5,
//             "desert_centipede": 1,
//             "sandstorm": 1
//         }
//     },
//     [ZoneName.Harder]: {
//         displayName: "Harder",
//         x: 2100,
//         y: 0,
//         width: 500,
//         height: 200,
//         displayColor: "#923a28",
//         backgroundColor: "#b36658",
//         density: 0.6,
//         highestLevel: 45,
//         normalSpawning: {
//             "hornet": 15,
//             "leg_hornet": 2,
//             "spider": 10,
//             "beetle": 20,
//             "boulder": 40,
//             "leg_evil_centipede": 1
//         }
//     },
//     [ZoneName.Dungeon]: {
//         displayName: "Dungeon",
//         x: 200,
//         y: 200,
//         width: 2400,
//         height: 200,
//         displayColor: "#a4aaa6",
//         backgroundColor: "#4d5e55",
//         density: 0.825,
//         highestLevel: 999,
//         normalSpawning: {
//             "dark_ladybug": 20,
//             "hornet": 20,
//             "leg_hornet": 0.9,
//             "spider": 15,
//             "beetle": 20,
//             "worker_ant": 7,
//             "baby_ant": 7,
//             "soldier_ant": 15,
//             "mantis": 7,
//             "desert_centipede": 0.05,
//             "evil_centipede": 2,
//             "ant_hole": 1,
//             "leg_evil_centipede": 1
//         },
//         specialSpawning: [
//             {
//                 timer: 60000 * 60,
//                 spawn: {
//                     "myt_worker_ant": 3,
//                     "myt_baby_ant": 3,
//                     "myt_soldier_ant": 3,
//                     "myt_ant_hole": 0.1,
//                     "myt_boulder": 1,
//                     "myt_evil_centipede": 0.1,
//                     "mega_hornet": 5,
//                     "mega_spider": 5,
//                     "mega_beetle": 5,
//                     "mega_mantis": 5,
//                     "passive_bee": 3,
//                     "massive_dark_ladybug": 8,
//                     "massive_shiny_ladybug": 0.01,
//                     "giant_spider": 0.0001,
//                 }
//             }
//         ]
//     },
//     [ZoneName.Hard]: {
//         displayName: "Hard",
//         x: 200,
//         y: 0,
//         width: 400,
//         height: 200,
//         displayColor: "#923a28",
//         backgroundColor: "#b36658",
//         density: 0.75,
//         highestLevel: 45,
//         normalSpawning: {
//             "ladybug": 10,
//             "dark_ladybug": 20,
//             "massive_shiny_ladybug": 0.0000001,
//             "ant_hole": 1,
//             "hornet": 15,
//             "leg_hornet": 1,
//             "spider": 10,
//             "beetle": 20,
//             "mantis": 3,
//             "rock": 5,
//             "boulder": 10,
//             "worker_ant": 7,
//             "baby_ant": 7,
//             "soldier_ant": 15,
//             "centipede": 0.1,
//             "desert_centipede": 0.1,
//             "evil_centipede": 1
//         }
//     },
//     [ZoneName.Nightmare]: {
//         displayName: "!!!",
//         x: 0,
//         width: 200,
//         displayColor: "#b02424",
//         backgroundColor: "#943434",
//         density: 0.825,
//         highestLevel: 999,
//         normalSpawning: {
//             "dark_ladybug": 20,
//             "hornet": 20,
//             "leg_hornet": 0.9,
//             "spider": 15,
//             "beetle": 20,
//             "boulder": 8,
//             "worker_ant": 7,
//             "baby_ant": 7,
//             "soldier_ant": 15,
//             "mantis": 7,
//             "desert_centipede": 0.05,
//             "evil_centipede": 2,
//             "ant_hole": 1,
//         },
//         specialSpawning: [
//             {
//                 timer: 1000000 * 60,
//                 spawn: {
//                     "myt_worker_ant": 3,
//                     "myt_baby_ant": 3,
//                     "myt_soldier_ant": 3,
//                     "myt_ant_hole": 0.1,
//                     "myt_boulder": 1,
//                     "myt_evil_centipede": 0.1,
//                     "mega_hornet": 5,
//                     "mega_spider": 5,
//                     "mega_beetle": 5,
//                     "mega_mantis": 5,
//                     "passive_bee": 3,
//                     "massive_dark_ladybug": 8,
//                     "massive_shiny_ladybug": 0.01,
//                     "giant_spider": 0.0001,
//                 }
//             }
//         ]
//     },
//     [ZoneName.Abyss]: {
//         displayName: `αBYsS`,
//         x: 2600,
//         width: 400,
//         displayColor: "#5785ba",
//         backgroundColor: "#5785ba",
//         density: 0.4,
//         highestLevel: 999,
//         normalSpawning: {
//             "starfish": 20,
//             "hornet": 20,
//             "leg_hornet": 0.9,
//             "spider": 15,
//             "beetle": 20,
//             "boulder": 8,
//             "worker_ant": 7,
//             "baby_ant": 7,
//             "soldier_ant": 15,
//             "mantis": 7,
//             "desert_centipede": 0.05,
//             "evil_centipede": 2,
//             "ant_hole": 1,
//         },
//         specialSpawning: [
//             {
//                 timer: 30 * 60,
//                 spawn: {
//                     "myt_starfish": 3,
//                 }
//             }
//         ]
//     }
// }

export interface Wall{
    x: number
    y: number
    width: number
    height: number
}

export const Walls: Wall[] = [
    // {
    //     x: 190,
    //     y: 170,
    //     width: 20,
    //     height: 250
    // },
    // {
    //     x: 2590,
    //     y: 170,
    //     width: 20,
    //     height: 250
    // },{
    //     x: 250,
    //     y: 200,
    //     width: 2300,
    //     height: 20
    // }
]
