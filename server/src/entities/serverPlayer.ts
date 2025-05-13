import { type WebSocket } from "ws";
import { ServerEntity } from "./serverEntity";
import { UVec2D } from "../../../common/src/physics/utils";
import { GameBitStream, type Packet, PacketStream } from "../../../common/src/net/net";
import { createHash } from "crypto";
import { type Game } from "../game";
import {
    ChatData,
    type EntitiesNetData,
    PetalData,
    PetalState,
    UpdatePacket
} from "../../../common/src/net/packets/updatePacket";
import { CircleHitbox, RectHitbox } from "../../../common/src/utils/hitbox";
import { Random } from "../../../common/src/utils/random";
import { Geometry, Numeric } from "../../../common/src/maths/math";
import { InputAction, InputPacket } from "../../../common/src/net/packets/inputPacket";
import { JoinPacket } from "../../../common/src/net/packets/joinPacket";
import { ActionType, EntityType, GameConstants, PlayerState } from "../../../common/src/constants";
import { GameOverPacket } from "../../../common/src/net/packets/gameOverPacket";
import { Inventory } from "../inventory/inventory";
import { ServerPetal } from "./serverPetal";
import { PetalDefinition, SavedPetalDefinitionData } from "../../../common/src/definitions/petals";
import { AttributeEvents } from "../utils/attributeRealizes";
import { PlayerModifiers } from "../../../common/src/typings";
import { EventFunctionArguments } from "../utils/petalEvents";
import { getLevelExpCost, getLevelInformation } from "../../../common/src/utils/levels";
import { damageableEntity, damageSource } from "../typings";
import { LoggedInPacket } from "../../../common/src/net/packets/loggedInPacket";
import { ServerFriendlyMob } from "./serverMob";
import { ChatChannel, ChatPacket } from "../../../common/src/net/packets/chatPacket";
import { PoisonEffect } from "../utils/effects";
import { MobDefinition } from "../../../common/src/definitions/mobs";
import { spawnLoot } from "../misc/spawning";
import { applyCommand, CommandResolving } from "../misc/command";
import VectorAbstract from "../../../common/src/physics/vectorAbstract";

// 闪避
enum curveType {
    LINEAR,
    SINE,
    CBRT
}

function curve(x: number, curve: curveType) {
    let res = 0;
    x = Math.max(0, Math.min(1, x));
    switch (curve) {
        case curveType.LINEAR:
            res = x;
            break;
        case curveType.SINE:
            res = x * Math.sin(2 * x) / Math.sin(2);
            break;
        case curveType.CBRT:
            res = Math.cbrt(2) / 2 * Math.cbrt(x - 0.5) + 0.5;
            break;
        default:
            res = x;
    }
    return Math.max(0, Math.min(1, res));
}

export class ServerPlayer extends ServerEntity<EntityType.Player> {
    type: EntityType.Player = EntityType.Player;
    socket: WebSocket;

    hitbox = new CircleHitbox(GameConstants.player.radius);

    name = "";

    direction: {
        direction: VectorAbstract
        mouseDirection: VectorAbstract
    } = {
            direction: UVec2D.new(0, 0),
            mouseDirection: UVec2D.new(0, 0)
        };

    distance = 0;
    isAttacking = false;
    isDefending = false;

    isPetalAttack = false;

    inventory: Inventory;

    joined = false;

    damage: number = GameConstants.player.defaultBodyDamage;

    private _health = GameConstants.player.defaultModifiers().maxHealth;

    actions: InputAction[] = [];

    get health(): number {
        return this._health;
    }

    set health(health: number) {
        if (health === this._health) return;
        this._health = Numeric.clamp(health, 0, this.modifiers.maxHealth);
        this.setFullDirty();
    }

    private _maxHealth = GameConstants.player.defaultModifiers().maxHealth;

    get maxHealth(): number {
        return this._maxHealth;
    }

    set maxHealth(maxHealth: number) {
        if (maxHealth === this._maxHealth) return;
        this._health = Numeric.clamp(this._health * maxHealth / this._maxHealth, 0, maxHealth);
        this._maxHealth = maxHealth;
        this.maxShield = this.maxHealth * 0.75;
        this.shield = Numeric.clamp(this.shield, 0, this.maxShield);

        this.setFullDirty();
    }

