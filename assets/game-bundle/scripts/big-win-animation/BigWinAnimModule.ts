import { BigWinType } from './BigWinAnimEnum';
import BigWinAnimModel from './BigWinAnimModel';

export default class BigWinAnimModule {
    static data: BigWinAnimModel = null;

    /**
     * Initialize BigWinAnim Module
     */
    static init() {
        this.data = new BigWinAnimModel();
    }

    static getBigWinType(winAmount: number, totalBet: number) {
        if (winAmount === 0) {
            return BigWinType.None;
        }

        const winRatio = winAmount / totalBet;

        if (winRatio >= 15 && winRatio < 50) {
            return BigWinType.BigWin;
        } else if (winRatio >= 50 && winRatio < 100) {
            return BigWinType.MegaBigWin;
        } else if (winRatio >= 100 && winRatio < 150) {
            return BigWinType.SuperBigWin;
        } else if (winRatio >= 150 && winRatio < 200) {
            return BigWinType.UltraBigWin;
        } else if (winRatio >= 200) {
            return BigWinType.UltraMegaBigWin;
        } else {
            return BigWinType.None;
        }
    }
}
