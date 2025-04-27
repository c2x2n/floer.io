import { ServerEntity } from "./serverEntity";
import { type EntitiesNetData } from "../../../common/src/packets/updatePacket";
import { CircleHitbox } from "../../../common/src/utils/hitbox";
import { EntityType } from "../../../common/src/constants";
import { PetalDefinition } from "../../../common/src/definitions/petal";
import { ServerPlayer } from "./serverPlayer";
import { CollisionResponse } from "../../../common/src/utils/collision";
import { AttributeEvents, PetalUsingAnimations, } from "../utils/attribute";
import { collideableEntity, damageableEntity, damageSource } from "../typings";
import { PetalBunch } from "../inventory/petalBunch";
import { ServerFriendlyMob, ServerMob } from "./serverMob";

export class ServerPetal extends ServerEntity<EntityType.Petal> {
    type: EntityType.Petal = EntityType.Petal;

    owner: ServerPlayer;

    hitbox: CircleHitbox;
    definition: PetalDefinition;

    _isReloading: boolean = false;

    _hidden: boolean = false;

    get hidden(): boolean {
        return this._hidden;
    }

    set hidden(value: boolean) {
        this._hidden = value;

        this.setDirty();
    }

    get isReloading(): boolean {
        return this._isReloading;
    }

    set isReloading(isReloading: boolean) {
        if (this._isReloading === isReloading) return;
        this._isReloading = isReloading;
        if (isReloading || this.definition.equipment) {
            this.reloadTime = 0;
        } else {
            this.health = this.definition.health;
            this.isLoadingFirstTime = false;
            this.useReload = 0;
        }
        this.setDirty();
    }

    isUsing?: PetalUsingAnimations;
    reloadTime: number = 0;
    useReload: number = 0;
    petalBunch: PetalBunch;

    isLoadingFirstTime: boolean = true;

    readonly damage?: number;
    health?: number;

    knockback: number = 0.00002;
    weight = 0.0002;

    spawned?: ServerMob;

    get canUse(): boolean {
        if (!this.definition.equipment && this.definition.usable)
            return this.useReload >= this.definition.useTime;
        return false;
    }

    canReceiveDamageFrom(source: damageableEntity): boolean {
        if (!this.health) return false;
        return this.owner.canReceiveDamageFrom(source);
    }

    canCollideWith(entity: ServerEntity): boolean {
        return !this.definition.equipment && super.canCollideWith(entity);
    }

    isActive(): boolean {
        return !this.isReloading && !this.isUsing && !this.destroyed;
    }

    constructor(petalBunch: PetalBunch, definition: PetalDefinition) {
        const player = petalBunch.player;
        super(player.game, player.position);
        this.petalBunch = petalBunch;

        this.position = player.position;
        this.definition = definition;
        this.owner = player;

        this.hitbox = new CircleHitbox(definition.hitboxRadius);
        if (!(definition.equipment)) {
            this.damage = definition.damage;
            this.health = definition.health;
        }
    }

    join(): void {
        this.game.grid.addEntity(this);
        this.isReloading = true;
    }

    tick(): void{
        if (this.owner.overleveled) {
            this.isReloading = true;
            this.isLoadingFirstTime = true;
            this.spawned?.destroy()
            return;
        }

        if (!this.definition.equipment) {
            if (this.isReloading) {
                if (
                    !this.definition.reloadTime
                    || this.reloadTime >= this.definition.reloadTime
                ) {
                    this.isReloading = false;
                }
                this.reloadTime += this.game.dt;
                this.position = this.owner.position;
            } else if (this.isUsing) {
                if (this.isUsing === PetalUsingAnimations.ABSORB) {
                    this.position = this.owner.position;
                } else if (this.isUsing === PetalUsingAnimations.HATCH) {
                    const isSandstorm = this.definition.attributes?.spawner?.idString === "sandstorm";

                    if (isSandstorm) {
                        this.isUsing = undefined;
                        this.useReload = 0;
                        this.hidden = false;
                    } else if (!this.spawned || this.spawned.destroyed) {
                        this.isReloading = true;
                        this.isUsing = undefined;
                        this.useReload = 0;
                        this.hidden = false;
                    }
                }
            } else {
                if (this.definition.usable) {
                    this.useReload += this.game.dt;
                    if (this.canUse) {
                        this.owner.sendEvent(AttributeEvents.CAN_USE, undefined, this)
                    }
                }
            }
        } else {
            this.isLoadingFirstTime = false;
            this.isReloading = false;
            this.position = this.owner.position;
        }
    }

    gotDamage: boolean = false;

    startUsing(animation: PetalUsingAnimations, func?: Function): void{
        this.isUsing = animation;

        if (this.isUsing === PetalUsingAnimations.HATCH) {
            const isSandstorm = this.definition.attributes?.spawner?.idString === "sandstorm";

            if (isSandstorm) {
                setTimeout(() => {
                    this.isUsing = undefined;
                    this.useReload = 0;
                }, 10);
                return;
            } else {
                this.hidden = true;
            }
            return;
        }

        setTimeout(() => {
            if (!this.isReloading) {
                this.isReloading = true;
                if(func) func()
            }
            this.isUsing = undefined;
            this.useReload = 0;
        }, animation === PetalUsingAnimations.NORMAL ? 0 : 100);
    }

    dealDamageTo(to: damageableEntity): void{
        if (this.definition.doesNotDamage?.includes(to.type)) {
            return;
        };
        if (this.damage && to.canReceiveDamageFrom(this)) {
            to.receiveDamage(this.damage, this.owner);
            this.owner.sendEvent(
                AttributeEvents.PETAL_DEAL_DAMAGE,
                to,
                this
            )
        }
    }

    receiveDamage(amount: number, source: damageSource) {
        if (!this.health) return;
        if (!this.isActive()) return;

        this.health -= amount;

        if (amount > 0) this.gotDamage = true;

        if (this.health <= 0) {
            this.isReloading = true;
        }
    }

    collideWith(collision: CollisionResponse, entity: collideableEntity): void{}

    get data(): Required<EntitiesNetData[EntityType.Petal]>{
        const data = {
            position: this.position,
            isReloading: this.isReloading || this.hidden,
            gotDamage: this.gotDamage,
            full: {
                definition: this.definition,
                ownerId: this.owner.id,
            }
        };
        this.gotDamage = false
        return data;
    };

    destroy() {
        super.destroy();
        if (this.spawned) this.spawned.destroy();
    }
}
