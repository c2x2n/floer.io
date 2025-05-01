import { Definitions, ObjectDefinition } from "../utils/definitions";
import { AttributeName } from "./attribute";
import { Rarity, RarityName } from "./rarity";
import { PlayerModifiers } from "../typings";
import { Projectile, ProjectileDefinition, ProjectileParameters } from "./projectile";
import { MobDefinition, Mobs } from "./mob";
import { MobCategory } from "./mob";
import { EntityType } from "../constants";

export type SavedPetalDefinitionData = PetalDefinition | null

export type PetalDefinition = ObjectDefinition & {
    readonly description?: string
    readonly rarity: RarityName
    readonly attributes?: AttributeParameters
    readonly modifiers?: Partial<PlayerModifiers>
    readonly undroppable?: boolean
    readonly unstackable?: boolean
    readonly hitboxRadius: number
    readonly effectiveFirstReload?: boolean;
    readonly noAnnouncement?: boolean;
    readonly doesNotDamage?: EntityType[]
    readonly images?: {
        readonly slotDisplaySize?: number
        readonly slotRotation?: number
        readonly slotRevolution?: number
        readonly selfGameRotation?: number
        readonly centerXOffset?: number
        readonly centerYOffset?: number
        readonly facingOut?: boolean
        readonly fontSizeMultiplier?: number
        readonly equipmentStyles?: {
            readonly noRender: boolean
            readonly thirdEye?: boolean
            readonly coordsToOwner?: {
                x: number
                y: number
                scale?: number
                rotation?: number
                zIndex?: number
            }
        }
    }
} & PetalEquipmentType;

type PetalEquipmentType = ({
    readonly equipment?: false
    readonly damage?: number
    readonly health?: number
    readonly reloadTime?: number
    readonly extendable: boolean
    readonly moreExtendDistance?: number
    readonly swinging?: {
        time: number
        distance: number
    }
} & PetalPieceType & PetalUsageType) | {
    readonly equipment: true
}

type PetalPieceType = {
    readonly isDuplicate: false
    readonly pieceAmount: 1
} | {
    readonly isDuplicate: true
    // Only allowed to use duplicateDisplay when have more than one
    readonly pieceAmount: number
    readonly isShowedInOne: boolean
    readonly distanceToCenter?: number
};

type PetalUsageType = {
    readonly usable: false
} | {
    readonly usable: true
    readonly useTime: number
}

export type AttributeParameters = {
    [K in AttributeName] ?: unknown
} & ({
    absorbing_heal?: number
    absorbing_shield?: number
    boost?: number,
    poison?: {
        damagePerSecond: number
        duration: number
    }
    healing_debuff?: {
        healing: number
        duration: number
    }
    body_poison?: {
        damagePerSecond: number
        duration: number
    }
    damage_reflection?: number
    self_damage?: number
    shoot?: ProjectileParameters
    peas_shoot?: ProjectileParameters
    place_projectile?: ProjectileParameters
    spawner?: MobDefinition
    critical_hit?: {
        chance: number
        multiplier: number
    }
    health_percent_damage?: {
        percent: number
        maxDamage?: number
    }
    damage_avoidance?: {
        chance: number
    }
    paralyze?: {
        duration: number
        speedReduction: number
        revolutionReduction?: number
    }
    area_poison?: {
        radius: number
        damagePerSecond: number
        tickInterval?: number
    }
    damage_heal?: {
        healPercent: number
        maximumHeal?: number // meaningless, because now it uses petal.damage to calculate not damage dealt
    }
    armor?: number
    lightning?: {
        attenuation: number
        range: number
        bounces: number
    }
    damage_reduction_percent?: number
})

export function getDisplayedPieces(petal: PetalDefinition): number {
    if (petal.equipment) return 0;
    if (petal.isDuplicate && petal.isShowedInOne) return 1;
    return petal.pieceAmount;
}

