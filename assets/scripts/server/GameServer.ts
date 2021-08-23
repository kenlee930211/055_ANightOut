import axios from 'axios';

const { ccclass } = cc._decorator;

export interface TradeConfig {
    currencyId: number;
    betLine: number;
    betValue: number;
    totalPayLine: number;
}

interface Response {
    data: string;
    error: string | {};
}

// 🚨🚨🚨 Note: All API subject to change by game type and API update. 🚨🚨🚨

@ccclass
export default class GameServer {
    private static instance: GameServer;

    private slotGameCode = '001_GC';
    private gamePlatformId = 'gt3';
    private accessToken = '';
    private memberID = '';
    private operatorID = '';
    private culture = '';

    private useLocalAPI = true;

    static getInstance(): GameServer {
        if (!GameServer.instance) {
            GameServer.instance = new GameServer();
        }

        return GameServer.instance;
    }

    // common API - step 1
    async doLogin() {
        return new Promise<Response>((resolve, reject) => {
            const headers = {
                'Content-Type': 'application/json',
                Culture: this.culture,
            };

            const data = {
                grantType: 'password',
                clientId: 'G3GameSGE',
                clientSecret: 'secret',
                username: '1000009',
                password: '60dab48f1244cd04f517ee06',
                scope: 'offline_access',
                appId: '1',
                gameplatformid: this.gamePlatformId,
            };

            let apiURL = 'https://gefmobileservice.gt3gamedev.com/Auth/Login';

            if (this.useLocalAPI) {
                apiURL = 'http://localhost:3000/Auth/Login';
            }

            axios
                .post(apiURL, data, {
                    headers: headers,
                })
                .then((response) => {
                    if (response.data.accessToken) {
                        const memberProfile = response.data.accessToken.gef_member_profile;

                        this.accessToken = response.data.accessToken.access_token;
                        this.memberID = memberProfile.memberID;
                        this.operatorID = memberProfile.operatorID;

                        resolve({
                            data: response.data,
                            error: null,
                        });
                    } else {
                        resolve({
                            data: null,
                            error: response.data,
                        });
                    }
                })
                .catch((error) => {
                    resolve({
                        data: null,
                        error: {
                            errcode: 'promise_reject',
                            errmsg: error,
                        },
                    });
                });
        });
    }

    // common API - step 2
    async getStartupSetting() {
        return new Promise<Response>((resolve, reject) => {
            const headers = this.getCustomHeader();

            const data = {
                sgcode: this.slotGameCode,
                memberid: this.memberID,
                operatorid: this.operatorID,
            };

            let apiURL = 'https://gefmobileservice.gt3gamedev.com/Play/StartupSetting';

            if (this.useLocalAPI) {
                apiURL = 'http://localhost:3000/Play/StartupSetting';
            }

            axios
                .post(apiURL, data, {
                    headers: headers,
                })
                .then((response) => {
                    if (response.data.res) {
                        resolve({
                            data: response.data.res,
                            error: '',
                        });
                    } else {
                        resolve({
                            data: null,
                            error: response.data,
                        });
                    }
                })
                .catch((error) => {
                    resolve({
                        data: null,
                        error: {
                            errcode: 'promise_reject',
                            errmsg: error,
                        },
                    });
                });
        });
    }

    // common API - step 3
    async tradeRound(tradeCofig: TradeConfig) {
        return new Promise<Response>((resolve, reject) => {
            const headers = this.getCustomHeader();

            // exmaple
            // const data = {
            //     sgcode: this.slotGameCode,
            //     playwinid: 1,
            //     currencyid: 1,
            //     linetrade: 1,
            //     tradeval: 1,
            //     line: 20,
            // };

            const data = {
                sgcode: this.slotGameCode,
                playwinid: 1,
                currencyid: tradeCofig.currencyId,
                linetrade: tradeCofig.betLine,
                tradeval: tradeCofig.betValue,
                line: tradeCofig.totalPayLine,
            };

            let apiURL = 'https://gefmobileservice.gt3gamedev.com/Play/TradeRound';

            if (this.useLocalAPI) {
                apiURL = 'http://localhost:3000/Play/TradeRound';
            }

            axios
                .post(apiURL, data, {
                    headers: headers,
                })
                .then((response) => {
                    if (response.data.res) {
                        resolve({
                            data: response.data.res,
                            error: '',
                        });
                    } else {
                        resolve({
                            data: null,
                            error: response.data,
                        });
                    }
                })
                .catch((error) => {
                    resolve({
                        data: null,
                        error: {
                            errcode: 'promise_reject',
                            errmsg: error,
                        },
                    });
                });
        });
    }

    // custom for Golden Colt
    async tradeFeature(featureGameId: number = 39) {
        return new Promise<Response>((resolve, reject) => {
            const headers = this.getCustomHeader();

            // reference
            // "isexistscatter": {
            //     "isexistscatter": true,
            //     "fgeligibleid": 38, <==== 🚩
            //     "feagid": 3
            //   }

            const data = {
                sgcode: this.slotGameCode,
                feageid: featureGameId, // 'feageid' here reference to tradeRound's 'fgeligibleid' propert as above show,
            };

            let apiURL = 'https://gefmobileservice.gt3gamedev.com/GoldenColtFeature/TradeFeature';

            if (this.useLocalAPI) {
                apiURL = 'http://localhost:3000/GoldenColtFeature/TradeFeature';
            }

            axios
                .post(apiURL, data, {
                    headers: headers,
                })
                .then((response) => {
                    resolve({
                        data: response.data,
                        error: '',
                    });
                })
                .catch((error) => {
                    resolve({
                        data: '',
                        error: error,
                    });
                });
        });
    }

    // custom for Golden Colt
    async tradeMostWanted(reffgeid: number) {
        return new Promise<Response>((resolve, reject) => {
            const headers = this.getCustomHeader();

            const data = {
                sgcode: this.slotGameCode,
                reffgeid: reffgeid,
                cardidx: 0,
            };

            let apiURL = 'https://gefmobileservice.gt3gamedev.com/GoldenColtFeature/TradeMostWanted';

            if (this.useLocalAPI) {
                apiURL = 'http://localhost:3000/GoldenColtFeature/TradeMostWanted';
            }

            axios
                .post(apiURL, data, {
                    headers: headers,
                })
                .then((response) => {
                    if (response.data.res) {
                        resolve({
                            data: response.data.res,
                            error: '',
                        });
                    } else {
                        resolve({
                            data: null,
                            error: response.data,
                        });
                    }
                })
                .catch((error) => {
                    resolve({
                        data: null,
                        error: {
                            errcode: 'promise_reject',
                            errmsg: error,
                        },
                    });
                });
        });
    }

    private getCustomHeader() {
        const headers = {
            'Content-Type': 'application/json',
            Authorization: 'bearer ' + this.accessToken,
            Culture: this.culture,
        };

        return headers;
    }
}