    maxShield = this._maxHealth * 0.75;

    private _shield = 0;

    get shield(): number {
        return this._shield;
    }

    set shield(shield: number) {
        const maxShield = this.maxHealth * 0.75; // 最大护盾值为最大生命值的75%
        this._shield = Numeric.clamp(shield, 0, maxShield);
    }

    kills = 0;

    firstPacket = true;

    /**
    * Entities the player can see
    */
    visibleEntities = new Set<ServerEntity>();

    // what needs to be sent again to the client
    readonly dirty = {
        id: true,
        zoom: true,
        inventory: false,
        slot: true,
        exp: false,
        overleveled: false,
        collect: false
    };

    private _zoom = 45;

    get zoom(): number {
        return this._zoom;
    }

    set zoom(zoom: number) {
        if (this._zoom === zoom) return;
        this._zoom = zoom;
        this.dirty.zoom = true;
    }

    get petalEntities(): ServerPetal[] {
        return this.inventory.petalBunches
            .reduce<ServerPetal[]>(
            (pre, petalBunch) =>
                pre.concat(petalBunch.petals),
            []
        );
    }

    modifiers: PlayerModifiers = GameConstants.player.defaultModifiers();
    otherModifiers: Array<Partial<PlayerModifiers>> = [];

    persistentSpeedModifier = 1;

    persistentZoomModifier = 1;

    godMode = false;

    spectatorMode = false;

    invisible = false;

    frozen = false;

    exp = 0;
    level = 1;
    levelInformation = getLevelInformation(0);

    overleveled = false;
    overleveledTimeRemains: number = GameConstants.player.overleveledTime;

    chatMessagesToSend: ChatData[] = [];
    collected: MobDefinition[] = [];

    killedBy?: damageSource;

    isAdmin = false;

    knockback = 3;

    canCollideWith(entity: ServerEntity): boolean {
        if (this.spectatorMode) return false;

        if (this.invisible) return false;

        return super.canCollideWith(entity);
    }

    canReceiveDamageFrom(source: damageableEntity): boolean {
        if (this.spectatorMode) return false;

        switch (source.type) {
            case EntityType.Player:
                return source != this;
            case EntityType.Mob:
                if (source instanceof ServerFriendlyMob) return source.owner !== this;
                return true;
            case EntityType.Petal:
                return source.owner != this;
            case EntityType.Projectile:
                if (source.source instanceof ServerFriendlyMob) return source.source.owner != this;
                return source.source != this;
        }
    }

    constructor(game: Game, socket: WebSocket) {
        const position = Random.vector(
            0,
            game.width,
            0,
            game.height
        );
        super(game, position);
        this.position = position;
        this.socket = socket;

        this.inventory = new Inventory(this);

        this.updateModifiers();
    }

    tick(): void {
        super.tick();

        this.setAcceleration(UVec2D.mul(
            this.direction.direction,
            Numeric.remap(this.distance, 0, 150, 0, GameConstants.player.maxSpeed) * this.modifiers.speed
        ));

        // 观察者模式下只处理移动，不处理花瓣和其他功能
        if (this.spectatorMode) return;

        let targetRange = GameConstants.player.defaultPetalDistance;

        if (this.isDefending) {
            this.sendEvent(AttributeEvents.DEFEND, undefined);
            targetRange = GameConstants.player.defaultPetalDefendingDistance;
        }

        if (this.isAttacking) {
            targetRange = GameConstants.player.defaultPetalAttackingDistance;
            if (isFinite(this.modifiers.extraDistance)) {
                targetRange += this.modifiers.extraDistance;
            }
            this.sendEvent(AttributeEvents.ATTACK, undefined);
        }

        this.inventory.range = targetRange;

        this.inventory.tick();

        if (this.health < this.modifiers.maxHealth) { this.sendEvent(AttributeEvents.HEALING, undefined); }

        this.heal(this.modifiers.healPerSecond * this.game.dt);

        if (this.modifiers.conditionalHeal && this.health < this.modifiers.maxHealth * this.modifiers.conditionalHeal.healthPercent) {
            this.heal(this.modifiers.conditionalHeal.healAmount * this.game.dt);
        }

        if (this.modifiers.selfPoison > 0) {
            this.receiveDamage(this.modifiers.selfPoison * this.game.dt, this, true);
        }

        // 护盾每秒自动消失5%
        if (this._shield > 0) {
            const shieldDecay = this._shield * 0.05 * this.game.dt;
            this.shield = this._shield - shieldDecay;
        }

        this.updateModifiers();

        if (this.level >= (this.game.zoneManager.inWhichZone(this.position)?.data.highestLevel ?? 999)) {
            this.dirty.overleveled = true;
            this.overleveledTimeRemains -= this.game.dt;
            this.overleveled = this.overleveledTimeRemains <= 0;
        } else {
            this.overleveled = false;
            if (this.overleveledTimeRemains <= GameConstants.player.overleveledTime) {
                this.overleveledTimeRemains += this.game.dt / 10;
            }
        }

        if (this.actions.length) this.runAction(this.actions.shift());
    }

