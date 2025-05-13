import { ClientApplication } from "./main";
import { Config } from "./config";

export interface SettingsData {
    keyboardMovement: boolean
    newControl: boolean
    blockMytAnn: boolean
    playerName: string
    screenShake: boolean
    hitbox: boolean
    debug: boolean
    server: string
}

export class Settings {
    data: SettingsData = {
        keyboardMovement: false,
        newControl: false,
        blockMytAnn: false,
        screenShake: true,
        playerName: "",
        hitbox: false,
        debug: false,
        server: "sh"
    };

    constructor(public app: ClientApplication) {
        const data = localStorage.getItem("settings");

        if (data) {
            const json = JSON.parse(data);
            Object.assign(this.data, json);
        }

        if (!Object.prototype.hasOwnProperty.call(Config.servers, this.data.server)) {
            this.data.server = "sh";
        }

        this.saveData();
    }

    saveData() {
        localStorage.setItem("settings", JSON.stringify(this.data));
    }

    changeSettings(key: string, to: SettingsData[keyof SettingsData]): void {
        if (Object.prototype.hasOwnProperty.call(this.data, key)) {
            Object.assign(this.data, {
                [key]: to
            });
        }

        this.saveData();
    }
}
