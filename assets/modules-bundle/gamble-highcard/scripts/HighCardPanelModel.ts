import { CardType } from './HighCardPanelEnum';

export interface HighCardResult {
    dealerCard: number;
    playerCard: number;
    randomCard: number[];
    winAmount: number;
}

export interface Card {
    cardValue: number;
    cardType: CardType;
}

export class HighCardPanelModel {
    highCardActive: boolean = false;

    highCardResult: HighCardResult = null;

    cardDesk: Map<string, Card> = new Map();

    numbersForRandom: number[] = [];
}