export let Petals = new Definitions<PetalDefinition>([
    {
        idString: "fast",
        displayName: "Fast",
        description: "Weaker than most petals, but recharges very quickly",
        damage: 8,
        health: 5,
        extendable: true,
        reloadTime: 0.5,
        usable: false,
        hitboxRadius: 0.345,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.common,
        usingAssets: "light",
        modifiers: {
            speed: 1.008
        },
    },
    {
        idString: "twin",
        displayName: "Twin",
        description: "Why stop at one? Why not TWO?!",
        damage: 8,
        health: 5,
        extendable: true,
        reloadTime: 0.5,
        usable: false,
        hitboxRadius: 0.345,
        isDuplicate: true,
        pieceAmount: 2,
        isShowedInOne: false,
        rarity: RarityName.unusual,
        usingAssets: "light",
        modifiers: {
            speed: 1.008
        },
    },
    {
        idString: "penta",
        displayName: "Penta",
        description: "FIVE.",
        damage: 18,
        health: 9,
        extendable: true,
        reloadTime: 0.5,
        usable: false,
        hitboxRadius: 0.345,
        isDuplicate: true,
        pieceAmount: 5,
        isShowedInOne: false,
        rarity: RarityName.mythic,
        usingAssets: "light",
        modifiers: {
            speed: 1.02
        },
    },
    {
        idString: "wing",
        displayName: "Wing",
        description: "It comes and goes.",
        damage: 20,
        health: 20,
        swinging: {
            time: 1,
            distance: 2.6
        },
        images:{
            slotDisplaySize: 45,
            selfGameRotation: 2
        },
        extendable: true,
        reloadTime: 1.25,
        usable: false,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "tri_wing",
        displayName: "Wing",
        description: "They come and go.",
        damage: 32,
        health: 20,
        swinging: {
            time: 1,
            distance: 2.6
        },
        images:{
            slotDisplaySize: 45,
            selfGameRotation: 2
        },
        extendable: true,
        reloadTime: 1.25,
        usable: false,
        hitboxRadius: 0.5,
        isDuplicate: true,
        pieceAmount: 3,
        isShowedInOne: false,
        rarity: RarityName.mythic,
        usingAssets: "wing"
    },
    {
        idString: "triplet",
        displayName: "Triplet",
        description: "How about THREE?!",
        damage: 8,
        health: 5,
        extendable: true,
        reloadTime: 0.5,
        usable: false,
        hitboxRadius: 0.345,
        isDuplicate: true,
        pieceAmount: 3,
        isShowedInOne: false,
        rarity: RarityName.epic,
        usingAssets: "light",
        modifiers: {
            speed: 1.008
        },
    },{
        idString: "faster",
        displayName: "Faster",
        description: "Quickly.",
        damage: 8,
        health: 5,
        extendable: true,
        reloadTime: 0.5,
        modifiers: {
            revolutionSpeed: 1.0
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },{
        idString: "faster_wing",
        displayName: "Wing",
        description: "It comes and goes quickly.",
        damage: 20,
        health: 20,
        swinging: {
            time: 0.5,
            distance: 2.6
        },
        extendable: true,
        reloadTime: 1.25,
        moreExtendDistance: 2.6,
        images:{
            slotDisplaySize: 45,
            selfGameRotation: 2
        },
        modifiers: {
            revolutionSpeed: 1.2
        },
        usable: false,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.legendary,
    },{
        idString: "tri_faster",
        displayName: "Faster",
        description: "Quickly.",
        damage: 15,
        health: 15,
        extendable: true,
        reloadTime: 0.5,
        modifiers: {
            revolutionSpeed: 1.0
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        pieceAmount: 3,
        isShowedInOne: true,
        rarity: RarityName.mythic,
        usingAssets: "faster"
    },
    {
        idString: "leaf",
        displayName: "Leaf",
        description: "Gathers energy from the sun to heal your flower passively",
        damage: 10,
        health: 10,
        extendable: true,
        images: {
            slotDisplaySize: 52,
            slotRotation: -0.1
        },
        modifiers: {
            healPerSecond: 1
        },
        reloadTime: 1,
        usable: false,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unusual,
    },{
        idString: "tri_leaf",
        displayName: "Leaf",
        description: "Gathers energy from the sun to heal your flower passively",
        damage: 10,
        health: 10,
        extendable: true,
        images: {
            slotDisplaySize: 40,
            slotRotation: -0.1
        },
        modifiers: {
            healPerSecond: 1
        },
        reloadTime: 1,
        usable: false,
        hitboxRadius: 0.6,
        isDuplicate: true,
        isShowedInOne: false,
        pieceAmount: 3,
        rarity: RarityName.legendary,
        usingAssets: "leaf"
    },
    {
        idString: "stinger",
        displayName: "Stinger",
        description: "It really hurts, but it's very fragile",
        damage: 35,
        health: 8,
        extendable: true,
        reloadTime: 3.5,
        images: {
            selfGameRotation: 0.1,
            slotDisplaySize: 25,
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unusual
    },
    {
        idString: "blood_stinger",
        displayName: "Stinger",
        description: "It hurts so much that it also damages you when broken. Very fragile.",
        damage: 50,
        health: 8,
        extendable: true,
        reloadTime: 4,
        attributes: {
            self_damage: 9
        },
        images: {
            selfGameRotation: 0.1,
            slotDisplaySize: 25,
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "dev_stinger",
        displayName: "Stinger",
        description: "I think it hurts?",
        damage: 100,
        health: 8,
        extendable: true,
        reloadTime: 0.2,
        images: {
            slotRotation: 3.14,
            slotRevolution: 6.28 / 5
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 5,
        rarity: RarityName.super,
        undroppable: true,
        usingAssets: "stinger"
    },
    {
        idString: "sand",
        displayName: "Sand",
        description: "A bunch of sand particles.",
        damage: 5,
        health: 2,
        reloadTime: 1,
        extendable: true,
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        pieceAmount: 4,
        isShowedInOne: true,
        rarity: RarityName.unusual
    },
    {
        idString: "rose",
        displayName: "Rose",
        description: "Its healing properties are amazing. Not so good at combat though",
        damage: 3,
        health: 3,
        extendable: false,
        usable: true,
        useTime: 1.5,
        images: {
            slotDisplaySize: 35,
        },
        attributes: {
            absorbing_heal: 10
        },
        reloadTime: 3,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unusual
    },{
        idString: "tri_rose",
        displayName: "Rose",
        description: "Its healing properties are amazing. Not so good at combat though",
        damage: 5,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 1,
        attributes: {
            absorbing_heal: 3.5
        },
        reloadTime: 3,
        hitboxRadius: 0.34,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 3,
        rarity: RarityName.rare,
        usingAssets: "rose"
    },{
        idString: "epic_rose",
        displayName: "Rose",
        description: "Extremely powerful rose, almost unheard of",
        damage: 5,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 1,
        images: {
            slotDisplaySize: 40
        },
        attributes: {
            absorbing_heal: 22
        },
        reloadTime: 3,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },{
        idString: "myt_tri_rose",
        displayName: "Rose",
        description: "This is a miracle rose, only one in the world",
        damage: 5,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 35
        },
        attributes: {
            absorbing_heal: 4.5
        },
        reloadTime: 0.4,
        hitboxRadius: 0.5,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 3,
        rarity: RarityName.mythic,
        usingAssets: "epic_rose"
    },
    {
        idString: "triangle",
        displayName: "Triangle",
        description: "Slash your enemies with a powerful triangle that deals additional damage based on their current health",
        damage: 5,
        health: 15,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 40,
            selfGameRotation: 0.01
        },
        attributes: {
            health_percent_damage: {
                percent: 0.3,
                maxDamage: 150
            }
        },
        reloadTime: 2.5,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic,
    },
    {
        idString: "tri_triangle",
        displayName: "Triangle",
        description: "Slash your enemies with a powerful triangle that deals additional damage based on their current health",
        damage: 5,
        health: 15,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 35,
            selfGameRotation: 0.01
        },
        attributes: {
            health_percent_damage: {
                percent: 0.5,
                maxDamage: 1200
            }
        },
        reloadTime: 2.5,
        hitboxRadius: 0.5,
        isDuplicate: true,
        pieceAmount: 3,
        isShowedInOne: true,
        rarity: RarityName.mythic,
        usingAssets: "triangle"
    },
    {
        idString: "bubble",
        displayName: "Bubble",
        description: "Physics are for the weak",
        damage: 0,
        health: 1,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 45,
        },
        attributes: {
            boost: 10
        },
        reloadTime: 3.5,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "unstoppable_bubble",
        displayName: "UNBubble",
        description: "Powers are for the DEV",
        damage: 0,
        health: 1,
        extendable: false,
        usable: true,
        useTime: 0,
        attributes: {
            boost: 10
        },
        modifiers: {
            maxHealth: 66666,
            healPerSecond: 66666,
        },
        reloadTime: 0,
        hitboxRadius: 0.6,
        isShowedInOne: false,
        isDuplicate: true,
        pieceAmount: 2,
        rarity: RarityName.super,
        usingAssets: "bubble",
        undroppable: true
    },
    {
        idString: "basic",
        displayName: "Basic",
        description: "A nice petal, not too strong but not too weak",
        damage: 10,
        health: 10,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 38,
        },
        reloadTime: 2.5,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        undroppable: true,
        rarity: RarityName.common
    },
    {
        idString: "square",
        displayName: "Square",
        description: "Something incredibly rare and useless... does not belong to this game as well.",
        damage: 10,
        health: 10,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 60,
            selfGameRotation: 0.25,
        },
        reloadTime: 2.5,
        hitboxRadius: 0.93,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unique,
    },
    {
        idString: "dandelion",
        displayName: "Dandelion",
        description: "It's interesting properties prevent healing effects on affected units",
        damage: 5,
        health: 15,
        extendable: true,
        images: {
            selfGameRotation: 0.02,
            slotDisplaySize: 45,
            slotRotation: 0.8,
            centerXOffset: -1,
            centerYOffset: -1,
            facingOut: true,
            fontSizeMultiplier: 0.8
        },
        usable: true,
        attributes: {
            healing_debuff: {
                healing: 0,
                duration: 10,
            },
            shoot: {
                hitboxRadius: 0.6,
                damage: 5,
                health: 20,
                despawnTime: 3,
                speed: 8,
                definition: Projectile.fromString("dandelion")
            }
        },
        useTime: 0.2,
        reloadTime: 2.3,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare,
    },
    {
        idString: "missile",
        displayName: "Missile",
        description: "You can actually shoot this one",
        damage: 30,
        health: 20,
        extendable: true,
        images: {
            selfGameRotation: 0.02,
            slotDisplaySize: 45,
            slotRotation: 0.8,
            centerXOffset: -1,
            centerYOffset: -1,
            facingOut: true
        },
        usable: true,
        attributes: {
            shoot: {
                hitboxRadius: 0.6,
                damage: 40,
                health: 10,
                despawnTime: 3,
                speed: 7.5,
                definition: Projectile.fromString("missile")
            }
        },
        useTime: 0.2,
        reloadTime: 2,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare,
    },
    {
        idString: "big_missile",
        displayName: "Missile",
        description: "You can actually shoot this bigger one",
        damage: 20,
        health: 50,
        extendable: true,
        images: {
            selfGameRotation: 0.02,
            slotDisplaySize: 45,
            slotRotation: 0.8,
            centerXOffset: -1,
            centerYOffset: -1,
            facingOut: true
        },
        usable: true,
        attributes: {
            shoot: {
                hitboxRadius: 1,
                damage: 40,
                health: 20,
                despawnTime: 3,
                speed: 7,
                definition: Projectile.fromString("missile")
            }
        },
        useTime: 0.2,
        reloadTime: 2,
        hitboxRadius: 1,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic,
        usingAssets: "missile"
    },
    {
        idString: "myt_big_missile",
        displayName: "Missile",
        description: "You can actually shoot this quickly bigger one",
        damage: 100,
        health: 25,
        extendable: true,
        images: {
            selfGameRotation: 0.02,
            slotDisplaySize: 45,
            slotRotation: 0.8,
            centerXOffset: -1,
            centerYOffset: -1,
            facingOut: true
        },
        usable: true,
        attributes: {
            shoot: {
                hitboxRadius: 0.6,
                damage: 50,
                health: 20,
                despawnTime: 3,
                speed: 12,
                definition: Projectile.fromString("missile")
            }
        },
        useTime: 0.1,
        reloadTime: 0.5,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.mythic,
        usingAssets: "missile"
    }, {
        idString: "iris",
        displayName: "Iris",
        description: "Very poisonous, but takes a little while to do its work",
        damage: 5,
        health: 5,
        extendable: true,
        usable: false,
        attributes: {
            poison: {
                damagePerSecond: 10,
                duration: 6.5
            }
        },
        reloadTime: 6,
        hitboxRadius: 0.35,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unusual,
    },
    {
        idString: "siris",
        displayName: "Iris",
        description: "very poisonous and takes a little while to do 3.6m damage",
        damage: 3,
        health: 729,
        extendable: true,
        usable: false,
        attributes: {
            poison: {
                damagePerSecond: 3645,
                duration: 1000
            }
        },
        reloadTime: 0.5,
        hitboxRadius: 0.35,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.arcane,
        undroppable: true,
        usingAssets: "iris"
    }, {
        idString: "cactus",
        displayName: "Cactus",
        description: "Not very strong, but somehow increases your maximum health",
        damage: 5,
        health: 15,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 52,
        },
        modifiers: {
            maxHealth: 35
        },
        reloadTime: 1,
        hitboxRadius: 0.7,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare,
    }, {
        idString: "poison_cactus",
        displayName: "Cactus",
        description: "Increases your maximum health and makes your flower toxic. Enemies hit by your flower will get poisoned",
        damage: 5,
        health: 15,
        extendable: true,
        images: {
            slotDisplaySize: 52,
        },
        usable: false,
        attributes: {
            poison: {
                damagePerSecond: 10,
                duration: 0.6
            },
            body_poison: {
                damagePerSecond: 9,
                duration: 4.5
            }
        },
        modifiers: {
            maxHealth: 35
        },
        reloadTime: 1,
        hitboxRadius: 0.7,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic,
    },
    {
        idString: "tri_cactus",
        displayName: "Cactus",
        description: "Not very strong, but somehow increases your maximum health",
        damage: 5,
        health: 15,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 52
        },
        modifiers: {
            maxHealth: 30
        },
        reloadTime: 1,
        hitboxRadius: 0.7,
        distanceToCenter: 0.65,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 3,
        rarity: RarityName.legendary,
        usingAssets: "cactus",
    },{
        idString: "salt",
        displayName: "Salt",
        description: "Reflects some of the damage you take back to the enemy that dealt it",
        damage: 10,
        health: 10,
        extendable: true,
        images: {
            slotDisplaySize: 40,
        },
        usable: false,
        attributes:{
            damage_reflection: 0.20
        },
        reloadTime: 2.5,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "tri_stinger",
        displayName: "Stinger",
        description: "It really hurts, but it's very fragile",
        damage: 35,
        health: 8,
        extendable: true,
        reloadTime: 3.5,
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 3,
        rarity: RarityName.legendary,
        usingAssets: "stinger"
    },
    {
        idString: "blood_tringer",
        displayName: "Stinger",
        description: "It hurts so much that it also damages you when broken. Very fragile",
        damage: 65,
        health: 8,
        extendable: true,
        reloadTime: 4,
        attributes: {
            self_damage: 4
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 3,
        rarity: RarityName.mythic,
        usingAssets: "blood_stinger"
    },
    {
        idString: "pinger",
        displayName: "Stinger",
        description: "It really hurts, but it's very fragile",
        damage: 75,
        health: 8,
        extendable: true,
        images: {
            slotRotation: 3.14,
            slotRevolution: 6.28 / 5
        },
        reloadTime: 2.5,
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 5,
        rarity: RarityName.mythic,
        usingAssets: "stinger"
    },
    {
        idString: "blood_sepinger",
        displayName: "Stinger",
        description: "i think it hurts a lot",
        damage: 25,
        health: 8,
        extendable: true,
        attributes: {
            self_damage: 1,
        },
        images: {
            slotRotation: 3.14,
            slotRevolution: 6.28 / 7
        },
        reloadTime: 0.5,
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 7,
        rarity: RarityName.super,
        undroppable: true,
        usingAssets: "blood_stinger"
    },
    {
        idString: "rice",
        displayName: "Rice",
        description: "Spawns instantly, but not very strong",
        damage: 9,
        health: 1,
        extendable: true,
        reloadTime: 0.04,
        images:{
            slotDisplaySize: 45
        },
        usable: false,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "leg_bubble",
        displayName: "Bubble",
        description: "Physics are for the weak",
        damage: 0,
        health: 1,
        extendable: false,
        usable: true,
        useTime: 0,
        images: {
            slotDisplaySize: 45,
        },
        attributes: {
            boost: 5
        },
        reloadTime: 1.5,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.legendary,
        usingAssets: "bubble"
    },
    {
        idString: "powder",
        displayName: "Powder",
        description: "Very quickly",
        damage: 0,
        health: 1,
        extendable: false,
        usable: false,
        images: {
            slotDisplaySize: 35,
        },
        modifiers: {
            speed: 1.128
        },
        reloadTime: 2,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        unstackable: true,
        rarity: RarityName.legendary
    },
    {
        idString: "web",
        displayName: "Web",
        description: "Sticky.",
        damage: 8,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 45,
        },
        attributes: {
            shoot: {
                definition: Projectile.fromString("web"),
                speed: 0,
                hitboxRadius: 3,
                despawnTime: 5,
                modifiers: {
                    speed: 0.4
                }
            }
        },
        reloadTime: 2,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "tri_web",
        displayName: "Web",
        description: "It's really sticky",
        damage: 8,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 45,
        },
        attributes: {
            shoot: {
                definition: Projectile.fromString("web"),
                speed: 0,
                hitboxRadius: 5,
                despawnTime: 5,
                modifiers: {
                    speed: 0.5
                }
            }
        },
        reloadTime: 2,
        hitboxRadius: 0.5,
        isDuplicate: true,
        pieceAmount: 3,
        isShowedInOne: true,
        rarity: RarityName.legendary,
        usingAssets: "web",
    },
    {
        idString: "myt_tri_web",
        displayName: "Web",
        description: "It's extremely sticky",
        damage: 8,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 45,
        },
        attributes: {
            shoot: {
                definition: Projectile.fromString("web"),
                speed: 0,
                hitboxRadius: 10,
                despawnTime: 5,
                modifiers: {
                    speed: 0.5
                }
            }
        },
        reloadTime: 2,
        hitboxRadius: 0.5,
        isDuplicate: true,
        pieceAmount: 3,
        isShowedInOne: false,
        rarity: RarityName.mythic,
        usingAssets: "web",
    },
    {
        idString: "peas",
        displayName: "Peas",
        description: "4 in 1 deal",
        damage: 8,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 30,
        },
        attributes: {
            peas_shoot: {
                definition: Projectile.fromString("peas"),
                speed: 6.25,
                damage: 8,
                health: 5,
                hitboxRadius: 0.35,
                despawnTime: 3.5
            }
        },
        reloadTime: 1.2,
        hitboxRadius: 0.35,
        isDuplicate: true,
        distanceToCenter: 0.4,
        pieceAmount: 4,
        isShowedInOne: true,
        rarity: RarityName.rare
    },
    {
        idString: "poison_peas",
        displayName: "Peas",
        description: "4 in 1 deal, now with a secret ingredient: poison",
        damage: 8,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 30,
        },
        attributes: {
            peas_shoot: {
                definition: Projectile.fromString("poison_peas"),
                speed: 6.25,
                damage: 8,
                health: 5,
                hitboxRadius: 0.35,
                despawnTime: 3.5
            },
            poison: {
                damagePerSecond: 10,
                duration: 1
            }
        },
        reloadTime: 1.2,
        hitboxRadius: 0.35,
        isDuplicate: true,
        distanceToCenter: 0.4,
        pieceAmount: 4,
        isShowedInOne: true,
        rarity: RarityName.epic,
    },
    {
        idString: "leg_poison_peas",
        displayName: "Peas",
        description: "4 bigger in 1 deal, now with a secret ingredient: poison",
        damage: 10,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 45,
        },
        attributes: {
            peas_shoot: {
                definition: Projectile.fromString("poison_peas"),
                speed: 6.25,
                damage: 10,
                health: 5,
                hitboxRadius: 0.46,
                despawnTime: 4
            },
            poison: {
                damagePerSecond: 10,
                duration: 2
            }
        },
        reloadTime: 1.2,
        hitboxRadius: 0.5,
        isDuplicate: true,
        pieceAmount: 4,
        isShowedInOne: true,
        rarity: RarityName.legendary,
        usingAssets: "poison_peas",
    },
    {
        idString: "myt_poison_peas",
        displayName: "Peas",
        description: "The most poisonous peas ever, it recharges at an amazing speed",
        damage: 10,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.1,
        images: {
            slotDisplaySize: 45,
        },
        attributes: {
            peas_shoot: {
                definition: Projectile.fromString("poison_peas"),
                speed: 6.25,
                damage: 15,
                health: 10,
                hitboxRadius: 0.46,
                despawnTime: 4.5
            },
            poison: {
                damagePerSecond: 15,
                duration: 2
            }
        },
        reloadTime: 0.3,
        hitboxRadius: 0.5,
        isDuplicate: true,
        pieceAmount: 5,
        isShowedInOne: true,
        rarity: RarityName.mythic,
        usingAssets: "poison_peas",
    },
    {
        idString: "speas",
        displayName: "Grapes",
        description: "pea machine gun AAAAAA",
        damage: 2,
        health: 12,
        extendable: false,
        usable: true,
        useTime: 0.03,
        images: {
            slotDisplaySize: 45,
        },
        attributes: {
            peas_shoot: {
                definition: Projectile.fromString("speas"),
                speed: 7.5,
                damage: 0.1,
                health: 26,
                hitboxRadius: 0.46,
                despawnTime: 4.5
            },
            poison: {
                damagePerSecond: 240,
                duration: 120
            }
        },
        reloadTime: 0.12,
        hitboxRadius: 0.5,
        isDuplicate: true,
        pieceAmount: 7,
        isShowedInOne: true,
        rarity: RarityName.phantasmagoric,
        undroppable: true,
        doesNotDamage: [EntityType.Player],
        usingAssets: "poison_peas",
    },
    {
        idString: "corn",
        displayName: "Corn",
        description: "You can actually eat it",
        damage: 12,
        health: 200,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 45,
        },
        reloadTime: 8,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "dice",
        displayName: "Dice",
        description: "Roll the dice! Has a 15% chance to deal 8x damage",
        damage: 9,
        health: 32,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 45,
            selfGameRotation: 0.01
        },
        attributes: {
            critical_hit: {
                chance: 0.15,
                multiplier: 8
            }
        },
        reloadTime: 3,
        hitboxRadius: 0.7,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "chip",
        displayName: "Chip",
        description: "A lucky microchip with a 70% chance to avoid taking damage",
        damage: 8,
        health: 8,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 40,
            selfGameRotation: 0.02
        },
        attributes: {
            damage_avoidance: {
                chance: 0.7
            }
        },
        reloadTime: 2.5,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare,
    },
    {
        idString: "pincer",
        displayName: "Pincer",
        description: "A deadly pincer that poisons and paralyzes enemies",
        damage: 5,
        health: 5,
        extendable:
        true,
            usable
    :
        false,
            images
    :
        {
            slotDisplaySize: 35,
                selfGameRotation
        :
            0.01
        }
    ,
        attributes: {
            poison: {
                damagePerSecond: 10,
                    duration
            :
                1
            }
        ,
            paralyze: {
                duration: 0.8,
                    speedReduction
            :
                1.0
            }
        }
    ,
        reloadTime: 1.25,
            hitboxRadius
    :
        0.45,
            isDuplicate
    :
        false,
            pieceAmount
    :
        1,
            rarity
    :
        RarityName.epic
    },{
        idString: "antennae",
        displayName: "Antennae",
        description: "Allows your flower to sense foes farther away",
        equipment: true,
        images: {
            slotDisplaySize: 60,
            equipmentStyles:{
                noRender: false,
                coordsToOwner:{
                    x: 0,
                    y: 27,
                    scale: 1
                }
            }
        },
        hitboxRadius: 0.7,
        modifiers: {
            zoom: 30
        },
        rarity: RarityName.legendary
    },{
        idString: "myt_antennae",
        displayName: "Antennae",
        description: "Allows your flower to sense foes farther farther away",
        equipment: true,
        images: {
            slotDisplaySize: 60
        },
        hitboxRadius: 0.9,
        modifiers: {
            zoom: 45
        },
        rarity: RarityName.mythic,
        usingAssets: "antennae"
    },
    {
        idString: "santennae",
        displayName: "Antennae",
        description: "A larger vision comes at the cost of details you can observe",
        equipment: true,
        images: {
            slotDisplaySize: 60
        },
        hitboxRadius: 0.9,
        modifiers: {
            zoom: 120
        },
        undroppable: true,
        rarity: RarityName.super,
        usingAssets: "antennae"
    },
    {
        idString: "thirdeye",
        displayName: "Third Eye",
        description: "Gives you the power to control your own petal.",
        equipment: true,
        images: {
            slotDisplaySize: 39,
            centerYOffset: -1.25,
            fontSizeMultiplier: 0.8,
            equipmentStyles: {
                noRender: false,
               // thirdEye: true,
                coordsToOwner: {
                    x: 0,
                    y: 10.5,
                    scale: 0.4
                }
            }
        },
        hitboxRadius: 0.6,
        modifiers: {
            controlRotation: true,
        },
        rarity: RarityName.unique
    },
    {
        idString: "tentacles",
        displayName: "Tentacles",
        description: "Allows you to extend your petals farther away.",
        equipment: true,
        images: {
            slotDisplaySize: 60,
            fontSizeMultiplier: 0.85,
            equipmentStyles: {
                noRender: false,
                coordsToOwner: {
                    x: 0,
                    y: -25,
                    scale: 1.5,
                    rotation: Math.PI,
                    zIndex: -1,
                }
            }
        },
        hitboxRadius: 0.6,
        unstackable: true,
        modifiers: {
            extraDistance: 1,
        },
        rarity: RarityName.legendary,
        undroppable: true, // TEMPORARY: TOREMOVE: spawn in game for testing purposes, remove this when added to drops
    },
    {
        idString: "stentacles",
        displayName: "Tentacles",
        description: "Slips into your ████ and █████ you.",
        equipment: true,
        images: {
            slotDisplaySize: 60,
          //  centerYOffset: -1.25,
            fontSizeMultiplier: 0.85,
            equipmentStyles: {
                noRender: false,
                coordsToOwner: {
                    x: 0,
                    y: -25,
                    scale: 1.5,
                    rotation: Math.PI,
                    zIndex: -1,
                }
            }
        },
        hitboxRadius: 0.6,
        modifiers: {
            extraDistance: 10,
        },
        rarity: RarityName.super,
        undroppable: true,
        usingAssets: "tentacles"
    },
    {
        idString: "yggdrasil",
        displayName: "Yggdrasil",
        description: "A dried leaf from the yggdrasil tree, rumored to be able to bring dead flowers back alive.",
        damage: 10,
        health: 10,
        extendable: false,
        usable: false,
        images: {
            slotDisplaySize: 50,
            fontSizeMultiplier: 0.87

     //       selfGameRotation: 0.02
        },
        modifiers: {
            revive: {
                healthPercent: 30,
                shieldPercent: 50,
                destroyAfterUse: true
            }
        },
        reloadTime: 2.5,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        effectiveFirstReload: true,
        noAnnouncement: true,
        undroppable: true,
        rarity: RarityName.unique,
    },
    {
        idString: "sygg",
        displayName: "Yggdrasil",
        description: "A whole Yggdrasil tree here. Never runs out.",
        damage: 0.01,
        health: 24,
        extendable: false,
        usable: false,
        images: {
            slotDisplaySize: 50,
            fontSizeMultiplier: 0.9

     //       selfGameRotation: 0.02
        },
        modifiers: {
            revive: {
                healthPercent: 100,
                shieldPercent: 70,
                destroyAfterUse: false
            }
        },
        reloadTime: 0.5,
        hitboxRadius: 0.55,
        isDuplicate: true,
        pieceAmount: 15,
        isShowedInOne: true,
        effectiveFirstReload: true,
        undroppable: true,
        rarity: RarityName.super,
        usingAssets: 'yggdrasil'
    },
    {
        idString: "stick",
        displayName: "Stick",
        description: "A mysterious stick that summons the forces of the wind.",
        damage: 5,
        health: 20,
        extendable: false,
        usable: true,
        useTime: 5,
        images: {
            slotDisplaySize: 50,
            centerYOffset: 0.05,
        },
        attributes: {
            spawner: {
                idString: "sandstorm",
                displayName: "Sandstorm",
                damage: 40,
                health: 35,
                category: MobCategory.Unactive,
                hitboxRadius: 4,
                speed: 7,
                images: {
                    width: 100,
                    height: 100
                },
                lootTable: {},
                rarity: RarityName.rare,
                exp: 0,
                usingAssets: "sandstorm",
                despawnTime: 10
            }
        },
        reloadTime: 2,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        effectiveFirstReload: true,
        undroppable: true, // TEMPORARY: TOREMOVE: spawn in game for testing purposes, remove this when added to drops
        rarity: RarityName.legendary,
    },
    {
        idString: "pollen",
        displayName: "Pollen",
        description: "Asthmatics beware. ",
        damage: 8,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        attributes: {
            place_projectile: {
                definition: Projectile.fromString("pollen"),
                speed: 0,
                damage: 8,
                health: 5,
                hitboxRadius: 0.3,
                despawnTime: 5,
                velocityAtFirst: 20
            }
        },
        reloadTime: 1,
        hitboxRadius: 0.3,
        isDuplicate: true,
        pieceAmount: 3,
        isShowedInOne: false,
        rarity: RarityName.epic,
    },
    {
        idString: "myt_pollen",
        displayName: "Pollen",
        description: "Asthmatics beware.",
        damage: 13,
        health: 10,
        extendable: false,
        usable: true,
        useTime: 0.2,
        attributes: {
            place_projectile: {
                definition: Projectile.fromString("pollen"),
                speed: 0,
                damage: 13,
                health: 10,
                hitboxRadius: 0.3,
                despawnTime: 5,
                velocityAtFirst: 20
            }
        },
        reloadTime: 0.3,
        hitboxRadius: 0.3,
        isDuplicate: true,
        pieceAmount: 4,
        isShowedInOne: false,
        rarity: RarityName.mythic,
        usingAssets: "pollen"
    },
    {
        idString: "egg",
        displayName: "Egg",
        description: "Something interesting might pop out of this.",
        damage: 1,
        health: 50,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 45
        },
        useTime: 1,
        attributes: {
            spawner: Mobs.fromString("soldier_ant")
        },
        reloadTime: 1,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "leg_egg",
        displayName: "Egg",
        description: "Something interesting might pop out of this.",
        damage: 1,
        health: 50,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 45
        },
        useTime: 1.5,
        attributes: {
            spawner: Mobs.fromString("beetle")
        },
        reloadTime: 1,
        hitboxRadius: 0.88,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.legendary,
        usingAssets: "egg"
    },
    {
        idString: "myt_egg",
        displayName: "Egg",
        description: "Something interesting might pop out of this.",
        damage: 1,
        health: 50,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 45
        },
        useTime: 1.5,
        attributes: {
            spawner: Mobs.fromString("leg_hornet")
        },
        reloadTime: 3.1,
        hitboxRadius: 1,
        isDuplicate: true,
        pieceAmount: 2,
        isShowedInOne: false,
        rarity: RarityName.mythic,
        usingAssets: "egg"
    },
    {
        idString: "segg",
        displayName: "Egg",
        description: "Something dangerous might pop out of this.",
        damage: 1,
        health: 2500,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 75
        },
        useTime: 1,
        attributes: {
            spawner: Mobs.fromString("mega_hornet")
        },
        reloadTime: 1,
        hitboxRadius: 1,
        isShowedInOne: false,
        isDuplicate: true,
        pieceAmount: 2,
        rarity: RarityName.super,
        usingAssets: "egg",
        undroppable: true
    },
    {
        idString: "segg2",
        displayName: "Egg",
        description: "An army might pop out of this.",
        damage: 1,
        health: 2500,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 40
        },
        useTime: 1,
        attributes: {
            spawner: Mobs.fromString("spider")
        },
        reloadTime: 1,
        hitboxRadius: 0.6,
        isShowedInOne: false,
        isDuplicate: true,
        pieceAmount: 25,
        rarity: RarityName.super,
        usingAssets: "egg",
        undroppable: true
    },
    {
        idString: "segg3",
        displayName: "Egg",
        description: "Something that does not belong to this world might pop out of this.",
        damage: 1,
        health: 2500,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 80
        },
        useTime: 0.2,
        attributes: {
            spawner: Mobs.fromString("sshiny"),
        },
        reloadTime: 0.2,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.ethereal,
        usingAssets: "egg",
        undroppable: true
    },
    {
        idString: "segg4",
        displayName: "Egg",
        description: "Something that can bomb might pop out of this.",
        damage: 1,
        health: 2500,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 80
        },
        useTime: 0.2,
        attributes: {
            spawner: Mobs.fromString("myt_ant_hole"),
        },
        reloadTime: 0.2,
        hitboxRadius: 0.6,
        isDuplicate: true,
        pieceAmount: 5,
        isShowedInOne: false,
        rarity: RarityName.ethereal,
        usingAssets: "egg",
        undroppable: true
    },
    {
        idString: "segg5",
        displayName: "Egg",
        description: "Something gigantic might pop out of this this.",
        damage: 3,
        health: 7500,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 80
        },
        useTime: 0.2,
        attributes: {
            spawner: Mobs.fromString("giant_spider"),
        },
        reloadTime: 0.2,
        hitboxRadius: 0.6,
        pieceAmount: 1,
        isDuplicate: false,
        rarity: RarityName.phantasmagoric,
        usingAssets: "egg",
        undroppable: true
    },
    {
        idString: "segg6",
        displayName: "Egg",
        description: "Something beyond imagination might pop out of this.",
        damage: 9,
        health: 7500*3,
        extendable: false,
        usable: true,
        images: {
            slotDisplaySize: 85
        },
        useTime: 0.2,
        attributes: {
            spawner: Mobs.fromString("giant_mantis"),
        },
        reloadTime: 0.2,
        hitboxRadius: 0.6,
        pieceAmount: 1,
        isDuplicate: false,
        rarity: RarityName.arcane,
        usingAssets: "egg",
        undroppable: true
    },
    {
        idString: "talisman",
        displayName: "Talisman",
        description: "A necklace that allows the wearer to anticipate enemy attacks",
        damage: 10,
        health: 10,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 40,
            selfGameRotation: 0.01
        },
        modifiers: {
            // damageAvoidanceChance: 0.12
			damageAvoidanceByDamage: true
        },
		// unstackable: true,
        reloadTime: 2.5,
        hitboxRadius: 0.45,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic,
    },
    {
        idString: "yinyang",
        displayName: "Yin Yang",
        description: "A mysterious petal with mighty power coming from the East.\nReverses your petal rotation direction.",
        damage: 20,
        health: 20,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 40,
            selfGameRotation: 0.01,
            fontSizeMultiplier: 0.9
        },
        modifiers: {
            yinYangs: 1
        },
        reloadTime: 1,
        hitboxRadius: 0.55,
        isDuplicate: false,
        effectiveFirstReload: true,
        pieceAmount: 1,
        rarity: RarityName.epic,
    },
    {
        idString: "uranium",
        displayName: "Uranium",
        description: "Highly radioactive material that poisons enemies and the wearer. Handle with care!",
        damage: 1,
        health: 32,
        extendable: false,
        usable: false,
        images: {
            slotDisplaySize: 40,
            selfGameRotation: 0.02
        },
        attributes: {
            area_poison: {
                radius: 15,
                damagePerSecond: 10,
            }
        },
        modifiers: {
            selfPoison: 20
        },
        reloadTime: 2.5,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        unstackable: true,
        rarity: RarityName.legendary
    },
    {
        idString: "honey",
        displayName: "Honey",
        description: "Slows enemies and reduces their rotation speed.",
        damage: 10,
        health: 10,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 45,
            selfGameRotation: 0.01
        },
        attributes: {
            paralyze: {
                duration: 5,
                speedReduction: 0.25,
                revolutionReduction: 0.25
            }
        },
        reloadTime: 1.7,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "shell",
        displayName: "Shell",
        description: "Provides a protective shield that absorbs damage.",
        damage: 5,
        health: 25,
        extendable: false,
        usable: true,
        useTime: 1.5,
        images: {
            slotDisplaySize: 40,
        },
        attributes: {
            absorbing_shield: 25
        },
        reloadTime: 3,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "heaviest",
        displayName: "Heaviest",
        description: "This thing is so heavy that nothing gets in the way.",
        damage: 10,
        health: 100,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 60,
        },
        attributes: {
            damage_reduction_percent: 65
        },
        reloadTime: 5,
        hitboxRadius: 1.0,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "jelly",
        displayName: "Jelly",
        description: "No one likes touching this.",
        damage: 10,
        health: 10,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 45,
            selfGameRotation: 0.01,
            slotRotation: 0.3,
        },
        attributes: {
            boost: -20
        },
        reloadTime: 2.5,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "sjelly",
        displayName: "Jelly",
        description: "I like eating this.",
        damage: 1,
        health: 100,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 45,
            selfGameRotation: 0.01,
            slotRotation: 0.3,
        },
        attributes: {
            boost: -300
        },
        reloadTime: 0.5,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.super,
        usingAssets: "jelly",
        undroppable: true
    },
    {
        idString: "rock",
        displayName: "Rock",
        description: "Extremely durable, but takes a bit longer to recharge.",
        damage: 15,
        health: 50,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 55,
        },
        reloadTime: 4,
        hitboxRadius: 0.7,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "starfish",
        displayName: "Starfish",
        description: "Increases health regen while below 75% health.",
        damage: 5,
        health: 7,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 65/0.94,
            slotRotation: -(90-32.5)*(Math.PI/180),
            facingOut:true,

        },
        modifiers: {
            conditionalHeal: {
                healthPercent: 0.75,
                healAmount: 9.5
            }
        },
        reloadTime: 2,
        hitboxRadius: 0.92,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.legendary
    },
    {
        idString: "fang",
        displayName: "Fang",
        description: "Heals you by a part of it's damage.",
        damage: 15,
        health: 10,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 43,
            selfGameRotation: 0.25,

        },
        attributes: {
            damage_heal: {
                healPercent: 28
            }
        },
        reloadTime: 1.25,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "bone",
        displayName: "Bone",
        description: "Sturdy.",
        damage: 12,
        health: 10,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 45,
            selfGameRotation: 0.15
        },
        attributes: {
            armor: 8
        },
        reloadTime: 1.25,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "lightning",
        displayName: "Lightning",
        description: "Strikes several nearby enemies.",
        damage: 20,
        health: 1,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 45,
            selfGameRotation: 0.15,
            fontSizeMultiplier: 0.9
        },
        attributes: {
            lightning: {
                attenuation: 0.9,
                range: 10,
                bounces: 8
            }
        },
        reloadTime: 1.25,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare,
    },
    {
        idString: "slightning",
        displayName: "Lightning",
        description: "Strikes several nearby enemies.",
        damage: 20,
        health: 1,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 45,
            selfGameRotation: 0.15
        },
        attributes: {
            lightning: {
                attenuation: 1,
                range: 100,
                bounces: 100
            }
        },
        reloadTime: 1.25,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.super,
        usingAssets: "lightning"
    }
] satisfies PetalDefinition[]);

