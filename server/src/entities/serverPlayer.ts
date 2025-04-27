import { type WebSocket } from "ws";
import { ServerEntity } from "./serverEntity";
import { Vec2, Vector } from "../../../common/src/utils/vector";
import { GameBitStream, type Packet, PacketStream } from "../../../common/src/net";
import { type Game } from "../game";
import { ChatData, type EntitiesNetData, UpdatePacket } from "../../../common/src/packets/updatePacket";
import { CircleHitbox, RectHitbox } from "../../../common/src/utils/hitbox";
import { Random } from "../../../common/src/utils/random";
import { MathNumeric } from "../../../common/src/utils/math";
import { InputAction, InputPacket } from "../../../common/src/packets/inputPacket";
import { JoinPacket } from "../../../common/src/packets/joinPacket";
import { ActionType, EntityType, GameConstants, PlayerState } from "../../../common/src/constants";
import { GameOverPacket } from "../../../common/src/packets/gameOverPacket";
import { Inventory } from "../inventory/inventory";
import { ServerPetal } from "./serverPetal";
import { PetalDefinition, Petals, SavedPetalDefinitionData } from "../../../common/src/definitions/petal";
import { spawnLoot } from "../utils/loot";
import { AttributeEvents } from "../utils/attribute";
import { PlayerModifiers } from "../../../common/src/typings";
import { EventFunctionArguments } from "../utils/eventManager";
import { getLevelExpCost, getLevelInformation } from "../../../common/src/utils/levels";
import { damageableEntity, damageSource } from "../typings";
import { LoggedInPacket } from "../../../common/src/packets/loggedInPacket";
import { ServerFriendlyMob } from "./serverMob";
import { ChatChannel, ChatPacket } from "../../../common/src/packets/chatPacket";
import { PoisonEffect } from "../utils/effects";
import { Rarity, RarityName } from "../../../common/src/definitions/rarity";
import { Mobs } from "../../../common/src/definitions/mob";
import { ZoneData, ZoneName, Zones } from "../../../common/src/zones";

// 闪避
enum curveType {
    LINEAR,
    SINE,
    CBRT,
}

