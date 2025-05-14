import { Definitions, ObjectDefinition } from "./definitions";
import { strokeColor } from "../misc/colors";

export enum RarityName {
    common = "common",
    unusual = "unusual",
    rare = "rare",
    epic = "epic",
    legendary = "legendary",
    mythic = "mythic",
    unique = "unique",
    super = "super",
    ethereal = "ethereal",
    phantasmagoric = "phantasmagoric",
    arcane = "arcane",
    empyrean = "Empyrean"
}

type RarityDefinition = ObjectDefinition & {
    idString: RarityName
} & {
    color: string
    border: string
    expWhenAbsorb: number
    level: number
    showParticle?: boolean
    isUnique?: boolean
    petalMaxCount?: number
    globalMessage?: boolean
    notCollideWithOther?: boolean
    hideInGallery?: boolean
};

export const Rarity = new Definitions<RarityDefinition>(([
    {
        idString: RarityName.common,
        displayName: "Common",
        color: "#7eef6d",
        expWhenAbsorb: 2,
        level: 1
    },
    {
        idString: RarityName.unusual,
        displayName: "Unusual",
        color: "#ffe65d",
        expWhenAbsorb: 10,
        level: 2
    },
    {
        idString: RarityName.rare,
        displayName: "Rare",
        color: "#4d52e3",
        expWhenAbsorb: 50,
        level: 3
    },
    {
        idString: RarityName.epic,
        displayName: "Epic",
        color: "#861fde",
        expWhenAbsorb: 200,
        level: 4
    },
    {
        idString: RarityName.legendary,
        displayName: "Legendary",
        color: "#de1f1f",
        expWhenAbsorb: 1000,
        level: 5
    },
    {
        idString: RarityName.mythic,
        displayName: "Mythic",
        color: "#1fdbde",
        expWhenAbsorb: 5000,
        level: 6,
        showParticle: true,
        isUnique: true,
        petalMaxCount: 3,
        globalMessage: true,
        notCollideWithOther: true
    },
    {
        idString: RarityName.unique,
        displayName: "Unique",
        color: "#dd2066",
        expWhenAbsorb: 12500,
        level: 7,
        showParticle: true,
        isUnique: true,
        globalMessage: true
    },
    // dev rarities
    {
        idString: RarityName["super"],
        displayName: "Super",
        color: "#2bffa3",
        expWhenAbsorb: 25000,
        level: 8,
        showParticle: true,
        petalMaxCount: 0,
        hideInGallery: true
    },
    {
        idString: RarityName.ethereal,
        displayName: "Ethereal",
        color: "#fdbe28",
        expWhenAbsorb: 25,
        level: 9,
        showParticle: true,
        petalMaxCount: 0,
        globalMessage: true,
        hideInGallery: true
    },
    {
        idString: RarityName.phantasmagoric,
        displayName: "Phantasmagoric",
        color: "#7852a9",
        expWhenAbsorb: 5,
        level: 10,
        showParticle: true,
        petalMaxCount: 0,
        globalMessage: true,
        hideInGallery: true
    },
    {
        idString: RarityName.arcane,
        displayName: "Arcane",
        color: "#7bb78c",
        expWhenAbsorb: 2,
        level: 11,
        showParticle: true,
        petalMaxCount: 0,
        globalMessage: true,
        hideInGallery: true
    },
    {
        idString: RarityName.empyrean,
        displayName: "Empyrean",
        color: "#707c8f",
        expWhenAbsorb: 1,
        level: 12,
        showParticle: true,
        petalMaxCount: 0,
        globalMessage: true,
        hideInGallery: true
    }
] satisfies Array<Partial<RarityDefinition>>).map(def => ({
    ...def,
    border: strokeColor(def.color)
})) satisfies RarityDefinition[]);
