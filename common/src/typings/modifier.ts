import { PoisonDataType } from "./effect";

export type PlayerModifiers = Modifiers & {
    healing: number
    maxHealth: number
    maxHealthScale: number
    revolutionSpeed: number
    zoom: number
    zoomScale: number
    damageAvoidanceByDamage: boolean
    yinYangAmount: number
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
    petalHealthScale: number
    leadMissiles: boolean
    aggroRange: number
    cursed: boolean
    petalReloadTime: number
    shocked: boolean
    bodyPoison: PoisonDataType
};

export interface Modifiers {
    healPerSecond: number
    speed: number
    healing: number
    armor: number
    damageReceiveChance: number
    damageReflection: number
}
