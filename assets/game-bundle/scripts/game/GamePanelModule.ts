/* eslint-disable no-async-promise-executor */
import { GameSetting } from '../../../scripts/GameSetting';
import { Delay, GetRandomFloat, GetRandomInterger, Shuffle } from '../../../scripts/HelperTools';
import GameServer, { TradeConfig } from '../../../scripts/server/GameServer';
import GamePanelModel, { GameResult, ResultWinningLine } from './GamePanelModel';

export default class GamePanelModule {
    static data: GamePanelModel = null;

    /**
     * Initialize GamePanel Module
     */
    static init() {
        this.data = new GamePanelModel();
    }

    static async callGameResultAPI(betLine: number, betValue: number, totalBet: number) {
        return new Promise<GameResult>(async (resolve, reject) => {
            const validTotalBet = this.checkFreeGameAvailability() === true ? 0 : totalBet;

            // const tradeConfig: TradeConfig = {
            //     currencyId: 1,
            //     betLine: betLine,
            //     betValue: betValue,
            //     totalPayLine: 20,
            // };

            // const result = await GameServer.getInstance().tradeRound(tradeConfig);

            // Dummy result
            const numberToRandom = GameSetting.symbols;
            const symbols: string[] = [];

            for (let i = 0; i < 15; i++) {
                const symbol = Shuffle(numberToRandom)[0];

                symbols.push(GameSetting.getSymbolMappingName(symbol));
            }

            const winningLine = this.getWinningLine(symbols, totalBet);
            const totalWinAmount = winningLine.reduce((total, line) => total + line.amount, 0);
            // End of dummy result

            // get game result
            const gameResult: GameResult = {
                totalBet: validTotalBet,
                symbols: symbols,
                winingLine: winningLine,
                totalWinAmount: totalWinAmount,
            };
            this.setGameResult(gameResult);

            // Simulate API request time
            await Delay(0.1);

            resolve(gameResult);
        });
    }

    static checkFreeGameAvailability() {
        // WIP
        return false;
    }

    static getLastGameResult() {
        return this.data.lastGameResult;
    }

    static getGameResult() {
        return this.data.gameResult;
    }

    static updateGameResultToLastResult() {
        this.setLastGameResult(this.data.gameResult);

        this.setGameResult(null);
    }

    private static setGameResult(gameResult: GameResult) {
        this.data.gameResult = gameResult;
    }

    private static setLastGameResult(gameResult: GameResult) {
        this.data.lastGameResult = gameResult;
    }

    private static getWinningLine(symbols: string[], totalBet: number) {
        const symbolsTable = this.arrayToMatrix(symbols, 3);
        const winningListList: ResultWinningLine[] = [];
        const wildSymbol = GameSetting.wildSymbolMappedName;
        const scatterSymbol = GameSetting.freeSpinSymbolMappedName;

        for (const winningLineObj of GameSetting.winningLine) {
            const lineNumber = winningLineObj.lineNumber;
            const linePosition = winningLineObj.linePosition;
            const collector = [];

            for (let x = 0; x < 5; x++) {
                const y = linePosition[x];

                collector.push(symbolsTable[x][y]);
            }

            const collectorList = [
                {
                    matchType: 'LeftToRight',
                    collector: collector,
                },
                {
                    matchType: 'RightToLeft',
                    collector: [...collector].reverse(),
                },
            ];

            // Match left to right / right to left
            for (const obj of collectorList) {
                const symbolToWin = this.getSymbolToWin(obj.collector);
                const lineWinPosition = [];
                let matchCount = 0;

                for (let i = 0; i < 5; i++) {
                    const symbol = obj.collector[i];

                    if (symbol === wildSymbol || symbol === symbolToWin) {
                        const winPosition = linePosition[i];

                        lineWinPosition.push(winPosition);

                        matchCount++;
                    } else {
                        for (let i = 0; i < 5 - matchCount; i++) {
                            lineWinPosition.push(-1);
                        }

                        break;
                    }
                }

                if (matchCount >= 3) {
                    winningListList.push({
                        lineNumber: lineNumber,
                        linePosition: linePosition,
                        lineWinPosition: obj.matchType === 'LeftToRight' ? lineWinPosition : lineWinPosition, //.reverse()
                        amount: this.getPayoutMultiplier(symbolToWin, matchCount) * totalBet,
                    });
                }
            }
        }

        return winningListList;
    }

    private static arrayToMatrix<Type>(arr: Type[], size: number) {
        const res = [];

        for (let i = 0; i < arr.length; i = i + size) res.push(arr.slice(i, i + size));

        return res;
    }

    private static getSymbolToWin(symbols: number[]) {
        const wildSymbol = 1;

        for (const symbol of symbols) {
            if (symbol != wildSymbol) {
                return symbol;
            }
        }
    }

    // eslint-disable-next-line complexity
    private static getPayoutMultiplier(symbolId: number, matchCount): number {
        switch (symbolId) {
            case 1:
                return 0;
            case 2:
                if (matchCount === 3) return 2;
                else if (matchCount === 4) return 2;
                else if (matchCount === 5) return 2;
                else return 0;
            case 3:
                return 0;
            case 4:
            case 5:
                if (matchCount === 3) return 3;
                else if (matchCount === 4) return 3;
                else if (matchCount === 5) return 3;
                else return 0;
            case 7:
            case 6:
                if (matchCount === 3) return 5;
                else if (matchCount === 4) return 5;
                else if (matchCount === 5) return 5;
                else return 0;
            case 9:
            case 8:
                if (matchCount === 3) return 10;
                else if (matchCount === 4) return 10;
                else if (matchCount === 5) return 10;
                else return 0;
            case 10:
            case 11:
                if (matchCount === 3) return 20;
                else if (matchCount === 4) return 20;
                else if (matchCount === 5) return 20;
                else return 0;
            case 12:
                if (matchCount === 3) return 25;
                else if (matchCount === 4) return 25;
                else if (matchCount === 5) return 25;
                else return 0;
            case 13:
                if (matchCount === 3) return 50;
                else if (matchCount === 4) return 100;
                else if (matchCount === 5) return 200;
                else return 0;
            default:
                return 0;
        }
    }
}
