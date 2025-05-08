export const Config: ClientConfig = {
    address: "ws://127.0.0.1:12563/floer/play"
};

export interface ClientConfig {
    readonly address: string
}
