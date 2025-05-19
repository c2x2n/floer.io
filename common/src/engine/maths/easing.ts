import { halfPI } from "./constants";

export const EasingFunctions = {
    linear: (t: number) => t,
    sineIn: (t: number) => {
        return 1 - Math.cos(t * halfPI);
    },
    sineOut: (t: number) => {
        return Math.sin(t * halfPI);
    },
    sineInOut: (t: number) => {
        return (1 - Math.cos(Math.PI * t)) / 2;
    }
} as const;