    runAction(action: InputAction | undefined) {
        if (!action) return;
        switch (action.type) {
            case ActionType.SwitchPetal:
                this.inventory.switchPetal(action.petalIndex, action.petalToIndex);
                break;
            case ActionType.DeletePetal:
                this.inventory.delete(action.petalIndex);
                break;
            case ActionType.TransformLoadout:
                for (let i = 0; i < this.inventory.slot; i++) {
                    this.inventory.switchPetal(i, i + this.inventory.slot);
                }
                break;
            case ActionType.Left:
                this.destroy();
                break;
        }
    }

    addExp(exp: number) {
        this.exp += exp;
        this.dirty.exp = true;
        this.levelInformation = getLevelInformation(this.exp);
        this.level = this.levelInformation.level;
    }

    dealDamageTo(to: damageableEntity): void {
        // 观察者模式下不造成伤害
        if (this.spectatorMode) return;

        if (to.canReceiveDamageFrom(this)) {
            const damage = this.damage * this.modifiers.bodyDamage;
            to.receiveDamage(damage, this);
            this.sendEvent(AttributeEvents.FLOWER_DEAL_DAMAGE, to);
        }
    }

    receiveDamage(amount: number, source: damageSource, disableEvent?: boolean) {
        if (!this.isActive()) return;

        // 无敌模式下不接受任何伤害
        if (this.godMode) return;

        if ((this.modifiers.damageAvoidanceChance > 0 && Math.random() < this.modifiers.damageAvoidanceChance)
            || (this.modifiers.damageAvoidanceByDamage && Math.random() < curve(amount / 100, curveType.CBRT))) {
            return;
        }

        // 检查是否为毒素伤害
        const isPoisonDamage
            // 玩家自身处于中毒状态
            = this.state.poison
            // 来源是PoisonEffect实例
            || (source && source instanceof PoisonEffect)
            // 来源是中毒的玩家
            || (source && source instanceof ServerPlayer && source.state.poison)
            // 自毒伤害(uranium辐射)
            || (disableEvent && this.modifiers.selfPoison > 0);

        // 检查是否为碰撞伤害（来自玩家或怪物，但不是花瓣和投射物）
        const isCollisionDamage = source
            && (source instanceof ServerPlayer
            || (source instanceof ServerEntity && source.type === EntityType.Mob))
            && !isPoisonDamage;

        // 如果是碰撞伤害，应用伤害减免
        if (isCollisionDamage && this.modifiers.bodyDamageReduction > 0) {
            amount *= (1 - this.modifiers.bodyDamageReduction);
        }

        // 如果是毒素伤害，直接扣减血量，绕过护盾
        if (isPoisonDamage) {
            this.health -= amount;
        } else {
            // 不是毒素伤害，正常的护盾逻辑
            // 优先消耗护盾
            if (this._shield > 0) {
                if (this._shield >= amount) {
                    this.shield = this._shield - amount;
                    amount = 0;
                } else {
                    amount -= this._shield;
                    this.shield = 0;
                }
            }

            if (amount > 0) {
                this.health -= amount;
            }
        }

        if (!disableEvent) {
            this.sendEvent(
                AttributeEvents.FLOWER_GET_DAMAGE, {
                    entity: source,
                    damage: amount
                }
            );
        }

        if (amount > 0) this.gotDamage = true;

        if (this.health <= 0) {
            if (this.modifiers.revive) {
                const revHealthP = this.modifiers.revive.healthPercent || 100;
                const shieldP = this.modifiers.revive.shieldPercent || 0;
                this.health = this.maxHealth * revHealthP / 100;
                this.shield = this.maxHealth * shieldP / 100;
                if (this.modifiers.revive.destroyAfterUse) {
                    for (let i = 0; i < this.inventory.inventory.length; i++) {
                        const petalData = this.inventory.inventory[i];
                        if (petalData?.modifiers?.revive?.destroyAfterUse) {
                            this.inventory.delete(i);
                            this.dirty.inventory = true;
                            break;
                        }
                    }
                }
                return; // I REFUSE TO DIE
            }
            if (source instanceof ServerPlayer) {
                source.kills++;
            }

            this.killedBy = source;

            this.destroy();

            if (source instanceof ServerPlayer) {
                source.addExp(this.exp / 2);
            }
        }
    }

