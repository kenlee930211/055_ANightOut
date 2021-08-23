import { BetType } from './DicePanelEnum';

export interface DiceResult {
    betType: BetType;
    winAmount: number;
}

export class DicePanelModel {
    diceActive: boolean = false;

    diceResult: DiceResult = null;

    numbersForRandom: number[] = [];

    lastDiceResults: number[] = [];
}
