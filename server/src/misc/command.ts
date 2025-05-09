import { PetalDefinition, Petals } from "../../../common/src/definitions/petals";
import { Rarity, RarityName } from "../../../common/src/definitions/rarities";
import { spawnLoot } from "./spawning";
import { Mobs } from "../../../common/src/definitions/mobs";
import { EntityType } from "../../../common/src/constants";
import { ServerWall } from "../entities/serverWall";
import { Vec2 } from "../../../common/src/utils/vector";
import { ServerPlayer } from "../entities/serverPlayer";
import {
    CommandDefinition,
    CommandDefinitions,
    CommandName,
    CommandParameterType
} from "../../../common/src/definitions/commands";
import { ChatData } from "../../../common/src/net/packets/updatePacket";
import { StTyped } from "../../../common/src/typings";

export type DirectlyChatData = ChatData & ({
    global: false
    to: ServerPlayer
} | {
    global: true
})

type CommandApply<K extends CommandName> =
    (resolve: CommandResolving, parameters: CommandParameterType<K>) => void

const Commands = {
    name: (resolve, parameters) => {
        const [name, who] = parameters;
        resolve.$p(who, player => {
            resolve.resolve(`Successfully changed ${player.name} 's name to ${name}.`);
            player.name = name;
        })
    },
    exp: (resolve, parameters) => {
        const [exp, who] = parameters;
        resolve.$p(who, player => {
            player.addExp(exp)
            resolve.resolve(`Successfully added ${exp} exp to ${player.name}.`);
        })
    },
    give: (resolve, parameters) => {
        const [item, amount, who] = parameters;
        resolve.$p(who, player => {
            const validatePString = Petals.hasString(item);
            const pVec = {x: player.position.x,y: player.position.y};
            if (!validatePString || !isFinite(amount)) {
                resolve.err(
                    `!validatePString: ${!validatePString}, !isFinite(count): ${!isFinite(amount)}`
                )
                resolve.err(
                    `pn: ${item}, count: ${amount}, pVec: ${pVec.x} ${pVec.y}`
                )
                return resolve.reject('Errored when trying to give petals.')
            } else {
                const petalDefinition = Petals.fromString(item); // petal string verifie
                const rarityDefinition = Rarity.fromString(petalDefinition.rarity);

                if (rarityDefinition.isUnique && player.game.gameHas(petalDefinition)) {
                    resolve.warn(`
                        '${petalDefinition.idString}' is a isUnique petal and is already in game.`
                    );
                }
                let pArr: PetalDefinition[] = [];
                for (let i = 0; i < amount; i++) {
                    pArr.push(petalDefinition)
                }
                spawnLoot(player.game, pArr, pVec, true); // pass array, true to make it bypass room limitations
                resolve.sendMessage(
                    `Admin dropped ${amount} of ${petalDefinition.idString} for you.`, 0xcfcfcf , player
                );
                resolve.resolve(
                    `Dropped ${amount} of ${petalDefinition.idString} for ${player.name}.`
                );
            }
        })
    },
    spawn: (resolve, parameters) => {
        const [mob, amount, who] = parameters;
        resolve.$p(who, player => {
            const validatePString = Mobs.hasString(mob);
            const pVec = {x: player.position.x,y: player.position.y};
            if (!validatePString || !isFinite(amount)) {
                resolve.err(
                    `!validatePString: ${!validatePString}, !isFinite(count): ${!isFinite(amount)}`
                )
                resolve.err(
                    `pn: ${mob}, count: ${amount}, pVec: ${pVec.x} ${pVec.y}`
                )
                return resolve.reject('Errored when trying to spawn mobs.')
            } else {
                const mobDefinition = Mobs.fromString(mob);

                for (let i = 0; i < amount; i++) {
                    player.game.spawnMob(mobDefinition, pVec)
                }
                resolve.resolve(
                    `Spawned ${amount} of ${mobDefinition.idString} for ${player.name}.`
                );
            }
        })
    },
    cleanup: (resolve, parameters) => {
        const [cleanUpLootAlso] = parameters;

        let dropCount = 0;
        let mobCount = 0;
        let petalCount = 0;

        // Clean up mobs
        for (const [id, entity] of resolve.player.game.grid.entities) {
            if (entity.type === EntityType.Mob) {
                entity.destroy(true);
                mobCount++;
            }

            if (cleanUpLootAlso && entity.type === EntityType.Loot) {
                entity.destroy(true);
                dropCount++;
            }
        }

        // Clean up invalid petals from players
        for (const player of resolve.player.game.players) {
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

        resolve.resolve(`Cleanup complete: Removed ${dropCount} drops, ${mobCount} mobs, and ${petalCount} invalid petals.`);
    },
    kill: (resolve, parameters) => {
        const [who] = parameters;
        resolve.$p(who, player => {
            player.receiveDamage(
                player.maxHealth ** 2 + player.shield * 2, resolve.player); // Deal damage from the admin

            if (player.isActive()) {
                // This check is needed in case the player had a revive mechanic that worked
                // ygg...
                resolve.warn(`Attempted to kill ${player.name} (ID: ${player.id}), but they might have survived (e.g., revive).`);
            }
            resolve.resolve(`Killed ${player.name} (ID: ${player.id}).`);
                // The GameOverPacket is sent within receiveDamage/destroy logic
        })
    },
    ban: (resolve, parameters) => {
        const [who] = parameters;
        resolve.$p(who, player => {
            player.destroy();
            player.socket.close();
            resolve.resolve(`Banned ${player.name} (ID: ${player.id})`);
        })
    },
    tp: (resolve, parameters) => {
        const [who, to] = parameters;
        if (to) {
            resolve.$p(who, player => {
                resolve.$p(to, target => {
                    player.position = target.position;
                    resolve.resolve(`Teleported ${player.name} (ID: ${player.id}) to ${target.name} (ID: ${target.id}).`);
                })
            })
        } else {
            resolve.$p(who, player => {
                resolve.player.position = player.position;
                resolve.resolve(`Teleported to ${player.name} (ID: ${player.id}).`);
            })
        }
    },
    list: (resolve, parameters) => {
        resolve.sendMessage('--- Player List ---');
        for (const player of resolve.player.game.players) {
            resolve.sendMessage(`ID: ${player.id}, Name: ${player.name}, XP: ${player.exp}`);
        }
        resolve.sendMessage('-------------------');
    },
    help: (resolve, parameters) => {
        resolve.sendMessage('--- Command List ---');
        for (const [name, def] of Object.entries(CommandDefinitions)) {
            let content = `/${name}`;

            if (def.parameters.length > 0) {
                for (const parameter of def.parameters) {
                    if (parameter.optional) {
                        content += ` [${parameter.displayName}]`;
                    } else {
                        content += ` <${parameter.displayName}>`;
                    }
                }
            }

            resolve.sendMessage(`${content} - ${def.description}`);
        }
        resolve.sendMessage('-------------------');
    },
} as const satisfies Readonly<{ readonly [K in CommandName]: CommandApply<K>}>

export class CommandResolving {
    state: 'pending' | 'resolved' | 'rejected' = 'pending';
    messages: DirectlyChatData[] = [];

    constructor(public player: ServerPlayer) {}

    get rejected(): boolean {
        return this.state === 'rejected';
    }

    getPlayer(value: string): ServerPlayer {
        if (!isNaN(+value)){ // Prove it's a number
            const id = +value;
            const player = this.player.game.grid.entities.get(id);
            if (player && player instanceof ServerPlayer) {
                return player;
            } else {
                this.reject(`"${value}" is not a valid player ID.`);
                return this.player;
            }
        } else {
            const player =
            Array.from(this.player.game.grid.byCategory[EntityType.Player]).find(
                (entity) => entity.name === value
            )
            if (player) {
                return player;
            } else {
                this.reject(`"${value}" is not a valid player Name to find.`);
                return this.player;
            }
        }
    }

    // Player query
    $p(value: string, callback: (player: ServerPlayer) => void): boolean{
        const player = value ? this.getPlayer(value) : this.player;
        if (this.rejected) return false;
        callback(player);
        return false;
    }


    sendMessage(
        content: string,
        color: number = 0xffcc00,
        to: ServerPlayer | boolean = this.player
        // Boolean value of True means Global Message.
        // If not, then it's a Direct Message.
    ) {
        if (this.state != "pending") return;
        if (typeof to === 'boolean' && to) {
            this.messages.push({
                content,
                color,
                global: true
            })
        } else {
            this.messages.push({
                content,
                color,
                global: false,
                to: to instanceof ServerPlayer ? to : this.player
            })
        }
    }

    err(message: string) {
        this.sendMessage(`[ERR!] ${message}`, 0xff0000);
    }

    warn(message: string) {
        this.sendMessage(`[WARN] ${message}`, 0xe96725);
    }

    resolve(tip: string) {
        this.sendMessage(tip);
        this.state = 'resolved';
    }

    reject(reason: string) {
        this.err(`Failed while executing the command, reason: ${reason}`);
        this.state = 'rejected';
    }

    finish() {
        this.messages.forEach(mes => {
            const nerfedChatData: ChatData = {
                content: mes.content,
                color: mes.color
            }
            if (mes.global) {
                this.player.game.sendGlobalMessage(
                    nerfedChatData
                );
            } else {
                mes.to.chatMessagesToSend.push(nerfedChatData);
            }
        })
    }
}

export function applyCommand(
    command: string,
    inputParameters: string[],
    resolve: CommandResolving
) {
    if (!Commands.hasOwnProperty(command))
        return resolve.reject(`Not a valid command: ${command}`);

    const commandName = command as CommandName;
    const commandData: CommandDefinition =
        CommandDefinitions[commandName];
    const commandParameters: StTyped[] = [];


    function toNumber(value: string, index: number) {
        const parsed = +value;
        if (isNaN(parsed))
            resolve.reject(`Parameter "${value}" of index ${index} is not a valid number.`);
        return parsed;
    }

    function toBoolean(value: string, index: number) {
        const parsed = value.toLowerCase();
        if (parsed !== 'true' && parsed !== 'false')
            resolve.reject(`Parameter "${value}" of index ${index} is not a valid boolean. Must be a "true" or "false".`);
        return parsed === 'true';
    }

    for (let i = 0; i < commandData.parameters.length; i++) {
        const parameter = commandData.parameters[i];
        if (inputParameters.length <= i) {
            if (parameter.optional) {
                commandParameters[i] = parameter.default;
            } else {
                resolve.reject(`Missing parameter of index ${i}.`);
            }
        } else {
            if (parameter.type === "string") {
                commandParameters[i] = inputParameters[i];
            } else if (parameter.type === "number") {
                commandParameters[i] = toNumber(inputParameters[i], i);
            } else if (parameter.type === "boolean") {
                commandParameters[i] = toBoolean(inputParameters[i], i);
            }
        }

        if (resolve.rejected) return;
    }

    (Commands[commandName] as CommandApply<typeof commandName>)(
        resolve, commandParameters as CommandParameterType<typeof commandName>
    );
}

/*
* const rest = content.substring(1); // remove command prefix /
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
        } else if (rest.startsWith('give ')) {
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
        } else if (rest.startsWith('rmwall')) {
            for (const [id, entity] of this.game.grid.entities) {
                if (entity.type === EntityType.Wall) {
                    entity.destroy(true);
                }
            }
        } else if (rest.startsWith('wallat')) {
            const params = rest.substring('wallat'.length).trim();
            const args = params.split(' ').filter(arg => arg.length > 0);
            if (args.length < 4) {
                return this.sendDirectMessage('Usage: insufficient params', 0xffcc00);
            }

            const x = parseInt(args[0]);
            const y = parseInt(args[1]);
            const width = parseInt(args[2]);
            const height = parseInt(args[3]);

            new ServerWall(
                this.game, Vec2.new(x, y), Vec2.new(x + width, y + height)
            )
        } else if (rest.startsWith('wallhere')) {
            const params = rest.substring('wallhere'.length).trim();
            const args = params.split(' ').filter(arg => arg.length > 0);
            if (args.length < 2) {
                return this.sendDirectMessage('Usage: insufficient params', 0xffcc00);
            }

            const x = this.position.x;
            const y = this.position.y;
            const width = parseInt(args[0]);
            const height = parseInt(args[1]);

            new ServerWall(
                this.game, Vec2.new(x, y), Vec2.new(x + width, y + height)
            )
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
        } else if (rest.startsWith('tp ')) {
            const targetIdentifier = rest.substring('tp '.length).trim();

            if (!targetIdentifier) {
                return this.sendDirectMessage('Please provide a player ID or name', 0xff0000);
            }

            const targetPlayer = this.findTarget(targetIdentifier);

            if (!targetPlayer) {
                return this.sendDirectMessage(`Player '${targetIdentifier}' not found`, 0xff0000);
            }

            if (targetPlayer === this) {
                return this.sendDirectMessage('Cannot teleport to yourself', 0xff0000);
            }

            const angle = Math.random() * Math.PI * 2;
            const distance = 10;
            const offsetX = Math.cos(angle) * distance;
            const offsetY = Math.sin(angle) * distance;

            this.position.x = targetPlayer.position.x + offsetX;
            this.position.y = targetPlayer.position.y + offsetY;

            this.sendDirectMessage(`Teleported to player ${targetPlayer.name} (ID: ${targetPlayer.id})`, 0x00ff00);
        } else if (rest.startsWith('help')) {
            this.sendDirectMessage('--- Admin Command List ---', 0x00ffff);
            this.sendDirectMessage('/name - Modify your name', 0x00ffff);
            this.sendDirectMessage('/xp [amount] - Give yourself XP', 0x00ffff);
            this.sendDirectMessage('/drop [petalID] [count] - Drop petals at your location', 0x00ffff);
            this.sendDirectMessage('/give [playerID/name] [petalID] [count] - Drop petals for a player', 0x00ffff);
            this.sendDirectMessage('/spawn [mobID] [count] - Spawn mobs at your location', 0x00ffff);
            this.sendDirectMessage('/cleanup - Clean up mobs and invalid petals', 0x00ffff);
            this.sendDirectMessage('/rmwall - Remove all walls', 0x00ffff);
            this.sendDirectMessage('/wallat [x] [y] [width] [height] - Create a wall at specified location', 0x00ffff);
            this.sendDirectMessage('/wallhere [width] [height] - Create a wall at your location', 0x00ffff);
            this.sendDirectMessage('/givexp [playerID/name] [amount] - Give a player XP', 0x00ffff);
            this.sendDirectMessage('/list - List all online players', 0x00ffff);
            this.sendDirectMessage('/whisper(or/w) [playerID/name] [message] - Send a private message', 0x00ffff);
            this.sendDirectMessage('/kill [playerID/name] - Kill a player', 0x00ffff);
            this.sendDirectMessage('/ban [playerID/name] - Kill and ban a player', 0x00ffff);
            this.sendDirectMessage('/forcekill [playerID/name] - Forcefully kill a player', 0x00ffff);
            this.sendDirectMessage('/tp [playerID/name] - Teleport to a player', 0x00ffff);
            this.sendDirectMessage('/help - Display this help information', 0x00ffff);
            this.sendDirectMessage('/speed [multiplier] [playerID/name] - Adjust movement speed', 0x00ffff);
            this.sendDirectMessage('/god - Toggle god mode', 0x00ffff);
            this.sendDirectMessage('/heal [playerID/name] - Restore health and shield', 0x00ffff);
            this.sendDirectMessage('/teleport [x] [y] - Teleport to specified coordinates', 0x00ffff);
            this.sendDirectMessage('/spectator [playerID/name] - Toggle spectator mode (no collisions, transparent, no petals)', 0x00ffff);
            this.sendDirectMessage('-------------------', 0x00ffff);
        } else if (rest.startsWith('spectator')) {
            const targetIdentifier = rest.substring('spectator'.length).trim();

            // 如果没有指定目标，则切换自己的观察者模式
            if (!targetIdentifier) {
                this.spectatorMode = !this.spectatorMode;

                if (this.spectatorMode) {
                    this.sendDirectMessage('Spectator mode enabled', 0x00ff00);
                } else {
                    this.sendDirectMessage('Spectator mode disabled', 0x00ff00);
                }
                // 设置为全局脏标记，以便客户端更新显示
                this.setFullDirty();
                // 强制花瓣更新状态
                this.petalEntities.forEach(petal => petal.setFullDirty());
                return;
            }

            // 查找目标玩家
            const targetPlayer = this.findTarget(targetIdentifier);

            if (!targetPlayer) {
                return this.sendDirectMessage(`Player '${targetIdentifier}' not found`, 0xff0000);
            }

            // 切换目标玩家的观察者模式
            targetPlayer.spectatorMode = !targetPlayer.spectatorMode;

            if (targetPlayer.spectatorMode) {
                this.sendDirectMessage(`Enabled spectator mode for ${targetPlayer.name} (ID: ${targetPlayer.id})`, 0x00ff00);
                targetPlayer.sendDirectMessage('An admin enabled spectator mode for you', 0x00ff00);
            } else {
                this.sendDirectMessage(`Disabled spectator mode for ${targetPlayer.name} (ID: ${targetPlayer.id})`, 0x00ff00);
                targetPlayer.sendDirectMessage('An admin disabled spectator mode for you', 0x00ff00);
            }

            // 设置为全局脏标记，以便客户端更新显示
            targetPlayer.setFullDirty();
            // 强制花瓣更新状态
            targetPlayer.petalEntities.forEach(petal => petal.setFullDirty());
        } else if (rest.startsWith('god')) {
            // 切换无敌模式
            this.godMode = !this.godMode;

            if (this.godMode) {
                this.sendDirectMessage('God mode enabled', 0x00ff00);
            } else {
                this.sendDirectMessage('God mode disabled', 0xff0000);
            }
        } else if (rest.startsWith('speed')) {
            const params = rest.substring('speed'.length).trim();
            const args = params.split(' ').filter(arg => arg.length > 0);

            if (args.length === 0) {
                return this.sendDirectMessage('Please provide a speed multiplier', 0xff0000);
            }

            const speedValue = parseFloat(args[0]);
            if (isNaN(speedValue) || speedValue <= 0) {
                return this.sendDirectMessage('Please provide a valid speed multiplier (greater than 0)', 0xff0000);
            }

            // 如果提供了玩家参数
            if (args.length > 1) {
                const targetIdentifier = args[1];
                const targetPlayer = this.findTarget(targetIdentifier);

                if (!targetPlayer) {
                    return this.sendDirectMessage(`Player '${targetIdentifier}' not found`, 0xff0000);
                }

                // 设置目标玩家的速度
                targetPlayer.persistentSpeedModifier = speedValue;
                targetPlayer.updateModifiers();

                this.sendDirectMessage(`Set ${targetPlayer.name}'s (ID: ${targetPlayer.id}) speed multiplier to ${speedValue}`, 0x00ff00);
                targetPlayer.sendDirectMessage(`An admin set your speed multiplier to ${speedValue}`, 0x00ff00);
            } else {
                // 设置自己的速度
                this.persistentSpeedModifier = speedValue;
                this.updateModifiers();

                this.sendDirectMessage(`Speed multiplier set to ${speedValue}`, 0x00ff00);
            }
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

        } else if (rest.startsWith('ban')) {
            const targetIdentifier = rest.substring('ban'.length).trim();

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

            targetPlayer.destroy();

            targetPlayer.socket.close();
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
            // // (though it should if called when active)
            // const gameOverPacket = new GameOverPacket();
            // gameOverPacket.kills = targetPlayer.kills; // Send the target's kill count
            // gameOverPacket.murderer = this.name; // Admin is the murderer
            // targetPlayer.addPacketToSend(gameOverPacket); // Send it to the killed player
            // targetPlayer.send(); // Ensure the packet is sent immediately if possible

            this.sendDirectMessage(`Forcefully killed ${targetPlayer.name} (ID: ${targetPlayer.id}).`, 0xFFA500);

        } else if (rest.startsWith('heal')) {
            const targetIdentifier = rest.substring('heal'.length).trim();

            // 如果没有指定目标，则治疗自己
            if (!targetIdentifier) {
                this.health = this.maxHealth;
                this.shield = this.maxShield;
                this.sendDirectMessage('Health and shield restored', 0x00ff00);
                return;
            }

            // 查找目标玩家
            const targetPlayer = this.findTarget(targetIdentifier);

            if (!targetPlayer) {
                return this.sendDirectMessage(`Player '${targetIdentifier}' not found`, 0xff0000);
            }

            // 恢复目标玩家的生命值和护盾
            targetPlayer.health = targetPlayer.maxHealth;
            targetPlayer.shield = targetPlayer.maxShield;

            this.sendDirectMessage(`Restored ${targetPlayer.name}'s (ID: ${targetPlayer.id}) health and shield`, 0x00ff00);
            targetPlayer.sendDirectMessage('An admin restored your health and shield', 0x00ff00);
        } else if (rest.startsWith('teleport')) {
            const params = rest.substring('teleport'.length).trim();
            const args = params.split(' ').filter(arg => arg.length > 0);

            if (args.length < 2) {
                return this.sendDirectMessage('Please provide valid coordinates (x y)', 0xff0000);
            }

            const x = parseFloat(args[0]);
            const y = parseFloat(args[1]);

            if (isNaN(x) || isNaN(y)) {
                return this.sendDirectMessage('Please provide valid coordinates', 0xff0000);
            }

            // 检查坐标是否在地图范围内
            const mapWidth = this.game.width;
            const mapHeight = this.game.height;

            if (x < 0 || x > mapWidth || y < 0 || y > mapHeight) {
                return this.sendDirectMessage(`Coordinates out of map bounds (0-${mapWidth}, 0-${mapHeight})`, 0xff0000);
            }

            // 设置新位置
            this.position.x = x;
            this.position.y = y;

            this.sendDirectMessage(`Teleported to coordinates (${x}, ${y})`, 0x00ff00);
        } else {
             this.sendDirectMessage(`Unknown command: /${rest.split(' ')[0]}`, 0xff0000);
        }
        * */