// if  u use this to generate iris s tats, remember to remove the 'siris' up there
/*
let rnameArr = ['c','un','r','e','l','m','u','s','eth','phas','arc','em'];
let rrrrrrr = [
    RarityName.common,
    RarityName.unusual,
    RarityName.rare,
    RarityName.epic,
    RarityName.legendary,
    RarityName.mythic,
    RarityName.unique,
    RarityName.super,
    RarityName.ethereal,
    RarityName.phantasmagoric,
    RarityName.arcane,
    RarityName.empyrean,
]
let i=0;
const rrrrrrrrrrrrrrrrrrrrr: PetalDefinition[] = [];
for (let r in rnameArr) {
    if (i<2) {
        i++
        continue;
    }
    const xxx: PetalDefinition = {
        idString: rnameArr[i]+'iris',
        displayName: "Iris",
        description: "uhmm",
        damage: 5*(3**i),
        health: 5*(3**i),
        extendable: true,
        usable: false,
        attributes: {
            poison: {
                damagePerSecond: 30*(3**i),
                duration: 5
            }
        },
        reloadTime: 0.5,
        hitboxRadius: 0.35,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: rrrrrrr[i],
        undroppable: true,
        usingAssets: "iris"
    };
    const asd: PetalDefinition = {
        idString: rnameArr[i]+'basic',
        displayName: "Basic",
        description: "uhmm",
        damage: 10*(3**i),
        health: 10*(3**i),
        extendable: true,
        usable: false,
        attributes: {
            self_damage: 5*(3**i),
            armor: 5*(3**i),
            critical_hit: {
                chance: 0.03,
                multiplier: 40
            },
            damage_reflection: i*5,
            damage_heal: {
                healPercent: 0.5
            },
            damage_avoidance: {
                chance: 0.99,
            }
        },
        modifiers: {
            speed: 1.2
        },
        reloadTime: 2.5,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: rrrrrrr[i],
        undroppable: true,
        usingAssets: "basic"
    };
    rrrrrrrrrrrrrrrrrrrrr.push(xxx);
    rrrrrrrrrrrrrrrrrrrrr.push(asd);
    i++
}
Petals = new Definitions<PetalDefinition>([...Petals.definitions, ...rrrrrrrrrrrrrrrrrrrrr]);*/
