export const Config: Readonly<ServerConfig> = Object.freeze({
    host: "0.0.0.0",
    port: 12563,
    tps: 40,
    adminSecret: "72502bd1646d5d37a75fb1aa76b9bd3d53e2129ebd6913b5040da31960181d41" // use sha256 and make your own hash
});

export interface ServerConfig {
    readonly host: string
    readonly port: number

    /**
     * The server tick rate
     * In ticks/second
     */
    readonly tps: number
    readonly adminSecret: string
}
