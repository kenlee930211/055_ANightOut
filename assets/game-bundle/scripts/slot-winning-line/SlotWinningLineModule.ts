import { WinType } from './SlotWinningLineEnum';

export default class SlotWinningLineModule {
    static getWinType(winAmount: number, totalBet: number) {
        if (winAmount === 0) {
            return WinType.None;
        }

        const winRatio = winAmount / totalBet;

        if (winRatio > 0 && winRatio < 10) {
            return WinType.WinSmall;
        } else if (winRatio >= 10 && winRatio < 15) {
            return WinType.WinBig;
        } else {
            return WinType.None;
        }
    }
}
