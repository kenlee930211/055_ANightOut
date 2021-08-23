import { gg } from '../../../scripts/framework/gg';
import { DollarBallPanelModel, DollarBallResult, SelectedNumberObj } from './DollarBallPanelModel';
import { Status } from './DollarBallPanelEnum';
import { Delay, GetRandomFloat, Shuffle } from '../../../scripts/HelperTools';
import { DollarBallPanelEvent } from './DollarBallPanelEvent';

export default class DollarBallPanelModule extends cc.Component {
    static data: DollarBallPanelModel = null;

    /**
     * Initialize DollarBallPanel Module
     */
    static init() {
        this.data = new DollarBallPanelModel();

        this.data.numbersForRandom = this.generateRangeNumber(1, 49);
    }

    private static generateRangeNumber(from: number, to: number) {
        const numberList = [];

        for (let i = from; i <= to; i++) {
            numberList.push(i);
        }

        return numberList;
    }

    /**
     *
     * @param number Selected number
     * @param clickedButton Clicked Button
     * @returns SelectedNumberObj
     */
    static addNumber(number: string, clickedButton: cc.Button) {
        for (const numberSprite of this.data.selectedNumberSpriteList) {
            if (numberSprite.selectedNumber === -1) {
                numberSprite.selectedNumber = Number(number);

                numberSprite.clickedButton = clickedButton;

                return numberSprite;
            }
        }
    }

    static clearNumber() {
        for (const obj of this.data.selectedNumberSpriteList) {
            obj.selectedNumber = -1;
            obj.numberSprite.active = false;
        }
    }

    static createNumberSelectedSpriteList(numberSelectedSprite: cc.Node) {
        const selectedSpriteList: SelectedNumberObj[] = [];

        for (let i = 0; i < 5; i++) {
            selectedSpriteList.push({
                selectedNumber: -1,
                numberSprite: numberSelectedSprite.children[i],
                clickedButton: null,
            });
        }

        return selectedSpriteList;
    }

    static getSelectedNumberSpriteCount() {
        return this.data.selectedNumberSpriteList.filter((x) => {
            return x.selectedNumber > 0;
        }).length;
    }

    static getDollarBallPanelStatus() {
        return this.data.dollarBallActive;
    }

    static setDollarBallPanelStatus(value: Status) {
        this.data.dollarBallActive = value;
    }

    static get5RandomNumber() {
        const shuffleArray = Shuffle(this.data.numbersForRandom);
        const first5Number = [shuffleArray[0], shuffleArray[1], shuffleArray[2], shuffleArray[3], shuffleArray[4]];

        return first5Number;
    }

    static numberIsSelected(selectedNumber: string) {
        for (const numberSprite of this.data.selectedNumberSpriteList) {
            if (numberSprite.selectedNumber.toString() === selectedNumber) {
                return true;
            }
        }

        return false;
    }

    static async setDollarBallResult(dollarBallResult: DollarBallResult) {
        this.data.dollarBallResult = dollarBallResult;

        for (let i = 0; i < 5; i++) {
            gg.eventManager.emit(DollarBallPanelEvent.OnUpdateResultByReelStop, i);

            await Delay(GetRandomFloat(0.1, 0.3));
        }
    }

    static clearDollarBallResult() {
        this.data.dollarBallResult = null;
    }

    static getWinIndicatorIndexByResult(result: number) {
        for (let i = 0; i < 5; i++) {
            const numberSprite = this.data.selectedNumberSpriteList[i];

            if (numberSprite.selectedNumber === result) {
                return i;
            }
        }
    }
}