    heal(amount: number) {
        amount *= this.modifiers.healing;
        this.health += amount;
    }

    sendPackets() {
        if (!this.joined) return;

        if (this.destroyed && this.killedBy && !this.killedBy.destroyed) { this.position = this.killedBy.position; }

        // calculate visible, deleted, and dirty entities
        // and send them to the client
        const updatePacket = new UpdatePacket();

        const radius = this.zoom + 10;
        const rect = RectHitbox.fromCircle(radius, this.position);
        const newVisibleEntities = this.game.grid.intersectsHitbox(rect);

        for (const entity of this.visibleEntities) {
            if (!newVisibleEntities.has(entity)) {
                updatePacket.deletedEntities.push(entity.id);
            }
        }

        for (const entity of newVisibleEntities) {
            if (!this.visibleEntities.has(entity)) {
                updatePacket.serverFullEntities.push(entity);
            }
        }

        for (const entity of this.game.fullDirtyEntities) {
            if (newVisibleEntities.has(entity)
                && !updatePacket.serverFullEntities.includes(entity)
                && !updatePacket.deletedEntities.includes(entity.id)) {
                updatePacket.serverFullEntities.push(entity);
            }
        }

        for (const entity of this.game.partialDirtyEntities) {
            if (newVisibleEntities.has(entity)
                && !updatePacket.serverFullEntities.includes(entity)
                && !updatePacket.deletedEntities.includes(entity.id)) {
                updatePacket.serverPartialEntities.push(entity);
            }
        }
        this.visibleEntities = newVisibleEntities;

        updatePacket.playerData.zoom = this.zoom;
        updatePacket.playerData.id = this.id;
        updatePacket.playerData.inventory = ([] as SavedPetalDefinitionData[])
            .concat(this.inventory.inventory);
        updatePacket.playerData.slot = this.inventory.slot;
        updatePacket.playerData.exp = this.exp;
        updatePacket.playerData.overleveled = this.overleveledTimeRemains;
        updatePacket.playerData.collect = this.collected.concat([]);

        updatePacket.playerDataDirty = this.dirty;

        updatePacket.players = [...this.game.activePlayers];

        updatePacket.map.width = this.game.width;
        updatePacket.map.height = this.game.height;
        updatePacket.mapDirty = this.firstPacket ?? this.game.mapDirty;

        updatePacket.chatDirty = this.chatMessagesToSend.length > 0;
        updatePacket.chatMessages = this.chatMessagesToSend.concat([]);

        const datas: PetalData[] = [];

        this.inventory.petalBunches.forEach(e => {
            const data = new PetalData();

            if (e.definition) {
                if (e.definition.equipment) {
                    data.state = PetalState.Normal;
                    data.percent = 1;
                } else if (e.definition.isDuplicate) {
                    let reloading = true;
                    let maxHealth = 1;
                    let health = 1;
                    let reloadingTime = 0;
                    for (const im of e.petals) {
                        if (!im.isReloading) {
                            reloading = false;
                            if (e.definition.health && typeof im.health === "number") {
                                maxHealth += e.definition.health;
                                health += im.health;
                            }
                        } else if (e.definition.reloadTime) {
                            reloadingTime = e.definition.reloadTime - im.reloadTime;
                            if (e.definition.health && typeof im.health === "number") {
                                maxHealth += e.definition.health;
                            }
                        }
                    }

                    data.state = reloading ? PetalState.Reloading : PetalState.Normal;
                    if (data.state === PetalState.Reloading && e.definition.reloadTime) {
                        data.percent = reloadingTime / e.definition.reloadTime;
                    } else {
                        data.percent = health / maxHealth;
                    }
                } else {
                    const im = e.petals[0];
                    if (im.isReloading) {
                        data.state = PetalState.Reloading;
                        if (e.definition.reloadTime) {
                            data.percent = (e.definition.reloadTime - im.reloadTime) / e.definition.reloadTime;
                        }
                    } else {
                        data.state = PetalState.Normal;
                        if (e.definition.health && typeof im.health === "number") {
                            data.percent = im.health / e.definition.health;
                        }
                    }
                }
            }

            data.percent = Numeric.clamp(data.percent, 0, 1);

            datas.push(data);
        });

        updatePacket.petalData = datas;

        this.firstPacket = false;

        this.addPacketToSend(updatePacket);
        this.send();

        this.chatMessagesToSend = [];
        this.collected = [];
    }

