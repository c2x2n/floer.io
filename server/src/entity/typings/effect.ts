import { ServerEntity } from "../entity";
import { damageSource } from "../../typings";
import { EntityType } from "../../../../common/src/constants";
import { PlayerModifiers } from "../../../../common/src/typings";
import ServerLivelyEntity from "../lively";

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
