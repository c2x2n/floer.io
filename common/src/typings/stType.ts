export type StTypeMapping = {
    string: string
    number: number
    boolean: boolean
};
export type StType = keyof StTypeMapping;
export type StTyped = StTypeMapping[StType];
export type StTypeToRealType<H extends StType> =
    StTypeMapping[H];
