import { ZoneName } from "../definitions/zones";

interface LevelInformation {
    level: number;
    remainsExp: number;
    toNextLevelExp: number;
    extraMaxHealth: number;
    extraSlot: number;
    nextExtraSlot: number;
    spawnAt: ZoneName;
}

export function getLevelInformation(exp: number): LevelInformation {
    let levelNow: number = 0;
    let expRemains: number = exp;
    let levelExpCost: number = 0;

    while (expRemains >= levelExpCost) {
        expRemains -= levelExpCost;

        levelExpCost = 3 + Math.abs(levelNow * 1.06 ** (levelNow - 1));

        levelNow += 1;
    }

    let extraSlot = 0;

    let spawnAt: ZoneName = ZoneName.SpawnZone;
    let currentStat: LevelStatDefinition | undefined = undefined;
    let nextExtraSlotLevel = 0;

    let i = 0;
    for (const levelStat of levelStats){
        if (levelNow >= levelStat.level){
            extraSlot += levelStat.extraSlot;
            if (levelStat.level > (currentStat?.level ?? 0) && levelStat.spawnAt) {
                currentStat = levelStat;
                spawnAt = levelStat.spawnAt;
            }
            if (!levelStats[i + 1]) nextExtraSlotLevel = 0;
            else nextExtraSlotLevel = levelStats[i + 1].level ?? 0;
        } else {
            break
        }
        i++
    }

    return {
        level: levelNow,
        remainsExp: expRemains,
        toNextLevelExp: levelExpCost,
        extraMaxHealth: levelNow * ( 200 - 100 ) / 59,
        extraSlot: extraSlot,
        nextExtraSlot: nextExtraSlotLevel,
        spawnAt: spawnAt
    };
}

export function getLevelExpCost(level: number): number {
    let levelNow: number = 0;

    let levelExpCost: number = 0;

    while (level >= levelNow) {
        levelExpCost += 3 + Math.abs(levelNow * 1.06 ** (levelNow - 1));

        levelNow += 1;
    }

    return levelExpCost;
}

export interface LevelStatDefinition {
    level: number;
    spawnAt?: ZoneName;
    extraSlot: number;
}

export const levelStats : LevelStatDefinition[] = [
    {
        level: 1,
        spawnAt: ZoneName.SpawnZone,
        extraSlot: 0
    },{
        level: 15,
        spawnAt: ZoneName.Medium,
        extraSlot: 0
    },{
        level: 30,
        spawnAt: ZoneName.Hard,
        extraSlot: 0
    },{
        level: 45,
        spawnAt: ZoneName.Nightmare,
        extraSlot: 0
    },{
        level: 60,
        extraSlot: 0
    },{
        level: 75,
        extraSlot: 0
    }
]