function curve(x: number, curve: curveType) {
    let res: number = 0;
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
        direction: Vector,
        mouseDirection: Vector
    } = {
        direction: Vec2.new(0, 0),
        mouseDirection: Vec2.new(0, 0)
    };
    distance: number = 0;
    isAttacking = false;
    isDefending = false;

    inventory: Inventory;

    joined: boolean = false;

    damage: number = GameConstants.player.defaultBodyDamage;

    private _health = GameConstants.player.defaultModifiers().maxHealth;

    actions: InputAction[] = []

    get health(): number {
        return this._health;
    }

    set health(health: number) {
        if (health === this._health) return;
        this._health = MathNumeric.clamp(health, 0, this.modifiers.maxHealth);
        this.setFullDirty();
    }

    private _maxHealth = GameConstants.player.defaultModifiers().maxHealth;

    get maxHealth(): number {
        return this._maxHealth;
    }

    set maxHealth(maxHealth: number) {
        if (maxHealth === this._maxHealth) return;
        this._health = MathNumeric.clamp(this._health  * maxHealth / this._maxHealth, 0, maxHealth);
        this._maxHealth = maxHealth;

        this.setFullDirty();
    }

    private _shield: number = 0;

    get shield(): number {
        return this._shield;
    }

    set shield(shield: number) {
        const maxShield = this.maxHealth * 0.75; // 最大护盾值为最大生命值的75%
        this._shield = MathNumeric.clamp(shield, 0, maxShield);
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
        overleveled: false
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

    get petalEntities(): ServerPetal[]{
        return this.inventory.petalBunches
            .reduce(
                (pre, petalBunch) =>
                    pre.concat(petalBunch.petals),
                [] as ServerPetal[]
            )
    }

    modifiers: PlayerModifiers = GameConstants.player.defaultModifiers();
    otherModifiers: Partial<PlayerModifiers>[] = [];

    exp: number = 0;
    level: number = 1;
    levelInformation = getLevelInformation(0);

    overleveled: boolean = false;
    overleveledTimeRemains: number = GameConstants.player.overleveledTime;

    chatMessagesToSend: ChatData[] = [];

    killedBy?: ServerPlayer;

    isAdmin: boolean = false;

    knockback: number = 3;

    canReceiveDamageFrom(source: damageableEntity): boolean {
        switch (source.type) {
            case EntityType.Player:
                return source != this
            case EntityType.Mob:
                if (source instanceof ServerFriendlyMob) return source.owner !== this;
                return true
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

        this.setAcceleration(Vec2.mul(
            this.direction.direction,
            MathNumeric.remap(this.distance, 0, 150, 0, GameConstants.player.maxSpeed) * this.modifiers.speed
        ));

        let targetRange = GameConstants.player.defaultPetalDistance;

        if (this.isDefending) {
            this.sendEvent(AttributeEvents.DEFEND, undefined)
            targetRange = GameConstants.player.defaultPetalDefendingDistance;
        }

        if (this.isAttacking) {
            targetRange = GameConstants.player.defaultPetalAttackingDistance
            if (isFinite(this.modifiers.extraDistance)) {
                targetRange += this.modifiers.extraDistance
            }
            this.sendEvent(AttributeEvents.ATTACK, undefined)
        }

        this.inventory.range = MathNumeric.targetEasing(
            this.inventory.range,
            targetRange,
            5
        )

        this.inventory.tick();

        if (this.health < this.modifiers.maxHealth)
            this.sendEvent(AttributeEvents.HEALING, undefined)

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

        if(this.actions.length) this.runAction(this.actions.shift());
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
                    this.inventory.switchPetal(i, i + this.inventory.slot)
                }
                break;
        }
    }

    addExp(exp: number) {
        this.exp += exp;
        this.dirty.exp = true;
        this.levelInformation = getLevelInformation(this.exp);
        this.level = this.levelInformation.level;
    }

    dealDamageTo(to: damageableEntity): void{
        if (to.canReceiveDamageFrom(this)) {
            to.receiveDamage(this.damage, this);
            this.sendEvent(
                AttributeEvents.FLOWER_DEAL_DAMAGE, to
            )
        }
    }

    receiveDamage(amount: number, source: damageSource, disableEvent?: boolean) {
        if (!this.isActive()) return;

        if ( (this.modifiers.damageAvoidanceChance > 0 && Math.random() < this.modifiers.damageAvoidanceChance)
			|| (this.modifiers.damageAvoidanceByDamage && Math.random() < curve(amount / 100, curveType.CBRT)) ) {
            return;
        }

        // 检查是否为毒素伤害
        const isPoisonDamage =
            // 玩家自身处于中毒状态
            this.state.poison ||
            // 来源是PoisonEffect实例
            (source && source instanceof PoisonEffect) ||
            // 来源是中毒的玩家
            (source && source instanceof ServerPlayer && source.state.poison) ||
            // 自毒伤害(uranium辐射)
            (disableEvent && this.modifiers.selfPoison > 0);

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
                    damage: amount,
                }
            )
        }

        if (amount > 0) this.gotDamage = true;

        if (this.health <= 0) {
            if (this.modifiers.revive) {
                const revHealthP = this.modifiers.revive.healthPercent || 100;
                const shieldP = this.modifiers.revive.shieldPercent || 0;
                this.health = this.maxHealth * revHealthP/100
                this.shield = this.maxHealth * shieldP/100;
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
                this.killedBy = source;
            }

            this.destroy();

            if (source instanceof ServerPlayer) {
                source.addExp(this.exp / 2)
            }

            const gameOverPacket = new GameOverPacket();
            gameOverPacket.kills = this.kills;
            gameOverPacket.murderer = source.name;
            this.addPacketToSend(gameOverPacket);
        }
    }

    heal(amount: number) {
        amount *= this.modifiers.healing;
        this.health += amount;
    }

    sendPackets() {
        if (!this.joined) return;

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

        updatePacket.playerDataDirty = this.dirty;

        updatePacket.players = [...this.game.activePlayers];

        updatePacket.map.width = this.game.width;
        updatePacket.map.height = this.game.height;
        updatePacket.mapDirty = this.firstPacket ?? this.game.mapDirty;


        updatePacket.chatDirty = this.chatMessagesToSend.length > 0;
        updatePacket.chatMessages = this.chatMessagesToSend.concat([]);

        this.firstPacket = false;

        this.addPacketToSend(updatePacket);
        this.send();

        this.chatMessagesToSend = [];
    }

    packetStream = new PacketStream(GameBitStream.create(1 << 16));

    readonly packetsToSend: Packet[] = [];

    send(): void{
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
    /**
         * Sends a chat message directly to this player instance.
         * The message will appear in their chat box, typically formatted as a system message.
         * @param message The content of the message to send.
         * @param color Optional color for the message text (default: 0xffcc00 - yellow).
         */
    sendDirectMessage(message: string, color: number = 0xffcc00): void {
        const chatData: ChatData = {
            content: `[System] ${message}`, // Prefix to identify as system message
            color: color
        };
        this.chatMessagesToSend.push(chatData);
        // The message will be sent during the next call to sendPackets()
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
                if (this.isAdmin && content.startsWith('/')) return this.processCommand(content); // we do not want admin commands to show up for everyone else
                if (content) this.sendChatMessage(content, packet.channel);
                break;
            }
        }
    }

    findTarget(identifier: string): ServerPlayer | undefined {
        for (const player of this.game.players) {
            if (player.name === identifier || player.id.toString() === identifier) {
                return player;
            }
        }
        return undefined;
    };

    processCommand(content: string): void {
        const rest = content.substring(1); // remove command prefix /
        if (!this.isAdmin) return; // double check
        if (rest.startsWith('name')) {
            this.name = rest.substring('name'.length)
        } else if (rest.startsWith('xp')) {
            const plusXp = parseFloat(rest.substring('xp'.length)) || 0;
            if (!isFinite(plusXp)) return this.sendDirectMessage('xp is not valid!')
            this.addExp(plusXp);
            this.dirty.exp = true;
        } else if (rest.startsWith('drop')) {
            const params = rest.substring('drop'.length).trim();
            const args = params.split(' ').filter(arg => arg.length > 0);
            if (args.length < 2) {
                return this.sendDirectMessage('insufficient params', 0xff0000);
            }
            const pn = args[0]; // id string
            const validatePString = Petals.hasString(pn);
            const count = parseInt(args[1]) ?? null;
            const pVec = {x: this.position.x,y: this.position.y};
            if (!validatePString || !isFinite(count)) {
                this.sendDirectMessage(`!validatePString: ${!validatePString}, !isFinite(count): ${!isFinite(count)}`)
                this.sendDirectMessage(`pn: ${pn}, count: ${count}, pVec: ${pVec.x} ${pVec.y}`)
                return this.sendDirectMessage('something went wrong!')
            } else {
                const pDef = Petals.fromString(pn); // petal string verified
                const pVec = { x: this.position.x, y: this.position.y };
                const rarityDefinition = Rarity.fromString(pDef.rarity);

                if (rarityDefinition.isUnique && this.game.gameHas(pDef)) {
                    this.sendDirectMessage(`'${pn}' is a isUnique petal and is already in game!`, 0xffcc00);
                }
                let pArr: PetalDefinition[] = [];
                for (let i=0; i<count; i++) {
                    pArr.push(pDef)
                }
                spawnLoot(this.game,pArr,pVec, true); // pass array, true to make it bypass room limitations
                this.sendDirectMessage(`Dropped ${count} of ${pDef.idString}.`);
            }
        } else if (rest.startsWith('give')) {
            const params = rest.substring('give'.length).trim();
            const args = params.split(' ').filter(arg => arg.length > 0);
            if (args.length < 3) {
                return this.sendDirectMessage('insufficient params', 0xff0000);
            }

            const targetIdentifier = args[0];
            const petalName = args[1];
            const count = parseInt(args[2]);

            // Find the target player
            let targetPlayer: ServerPlayer | undefined = this.findTarget(targetIdentifier);

            if (!targetPlayer) {
                return this.sendDirectMessage(`Player '${targetIdentifier}' not found.`, 0xff0000);
            }

            const validatePetalString = Petals.hasString(petalName);

            if (!validatePetalString || !isFinite(count) || count <= 0) {
                this.sendDirectMessage(`Invalid petal name ('${petalName}') or count ('${args[2]}').`, 0xff0000);
                return;
            }

            const petalDef = Petals.fromString(petalName);
            const rarityDefinition = Rarity.fromString(petalDef.rarity);

            if (rarityDefinition.isUnique && this.game.gameHas(petalDef)) {
                this.sendDirectMessage(`'${petalName}' is a unique petal and is already in the game!`, 0xffcc00);
                // Optionally, you might still allow dropping it if needed for testing
            }

            let petalArr: PetalDefinition[] = [];
            for (let i = 0; i < count; i++) {
                petalArr.push(petalDef);
            }

            // Use target player's position
            const targetPosition = { x: targetPlayer.position.x, y: targetPlayer.position.y };

            spawnLoot(this.game, petalArr, targetPosition, true); // bypass room limitations
            this.sendDirectMessage(`Dropped ${count} of ${petalDef.idString} for ${targetPlayer.name} (ID: ${targetPlayer.id}).`);
            targetPlayer.sendDirectMessage(`Admin dropped ${count} of ${petalDef.idString} for you.`); // Notify the target player

        } else if (rest.startsWith('spawn')) {
            const params = rest.substring('spawn'.length).trim();
            const args = params.split(' ').filter(arg => arg.length > 0);
            if (args.length < 2) {
                return this.sendDirectMessage('insufficient params', 0xff0000);
            }
            const mn = args[0]; // id string
            const validatePString = Mobs.hasString(mn);
            const count = parseInt(args[1]) ?? null;
            const pVec = {x: this.position.x,y: this.position.y};
            if (!validatePString || !isFinite(count)) {
                this.sendDirectMessage(`!validatePString: ${!validatePString}, !isFinite(count): ${!isFinite(count)}`)
                this.sendDirectMessage(`pn: ${mn}, count: ${count}, pVec: ${pVec.x} ${pVec.y}`)
                return this.sendDirectMessage('something went wrong!')
            } else {
                if (count>1) {
                    this.sendDirectMessage('rn they spawn at the exact same place.')
                    this.sendDirectMessage('u will regret spawning more than 1')
                }
                const mDef = Mobs.fromString(mn); // petal string verified
                let pVec = { x: this.position.x, y: this.position.y };
                for (let i=0; i<count; i++) {
                    this.game.spawnMob(mDef, pVec)
                }
                this.sendDirectMessage(`Spawned ${count} of ${mDef.idString}.`);
            }
        } else if (rest.startsWith('cleanup')) {
            let dropCount = 0;
            let mobCount = 0;
            let petalCount = 0;

            // Clean up drops
            for (const [id, entity] of this.game.grid.entities) {
                if (entity.type === EntityType.Wall) {
                    entity.destroy();
                    dropCount++;
                }
            }

            // Clean up mobs
            for (const [id, entity] of this.game.grid.entities) {
                if (entity.type === EntityType.Mob) {
                    entity.destroy(true);
                    mobCount++;
                }
            }

            // Clean up invalid petals from players
            for (const player of this.game.players) {
                const inventory = player.inventory.inventory;
                const toRemove: number[] = [];

                // Track mythic counts
                const mythicCounts = new Map<string, number>();

                for (let i = 0; i < inventory.length; i++) {
                    const petal = inventory[i];
                    if (!petal) continue;

                    const def = Petals.fromString(petal.idString);
                    const rarity = Rarity.fromString(def.rarity);

                    // Check for mythics (max 3 per player)
                    // TODO: FIX: this logic is WRONG, max 3 mythics in server
                    // but still useful sometimes maybe so im keeping
                    if (rarity.idString === 'mythic') {
                        const count = (mythicCounts.get('mythic') || 0) + 1;
                        mythicCounts.set('mythic', count);
                        if (count > 3 && !player.isAdmin) {
                            toRemove.push(i);
                        }
                    }

                    // Remove super petals from non-dev players
                    if (def.rarity === RarityName.super && !player.isAdmin) {
                        toRemove.push(i);
                    }
                }

                toRemove.sort((a, b) => b - a).forEach(index => {
                    player.inventory.delete(index);
                    petalCount++;
                });
            }

            this.sendDirectMessage(`Cleanup complete: Removed ${dropCount} drops, ${mobCount} mobs, and ${petalCount} invalid petals.`);
        } else if (rest.startsWith('givexp')) {
            const params = rest.substring('givexp'.length).trim();
            const args = params.split(' ').filter(arg => arg.length > 0);
            if (args.length < 2) {
                return this.sendDirectMessage('Usage: insufficient params', 0xffcc00);
            }

            const targetIdentifier = args[0];
            const amount = parseFloat(args[1]);

            if (!isFinite(amount)) {
                return this.sendDirectMessage('Invalid XP amount.', 0xff0000);
            }

            let targetPlayer: ServerPlayer | undefined = this.findTarget(targetIdentifier);

            if (!targetPlayer) {
                return this.sendDirectMessage(`Player "${targetIdentifier}" not found.`, 0xff0000);
            }

            if (targetPlayer === this) {
                 return this.sendDirectMessage(`Use /xp to give yourself XP.`, 0xffcc00);
            }

            targetPlayer.addExp(amount);
            targetPlayer.dirty.exp = true;
            this.sendDirectMessage(`Gave ${amount} XP to ${targetPlayer.name} (ID: ${targetPlayer.id}).`);
            targetPlayer.sendDirectMessage(`You received ${amount} XP from an admin.`);

        } else if (rest.startsWith('list')) {
            this.sendDirectMessage('--- Player List ---');
            for (const player of this.game.players) {
                this.sendDirectMessage(`ID: ${player.id}, Name: ${player.name}, XP: ${player.exp}`);
            }
            this.sendDirectMessage('-------------------');
        } else if (rest.startsWith('whisper ') || rest.startsWith('w ')) {
            const commandPrefix = rest.startsWith('whisper ') ? 'whisper ' : 'w ';
            const params = rest.substring(commandPrefix.length).trim();
            const firstSpaceIndex = params.indexOf(' ');
            if (firstSpaceIndex === -1) {
                return this.sendDirectMessage('insufficient params', 0xff0000);
            }
            const targetIdentifier = params.substring(0, firstSpaceIndex);
            const message = params.substring(firstSpaceIndex + 1).trim();
            if (!message) {
                return this.sendDirectMessage('insufficient params', 0xff0000);
            }
            const targetPlayer = this.findTarget(targetIdentifier);
            if (!targetPlayer) {
                return this.sendDirectMessage(`Player '${targetIdentifier}' not found.`, 0xff0000);
            }
            targetPlayer.sendDirectMessage(`[Whisper from ${this.name}]: ${message}`, 0xffaaff); // different from reg dms

            this.sendDirectMessage(`[Whisper to ${targetPlayer.name}]: ${message}`, 0xffaaff);
        } else if (rest.startsWith('kill ')) {
            const targetIdentifier = rest.substring('kill '.length).trim();

            if (!targetIdentifier) {
                return this.sendDirectMessage('provide player identifier pls', 0xff0000);
            }

            const targetPlayer = this.findTarget(targetIdentifier);

            if (!targetPlayer) {
                return this.sendDirectMessage(`Player '${targetIdentifier}' not found.`, 0xff0000);
            }

            if (targetPlayer === this) {
                this.sendDirectMessage('hi why do you want to kill yourself', 0xffcc00);
            }

            // Deal enough damage to ensure the player is killed, bypassing potential shields/revives if needed
            // Using a large damage value is simpler than checking all conditions
            targetPlayer.receiveDamage(targetPlayer.maxHealth ** 2 + targetPlayer.shield * 2, this); // Deal damage from the admin

            if (targetPlayer.isActive()) {
                // This check is needed in case the player had a revive mechanic that worked
                // ygg...
                this.sendDirectMessage(`Attempted to kill ${targetPlayer.name} (ID: ${targetPlayer.id}), but they might have survived (e.g., revive).`, 0xffcc00);
            } else {
                this.sendDirectMessage(`Successfully killed ${targetPlayer.name} (ID: ${targetPlayer.id}).`, 0xFFA500);
                // The GameOverPacket is sent within receiveDamage/destroy logic
            }

        } else if (rest.startsWith('forcekill ')) {
            const targetIdentifier = rest.substring('forcekill '.length).trim();
            if (!targetIdentifier) {
                return this.sendDirectMessage('provide player identifier pls', 0xff0000);
            }
            const targetPlayer = this.findTarget(targetIdentifier);
            if (!targetPlayer) {
                return this.sendDirectMessage(`Player '${targetIdentifier}' not found.`, 0xff0000);
            }
            if (targetPlayer === this) {
                this.sendDirectMessage('dont kill yourself pls', 0xffcc00);
                return this.sendDirectMessage('if you want to kill urself with command, unequip ygg and use /kill', 0xffcc00);
            }
            if (!targetPlayer.isActive()) {
                 return this.sendDirectMessage(`Player ${targetPlayer.name} (ID: ${targetPlayer.id}) is already inactive.`, 0xffcc00);
            }

            targetPlayer.destroy();
            targetPlayer.killedBy = this;

            // Send game over packet manually since destroy() might not do it in all cases
            // (though it should if called when active)
            const gameOverPacket = new GameOverPacket();
            gameOverPacket.kills = targetPlayer.kills; // Send the target's kill count
            gameOverPacket.murderer = this.name; // Admin is the murderer
            targetPlayer.addPacketToSend(gameOverPacket); // Send it to the killed player
            targetPlayer.send(); // Ensure the packet is sent immediately if possible

            this.sendDirectMessage(`Forcefully killed ${targetPlayer.name} (ID: ${targetPlayer.id}).`, 0xFFA500);

        } else {
             this.sendDirectMessage(`Unknown command: /${rest.split(' ')[0]}`, 0xff0000);
        }
    }

    join(packet: JoinPacket): void {
        this.name = packet.name.trim();
        if (!this.name) this.name = GameConstants.player.defaultName;

        this.game.activePlayers.add(this);
        this.game.grid.addEntity(this);

        this.petalEntities.map(e => e.join());

        console.log(`Game | "${this.name}" joined the game`);

        if (packet.secret && packet.secret === this.game.adminSecret) {
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
            let index = 0
            for (const petal of packet.petals) {
                this.inventory.updateInventory(index, petal);
                index ++;
            }
        }
    }

    processInput(packet: InputPacket): void {
        if (!this.isActive()) return;

        // if the direction changed set to dirty
        if (!Vec2.equals(this.direction.direction, Vec2.radiansToDirection(packet.direction.direction))) {
            this.setDirty();
        }
        this.direction = {
            direction: Vec2.radiansToDirection(packet.direction.direction),
            mouseDirection: Vec2.radiansToDirection(packet.direction.mouseDirection)
        };
        this.distance = packet.movementDistance;
        this.isAttacking = packet.isAttacking;
        this.isDefending = packet.isDefending;

        packet.actions.forEach((action) => {
            this.actions.push(action);
        })
    }

    sendEvent<T extends AttributeEvents>(
        event: T, data: EventFunctionArguments[T], petal?: ServerPetal
    ) {
        if (!petal){
            return this.inventory.eventManager.sendEvent<T>(event, data);
        }
        this.inventory.eventManager.sendEventByPetal<T>(petal, event, data);
    }

    get playerState(): PlayerState {
        if (this.state.poison) return PlayerState.Poisoned;
        if (this.modifiers.healing < 1) return PlayerState.Danded;
        if (this.isAttacking) return PlayerState.Attacking;
        if (this.isDefending) return PlayerState.Defending;
        return PlayerState.Normal
    }

    gotDamage: boolean = false;

    get data(): Required<EntitiesNetData[EntityType.Player]> {
        const data = {
            position: this.position,
            direction: this.direction.direction,
            state: this.playerState,
            gotDamage: this.gotDamage,
            full: {
                healthPercent: this.health / this.maxHealth,
                shieldPercent: this._shield / this.maxHealth * 0.75, // 最大护盾为最大生命值的75%
                isAdmin: this.isAdmin
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
        now.yinYangs += extra.yinYangs ?? 0;
        now.extraDistance += extra.extraDistance ?? 0;
        now.controlRotation = extra.controlRotation ?? now.controlRotation;
        now.revive = extra.revive ?? now.revive;
        if (extra.conditionalHeal) {
            now.conditionalHeal = extra.conditionalHeal;
        }
        now.extraSlot += extra.extraSlot ?? 0;

        return now;
    }

    updateModifiers(): void {
        let modifiersNow = GameConstants.player.defaultModifiers();

        let effectedPetals: PetalDefinition[] = []

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
                    const modifierWithoutAvoidance = {...modifier};
                    delete modifierWithoutAvoidance.damageAvoidanceChance;

                    modifiersNow = this.calcModifiers(modifiersNow, modifierWithoutAvoidance);
                } else {
                    modifiersNow = this.calcModifiers(modifiersNow, modifier);
                }

                effectedPetals.push(petal.definition)
            }
        }

        this.effects.effects.forEach(effect => {
            if (effect.modifier) {
                if (effect.modifier.damageAvoidanceChance) {
                    avoidanceFailureChance *= (1 - effect.modifier.damageAvoidanceChance);
                    const modifierWithoutAvoidance = {...effect.modifier};
                    delete modifierWithoutAvoidance.damageAvoidanceChance;
                    modifiersNow = this.calcModifiers(modifiersNow, modifierWithoutAvoidance);
                } else {
                    modifiersNow = this.calcModifiers(modifiersNow, effect.modifier);
                }
            }
        })

        this.otherModifiers.forEach(effect => {
            if (effect.damageAvoidanceChance) {
                avoidanceFailureChance *= (1 - effect.damageAvoidanceChance);
                const modifierWithoutAvoidance = {...effect};
                delete modifierWithoutAvoidance.damageAvoidanceChance;
                modifiersNow = this.calcModifiers(modifiersNow, modifierWithoutAvoidance);
            } else {
                modifiersNow = this.calcModifiers(modifiersNow, effect);
            }
        })

        this.otherModifiers = [];

        modifiersNow.damageAvoidanceChance = 1 - avoidanceFailureChance;

        modifiersNow = this.calcModifiers(modifiersNow, {
            maxHealth: this.levelInformation.extraMaxHealth
        });

        this.modifiers = modifiersNow;

        this.maxHealth = this.modifiers.maxHealth;
        this.zoom = this.modifiers.zoom;

        this.inventory.changeSlotAmountTo(
            GameConstants.player.defaultSlot + this.levelInformation.extraSlot
        )
    }

    destroy() {
        if (this.destroyed) return;

        if (this.game.leaderboard()[0] == this){
            let content = `The Leader ${this.name} with ${this.exp.toFixed(0)} scores was killed`
            if (this.killedBy) {
                content += ` by ${this.killedBy.name}`
            }
            this.game.sendGlobalMessage({
                content: content + `!`,
                color: 0x9f5c4b
            });
        }

        super.destroy();
        for (const i of this.petalEntities){
            i.destroy();
        }
        spawnLoot(
            this.game,
            this.inventory.drop(3),
            this.position
        )

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
                if (!player.hitbox.collidesWith(hitbox)) continue
                player.chatMessagesToSend.push(modifiedMessage);
            }
        } else if (channel === ChatChannel.Global) {
            const isAnno = this.isAdmin && message.startsWith("!");
            modifiedMessage = {
                color: isAnno ? 0xff0000 : 0xffffff,
                content: `[Global] ${this.name}: ${isAnno ? message.substring(1) : message}`
            }
            this.game.sendGlobalMessage(modifiedMessage);
        }
    }
}
