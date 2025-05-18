import ServerLivelyEntity from "../lively";

export interface Damage {
    amount: number
    source: ServerLivelyEntity
    to: ServerLivelyEntity
    type: DamageType
}

export enum DamageType {
    COLLISION,
    POISON,
    DAMAGE_REFLECTION
}
