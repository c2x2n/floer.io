export const Config: ClientConfig = {
    servers: {
        "loc": {
            name: "Local Server",
            address: "ws://localhost:12563/floer/",
            fetchAddress: "http://localhost:12563/floer/"
        }, "sh": {
            name: "Shanghai",
            address: "ws://124.223.18.68:12563/floer/",
            fetchAddress: "http://124.223.18.68:12563/floer/"
        }, "sgp": {
            name: "Singapore",
            address: "wss://floer.xyz/floer/",
            fetchAddress: "http://floer.xyz/floer/"
        }
    }
};

export interface ClientConfig {
    readonly servers: {
        [K: string]: {
            name: string;
            address: string;
            fetchAddress: string;
        }
    }
}

