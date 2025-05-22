export interface WallDefinition {
    readonly x: number
    readonly y: number
    readonly width: number
    readonly height: number
}

export const Walls: WallDefinition[] = [
    {
        x: 0,
        y: 0,
        width: 100,
        height: 100
    }
];
