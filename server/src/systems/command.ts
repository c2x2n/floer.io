import { PetalDefinition, Petals } from "../../../common/src/definitions/petals";
import { Rarity, RarityName } from "../../../common/src/definitions/rarities";
import { Mobs } from "../../../common/src/definitions/mobs";
import { EntityType } from "../../../common/src/constants";
import { ServerPlayer } from "../entity/serverPlayer";
import {
    CommandDefinition,
    CommandDefinitions,
    CommandName,
    CommandParameterType
} from "../../../common/src/definitions/commands";
import { ChatData } from "../../../common/src/engine/net/packets/updatePacket";
import { DamageType } from "../typings/damage";
import { StTyped } from "../../../common/src/typings/stType";
import { spawnLoot } from "../entity/spawning/loot";
import { Geometry } from "../../../common/src/engine/maths/geometry";
import { Random } from "../../../common/src/engine/maths/random";
import { P2 } from "../../../common/src/engine/maths/constants";

export type DirectlyChatData = ChatData & ({
    global: false
    to: ServerPlayer
} | {
    global: true
});

type CommandApply<K extends CommandName> =
    (resolve: CommandResolving, parameters: CommandParameterType<K>) => void;

const Commands = {
    name: (resolve, parameters) => {
        const [name, who] = parameters;
        resolve.$p(who, player => {
            resolve.resolve(`Successfully changed ${player.name} 's name to ${name}.`);
            player.name = name;
        });
    },
    exp: (resolve, parameters) => {
        const [exp, who] = parameters;
        resolve.$p(who, player => {
            player.addExp(exp);
            resolve.resolve(`Successfully added ${exp} exp to ${player.name}.`);
        });
    },
    give: (resolve, parameters) => {
        const [item, amount, who] = parameters;
        resolve.$p(who, player => {
            const validatePString = Petals.hasString(item);
            const pVec = { x: player.position.x, y: player.position.y };
            if (!validatePString || !isFinite(amount)) {
                resolve.err(
                    `!validatePString: ${!validatePString}, !isFinite(count): ${!isFinite(amount)}`
                );
                resolve.err(
                    `pn: ${item}, count: ${amount}, pVec: ${pVec.x} ${pVec.y}`
                );
                return resolve.reject("Errored when trying to give petals.");
            } else {
                const petalDefinition = Petals.fromString(item); // petal string verifie
                const rarityDefinition = Rarity.fromString(petalDefinition.rarity);

                if (rarityDefinition.isUnique && player.game.gameHas(petalDefinition)) {
                    resolve.warn(`
                        '${petalDefinition.idString}' is a isUnique petal and is already in game.`
                    );
                }
                const pArr: PetalDefinition[] = [];
                for (let i = 0; i < amount; i++) {
                    pArr.push(petalDefinition);
                }
                spawnLoot(player.game, pArr, pVec, true); // pass array, true to make it bypass room limitations
                resolve.sendMessage(
                    `Admin dropped ${amount} of ${petalDefinition.idString} for you.`, 0xcfcfcf, player
                );
                resolve.resolve(
                    `Dropped ${amount} of ${petalDefinition.idString} for ${player.name}.`
                );
            }
        });
    },
    spawn: (resolve, parameters) => {
        const [mob, amount, who] = parameters;
        resolve.$p(who, player => {
            const validatePString = Mobs.hasString(mob);
            const pVec = { x: player.position.x, y: player.position.y };
            if (!validatePString || !isFinite(amount)) {
                resolve.err(
                    `!validatePString: ${!validatePString}, !isFinite(count): ${!isFinite(amount)}`
                );
                resolve.err(
                    `pn: ${mob}, count: ${amount}, pVec: ${pVec.x} ${pVec.y}`
                );
                return resolve.reject("Errored when trying to spawn mobs.");
            } else {
                const mobDefinition = Mobs.fromString(mob);

                for (let i = 0; i < amount; i++) {
                    player.game.spawnMob(mobDefinition, pVec);
                }
                resolve.resolve(
                    `Spawned ${amount} of ${mobDefinition.idString} for ${player.name}.`
                );
            }
        });
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
                if (rarity.idString === "mythic") {
                    const count = (mythicCounts.get("mythic") || 0) + 1;
                    mythicCounts.set("mythic", count);
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
                {
                    amount: player.maxHealth ** 2 + player.shield * 2,
                    to: player,
                    source: player,
                    type: DamageType.POISON
                }); // Deal damage from the admin

            if (player.isActive()) {
                // This check is needed in case the player had a revive mechanic that worked
                // ygg...
                resolve.warn(`Attempted to kill ${player.name} (ID: ${player.id}), but they might have survived (e.g., revive).`);
            }
            resolve.resolve(`Killed ${player.name} (ID: ${player.id}).`);
            // The GameOverPacket is sent within receiveDamage/destroy logic
        });
    },
    ban: (resolve, parameters) => {
        const [who] = parameters;
        resolve.$p(who, player => {
            player.destroy();
            player.socket.close();
            resolve.resolve(`Banned ${player.name} (ID: ${player.id})`);
        });
    },
    tp: (resolve, parameters) => {
        const [who, to] = parameters;
        if (to) {
            resolve.$p(who, player => {
                resolve.$p(to, target => {
                    player.position.set(Random.pointInsideCircle(
                        target.position.clone(), 5
                    ));
                    resolve.resolve(`Teleported ${player.name} (ID: ${player.id}) to ${target.name} (ID: ${target.id}).`);
                });
            });
        } else {
            resolve.$p(who, player => {
                resolve.player.position.set(Random.pointInsideCircle(
                    player.position.clone(), 5
                ));
                resolve.resolve(`Teleported to ${player.name} (ID: ${player.id}).`);
            });
        }
    },
    list: (resolve, parameters) => {
        resolve.sendMessage("--- Player List ---");
        for (const player of resolve.player.game.players) {
            resolve.sendMessage(`ID: ${player.id}, Name: ${player.name}, XP: ${player.exp}`);
        }
        resolve.sendMessage("-------------------");
    },
    help: (resolve, parameters) => {
        resolve.sendMessage("--- Command List ---");
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
        resolve.sendMessage("-------------------");
    },
    spectator: (resolve, parameters) => {
        const [who] = parameters;
        resolve.$p(who, player => {
            player.spectatorMode = !player.spectatorMode;
            resolve.resolve(`${player.name} ${player.spectatorMode ? "entered" : "exited"} spectator mode.`);
        });
    },
    speed: (resolve, parameters) => {
        const [multiplier, who] = parameters;
        if (multiplier <= 0) {
            return resolve.reject("Speed multiplier must be greater than 0");
        }
        resolve.$p(who, player => {
            player.persistentSpeedModifier = multiplier;
            player.updateAndApplyModifiers();
            resolve.resolve(`Set ${player.name}'s speed multiplier to ${multiplier}`);
        });
    },
    zoom: (resolve, parameters) => {
        const [multiplier, who] = parameters;
        if (multiplier <= 0) {
            return resolve.reject("Zoom multiplier must be greater than 0");
        }
        resolve.$p(who, player => {
            player.persistentZoomModifier = multiplier;
            player.updateAndApplyModifiers();
            resolve.resolve(`Set ${player.name}'s zoom multiplier to ${multiplier}`);
        });
    },
    god: (resolve, parameters) => {
        const [who] = parameters;
        resolve.$p(who, player => {
            player.invincible = !player.invincible;
            resolve.resolve(`${player.name} ${player.invincible ? "enabled" : "disabled"} god mode.`);
        });
    },
    invisible: (resolve, parameters) => {
        const [who] = parameters;
        resolve.$p(who, player => {
            player.invisible = !player.invisible;
            resolve.resolve(`${player.name} is now ${player.invisible ? "invisible" : "visible"}.`);
        });
    },
    freeze: (resolve, parameters) => {
        const [who] = parameters;
        resolve.$p(who, player => {
            player.frozen = !player.frozen;
            resolve.resolve(`${player.name} is now ${player.frozen ? "frozen" : "unfrozen"}.`);
        });
    },
    heal: (resolve, parameters) => {
        const [who] = parameters;
        resolve.$p(who, player => {
            player.health = player.maxHealth;
            player.shield = player.maxShield;
            resolve.resolve(`Restored ${player.name}'s health and shield to maximum.`);
        });
    }
} as const satisfies Readonly<{ readonly [K in CommandName]: CommandApply<K> }>;

