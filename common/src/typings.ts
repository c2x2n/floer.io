import { GameConstants } from "./constants";

export type PlayerModifiers = Modifiers & {
    healing: number;
    maxHealth: number;
    revolutionSpeed: number;
    zoom: number;
    damageAvoidanceChance: number;
	damageAvoidanceByDamage: boolean;
    yinYangs: number;
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
}

export interface Modifiers {
    healPerSecond: number;
    speed: number;
    selfPoison: number;
}
