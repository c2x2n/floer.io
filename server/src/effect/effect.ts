import { ServerEntity } from "../entities/serverEntity";
import { damageSource } from "../typings";
import { EntityType } from "../../../common/src/constants";
import { PlayerModifiers } from "../../../common/src/typings";
import { EffectData } from "./typings";

export class Effect {
    time = 0;

    hasStarted = false;

    readonly effectedTarget: ServerEntity;
    readonly source: damageSource;
    readonly workingType?: EntityType[];
    readonly duration: number;
    readonly callback?: EffectData["callback"];
    readonly modifier?: Partial<PlayerModifiers>;

    public constructor(data: EffectData) {
        this.effectedTarget = data.effectedTarget;
        this.source = data.source;
        this.workingType = data.workingType;
        this.duration = data.duration;
        this.callback = data.callback;
        this.modifier = data.modifier;
    }

    public start() {
        if (this.workingType && !this.workingType.includes(this.effectedTarget.type)) {
            return;
        }
        this.effectedTarget.effects.addEffect(this);
        this.hasStarted = true;
    }

    public tick(dt: number) {
        this.time += dt;
        if (this.callback) this.callback(dt, this.effectedTarget);
        if (this.time >= this.duration) this.destroy();
    }

    public destroy() {
        this.effectedTarget.effects.removeEffect(this);
    }
}
