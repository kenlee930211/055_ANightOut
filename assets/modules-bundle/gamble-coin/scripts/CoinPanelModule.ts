import { gg } from '../../../scripts/framework/gg';
import { CoinPanelModel, CoinResult } from './CoinPanelModel';
import { BetType, Status } from './CoinPanelEnum';
import { GetRandomInterger } from '../../../scripts/HelperTools';

export default class CoinPanelModule extends cc.Component {
    static data: CoinPanelModel = null;

    /**
     * Initialize CoinPanel Module
     */
    static init() {
        this.data = new CoinPanelModel();
    }

    static getCoinPanelStatus() {
        return this.data.coinActive;
    }

    static setCoinPanelStatus(value: Status) {
        this.data.coinActive = Boolean(value);
    }

    private static setCoinResult(coinResult: CoinResult) {
        this.data.coinResult = coinResult;
    }

    static getLastCoinResults() {
        return this.data.lastCoinResults;
    }

    static clearCoinResult() {
        this.data.coinResult = null;

        this.data.lastCoinResults = [];
    }

    static getCoinMultiplier() {
        return this.data.coinMultiplier[this.data.winningStreak];
    }

    static async getCoinResult(betType: BetType, bank: number) {
        return new Promise<CoinResult>((resolve, reject) => {
            // get result
            const headOrTail = GetRandomInterger(BetType.Head, BetType.Tail);

            let winAmount = 0;
            let coinMultiplier = this.data.coinMultiplier[0];

            if (betType === headOrTail) {
                const coinMultiplierIndex = cc.misc.clampf(this.data.winningStreak, 0, this.data.coinMultiplier.length - 1);

                coinMultiplier = this.data.coinMultiplier[coinMultiplierIndex];

                winAmount = bank * coinMultiplier;

                this.data.winningStreak = cc.misc.clampf(this.data.winningStreak + 1, 0, 5);
            } else {
                this.data.winningStreak = 0;
            }

            const coinResult = {
                betType: headOrTail,
                winningStreak: this.data.winningStreak,
                winAmount: winAmount,
            };

            this.setCoinResult(coinResult);

            this.addLastCoinResult(coinResult.betType);

            resolve(coinResult);
        });
    }

    private static addLastCoinResult(coinResult: number) {
        if (this.data.lastCoinResults.length >= 6) {
            this.data.lastCoinResults.shift();
        }

        this.data.lastCoinResults.push(coinResult);
    }
}
