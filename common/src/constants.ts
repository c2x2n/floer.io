import { Modifiers, PlayerModifiers } from "./typings/modifier";

export enum EntityType {
    Player,
    Petal,
    Mob,
    Loot,
    Projectile,
    Wall
}

export enum ActionType {
    SwitchPetal,
    DeletePetal,
    TransformLoadout,
    Left
}

export enum PlayerState {
    Attacking,
    Defending,
    Danded,
    Poisoned,
    Debuffed,
    Normal
}

export const GameConstants = Object.freeze({
    protocolVersion: 1,
    defaultModifiers: (): Modifiers => ({
        healPerSecond: 0,
        speed: 1,
        healing: 1,
        damageReceiveChance: 1,
        damageReflection: 0,
        armor: 0
    }),
    maxPosition: 4096,
    player: {
        maxChatLength: 80,
        radius: 1.2,
        defaultBodyDamage: 25,
        maxSpeed: 0.5,
        defaultName: "Player",
        maxNameLength: 20,
        defaultSlot: 10,
        defaultPrepareSlot: 10,
        defaultEquippedPetals: ["basic", "basic", "basic", "basic", "basic"],
        mutateDefaultPetals: {
            equippedPetals: ["yggdrasil", "basic", "basic", "basic", "basic"],
            chance: 1 / 1000
        },
        defaultPreparationPetals: [],
        defaultPetalDistance: 3.5,
        defaultPetalAttackingDistance: 6.5,
        defaultPetalDefendingDistance: 1.9,
        overleveledTime: 30,
        defaultModifiers: (): PlayerModifiers => ({
            ...GameConstants.defaultModifiers(), // load from defaults
            maxHealth: 100,
            maxHealthScale: 1,
            revolutionSpeed: 2.4,
            revolutionSpeedScale: 1,
            zoom: 45,
            zoomScale: 1,
            extraDistance: 0,
            damageAvoidanceByDamage: false,
            yinYangAmount: 0,
            controlRotation: false,
            extraSlot: 0,
            bodyDamage: 1,
            knockbackReduction: 0,
            bodyDamageReduction: 0,
            petalHealthScale: 1,
            leadMissiles: false,
            aggroRange: 1,
            cursed: false,
            petalReloadTime: 1,
            shocked: false,
            bodyPoison: {
                damagePerSecond: 0,
                duration: 0
            }
        })
    },
    petal: {
        rotationRadius: 0.5
    },
    game: {
        width: 2566,
        height: 300
    },
    loot: {
        radius: 0.6,
        spawnRadius: 3,
        despawnTime: [30, 30, 30, 50, 90, 120, 180, 0.5, 0.5, 0.5] // super is 1 so that if accidentally dev super petals are dropped, noone can pick it
    },
    mob: {
        maxHealth: 10000000,
        walkingReload: 2,
        walkingTime: 1
    },
    maxTokenLength: 20
});
