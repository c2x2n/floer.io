import ServerLivelyEntity from "./livelyEntity";
import { MobCategory, MobDefinition } from "../../../common/src/definitions/mobs";
import { ServerMob } from "./serverMob";
import { CircleHitbox } from "../../../common/src/engine/physics/hitbox";
import { Random } from "../../../common/src/engine/maths/random";
import { Geometry } from "../../../common/src/engine/maths/geometry";
import { UVector2D } from "../../../common/src/engine/physics/uvector";
import { GameConstants } from "../../../common/src/constants";
import VectorAbstract from "../../../common/src/engine/physics/vectorAbstract";
import { ProjectileParameters } from "../../../common/src/definitions/projectiles";
import spawnProjectile from "./spawning/projectile";
import { ServerGame } from "../game";
import { Numeric } from "../../../common/src/engine/maths/numeric";
import Vector from "../../../common/src/engine/physics/vector";

export default class MobAI {
    public isEinstein: boolean;

    public targeted: ServerLivelyEntity | null = null;

    public state: AIState = AIState.Idle;

    public type: MobCategory;

    public aggroRadius = 0;

    public definition: MobDefinition;
    /* Whether mob can shoot */
    public shootable = false;

    public game: ServerGame;

    public constructor(private readonly mob: ServerMob, isEinstein: boolean = Math.random() < 0.2) {
        this.isEinstein = isEinstein;
        this.definition = mob.definition;
        this.type = this.definition.category;
        this.shootable = !!this.definition.shootable;
        this.game = mob.game;
        if (this.definition.category === MobCategory.Enemy) this.aggroRadius = this.definition.aggroRadius;
        if (this.definition.category === MobCategory.Fixed) this.state = AIState.Locked;
    }

    public changeAggroTo(target: ServerLivelyEntity) {
        if (this.targeted) return;
        if (this.definition.category === MobCategory.Unactive
            || this.definition.category === MobCategory.Fixed) return;
        this.targeted = target;
    }

    public getTargetAround(): ServerLivelyEntity | null {
        if (this.targeted || !this.aggroRadius) {
            return this.targeted?.isActive() ? this.targeted : this.targeted = null;
        }
        const aggro = new CircleHitbox(
            this.aggroRadius, this.mob.position
        );

        const entities
            = this.mob.game.grid.intersectsHitbox(aggro);

        const aggroable = Array.from(entities)
            .filter(e =>
                (e instanceof ServerLivelyEntity)
                && aggro.collidesWith(e.hitbox)) as ServerLivelyEntity[];

        let closestEntity: ServerLivelyEntity | null = null;
        let closestDistance = Infinity;

        for (const entity of aggroable) {
            if (!entity.isActive()) continue;
            if (entity.team === this.mob.team) continue;
            if (entity.parent) continue;

            const distance = UVector2D.distanceBetween(
                aggro.position,
                entity.position
            );

            if (distance >= closestDistance) continue;

            closestDistance = distance;
            closestEntity = entity;
        }

        this.targeted = closestEntity;
        return closestEntity;
    }

    public wipe() {
        this.targeted = null;
        this.state = AIState.Idle;
    }

    protected shootSpeedForNow?: number;
    protected shootReload = 0;

    shoot(shoot: ProjectileParameters): void {
        if (!this.targeted) return;

        if (this.isEinstein) {
            const differenceXY = this.mob.position.clone()
                .sub(this.targeted.position);
            let distance = UVector2D.distanceBetween(this.mob.position, this.targeted.position);
            if (distance === 0) distance = 1;

            const unitDistancePerp = {
                x: differenceXY.y / distance,
                y: -differenceXY.x / distance
            };

            let entPerpComponent = unitDistancePerp.x * this.targeted.velocity.x
                + unitDistancePerp.y * this.targeted.velocity.y;

            entPerpComponent = Numeric.clamp(entPerpComponent, shoot.speed * -0.9, shoot.speed * 0.9);

            const directComponent = Math.sqrt(shoot.speed ** 2 - entPerpComponent ** 2);
            const offset = (entPerpComponent / directComponent * distance) / 2;
            const nP: VectorAbstract = {
                x: this.targeted.position.x + offset * unitDistancePerp.x,
                y: this.targeted.position.y + offset * unitDistancePerp.y
            };

            this.mob.direction = Geometry.directionBetweenPoints(
                nP,
                this.mob.position
            );
        }

        const position = shoot.definition.onGround
            ? this.mob.position
            : this.mob.position.clone().add(UVector2D.mul(this.mob.direction, this.mob.hitbox.radius));

        spawnProjectile(this.mob,
            position,
            this.mob.direction, shoot);
    }

    shootTick(): void {
        if (!this.definition.shootable) return;

        if (!this.shootSpeedForNow) {
            if (typeof this.definition.shootSpeed === "number") {
                this.shootSpeedForNow = this.definition.shootSpeed;
            } else {
                this.shootSpeedForNow
                    = Random.float(
                        this.definition.shootSpeed.min,
                        this.definition.shootSpeed.max
                    );
            }
        }

        this.shootReload += this.game.dt;
        if (this.shootReload >= this.shootSpeedForNow) {
            this.shoot(this.definition.shoot);
            this.shootReload = 0;
            this.shootSpeedForNow = undefined;
        }
    }

    move(): void {
        this.mob.maintainAcceleration(Geometry.directionToRadians(this.mob.direction), this.mob.speed);
    }

    protected reachTarget(): void {
        const target = this.targeted;
        if (!target) return;
        const position = this.mob.position;
        const distanceBetween = UVector2D.distanceBetween(target.position, position);
        if (this.aggroRadius && distanceBetween > this.aggroRadius * 2.2) return this.wipe();

        const direction = Geometry.directionBetweenPoints(
            target.position, position
        );

        if (this.shootable) {
            if (this.shootSpeedForNow && this.definition.movement?.reachingAway) {
                const reachingAwayRadius = Math.max(15, this.aggroRadius * 0.8);
                if (distanceBetween <= reachingAwayRadius) {
                    this.shootTick();
                } else {
                    this.move();
                }
            } else {
                this.move();
                this.shootTick();
            }
        } else {
            this.move();
        }
        this.mob.direction = direction;
    }

    walkingReload = 0;
    walkingTime = 0;

    public tick() {
        if (this.state === AIState.Locked) return;

        if (this.state === AIState.Backing) {
            this.targeted = null;
            return;
        }

        const target = this.getTargetAround();
        if (target) {
            this.state = AIState.GetTarget;
            this.reachTarget();
        } else {
            this.state = AIState.Idle;
            this.walkingReload += this.game.dt;

            if (this.walkingReload >= GameConstants.mob.walkingReload) {
                if (this.walkingTime === 0) this.mob.direction = Random.vector(-1, 1, -1, 1);

                this.move();

                this.walkingTime += this.game.dt;

                if (this.walkingTime >= GameConstants.mob.walkingTime) {
                    this.walkingReload = 0;
                    this.walkingTime = 0;
                }
            }
        }
    }
}

export enum AIState {
    Idle,
    Locked,
    GetTarget,
    Backing
}
