import { JackpotType, Status } from './DollarBallPanelEnum';

export interface SelectedNumberObj {
    selectedNumber: number;
    numberSprite: cc.Node;
    clickedButton: cc.Button;
}

export interface DollarBallResult {
    results: number[];
    winAmount: number;
    jackpotType: JackpotType;
    jackpotAmount: number;
}

export class DollarBallPanelModel {
    dollarBallActive: Status = Status.Inactive;

    selectedNumberSpriteList: SelectedNumberObj[] = [];

    numbersForRandom: number[] = [];

    dollarBallResult: DollarBallResult = null;
}
