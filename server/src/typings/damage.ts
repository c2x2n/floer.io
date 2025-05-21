import ServerLivelyEntity from "../entity/livelyEntity";

export interface Damage {
    amount: number
    source: ServerLivelyEntity
    to: ServerLivelyEntity
    type: DamageType
}

export enum DamageType {
    COLLISION,
    POISON,
    DAMAGE_REFLECTION,
    PHYSICAL
}