export class CommandResolving {
    state: "pending" | "resolved" | "rejected" = "pending";
    messages: DirectlyChatData[] = [];

    constructor(public player: ServerPlayer) {}

    get rejected(): boolean {
        return this.state === "rejected";
    }

    getPlayer(value: string): ServerPlayer {
        if (!isNaN(+value)) { // Prove it's a number
            const id = +value;
            const player = this.player.game.grid.entities.get(id);
            if (player && player instanceof ServerPlayer) {
                return player;
            } else {
                this.reject(`"${value}" is not a valid player ID.`);
                return this.player;
            }
        } else {
            const player
            = Array.from(this.player.game.grid.byCategory[EntityType.Player]).find(
                entity => entity.name === value
            );
            if (player) {
                return player;
            } else {
                this.reject(`"${value}" is not a valid player Name to find.`);
                return this.player;
            }
        }
    }

    // Player query
    $p(value: string, callback: (player: ServerPlayer) => void): boolean {
        const player = value ? this.getPlayer(value) : this.player;
        if (this.rejected) return false;
        callback(player);
        return false;
    }

    sendMessage(
        content: string,
        color = 0xffcc00,
        to: ServerPlayer | boolean = this.player
        // Boolean value of True means Global Message.
        // If not, then it's a Direct Message.
    ) {
        if (this.state != "pending") return;
        if (typeof to === "boolean" && to) {
            this.messages.push({
                content,
                color,
                global: true
            });
        } else {
            this.messages.push({
                content,
                color,
                global: false,
                to: to instanceof ServerPlayer ? to : this.player
            });
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
        this.state = "resolved";
    }

    reject(reason: string) {
        this.err(`Failed while executing the command, reason: ${reason}`);
        this.state = "rejected";
    }

    finish() {
        this.messages.forEach(mes => {
            const nerfedChatData: ChatData = {
                content: mes.content,
                color: mes.color
            };
            if (mes.global) {
                this.player.game.sendGlobalMessage(
                    nerfedChatData
                );
            } else {
                mes.to.chatMessagesToSend.push(nerfedChatData);
            }
        });
    }
}

export function applyCommand(
    command: string,
    inputParameters: string[],
    resolve: CommandResolving
) {
    if (!Object.prototype.hasOwnProperty.call(Commands, command)) { return resolve.reject(`Not a valid command: ${command}`); }

    const commandName = command as CommandName;
    const commandData: CommandDefinition
        = CommandDefinitions[commandName];
    const commandParameters: StTyped[] = [];

    function toNumber(value: string, index: number) {
        const parsed = +value;
        if (isNaN(parsed)) { resolve.reject(`Parameter "${value}" of index ${index} is not a valid number.`); }
        return parsed;
    }

    function toBoolean(value: string, index: number) {
        const parsed = value.toLowerCase();
        if (parsed !== "true" && parsed !== "false") { resolve.reject(`Parameter "${value}" of index ${index} is not a valid boolean. Must be a "true" or "false".`); }
        return parsed === "true";
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
