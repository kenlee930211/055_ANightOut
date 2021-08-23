import { JackpotType } from './JackpotPanelEnum';
import JackpotPanelModel, { JackpoWonResult } from './JackpotPanelModel';
import { GetRandomFloat } from '../../../scripts/HelperTools';

export default class JackootPanelModule extends cc.Component {
    static data: JackpotPanelModel = null;

    static getJackpotAmount(jackpotType: JackpotType) {
        let amount = 0;

        switch (jackpotType) {
            case JackpotType.Major:
                amount = GetRandomFloat(20000, 250000);

                this.data.jackpotCounterAmount.major = amount;

                break;
            case JackpotType.Random:
                amount = this.data.jackpotCounterAmount.random + GetRandomFloat(0.1, 0.9);

                this.data.jackpotCounterAmount.random = amount;

                break;
            case JackpotType.Minor:
                amount = GetRandomFloat(5000, 60000);

                this.data.jackpotCounterAmount.minor = amount;

                break;
        }

        return amount;
    }

    static setJackpoWonResult(jackpoWonResult: JackpoWonResult) {
        this.data.jackpoWonResult = jackpoWonResult;
    }

    /**
     * Initialize JackpotPanel Module
     */
    static init() {
        this.data = new JackpotPanelModel();
        this.data.jackpotCounterAmount.minor = 0;
        this.data.jackpotCounterAmount.random = GetRandomFloat(230000, 1100000);
        this.data.jackpotCounterAmount.major = 0;

        // const settingCacheJsonStr = gg.storage.getItem(JackpotPanelConst.CacheKey);
        // if (settingCacheJsonStr == null || settingCacheJsonStr == "") {
        //     this.data = new JackpotPanelModel();
        // } else {
        //     try {
        //         this.data = new JackpotPanelModel().fromJSON(JSON.parse(settingCacheJsonStr));
        //     } catch (error) {
        //         gg.logger.error("解析游戏缓存设置信息时失败", error);
        //         gg.logger.error("将重置游戏设置");
        //         this.data = new JackpotPanelModel();
        //     }
        // }
        // gg.logger.log("游戏设置", this.data);
    }

    static saveSettingConfig() {
        // this.data && gg.storage.setItem(JackpotPanelConst.CacheKey, this.data.toJsonString());
    }
}
