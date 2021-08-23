import { gg } from '../../../scripts/framework/gg';
import { DicePanelModel, DiceResult } from './DicePanelModel';
import { BetType, Status } from './DicePanelEnum';
import { Shuffle } from '../../../scripts/HelperTools';

export default class DicePanelModule extends cc.Component {
    static data: DicePanelModel = null;

    /**
     * Initialize DicePanel Module
     */
    static init() {
        this.data = new DicePanelModel();

        this.data.numbersForRandom = this.generateRangeNumber(1, 6);
    }

    static getDicePanelStatus() {
        return this.data.diceActive;
    }

    static setDicePanelStatus(value: Status) {
        this.data.diceActive = Boolean(value);
    }

    private static setDiceResult(diceResult: DiceResult) {
        this.data.diceResult = diceResult;
    }

    static getLastDiceResults() {
        return this.data.lastDiceResults;
    }

    static clearDiceResult() {
        this.data.diceResult = null;

        this.data.lastDiceResults = [];
    }

    static async getDiceResult(betType: Number, bank: number) {
        return new Promise<DiceResult>((resolve, reject) => {
            // get result

            const shuffleArray = Shuffle(this.data.numbersForRandom);
            const result = shuffleArray[0];
            const resultObj = {
                number: result,
                bigSmall: result <= 3 ? BetType.Small : BetType.Big,
            };

            let winAmount = 0;

            switch (betType) {
                case BetType.Big:
                case BetType.Small:
                    if (betType === resultObj.bigSmall) {
                        winAmount = bank * 2;
                    }

                    break;

                case BetType.One:
                case BetType.Two:
                case BetType.Three:
                case BetType.Four:
                case BetType.Five:
                case BetType.Six:
                    if (betType === resultObj.number) {
                        winAmount = bank * 6;
                    }
                    break;
            }

            const diceResult = {
                betType: resultObj.number,
                winAmount: winAmount,
            };

            this.setDiceResult(diceResult);

            this.addLastDiceResult(diceResult.betType);

            resolve(diceResult);
        });
    }

    private static addLastDiceResult(diceResult: number) {
        if (this.data.lastDiceResults.length >= 8) {
            this.data.lastDiceResults.shift();
        }

        this.data.lastDiceResults.push(diceResult);
    }

    private static generateRangeNumber(from: number, to: number) {
        const numberList = [];

        for (let i = from; i <= to; i++) {
            numberList.push(i);
        }

        return numberList;
    }
}
