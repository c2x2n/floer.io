import { ServerEntity } from "../entities/serverEntity";
import { damageSource } from "../typings";
import { EntityType } from "../../../common/src/constants";
import { PlayerModifiers } from "../../../common/src/typings";

export interface EffectData {
    readonly effectedTarget: ServerEntity
    readonly source: damageSource
    readonly workingType?: EntityType[]
    readonly duration: number
    readonly callback?: (dt: number, effected: ServerEntity) => void
    readonly modifier?: Partial<PlayerModifiers>
}

export interface PoisonEffectData {
    readonly effectedTarget: ServerEntity
    readonly source: damageSource
    readonly duration: number
    readonly damagePerSecond: number
}
