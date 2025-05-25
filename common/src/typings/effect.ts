import { PlayerModifiers } from "./modifier";

export type PoisonDataType = {
    damagePerSecond: number
    duration: number
};

export type EffectsOnHitDataType = {
    modifier: Partial<PlayerModifiers>
    duration: number
};
