import { BetType } from './CoinPanelEnum';

export interface CoinResult {
    betType: BetType;
    winAmount: number;
    winningStreak: number;
}

export class CoinPanelModel {
    coinActive: boolean = false;

    coinResult: CoinResult = null;

    coinMultiplier: number[] = [];

    winningStreak: number = 0;

    lastCoinResults: number[] = [];
}
