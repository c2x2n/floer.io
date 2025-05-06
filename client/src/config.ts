export const Config: ClientConfig = {
    address: "ws://192.168.0.107:12563/floer/play"
};

export interface ClientConfig {
    readonly address: string
}
