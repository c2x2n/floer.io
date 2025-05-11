export type PlayerModifiers = Modifiers & {
    healing: number;
    maxHealth: number;
    revolutionSpeed: number;
    zoom: number;
    damageAvoidanceChance: number;
	damageAvoidanceByDamage: boolean;
    yinYangAmount: number;
    conditionalHeal?: {
        healthPercent: number;
        healAmount: number;
    };
    revive?: {
        healthPercent?: number;
        shieldPercent?: number;
        destroyAfterUse: boolean;
    }
    extraDistance: number;
    controlRotation: boolean;
    extraSlot: number;
    bodyDamage: number;
    knockbackReduction: number;
    bodyDamageReduction: number;
}

export interface Modifiers {
    healPerSecond: number;
    speed: number;
    selfPoison: number;
}

export type StTypeMapping = {
    string: string;
    number: number;
    boolean: boolean;
}

export type StType = keyof StTypeMapping;
export type StTyped = StTypeMapping[StType];
export type StTypeToRealType<H extends StType> =
    StTypeMapping[H];

export type StringToNumber<S extends string> = S extends `${infer N extends number}` ? N : never;
