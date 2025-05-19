import { P2 } from "../../../../common/src/engine/maths/constants";
import { Random } from "../../../../common/src/engine/maths/random";
import { UVector2D } from "../../../../common/src/engine/physics/uvector";
import { type Game } from "../game";
import { RenderContainer } from "./misc";
import VectorAbstract from "../../../../common/src/engine/physics/vectorAbstract";
import { Numeric } from "../../../../common/src/engine/maths/numeric";
import { EasingFunctions } from "../../../../common/src/engine/maths/easing";

export class ParticleManager {
    particles: Particle[] = [];

    constructor(public game: Game) { }

    spawnParticle(options: ParticleOptions): Particle {
        const particle = new Particle(options, this.game.getCanvasCtx());
        this.particles.push(particle);
        return particle;
    }

    particlesCount() {
        return this.particles.length;
    }

    spawnParticles(amount: number, options: () => ParticleOptions) {
        for (let i = 0; i < amount; i++) {
            this.spawnParticle(options());
        }
    }

    render(dt: number) {
        for (let i = 0; i < this.particles.length; i++) {
            const part = this.particles[i];

            if (part.dead) {
                this.particles.splice(i, 1);
                continue;
            }

            part.render(dt);
        }
    }
}

interface MinMax {
    min: number
    max: number
}

type ParticleOption = (MinMax | {
    start: number
    end: number
} | {
    value: number
}) & {
    /**
     * Easing function
     * Defaults to linear lerp
     */
    easing?: (t: number) => number
};

interface ParticleOptions {
    /** Particle initial position */
    position: VectorAbstract
    /** Particle sprite zIndex */
    zIndex?: number
    /** Particle Sprite tint */
    tint?: string
    /** Particle life time in seconds */
    lifeTime: MinMax | number
    /** Particle rotation */
    rotation: ParticleOption
    /** Particle speed */
    speed: ParticleOption
    /** Direction particle will move to */
    direction: ParticleOption
    /** Particle scale */
    scale: ParticleOption
    /** Particle alpha */
    alpha: ParticleOption
}

function getMinMax(option: ParticleOption) {
    let start: number;
    let end: number;
    if ("min" in option) {
        start = end = Random["float"](option.min, option.max);
    } else if ("start" in option && "end" in option) {
        start = option.start;
        end = option.end;
    } else {
        start = option.value;
        end = option.value;
    }
    return {
        start,
        end,
        easing: option.easing ?? EasingFunctions.linear,
        value: start
    };
}

type ParticleInterpData = Omit<ParticleOptions, "position" | "sprite" | "lifeTime">;

class Particle {
    dead = false;
    tick = 0;
    end: number;
    position: VectorAbstract;

    container: RenderContainer;

    data: {
        [K in keyof ParticleInterpData]: {
            start: number
            end: number
            value: number
            easing: (t: number) => number
        }
    };

    constructor(
        private options: ParticleOptions
        , private ctx: CanvasRenderingContext2D
    ) {
        this.position = options.position;

        if (typeof options.lifeTime === "number") {
            this.end = options.lifeTime;
        } else {
            this.end = Random["float"](options.lifeTime.min, options.lifeTime.max);
        }

        this.data = {
            rotation: getMinMax(options.rotation),
            speed: getMinMax(options.speed),
            direction: getMinMax(options.direction),
            scale: getMinMax(options.scale),
            alpha: getMinMax(options.alpha)
        };

        this.container = new RenderContainer(ctx);

        this.container.renderFunc = this.draw.bind(this);
    }

    render(dt: number) {
        this.tick += dt;
        if (this.tick > this.end) {
            this.dead = true;
        }

        const t = this.tick / this.end;

        for (const key in this.data) {
            const data = this.data[key as keyof ParticleInterpData];
            data!.value = Numeric.lerp(data!.start, data!.end, data!.easing(t));
        }

        this.position = UVector2D.add(
            this.position,
            UVector2D.fromPolar(this.data.direction.value, this.data.speed.value * dt)
        );

        if (!this.options.tint) return;

        const position = this.position;
        const rotation = this.data.rotation.value;
        const alpha = this.data.alpha.value;
        const scale = this.data.scale.value;

        this.container.position = position;
        this.container.rotation = rotation;
        this.container.alpha = alpha;
        this.container.scale = scale;

        this.container.render(dt);
    }

    draw() {
        if (!this.options.tint) return;

        const { ctx } = this;

        ctx.fillStyle = this.options.tint;
        ctx.beginPath();

        ctx.arc(
            0,
            0,
            1,
            0, P2
        );

        ctx.fill();
    }
}
