import { Zone, ZoneName, Zones } from "../definitions/zones";

interface CurrentLevelInformation {
    level: number;
    remainsExp: number;
    toNextLevelExp: number;
    extraMaxHealth: number;
    extraSlot: number;
}

export function getLevelInformation(exp: number): CurrentLevelInformation {
    let levelNow: number = 0;

    let expRemains: number = exp;

    let levelExpCost: number = 0;

    while (expRemains >= levelExpCost) {
        expRemains -= levelExpCost;

        levelExpCost = 3 + Math.abs(levelNow * 1.06 ** (levelNow - 1));

        levelNow += 1;
    }

    let extraSlot = 0;

    for (const levelStat of levelStats){
        if (levelNow >= levelStat.level){
            extraSlot += levelStat.extraSlot;
        }
    }

    return {
        level: levelNow,
        remainsExp: expRemains,
        toNextLevelExp: levelExpCost,
        extraMaxHealth: levelNow * ( 200 - 100 ) / 59 - 100,
        extraSlot: extraSlot
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

export interface LevelStat {
    level: number;
    spawnAt?: Zone;
    extraSlot: number;
}

export const levelStats : LevelStat[] = [
    {
        level: 1,
        spawnAt: Zones[ZoneName.Easy],
        extraSlot: 0
    },{
        level: 15,
        spawnAt: Zones[ZoneName.Medium],
        extraSlot: 1
    },{
        level: 30,
        spawnAt: Zones[ZoneName.Hard],
        extraSlot: 1
    },{
        level: 45,
        spawnAt: Zones[ZoneName.Nightmare],
        extraSlot: 1
    },{
        level: 60,
        extraSlot: 1
    },{
        level: 75,
        extraSlot: 1
    }
]