    packetStream = new PacketStream(GameBitStream.create(1 << 16));

    readonly packetsToSend: Packet[] = [];

    send(): void {
        this.packetStream.stream.index = 0;

        for (const packet of this.packetsToSend) {
            this.packetStream.serializeServerPacket(packet);
        }

        this.packetsToSend.length = 0;
        const buffer = this.packetStream.getBuffer();
        this.sendData(buffer);
    }

    addPacketToSend(packet: Packet): void {
        this.packetsToSend.push(packet);
    }

    sendData(data: ArrayBuffer): void {
        try {
            this.socket.send(data);
        } catch (error) {
            console.error("Error sending data:", error);
        }
    }

    processMessage(packet: Packet): void {
        switch (true) {
            case packet instanceof JoinPacket: {
                this.join(packet);
                break;
            }
            case packet instanceof InputPacket: {
                this.processInput(packet);
                break;
            }
            case packet instanceof ChatPacket: {
                const content = packet.chat.trim();
                if (this.isAdmin && content.startsWith("/")) return this.processCommand(content); // we do not want admin commands to show up for everyone else
                if (content) this.sendChatMessage(content, packet.channel);
                break;
            }
        }
    }

    processCommand(content: string): void {
        content = content.split("/").slice(1).join("/");
        const commandName = content.split(" ")[0];
        const args = content.split(" ").slice(1);

        const commandResolving = new CommandResolving(this);

        applyCommand(commandName, args, commandResolving);

        commandResolving.finish();
    }

    join(packet: JoinPacket): void {
        this.name = packet.name.trim();
        if (!this.name) this.name = GameConstants.player.defaultName;

        this.game.activePlayers.add(this);
        this.game.grid.addEntity(this);

        this.petalEntities.map(e => e.join());

        console.log(`Game | "${this.name}" joined the game`);

        if (packet.secret && this.game.adminSecret
            === createHash("sha256").update(packet.secret).digest("hex")) {
            this.isAdmin = true;
        }

        this.updateModifiers();

        const loggedIn = new LoggedInPacket();
        loggedIn.inventory = this.inventory.inventory;
        this.addPacketToSend(loggedIn);

        this.send();

        this.joined = true;

        if (this.inventory.inventory.length) {
            this.inventory.loadConfigByData(this.inventory.inventory);
        } else {
            this.inventory.loadDefaultConfig();
        }

        if (this.isAdmin && packet.petals.length > 0) {
            let index = 0;
            for (const petal of packet.petals) {
                this.inventory.updateInventory(index, petal);
                index++;
            }
        }
    }

