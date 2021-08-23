export interface ResultWinningLine {
    lineNumber: number;
    linePosition: number[];
    lineWinPosition: number[];
    amount: number;
}

export interface GameResult {
    totalBet: number;
    symbols: string[];
    winingLine: ResultWinningLine[];
    totalWinAmount: number;
}

export default class GamePanelModel {
    gameResult: GameResult = null;
    lastGameResult: GameResult = null;
}
