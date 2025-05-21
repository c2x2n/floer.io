import { StType, StTyped, StTypeToRealType } from "../typings/stType";

export type CommandDefinition = {
    readonly description: string
    readonly parameters: CommandParametersDefinition[]
};

export type CommandParametersDefinition<T extends StType = StType> = {
    readonly type: T
    readonly displayName: string
} & (
    {
        readonly optional: false
    } | {
        readonly optional: true
        readonly default: StTypeToRealType<T>
    }
);

export const CommandDefinitions = {
    name: {
        description: "Renames yourself or other players.",
        parameters: [
            {
                type: "string",
                displayName: "name",
                optional: false
            },
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    exp: {
        description: "Gives exp to yourself or other players.",
        parameters: [
            {
                type: "number",
                displayName: "exp",
                optional: false
            },
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    give: {
        description: "Gives player petals.",
        parameters: [
            {
                type: "string",
                displayName: "petal",
                optional: false
            },
            {
                type: "number",
                displayName: "count",
                optional: true,
                default: 1
            },
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    spawn: {
        description: "Spawns mobs in front of a player.",
        parameters: [
            {
                type: "string",
                displayName: "mob",
                optional: false
            },
            {
                type: "number",
                displayName: "count",
                optional: true,
                default: 1
            },
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    cleanup: {
        description: "Cleans up all mobs and invaild petals. Give a True boolean for parameter to clean up loots too.",
        parameters: [
            {
                type: "boolean",
                displayName: "loot",
                optional: true,
                default: false
            }
        ]
    },
    kill: {
        description: "Kills someone. Without target, it will kill yourself.",
        parameters: [
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    ban: {
        description: "Bans someone. Must have a target.",
        parameters: [
            {
                type: "string",
                displayName: "player",
                optional: false
            }
        ]
    },
    tp: {
        description: "Teleport to someone. Or teleport someone to another people. Without target, it will teleport you to the target player.",
        parameters: [
            {
                type: "string",
                displayName: "player",
                optional: false
            },
            {
                type: "string",
                displayName: "to",
                optional: true,
                default: ""
            }
        ]
    },
    list: {
        description: "List all players' ID and name for help.",
        parameters: []
    },
    help: {
        description: "Show this help menu.",
        parameters: []
    },
    spectator: {
        description: "Toggle spectator mode for yourself or another player. In spectator mode, you can't collide, take damage, or use petals.",
        parameters: [
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    speed: {
        description: "Set movement speed multiplier for yourself or another player.",
        parameters: [
            {
                type: "number",
                displayName: "multiplier",
                optional: false
            },
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    zoom: {
        description: "Set zoom level (field of view) for yourself or another player. Higher values mean you can see further.",
        parameters: [
            {
                type: "number",
                displayName: "multiplier",
                optional: false
            },
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    god: {
        description: "Toggle god mode for yourself or another player. In god mode, you cannot take any damage.",
        parameters: [
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    invisible: {
        description: "Toggle invisibility for yourself or another player.",
        parameters: [
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    },
    freeze: {
        description: "Freeze or unfreeze a player.",
        parameters: [
            {
                type: "string",
                displayName: "player",
                optional: false
            }
        ]
    },
    heal: {
        description: "Restore health and shield to full for yourself or another player.",
        parameters: [
            {
                type: "string",
                displayName: "player",
                optional: true,
                default: ""
            }
        ]
    }
} as const satisfies Readonly<Record<string, CommandDefinition>>;

export type CommandName = keyof typeof CommandDefinitions;

type CommandParameters<T extends CommandName> =
    typeof CommandDefinitions[T]["parameters"];

export type CommandParameterType
    <
        T extends CommandName,
        K extends Array<Readonly<CommandParametersDefinition>> = CommandParameters<T>,
        N extends Array<Readonly<StTyped>> = []
    > =
    K extends [infer H extends Readonly<CommandParametersDefinition>, ...infer R
    extends Array<Readonly<CommandParametersDefinition>>]
        ? H["type"] extends infer S extends Readonly<StType>
            ? CommandParameterType<T, R, [...N,
                S extends "string"
                    ? string
                    : S extends "number"
                        ? number
                        : S extends "boolean"
                            ? boolean
                            : never
            ]>
            : never
        : N;
