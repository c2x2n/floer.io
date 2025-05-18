import { Effect } from "./effect";
import { ServerEntity } from "../entity";

export class EffectManager {
    effects = new Set<Effect>();

    constructor(public owner: ServerEntity) {}

    tick() {
        this.effects.forEach(e => {
            e.tick(this.owner.game.dt);
        });
    }

    addEffect(effect: Effect) {
        if (effect.effectedTarget != this.owner) return;
        this.effects.add(effect);
    }

    removeEffect(effect: Effect) {
        if (effect.effectedTarget != this.owner) return;
        this.effects.delete(effect);
    }
}
