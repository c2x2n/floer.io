import { EntityType } from "../../../common/src/constants";

export default class TeamGenerator {
    // For default teams giving to special entities
    private readonly defaultTeams: { [K in EntityType]?: number } = {
        [EntityType.Mob]: 1
    };

    private _currentId = 1;
    private readonly _freeList: number[] = [];

    public create(type: EntityType): number {
        const defaultTeam = this.defaultTeams[type];
        if (typeof defaultTeam === "number" && defaultTeam) {
            return defaultTeam;
        }

        const shifted = this._freeList.shift();

        if (shifted && this.isVaildToGive(shifted)) return shifted;

        do {
            this._currentId++;
        } while (!this.isVaildToGive(this._currentId));
        return this._currentId;
    }

    private isVaildToGive(id: number): boolean {
        return !Object.values(this.defaultTeams).includes(this._currentId) && id > 0;
    }

    public give(id: number) {
        if (!this._freeList.includes(id) && this.isVaildToGive(id)) this._freeList.push(id);
    }
}
