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
        defaultSlot: 5,
        defaultPrepareSlot: 10,
        defaultEquippedPetals: ["basic","basic","basic","basic","basic"],
        mutateDefaultPetals: {
            equippedPetals: ["yggdrasil","basic","basic","basic","basic"],
            chance: 1 / 1000,
        },
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
            extraDistance: 0,
            damageAvoidanceChance: 0,
            damageAvoidanceByDamage: false,
            selfPoison: 0,
            yinYangs: 0,
            conditionalHeal: undefined,
            controlRotation: false,
            extraSlot: 0
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
        radius: 0.6,
        spawnRadius: 3,
        despawnTime: [30,30,30,50,90,120,180,1] // super is 1 so that if accidentally dev super petals are dropped, noone can pick it
    },
    mob: {
        maxHealth: 100000,
        walkingReload: 2,
        walkingTime: 1
    },
    maxTokenLength: 20
};

