export type PlayerModifiers = Modifiers & {
    healing: number;
    maxHealth: number;
    revolutionSpeed: number;
    zoom: number;
    damageAvoidanceChance: number;
	damageAvoidanceByDamage: boolean;
    yinYangAmount: number;
    conditionalHeal?: {
        healthPercent: number;
        healAmount: number;
    };
    revive?: {
        healthPercent?: number;
        shieldPercent?: number;
        destroyAfterUse: boolean;
    }
    extraDistance: number;
    controlRotation: boolean;
    extraSlot: number;
}

export interface Modifiers {
    healPerSecond: number;
    speed: number;
    selfPoison: number;
}
