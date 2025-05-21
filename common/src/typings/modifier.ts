import { PoisonDataType } from "./effect";

export type PlayerModifiers = Modifiers & {
    healing: number
    maxHealth: number
    revolutionSpeed: number
    zoom: number
    damageAvoidanceByDamage: boolean
    yinYangAmount: number
    conditionalHeal?: {
        healthPercent: number
        healAmount: number
    }
    revive?: {
        healthPercent?: number
        shieldPercent?: number
        destroyAfterUse: boolean
    }
    extraDistance: number
    controlRotation: boolean
    extraSlot: number
    bodyDamage: number
    knockbackReduction: number
    bodyDamageReduction: number
};

export interface Modifiers {
    healPerSecond: number
    speed: number
    healing: number
    armor: number
    damageReceiveChance: number
    damageReflection: number
    bodyPoison: PoisonDataType
}
