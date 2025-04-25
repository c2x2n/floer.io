export const Config: ServerConfig = {
    host: "0.0.0.0",
    port: 12563,
    tps: 30
};

export interface ServerConfig {
    readonly host: string
    readonly port: number

    /**
     * The server tick rate
     * In ticks/second
     */
    readonly tps: number
}
