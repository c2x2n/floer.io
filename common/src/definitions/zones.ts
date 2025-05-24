export type MobSpawner = Record<string, number>;

export enum ZoneName {
    SpawnZone = "SpawnZone",
    Medium = "Medium",
    Hard = "Hard",
    Nightmare = "Nightmare"
}

export type SpecialSpawn = {
    readonly timer: number | { min: number, max: number }
    readonly spawn: MobSpawner
};

export type ZoneDefinition = {
    readonly displayName: string
    readonly x: number
    readonly y?: number
    readonly width: number
    readonly height?: number
    readonly displayColor: string
    readonly backgroundColor: string
    readonly density: number
    readonly highestLevel: number
    readonly normalSpawning: MobSpawner
    readonly specialSpawning?: SpecialSpawn[]
};

export const Zones: { readonly [K in ZoneName]: ZoneDefinition } = Object.freeze({
    [ZoneName.SpawnZone]: {
        displayName: "Easy",
        x: 0,
        width: 600,
        displayColor: "#1da25e",
        backgroundColor: "#1ea761",
        highestLevel: 15,
        density: 0.825,
        normalSpawning: {
            ladybug: 10,
            rock: 20,
            boulder: 1,
            massive_ladybug: 0.05,
            bee: 10,
            baby_ant: 20,
            soldier_ant: 1,
            centipede: 1
        }
    },
    [ZoneName.Medium]: {
        displayName: "Medium",
        x: 600,
        width: 600,
        displayColor: "#92a728",
        backgroundColor: "#decf7c",
        density: 1.5,
        highestLevel: 30,
        normalSpawning: {
            ladybug: 10,
            shiny_ladybug: 1,
            beetle: 5,
            cactus: 45,
            mega_cactus: 1,
            ant_hole: 0.8,
            bee: 10,
            worker_ant: 5,
            baby_ant: 5,
            soldier_ant: 5,
            centipede: 1,
            desert_centipede: 12
        }
    },
    [ZoneName.Hard]: {
        displayName: "Hard",
        x: 1200,
        width: 800,
        displayColor: "#923a28",
        backgroundColor: "#b36658",
        density: 0.9,
        highestLevel: 45,
        normalSpawning: {
            ladybug: 10,
            dark_ladybug: 20,
            ant_hole: 1,
            hornet: 15,
            spider: 20,
            beetle: 20,
            mantis: 15,
            rock: 5,
            boulder: 15,
            worker_ant: 5,
            baby_ant: 5,
            soldier_ant: 5,
            centipede: 2,
            evil_centipede: 1
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
            dark_ladybug: 30,
            hornet: 25,
            leg_hornet: 0.05,
            leg_beetle: 0.09,
            leg_spider: 0.09,
            leg_mantis: 0.05,
            leg_evil_centipede: 0.005,
            spider: 20,
            beetle: 20,
            boulder: 10,
            worker_ant: 5,
            baby_ant: 5,
            soldier_ant: 5,
            mantis: 22,
            evil_centipede: 2,
            ant_hole: 2
        }
    }
});
