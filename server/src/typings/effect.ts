import { EntityType } from "../../../common/src/constants";
import { PlayerModifiers } from "../../../common/src/typings/modifier";
import ServerLivelyEntity from "../entity/livelyEntity";

export interface EffectData {
    readonly effectedTarget: ServerLivelyEntity
    readonly source: ServerLivelyEntity
    readonly workingType?: EntityType[]
    readonly duration: number
    readonly callback?: (dt: number, effected: ServerLivelyEntity) => void
    readonly modifier?: Partial<PlayerModifiers>
}

export interface PoisonEffectData {
    readonly effectedTarget: ServerLivelyEntity
    readonly source: ServerLivelyEntity
    readonly duration: number
    readonly damagePerSecond: number
}
