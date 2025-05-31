import { ServerEntity } from "./serverEntity";
import { CircleHitbox } from "../../../common/src/engine/physics/hitbox";
import { EntityType } from "../../../common/src/constants";
import { PetalDefinition } from "../../../common/src/definitions/petals";
import { ServerPlayer } from "./serverPlayer";
import { AttributeEvents, PetalUsingAnimations } from "../systems/petal/attributeRealizes";
import { PetalBunch } from "../systems/inventory/petalBunch";
import { ServerMob } from "./serverMob";
import { UVector2D } from "../../../common/src/engine/physics/uvector";
import ServerLivelyEntity from "./livelyEntity";
import { Damage } from "../typings/damage";
import { EntitiesNetData } from "../../../common/src/engine/net/entitySerializations";

export class ServerPetal extends ServerLivelyEntity<EntityType.Petal> {
    type: EntityType.Petal = EntityType.Petal;

    owner: ServerPlayer;

    readonly name: string = "Petal";

    hitbox: CircleHitbox;
    definition: PetalDefinition;

    _isReloading = false;

    _hidden = false;

    get maxHealth(): number {
        return this._maxHealth * this.owner.modifiers.petalHealthScale;
    }

    set maxHealth(value: number) {
        super.maxHealth = value;
    }

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
            if (this.definition.health) this.health = this.maxHealth;
            this.isLoadingFirstTime = false;
            this.useReload = 0;
        }
        this.setDirty();
    }

    isUsing?: PetalUsingAnimations;
    reloadTime = 0;
    get fullReloadTime(): number {
        if (this.definition.equipment) return 0;
        return this.definition.reloadTime
            ? this.definition.reloadTime * this.owner.modifiers.petalReloadTime + (this.isLoadingFirstTime ? 2.5 : 0)
            : 0;
    }

    useReload = 0;
    petalBunch: PetalBunch;

    isLoadingFirstTime = true;

    knockback = 0.00002;
    weight = 0.2;

    spawned?: ServerMob;

    get canUse(): boolean {
        if (!this.definition.equipment && this.definition.usable) { return this.useReload >= this.definition.useTime; }
        return false;
    }

    canCollideWith(entity: ServerEntity): boolean {
        if (entity instanceof ServerLivelyEntity) return entity.team != this.team;
        return !this.isReloading && !this.isUsing && !this.destroyed
            && !this.definition.equipment && super.canCollideWith(entity);
    }

    canDealDamage(): boolean {
        return !this.isReloading && !this.isUsing && !this.destroyed;
    }

    constructor(petalBunch: PetalBunch, definition: PetalDefinition) {
        const player = petalBunch.player;
        super(player.game, player.position, EntityType.Petal);
        this.petalBunch = petalBunch;
        this.position = player.position.clone();
        this.definition = definition;
        this.constantModifier = definition.petalModifiers;
        this.effectsOnHit = definition.effectsOnHit;
        this.bodyPoison = definition.poison;
        this.owner = player;
        this.setParent(player);
        this.hitbox = new CircleHitbox(definition.hitboxRadius);
        if (!definition.equipment) {
            this.damage = definition.damage;
            if (definition.health) {
                this.maxHealth = definition.health;
            } else {
                this.invincible = true;
            }
        }
    }

    banned = false;
    bannedOutTime = 0;
    bannedReload = 0;

    join(): void {
        this.game.grid.addEntity(this);
        this.isReloading = true;
    }

    tick(): void {
        super.tick();

        if (this.banned) {
            this.reloadTime = 0;
            this.isReloading = true;
            this.isLoadingFirstTime = true;
            this.spawned?.destroy();

            this.bannedReload += this.game.dt;
            if (this.bannedOutTime > 0 && this.bannedReload >= this.bannedOutTime) {
                this.banned = false;
                this.bannedReload = 0;
                this.bannedOutTime = 0;
            }
            return;
        }

        if (!this.definition.equipment) {
            if (this.isReloading) {
                if (
                    !this.definition.reloadTime
                    || this.reloadTime >= this.fullReloadTime
                ) {
                    this.isReloading = false;
                }
                this.reloadTime += this.game.dt;
                this.position.set(this.owner.position);
            } else if (this.isUsing) {
                if (this.isUsing === PetalUsingAnimations.ABSORB) {
                    this.position.set(this.owner.position);
                } else if (this.isUsing === PetalUsingAnimations.HATCH) {
                    this.hidden = true;
                    if (!this.spawned || this.spawned.destroyed) {
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
                        this.owner.sendEvent(AttributeEvents.USABLE, undefined, this);
                    }
                }

                this.health += 0;
            }
        } else {
            this.isLoadingFirstTime = false;
            this.isReloading = false;
            this.position = this.owner.position.clone();
        }
    }

    gotDamage = false;

    startUsing(animation: PetalUsingAnimations, func?: () => void): void {
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
                if (func) func();
            }
            this.isUsing = undefined;
            this.useReload = 0;
        }, animation === PetalUsingAnimations.NORMAL ? 0 : 100);
    }

    public override collisionDamage(to: ServerLivelyEntity) {
        if (this.definition.doesNotDamage?.includes(to.type) || this.owner.spectatorMode) return;

        super.collisionDamage(to);

        this.owner.sendEvent(
            AttributeEvents.PETAL_DEAL_DAMAGE,
            to,
            this
        );
    }

    protected override onReceiveDamage(damage: Damage) {
        if (damage.amount > 0) this.gotDamage = true;
        if (this.health <= 0) this.isReloading = true;
    }

    get data(): Required<EntitiesNetData[EntityType.Petal]> {
        const data = {
            position: UVector2D.mul(UVector2D.sub(this.position, this.owner.position), 100),
            isReloading: this.isReloading || this.hidden,
            gotDamage: this.gotDamage,
            full: {
                definition: this.definition,
                ownerId: this.owner.id
            }
        };
        this.gotDamage = false;
        return data;
    };

    destroy() {
        super.destroy();
        this.spawned?.destroy();
    }
}
