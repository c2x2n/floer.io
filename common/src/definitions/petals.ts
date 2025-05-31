import { Definitions, ObjectDefinition } from "./definitions";
import { RarityName } from "./rarities";
import { Modifiers, PlayerModifiers } from "../typings/modifier";
import { ProjectileParameters, Projectiles } from "./projectiles";
import { MobDefinition, Mobs } from "./mobs";
import { EntityType } from "../constants";
import { halfPI, P2, PI } from "../engine/maths/constants";
import { EffectsOnHitDataType, PoisonDataType } from "../typings/effect";
import { Counter } from "../typings/counter";

export type SavedPetalDefinitionData = PetalDefinition | null;

export type PetalDefinition = ObjectDefinition & {
    readonly description?: string
    readonly fullName?: string
    readonly rarity: RarityName
    readonly attributes?: AttributeParameters
    readonly behavior?: PetalBehaviorDataType
    readonly wearerAttributes?: Partial<PlayerModifiers>
    readonly petalModifiers?: Partial<Modifiers>
    readonly petalCounter?: Partial<Counter>
    readonly undroppable?: boolean
    readonly unstackable?: boolean
    readonly hitboxRadius: number
    readonly effectiveFirstReload?: boolean
    readonly noAnnouncement?: boolean
    readonly doesNotDamage?: EntityType[]
    readonly effectsOnHit?: EffectsOnHitDataType
    readonly poison?: PoisonDataType
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
};

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
};

export type PetalBehaviors = {
    readonly self_damage: number
    readonly critical_hit: {
        readonly chance: number
        readonly multiplier: number
    }
    readonly health_percent_damage: {
        readonly percent: number
        readonly maxDamage?: number
        readonly trueDamage?: boolean
    }
    readonly damage_avoidance: number
    readonly damage_reduction_percent: {
        readonly percent: number
        readonly from?: EntityType[]
    }
    readonly ban_petal: {
        readonly num: number
        readonly duration: number
    }
    readonly random: Array<{
        readonly effect?: EffectsOnHitDataType
        readonly poison?: PoisonDataType
        readonly damage?: number
        readonly weight: number
    }>
    readonly area_poison: {
        readonly radius: number
        readonly damagePerSecond: number
        readonly tickInterval?: number
    }
    readonly damage_heal: {
        readonly healPercent: number
        readonly maximumHeal?: number // meaningless, because now it uses petal.damage to calculate not damage dealt
    }
    readonly lightning: {
        readonly attenuation: number
        readonly range: number
        readonly bounces: number
    }
    readonly bleeding: unknown
};

export type PetalBehaviorDataType = {
    readonly [K in keyof PetalBehaviors]: {
        name: K
        data: PetalBehaviors[K]
    }
}[keyof PetalBehaviors];

export type AttributeParameters = {
    readonly absorbing_heal?: number
    readonly absorbing_shield?: number
    readonly boost?: number
    readonly moveBoost?: number
    readonly shoot?: ProjectileParameters
    readonly around_circle_shoot?: ProjectileParameters
    readonly peas_shoot?: {
        readonly radius?: number
        readonly amount: number
        readonly parameters: ProjectileParameters
    }
    readonly place_projectile?: ProjectileParameters
    readonly spawner?: MobDefinition
};

export function getDisplayedPieces(petal: PetalDefinition): number {
    if (petal.equipment) return 0;
    if (petal.isDuplicate && petal.isShowedInOne) return 1;
    return petal.pieceAmount;
}