    processInput(packet: InputPacket): void {
        if (!this.isActive() || this.frozen) {
            this.direction = {
                direction: UVec2D.new(0, 0),
                mouseDirection: UVec2D.new(0, 0)
            };
            this.distance = 0;
            this.isAttacking = false;
            this.isDefending = false;
            return;
        }

        // if the direction changed set to dirty
        if (!UVec2D.equals(this.direction.direction, Geometry.radiansToDirection(packet.direction.direction))) {
            this.setDirty();
        }
        this.direction = {
            direction: Geometry.radiansToDirection(packet.direction.direction),
            mouseDirection: Geometry.radiansToDirection(packet.direction.mouseDirection)
        };
        this.distance = packet.movementDistance;
        this.isAttacking = packet.isAttacking;
        this.isDefending = packet.isDefending;

        packet.actions.forEach(action => {
            this.actions.push(action);
        });
    }

    sendEvent<T extends AttributeEvents>(
        event: T, data: EventFunctionArguments[T], petal?: ServerPetal
    ) {
        if (!petal) {
            return this.inventory.eventManager.sendEvent<T>(event, data);
        }
        this.inventory.eventManager.sendEventByPetal<T>(petal, event, data);
    }

    get playerState(): PlayerState {
        if (this.state.poison) return PlayerState.Poisoned;
        if (this.modifiers.healing < 1) return PlayerState.Danded;
        if (this.isAttacking) return PlayerState.Attacking;
        if (this.isDefending) return PlayerState.Defending;
        if (this.modifiers.speed < 1) return PlayerState.Debuffed;
        return PlayerState.Normal;
    }

    gotDamage = false;

    get data(): Required<EntitiesNetData[EntityType.Player]> {
        const data = {
            position: this.position,
            direction: this.direction.direction,
            state: this.playerState,
            gotDamage: this.gotDamage,
            full: {
                healthPercent: this.health / this.maxHealth,
                shieldPercent: this.shield / this.maxShield,
                isAdmin: this.isAdmin,
                spectator: this.spectatorMode,
                invisible: this.invisible,
                frozen: this.frozen
            }
        };

        this.gotDamage = false;
        return data;
    }

    calcModifiers(now: PlayerModifiers, extra: Partial<PlayerModifiers>): PlayerModifiers {
        now.healing *= extra.healing ?? 1;
        now.maxHealth += extra.maxHealth ?? 0;
        now.healPerSecond += extra.healPerSecond ?? 0;
        now.speed *= extra.speed ?? 1;
        now.revolutionSpeed += extra.revolutionSpeed ?? 0;
        now.zoom += extra.zoom ?? 0;
        now.damageAvoidanceChance += extra.damageAvoidanceChance ?? 0;
        now.damageAvoidanceByDamage = extra.damageAvoidanceByDamage ?? now.damageAvoidanceByDamage;
        now.selfPoison += extra.selfPoison ?? 0;
        now.yinYangAmount += extra.yinYangAmount ?? 0;
        now.extraDistance += extra.extraDistance ?? 0;
        now.controlRotation = extra.controlRotation ?? now.controlRotation;
        now.revive = extra.revive ?? now.revive;
        now.bodyDamage *= extra.bodyDamage ?? 1;
        now.knockbackReduction += extra.knockbackReduction ?? 0;
        if (extra.conditionalHeal) {
            now.conditionalHeal = extra.conditionalHeal;
        }
        now.extraSlot += extra.extraSlot ?? 0;
        now.bodyDamageReduction += extra.bodyDamageReduction ?? 0;
        return now;
    }

