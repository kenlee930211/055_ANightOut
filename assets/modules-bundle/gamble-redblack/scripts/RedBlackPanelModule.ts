import { gg } from '../../../scripts/framework/gg';
import { RedBlackPanelModel, RedBlackResult } from './RedBlackPanelModel';
import { Choices, Status } from './RedBlackPanelEnum';
import { GetRandomInterger } from '../../../scripts/HelperTools';

export default class RedBlackPanelModule extends cc.Component {
    static data: RedBlackPanelModel = null;

    /**
     * Initialize RedBlackPanel Module
     */
    static init() {
        this.data = new RedBlackPanelModel();
    }

    static getRedBlackPanelStatus() {
        return this.data.redBlackActive;
    }

    static setRedBlackPanelStatus(value: Status) {
        this.data.redBlackActive = Boolean(value);
    }

    static setRedBlackResult(redBlackResult: RedBlackResult) {
        this.data.redBlackResult = redBlackResult;
    }

    static getLastCardsResults() {
        return this.data.lastCardResults;
    }

    static clearRedBlackResult() {
        this.data.redBlackResult = null;

        this.data.lastCardResults = [];
    }

    static async getRedBlackResult(choices: Choices, balance: number) {
        return new Promise<RedBlackResult>((resolve, reject) => {
            // get result
            const randomCard = GetRandomInterger(1, 52);
            const redOrBlack = randomCard <= 26 ? Choices.Black : Choices.Red;

            let winAmount = 0;

            if (choices === redOrBlack) {
                winAmount = balance * 2;
            }

            const result = {
                cardResult: randomCard,
                winAmount: winAmount,
                playerBalance: winAmount,
            };
            // end of result

            this.setRedBlackResult(result);

            this.addLastCardResult(result.cardResult);

            resolve(result);
        });
    }

    private static addLastCardResult(cardResult: number) {
        if (this.data.lastCardResults.length >= 7) {
            this.data.lastCardResults.shift();
        }

        this.data.lastCardResults.push(cardResult);
    }
}
