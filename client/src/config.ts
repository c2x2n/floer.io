export const Config: ClientConfig = {
    servers: {
        loc: {
            name: "Local Server",
            address: "ws://localhost:12563/floer/",
            fetchAddress: "http://localhost:12563/floer/"
        }, sh: {
            name: "Shanghai",
            address: "ws://124.223.18.68:12563/floer/",
            fetchAddress: "http://124.223.18.68:12563/floer/"
        }, sgp: {
            name: "Singapore",
            address: "wss://floer.xyz/floer/",
            fetchAddress: "http://floer.xyz/floer/"
        }, sy: {
            name: "Shiyan",
            address: "ws://211.154.18.48:12563/floer/",
            fetchAddress: "http://211.154.18.48:12563/floer/"
        }, hk: {
            name: "Hongkong",
            address: "ws://38.55.192.120:12563/floer/",
            fetchAddress: "http://38.55.192.120:12563/floer/"
        }
    }
};

export interface ClientConfig {
    readonly servers: Record<string, {
        name: string
        address: string
        fetchAddress: string
    }>
}