    updateModifiers(): void {
        let modifiersNow = GameConstants.player.defaultModifiers();

        const effectedPetals: PetalDefinition[] = [];

        // 闪避
        let avoidanceFailureChance = 1;

        for (const petal of this.petalEntities) {
            const modifier = petal.definition.modifiers;
            // has modifier AND (EITHER not first time reloading OR petal effects work on first reload)
            // petal.def.effectivefirstreload being undefined does not affect the result
            if (modifier && (!petal.isLoadingFirstTime || (petal.isLoadingFirstTime && petal.definition.effectiveFirstReload))) {
                if (petal.definition.unstackable && effectedPetals.includes(petal.definition)) continue;
                if (modifier.damageAvoidanceChance) {
                    avoidanceFailureChance *= (1 - modifier.damageAvoidanceChance);
                    const modifierWithoutAvoidance = { ...modifier };
                    delete modifierWithoutAvoidance.damageAvoidanceChance;

                    modifiersNow = this.calcModifiers(modifiersNow, modifierWithoutAvoidance);
                } else {
                    modifiersNow = this.calcModifiers(modifiersNow, modifier);
                }

                effectedPetals.push(petal.definition);
            }
        }

        this.effects.effects.forEach(effect => {
            if (effect.modifier) {
                if (effect.modifier.damageAvoidanceChance) {
                    avoidanceFailureChance *= (1 - effect.modifier.damageAvoidanceChance);
                    const modifierWithoutAvoidance = { ...effect.modifier };
                    delete modifierWithoutAvoidance.damageAvoidanceChance;
                    modifiersNow = this.calcModifiers(modifiersNow, modifierWithoutAvoidance);
                } else {
                    modifiersNow = this.calcModifiers(modifiersNow, effect.modifier);
                }
            }
        });

        this.otherModifiers.forEach(effect => {
            if (effect.damageAvoidanceChance) {
                avoidanceFailureChance *= (1 - effect.damageAvoidanceChance);
                const modifierWithoutAvoidance = { ...effect };
                delete modifierWithoutAvoidance.damageAvoidanceChance;
                modifiersNow = this.calcModifiers(modifiersNow, modifierWithoutAvoidance);
            } else {
                modifiersNow = this.calcModifiers(modifiersNow, effect);
            }
        });

        this.otherModifiers = [];

        if (this.persistentSpeedModifier !== 1) {
            modifiersNow = this.calcModifiers(modifiersNow, {
                speed: this.persistentSpeedModifier
            });
        }
        if (this.persistentZoomModifier !== 1) {
            modifiersNow = this.calcModifiers(modifiersNow, {
                zoom: this.persistentZoomModifier
            });
        }

        modifiersNow.damageAvoidanceChance = 1 - avoidanceFailureChance;

        modifiersNow = this.calcModifiers(modifiersNow, {
            maxHealth: this.levelInformation.extraMaxHealth
        });

        this.modifiers = modifiersNow;

        this.maxHealth = this.modifiers.maxHealth;
        this.zoom = this.modifiers.zoom;

        this.inventory.changeSlotAmountTo(
            GameConstants.player.defaultSlot + this.levelInformation.extraSlot
        );
    }

    destroy() {
        if (this.destroyed) return;

        if (this.game.leaderboard()[0] == this) {
            let content = `The Leader ${this.name} with ${this.exp.toFixed(0)} scores was killed`;
            if (this.killedBy instanceof ServerPlayer) { content += ` by ${this.killedBy.name}`; }
            this.game.sendGlobalMessage({
                content: `${content}!`,
                color: 0x9f5c4b
            });
        }

        const gameOverPacket = new GameOverPacket();
        gameOverPacket.kills = this.kills;

        if (this.killedBy) {
            gameOverPacket.murderer = this.killedBy.name;
            gameOverPacket.killerID = this.killedBy.id;
        }

        this.addPacketToSend(gameOverPacket);

        super.destroy();
        for (const i of this.petalEntities) {
            i.destroy();
        }
        spawnLoot(
            this.game,
            this.inventory.drop(3),
            this.position
        );

        this.exp = getLevelExpCost(Math.floor(this.level * 0.75) + 1);

        this.dirty.inventory = true;
        this.dirty.exp = true;

        this.game.activePlayers.delete(this);
    }

    sendChatMessage(message: string, channel: ChatChannel): void {
        const radius = 50;
        const hitbox = new CircleHitbox(radius, this.position);
        const players = this.game.players;

        let modifiedMessage: ChatData = {
            color: 0xffffff,
            content: `[Local] ${this.name}: ${message}`
        };

        if (channel === ChatChannel.Local) {
            for (const player of players) {
                if (!player.hitbox.collidesWith(hitbox)) continue;
                player.chatMessagesToSend.push(modifiedMessage);
            }
        } else if (channel === ChatChannel.Global) {
            const isAnno = this.isAdmin && message.startsWith("!");
            modifiedMessage = {
                color: isAnno ? 0xff0000 : 0xffffff,
                content: `[Global] ${this.name}: ${isAnno ? message.substring(1) : message}`
            };
            this.game.sendGlobalMessage(modifiedMessage);
        }
    }
}
