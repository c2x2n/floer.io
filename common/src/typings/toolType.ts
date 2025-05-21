export type StringToNumber<S extends string> = S extends `${infer N extends number}` ? N : never;
