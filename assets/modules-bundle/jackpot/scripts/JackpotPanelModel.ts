import { JackpotType } from './JackpotPanelEnum';

export interface JackpoWonResult {
    jackpotType: JackpotType;
    amount: number;
}

export default class JackpotPanelModel {
    jackpotCounterAmount = {
        major: 0,
        random: 0,
        minor: 0,
    };

    jackpoWonResult: JackpoWonResult = null;

    // fromJSON(json: any): JackpotPanelModel {
    //     this.musicVolume = json.musicVolume;
    //     this.soundVolume = json.soundVolume;
    //     this.enableVibrate = json.enableVibrate;
    //     return this;
    // }

    // toJSON() {
    //     let json = {};
    //     json = Object.assign(json, this);
    //     return json;
    // }

    // toJsonString() {
    //     return JSON.stringify(this.toJSON());
    // }
}