export const PetalDefinitions = [
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
        wearerAttributes: {
            speed: 1.006
        }
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
        wearerAttributes: {
            speed: 1.005
        }
    },
    {
        idString: "penta",
        displayName: "Penta",
        description: "FIVE.",
        damage: 15,
        health: 10,
        extendable: true,
        reloadTime: 0.5,
        usable: false,
        hitboxRadius: 0.345,
        isDuplicate: true,
        pieceAmount: 5,
        isShowedInOne: false,
        rarity: RarityName.mythic,
        usingAssets: "light",
        wearerAttributes: {
            speed: 1.01
        }
    },
    {
        idString: "wing",
        displayName: "Wing",
        description: "It comes and goes.",
        damage: 20,
        health: 15,
        swinging: {
            time: 0.5,
            distance: 4.8
        },
        images: {
            slotDisplaySize: 60,
            selfGameRotation: 360
        },
        extendable: true,
        reloadTime: 1.25,
        usable: false,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "dark_wing",
        fullName: "Dark Wing",
        displayName: "Wing",
        description: "It hurts and curses.",
        damage: 20,
        health: 15,
        swinging: {
            time: 0.5,
            distance: 4.8
        },
        images: {
            slotDisplaySize: 70,
            selfGameRotation: 360
        },
        effectsOnHit: {
            modifier: {
                cursed: true,
                aggroRange: 2
            },
            duration: 6.66
        },
        extendable: true,
        reloadTime: 1.25,
        usable: false,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.mythic
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
        wearerAttributes: {
            speed: 1.004
        }
    }, {
        idString: "faster",
        displayName: "Faster",
        description: "Quickly.",
        damage: 8,
        health: 5,
        extendable: true,
        reloadTime: 0.5,
        wearerAttributes: {
            revolutionSpeed: 1.0
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    }, {
        idString: "faster_wing",
        displayName: "Wing",
        description: "It comes and goes quickly.",
        damage: 20,
        health: 15,
        swinging: {
            time: 0.25,
            distance: 4.8
        },
        extendable: true,
        reloadTime: 1.25,
        images: {
            slotDisplaySize: 60,
            selfGameRotation: 360
        },
        wearerAttributes: {
            revolutionSpeed: 1.25
        },
        usable: false,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.legendary
    }, {
        idString: "tri_faster",
        displayName: "Fastest",
        description: "Quickly.",
        damage: 15,
        health: 15,
        extendable: true,
        images: {
            selfGameRotation: 18
        },
        reloadTime: 0.5,
        wearerAttributes: {
            revolutionSpeed: 1.0
        },
        usable: false,
        hitboxRadius: 0.3,
        distanceToCenter: 0.55,
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
        damage: 9,
        health: 10,
        extendable: true,
        images: {
            slotDisplaySize: 60,
            slotRotation: -0.1,
            centerXOffset: 1,
            selfGameRotation: 18
        },
        wearerAttributes: {
            healPerSecond: 2
        },
        reloadTime: 1,
        usable: false,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unusual
    },
    {
        idString: "tri_leaf",
        displayName: "Leaf",
        description: "Gathers energy from the sun to heal your flower passively",
        damage: 9,
        health: 10,
        extendable: true,
        images: {
            slotDisplaySize: 60,
            slotRotation: -0.1,
            selfGameRotation: 18
        },
        wearerAttributes: {
            healPerSecond: 1
        },
        reloadTime: 1,
        usable: false,
        hitboxRadius: 0.55,
        isDuplicate: true,
        isShowedInOne: false,
        pieceAmount: 3,
        rarity: RarityName.legendary,
        usingAssets: "leaf"
    },
    {
        idString: "g_leaf",
        fullName: "Golden Leaf",
        displayName: "Leaf",
        description: "Has magic and makes your petals reload faster",
        damage: 9,
        health: 10,
        extendable: true,
        images: {
            slotDisplaySize: 60,
            slotRotation: -0.1,
            selfGameRotation: 18
        },
        wearerAttributes: {
            petalReloadTime: 0.5
        },
        reloadTime: 1,
        usable: false,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.mythic
    },
    {
        idString: "stinger",
        displayName: "Stinger",
        description: "It really hurts, but it's very fragile",
        damage: 35,
        health: 10,
        extendable: true,
        reloadTime: 4,
        images: {
            selfGameRotation: 18,
            slotDisplaySize: 25
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unusual
    },
    {
        idString: "pinger",
        displayName: "Stinger",
        fullName: "Blood Stinger",
        description: "It hurts so much. Make your enemy bleeding.",
        damage: 35,
        health: 8,
        extendable: true,
        reloadTime: 4,
        behavior: {
            name: "bleeding",
            data: undefined
        },
        images: {
            selfGameRotation: 18,
            slotDisplaySize: 25,
            slotRevolution: P2 / 5,
            slotRotation: PI
        },
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        pieceAmount: 5,
        isShowedInOne: true,
        rarity: RarityName.mythic,
        usingAssets: "blood_stinger"
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
            slotRevolution: P2 / 5
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
        damage: 6,
        health: 2,
        reloadTime: 1,
        images: {
            selfGameRotation: 18,
            slotDisplaySize: 25
        },
        extendable: true,
        usable: false,
        distanceToCenter: 0.45,
        hitboxRadius: 0.35,
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
            slotDisplaySize: 35
        },
        attributes: {
            absorbing_heal: 12
        },
        reloadTime: 3,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unusual
    }, {
        idString: "tri_rose",
        displayName: "Rose",
        description: "Its healing properties are amazing. Not so good at combat though",
        damage: 5,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 1.5,
        attributes: {
            absorbing_heal: 4.5
        },
        reloadTime: 3.5,
        images: {
            selfGameRotation: 18,
            slotDisplaySize: 28
        },
        hitboxRadius: 0.3,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 3,
        rarity: RarityName.rare,
        usingAssets: "rose"
    }, {
        idString: "epic_rose",
        displayName: "Rose",
        description: "Extremely powerful rose, almost unheard of",
        damage: 5,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 1.5,
        images: {
            slotDisplaySize: 45,
            selfGameRotation: 18,
            slotRotation: 0.6
        },
        attributes: {
            absorbing_heal: 27
        },
        reloadTime: 3,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    }, {
        idString: "myt_tri_rose",
        displayName: "Rose",
        fullName: "Miraculous Rose",
        description: "This is a miracle rose, only one in the world",
        damage: 5,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 35,
            selfGameRotation: 18
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
            slotDisplaySize: 32,
            selfGameRotation: 18
        },
        behavior: {
            name: "health_percent_damage",
            data: {
                percent: 0.3,
                maxDamage: 150
            }
        },
        reloadTime: 2.5,
        hitboxRadius: 0.45,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
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
            slotDisplaySize: 30,
            selfGameRotation: 18
        },
        behavior: {
            name: "health_percent_damage",
            data: {
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
            slotDisplaySize: 45
        },
        attributes: {
            boost: 0.28
        },
        reloadTime: 3.3,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },

    // Dev bubble
    {
        idString: "dev_bub",
        displayName: "Dubble",
        description: "Powers are for the DEV",
        damage: 0,
        health: 1,
        extendable: false,
        usable: true,
        useTime: 0,
        attributes: {
            boost: 1
        },
        wearerAttributes: {
            maxHealth: 66666,
            healPerSecond: 66666
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
            slotDisplaySize: 38
        },
        reloadTime: 2.5,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        undroppable: true,
        rarity: RarityName.common
    },
    {
        idString: "card",
        displayName: "Card",
        fullName: "Joker Card",
        description: "A joker card.",
        damage: 10,
        health: 10,
        extendable: true,
        usable: false,
        behavior: {
            name: "ban_petal",
            data: {
                num: 5,
                duration: 5
            }
        },
        images: {
            slotDisplaySize: 60,
            slotRotation: 0.2
        },
        reloadTime: 2.5,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.mythic
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
            slotDisplaySize: 40,
            slotRotation: P2 / 6,
            selfGameRotation: 18
        },
        reloadTime: 2.5,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unique
    },
    {
        idString: "dandelion",
        displayName: "Dandelion",
        description: "It's interesting properties prevent healing effects on affected units",
        damage: 5,
        health: 20,
        extendable: true,
        images: {
            selfGameRotation: 0.02,
            slotDisplaySize: 45,
            slotRotation: 0.8,
            facingOut: true,
            fontSizeMultiplier: 0.8
        },
        usable: true,
        effectsOnHit: {
            modifier: {
                healing: 0
            },
            duration: 10
        },
        attributes: {
            shoot: {
                hitboxRadius: 0.6,
                damage: 5,
                health: 20,
                despawnTime: 3,
                speed: 1.1,
                definition: Projectiles.fromString("dandelion"),
                effectsOnHit: {
                    modifier: {
                        healing: 0
                    },
                    duration: 10
                }
            }
        },
        useTime: 0.2,
        reloadTime: 2.3,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "missile",
        displayName: "Missile",
        description: "You can actually shoot this one",
        damage: 15,
        health: 10,
        extendable: true,
        petalCounter: {
            missileCount: 1
        },
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
                damage: 30,
                health: 10,
                despawnTime: 3,
                speed: 1,
                definition: Projectiles.fromString("missile")
            }
        },
        useTime: 0.2,
        reloadTime: 2,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "big_missile",
        displayName: "Missile",
        description: "You can actually shoot this bigger one",
        damage: 10,
        health: 50,
        extendable: true,
        petalCounter: {
            missileCount: 1
        },
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
                damage: 20,
                health: 75,
                despawnTime: 3,
                speed: 1,
                definition: Projectiles.fromString("missile")
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
        idString: "myt_missile",
        displayName: "Missile",
        fullName: "Mecha Missile",
        description: "You can actually shoot this quickly bigger one",
        damage: 25,
        health: 13,
        extendable: true,
        images: {
            selfGameRotation: 0.02,
            slotDisplaySize: 60,
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
                health: 25,
                despawnTime: 10,
                speed: 1,
                definition: Projectiles.fromString("myt_big_missile")
            }
        },
        useTime: 0.1,
        reloadTime: 0.5,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.mythic
    }, {
        idString: "iris",
        displayName: "Iris",
        description: "Very poisonous, but takes a little while to do its work",
        damage: 5,
        health: 5,
        extendable: true,
        usable: false,
        poison: {
            damagePerSecond: 10,
            duration: 6.5
        },
        reloadTime: 6,
        hitboxRadius: 0.3,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.unusual
    }, {
        idString: "cactus",
        displayName: "Cactus",
        description: "Not very strong, but somehow increases your maximum health",
        damage: 5,
        health: 15,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 68,
            selfGameRotation: 18
        },
        wearerAttributes: {
            maxHealth: 35
        },
        reloadTime: 1,
        hitboxRadius: 0.7,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "poison_cactus",
        displayName: "Cactus",
        description: "Increases your maximum health and makes your flower toxic. Enemies hit by your flower will get poisoned",
        damage: 5,
        health: 15,
        extendable: true,
        images: {
            slotDisplaySize: 68,
            selfGameRotation: 18
        },
        usable: false,
        poison: {
            damagePerSecond: 10,
            duration: 0.6
        },
        wearerAttributes: {
            maxHealth: 35,
            bodyPoison: {
                damagePerSecond: 9,
                duration: 4.5
            }
        },
        reloadTime: 1,
        hitboxRadius: 0.7,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
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
            slotDisplaySize: 52,
            selfGameRotation: 18
        },
        wearerAttributes: {
            maxHealth: 30
        },
        reloadTime: 1,
        hitboxRadius: 0.7,
        distanceToCenter: 0.62,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 3,
        rarity: RarityName.legendary,
        usingAssets: "cactus"
    },
    {
        idString: "myt_cactus",
        displayName: "Cactus",
        fullName: "Overloaded Cactus",
        description: "Not very strong, but somehow increases your maximum health",
        damage: 5,
        health: 15,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 68,
            selfGameRotation: 18
        },
        wearerAttributes: {
            maxHealth: 50,
            bodyPoison: {
                damagePerSecond: 15,
                duration: 5
            },
            petalHealthScale: 2
        },
        poison: {
            damagePerSecond: 10,
            duration: 1
        },
        reloadTime: 1,
        hitboxRadius: 0.7,
        isDuplicate: false,
        rarity: RarityName.mythic,
        pieceAmount: 1
    },
    {
        idString: "salt",
        displayName: "Salt",
        description: "Reflects some of the damage you take back to the enemy that dealt it",
        damage: 10,
        health: 10,
        extendable: true,
        images: {
            slotDisplaySize: 50,
            selfGameRotation: 15
        },
        usable: false,
        wearerAttributes: {
            damageReflection: 0.20
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
        health: 10,
        extendable: true,
        images: {
            selfGameRotation: 18
        },
        reloadTime: 4,
        usable: false,
        hitboxRadius: 0.3,
        isDuplicate: true,
        isShowedInOne: true,
        pieceAmount: 3,
        rarity: RarityName.legendary,
        usingAssets: "stinger"
    },
    {
        idString: "myt_bubble",
        displayName: "Bubble",
        fullName: "Magic Bubble",
        description: "Physics are for the weak, but magics not",
        damage: 0,
        health: 1,
        extendable: false,
        usable: true,
        useTime: 0.1,
        images: {
            slotDisplaySize: 45
        },
        attributes: {
            moveBoost: 0.2
        },
        reloadTime: 1.4,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.mythic,
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
            slotDisplaySize: 35
        },
        wearerAttributes: {
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
            selfGameRotation: 22
        },
        attributes: {
            shoot: {
                definition: Projectiles.fromString("web"),
                speed: 0,
                hitboxRadius: 3,
                despawnTime: 5,
                effectWhenOn: {
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
            selfGameRotation: 22
        },
        attributes: {
            shoot: {
                definition: Projectiles.fromString("web"),
                speed: 0,
                hitboxRadius: 5,
                despawnTime: 5,
                effectWhenOn: {
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
        usingAssets: "web"
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
            selfGameRotation: 22
        },
        attributes: {
            shoot: {
                definition: Projectiles.fromString("web"),
                speed: 0,
                hitboxRadius: 10,
                despawnTime: 5,
                effectWhenOn: {
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
        usingAssets: "web"
    },
    {
        idString: "peas",
        displayName: "Peas",
        description: "4 in 1 deal.",
        damage: 8,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        images: {
            slotDisplaySize: 30,
            selfGameRotation: 18,
            slotRotation: 0.2
        },
        attributes: {
            peas_shoot: {
                amount: 4,
                parameters: {
                    definition: Projectiles.fromString("peas"),
                    speed: 0.5,
                    damage: 8,
                    health: 5,
                    hitboxRadius: 0.35,
                    despawnTime: 3.5
                }
            }
        },
        reloadTime: 1.2,
        hitboxRadius: 0.35,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare,
        usingAssets: "4peas"
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
            selfGameRotation: 18,
            slotRotation: 0.2
        },
        poison: {
            damagePerSecond: 10,
            duration: 1
        },
        attributes: {
            peas_shoot: {
                amount: 4,
                parameters: {
                    definition: Projectiles.fromString("poison_peas"),
                    speed: 0.8,
                    damage: 8,
                    health: 5,
                    hitboxRadius: 0.35,
                    despawnTime: 3.5,
                    poison: {
                        damagePerSecond: 10,
                        duration: 1
                    }
                }
            }
        },
        reloadTime: 1.2,
        hitboxRadius: 0.35,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic,
        usingAssets: "4poison_peas"
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
            slotDisplaySize: 40,
            selfGameRotation: 18,
            slotRotation: 0.2
        },
        poison: {
            damagePerSecond: 10,
            duration: 2
        },
        attributes: {
            peas_shoot: {
                amount: 4,
                parameters: {
                    definition: Projectiles.fromString("poison_peas"),
                    speed: 0.8,
                    damage: 10,
                    health: 5,
                    hitboxRadius: 0.46,
                    despawnTime: 4,
                    poison: {
                        damagePerSecond: 10,
                        duration: 2
                    }
                }
            }
        },
        reloadTime: 1.2,
        hitboxRadius: 0.5,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.legendary,
        usingAssets: "4poison_peas"
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
            slotDisplaySize: 40,
            selfGameRotation: 18
        },
        poison: {
            damagePerSecond: 10,
            duration: 2
        },
        attributes: {
            around_circle_shoot: {
                definition: Projectiles.fromString("poison_peas"),
                speed: 1,
                damage: 10,
                health: 5,
                hitboxRadius: 0.46,
                despawnTime: 1.1,
                poison: {
                    damagePerSecond: 10,
                    duration: 2
                },
                spawner: {
                    amount: 4,
                    type: EntityType.Projectile,
                    spawn: {
                        definition: Projectiles.fromString("poison_peas"),
                        speed: 1,
                        damage: 8,
                        health: 5,
                        hitboxRadius: 0.35,
                        despawnTime: 0.3,
                        poison: {
                            damagePerSecond: 10,
                            duration: 1
                        }
                    }
                }
            }
        },
        reloadTime: 0.3,
        hitboxRadius: 0.5,
        isDuplicate: true,
        pieceAmount: 4,
        isShowedInOne: true,
        rarity: RarityName.mythic,
        usingAssets: "poison_peas"
    },
    {
        idString: "corn",
        displayName: "Corn",
        description: "You can actually eat it",
        damage: 6,
        health: 200,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 60,
            selfGameRotation: 18
        },
        reloadTime: 10,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "dice",
        displayName: "Dice",
        description: "Roll the dice! Has a 17% chance to deal 8x damage",
        damage: 9,
        health: 32,
        extendable: true,
        usable: false,
        images: {
            slotRotation: halfPI / 2,
            slotDisplaySize: 65,
            selfGameRotation: 0.01
        },
        behavior: {
            name: "critical_hit",
            data: {
                chance: 0.17,
                multiplier: 8
            }
        },
        reloadTime: 3,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "myt_dice",
        displayName: "Dice",
        fullName: "Ominous Dice",
        description: "Check your destiny. It's not that easy.",
        damage: 15,
        health: 15,
        extendable: true,
        images: {
            slotDisplaySize: 55,
            selfGameRotation: 18
        },
        behavior: {
            name: "random",
            data: [{
                poison: {
                    damagePerSecond: 7,
                    duration: 5
                },
                effect: {
                    modifier: {
                        healing: 0
                    },
                    duration: 10
                },
                weight: 20
            }, {
                effect: {
                    modifier: {
                        petalReloadTime: 2
                    },
                    duration: 15
                },
                weight: 15
            }, {
                effect: {
                    modifier: {
                        yinYangAmount: 1,
                        revolutionSpeed: 0.5,
                        speed: -1
                    },
                    duration: 3
                },
                weight: 25
            }, {
                effect: {
                    modifier: {
                        zoomScale: 0.5
                    },
                    duration: 7.5
                },
                weight: 15
            }, {
                effect: {
                    modifier: {
                        maxHealth: 0.5
                    },
                    duration: 7.5
                },
                weight: 15
            }, {
                effect: {
                    modifier: {
                        shocked: true,
                        armor: -20
                    },
                    duration: 7.5
                },
                weight: 5
            }, {
                damage: 65535,
                weight: 5
            }]
        },
        reloadTime: 3,
        usable: false,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.mythic
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
            slotDisplaySize: 45,
            selfGameRotation: 18
        },
        behavior: {
            name: "damage_avoidance",
            data: 0.7
        },
        reloadTime: 2.5,
        hitboxRadius: 0.75,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
    },
    {
        idString: "pincer",
        displayName: "Pincer",
        description: "A deadly pincer that poisons and paralyzes enemies",
        damage: 5,
        health: 5,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 46,
            selfGameRotation: 0.01
        },
        poison: {
            damagePerSecond: 10,
            duration: 1
        },
        effectsOnHit: {
            modifier: {
                speed: 0
            },
            duration: 0.8
        },
        reloadTime: 1.25,
        hitboxRadius: 0.45,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    }, {
        idString: "antennae",
        displayName: "Antennae",
        description: "Allows your flower to sense foes farther away.",
        equipment: true,
        images: {
            slotDisplaySize: 60,
            equipmentStyles: {
                noRender: false,
                coordsToOwner: {
                    x: 0,
                    y: 27,
                    scale: 1
                }
            }
        },
        hitboxRadius: 0.7,
        wearerAttributes: {
            zoom: 30
        },
        rarity: RarityName.legendary
    }, {
        idString: "myt_antennae",
        fullName: "Mecha Antennae",
        displayName: "Antennae",
        description: "Allows your flower to sense foes farther farther away. Also turns you into an Overlord.",
        equipment: true,
        images: {
            slotDisplaySize: 60
        },
        hitboxRadius: 0.9,
        wearerAttributes: {
            zoom: 45,
            leadMissiles: true
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
        wearerAttributes: {
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
        wearerAttributes: {
            controlRotation: true
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
                    zIndex: -1
                }
            }
        },
        hitboxRadius: 0.6,
        unstackable: true,
        wearerAttributes: {
            extraDistance: 1
        },
        rarity: RarityName.legendary,
        undroppable: true // TEMPORARY: TOREMOVE: spawn in game for testing purposes, remove this when added to drops
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
                    zIndex: -1
                }
            }
        },
        hitboxRadius: 0.6,
        wearerAttributes: {
            extraDistance: 10
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
        wearerAttributes: {
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
        rarity: RarityName.unique
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
        wearerAttributes: {
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
        usingAssets: "yggdrasil"
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
            centerYOffset: 0.05
        },
        reloadTime: 2,
        hitboxRadius: 0.55,
        isDuplicate: false,
        pieceAmount: 1,
        effectiveFirstReload: true,
        undroppable: true, // TEMPORARY: TOREMOVE: spawn in game for testing purposes, remove this when added to drops
        rarity: RarityName.legendary
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
                definition: Projectiles.fromString("pollen"),
                speed: 0,
                damage: 8,
                health: 5,
                hitboxRadius: 0.3,
                despawnTime: 5,
                accelerationF: 8
            }
        },
        reloadTime: 1,
        hitboxRadius: 0.3,
        isDuplicate: true,
        pieceAmount: 3,
        isShowedInOne: false,
        rarity: RarityName.epic
    },
    {
        idString: "myt_pollen",
        fullName: "Allergic Pollen",
        displayName: "Pollen",
        description: "Asthmatics beware. Maybe this time for true.",
        damage: 8,
        health: 5,
        extendable: false,
        usable: true,
        useTime: 0.2,
        attributes: {
            place_projectile: {
                definition: Projectiles.fromString("pollen"),
                speed: 0,
                damage: 8,
                health: 5,
                hitboxRadius: 0.3,
                despawnTime: 5,
                accelerationF: 1,
                effectsOnHit: {
                    modifier: {
                        armor: -4
                    },
                    duration: 5
                }
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
            slotDisplaySize: 60
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
            slotDisplaySize: 72.5
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
        idString: "talisman",
        displayName: "Talisman",
        description: "A necklace that allows the wearer to anticipate enemy attacks",
        damage: 10,
        health: 10,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 60,
            selfGameRotation: 0.01
        },
        wearerAttributes: {
            damageAvoidanceByDamage: true
        },
        // unstackable: true,
        reloadTime: 2.5,
        hitboxRadius: 0.45,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
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
            slotDisplaySize: 60,
            selfGameRotation: 240,
            fontSizeMultiplier: 0.9
        },
        wearerAttributes: {
            yinYangAmount: 1
        },
        reloadTime: 1,
        hitboxRadius: 0.55,
        isDuplicate: false,
        effectiveFirstReload: true,
        pieceAmount: 1,
        rarity: RarityName.epic
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
        behavior: {
            name: "area_poison",
            data: {
                radius: 15,
                damagePerSecond: 20
            }
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
        damage: 5,
        health: 20,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 65,
            selfGameRotation: 18
        },
        effectsOnHit: {
            modifier: {
                speed: 0.95,
                revolutionSpeed: 0.85
            },
            duration: 8
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
            slotDisplaySize: 65,
            selfGameRotation: 18
        },
        attributes: {
            absorbing_shield: 25
        },
        reloadTime: 3,
        hitboxRadius: 0.8,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.epic
    },
    {
        idString: "heaviest",
        displayName: "Heaviest",
        description: "This thing is so heavy that nothing gets in the way.",
        damage: 8,
        health: 100,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 60,
            selfGameRotation: 18
        },
        behavior: {
            name: "damage_reduction_percent",
            data: {
                percent: 0.75,
                from: [EntityType.Petal]
            }
        },
        reloadTime: 10,
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
            slotRotation: 0.3
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
            slotRotation: 0.3
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
        damage: 13,
        health: 45,
        extendable: true,
        usable: false,
        images: {
            slotDisplaySize: 55,
            selfGameRotation: 18
        },
        reloadTime: 4.5,
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
            slotDisplaySize: 78,
            slotRotation: -(90 - 32.5) * (Math.PI / 180),
            facingOut: true
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
            selfGameRotation: 0.25

        },
        behavior: {
            name: "damage_heal",
            data: {
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
            slotDisplaySize: 65,
            selfGameRotation: 0.15
        },
        petalModifiers: {
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
        behavior: {
            name: "lightning",
            data: {
                attenuation: 0.9,
                range: 10,
                bounces: 8
            }
        },
        reloadTime: 1.25,
        hitboxRadius: 0.6,
        isDuplicate: false,
        pieceAmount: 1,
        rarity: RarityName.rare
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
        behavior: {
            name: "lightning",
            data: {
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
    },
    {
        idString: "cutter",
        displayName: "Cutter",
        description: "A friend used to own this... now it's time for revenge.Increases body damage.",
        equipment: true,
        images: {
            slotDisplaySize: 55,
            slotRotation: -(22.5) * (Math.PI / 180),
            fontSizeMultiplier: 0.8,
            equipmentStyles: {
                noRender: false,
                coordsToOwner: {
                    x: 0,
                    y: 0,
                    scale: 2
                }
            }
        },
        hitboxRadius: 0.6,
        unstackable: true,
        wearerAttributes: {
            bodyDamage: 2
        },
        rarity: RarityName.epic
    },
    {
        idString: "smasher",
        displayName: "Smasher",
        description: "Steady.",
        equipment: true,
        images: {
            slotDisplaySize: 55,
            fontSizeMultiplier: 0.8,
            equipmentStyles: {
                noRender: false,
                coordsToOwner: {
                    x: 0,
                    y: 0,
                    scale: 2
                }
            }
        },
        hitboxRadius: 0.6,
        unstackable: true,
        wearerAttributes: {
            knockbackReduction: 0.5
        },
        rarity: RarityName.epic
    },
    {
        idString: "disc",
        displayName: "Disc",
        description: "Reduces damages taken from collisions with mobs and flowers.",
        equipment: true,
        images: {
            slotDisplaySize: 55,
            fontSizeMultiplier: 0.8,
            equipmentStyles: {
                noRender: false,
                coordsToOwner: {
                    x: 0,
                    y: 0,
                    scale: 2
                }
            }
        },
        hitboxRadius: 0.6,
        unstackable: true,
        wearerAttributes: {
            bodyDamageReduction: 0.5
        },
        rarity: RarityName.epic
    }
] as const satisfies Array<Readonly<PetalDefinition>>;

export const Petals = new Definitions<PetalDefinition>(PetalDefinitions);

export type AttributeNames = keyof AttributeParameters;
