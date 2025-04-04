export enum EntityType {
    Player,
    Petal,
    Mob,
    Loot

}

export const GameConstants = {
    maxPosition: 2048,
    player: {
        radius: 1.5,
        defaultBodyDamage: 20,
        defaultHealth: 150,
        maxHealth: 150,
        maxSpeed: 8,
        defaultName: "Player",
        maxNameLength: 20,
        spawnMaxX: 100,
        spawnMaxY: 50,
        revolutionSpeed: 2,
        defaultSlot: 5,
        defaultEquippedPetals: ["light","stinger","sand","sand","rose"],
        defaultPreparationPetals: ["stinger","stinger","stinger","stinger","rose"]
    },
    petal: {
        rotationRadius: 0.5,
        useReload: 0.9
    },
    game: {
        width: 2048,
        height: 50
    },
    loot: {
        radius: 0.1
    },
    mob: {
        maxHealth: 100000,
        walkingReload: 2,
        walkingTime: 1
    },
    maxTokenLength: 20
};
