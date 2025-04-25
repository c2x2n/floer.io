import { type BLEND_MODES, Sprite, type TextureSourceLike, type ColorSource } from "pixi.js";
import { EasingFunctions, MathNumeric } from "@common/utils/math.ts";
import { Random } from "@common/utils/random.ts";
import { Vec2, type Vector } from "@common/utils/vector.ts";
import { type Game } from "../game.ts";
import { Camera } from "../render/camera.ts";

export class ParticleManager {
    particles: Particle[] = [];

    constructor(public game: Game) { }

    spawnParticle(options: ParticleOptions): Particle {
        const particle = new Particle(options);
        this.game.camera.addObject(particle.sprite);
        this.particles.push(particle);
        return particle;
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
                part.destroy();
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
    position: Vector
    /** Particle frame id */
    sprite: TextureSourceLike
    /** Particle sprite zIndex */
    zIndex?: number
    /** Particle sprite blend mode */
    blendMode?: BLEND_MODES
    /** Particle Sprite tint */
    tint?: ColorSource
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
        start = end = Random.float(option.min, option.max);
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
    position: Vector;

    sprite: Sprite;

    data: {
        [K in keyof ParticleInterpData]: {
            start: number
            end: number
            value: number
            easing: (t: number) => number
        }
    };

    constructor(options: ParticleOptions) {
        this.position = options.position;

        this.sprite = Sprite.from(options.sprite);
        this.sprite.visible = false;
        this.sprite.anchor.set(0.5);

        if (options.zIndex) {
            this.sprite.zIndex = options.zIndex;
        }
        if (options.blendMode) {
            this.sprite.blendMode = options.blendMode;
        }
        if (options.tint) {
            this.sprite.tint = options.tint;
        }

        if (typeof options.lifeTime === "number") {
            this.end = options.lifeTime;
        } else {
            this.end = Random.float(options.lifeTime.min, options.lifeTime.max);
        }

        this.data = {
            rotation: getMinMax(options.rotation),
            speed: getMinMax(options.speed),
            direction: getMinMax(options.direction),
            scale: getMinMax(options.scale),
            alpha: getMinMax(options.alpha)
        };
    }

    render(dt: number) {
        this.tick += dt;
        if (this.tick > this.end) {
            this.dead = true;
        }

        this.sprite.visible = true;

        const t = this.tick / this.end;

        for (const key in this.data) {
            const data = this.data[key as keyof ParticleInterpData];
            data!.value = MathNumeric.lerp(data!.start, data!.end, data!.easing(t));
        }

        this.sprite.rotation = this.data.rotation.value;
        this.sprite.scale = this.data.scale.value;
        this.sprite.alpha = this.data.alpha.value;

        this.position = Vec2.add(
            this.position,
            Vec2.fromPolar(this.data.direction.value, this.data.speed.value * dt)
        );
        this.sprite.position = this.position; //Camera.vecToScreen(this.position)
    }

    destroy() {
        this.sprite.destroy();
    }
}
