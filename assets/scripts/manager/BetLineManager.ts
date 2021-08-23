const { ccclass } = cc._decorator;

@ccclass
export default class BetLineManager {
    private static instance: BetLineManager;
    private selectedIndex = 0;
    private lines: number[] = [];
    private betLineAdjusting = false;

    static getInstance(): BetLineManager {
        if (!BetLineManager.instance) {
            BetLineManager.instance = new BetLineManager();
        }

        return BetLineManager.instance;
    }

    /**
     * @returns Line Value
     */
    get selectedLine() {
        return this.lines[this.selectedIndex];
    }

    /**
     * @returns Line Selected Index
     */
    get selectedLineIndex() {
        return this.selectedIndex;
    }

    /**
     * @returns Get adjustInProgress status
     */
    get adjustInProgress() {
        return this.betLineAdjusting;
    }

    /**
     * Set adjustInProgress status
     */
    set adjustInProgress(value: boolean) {
        this.betLineAdjusting = value;
    }

    setupBetLine(lines: number[], selectedIndex: number) {
        this.lines = lines;

        this.selectedIndex = selectedIndex;
    }

    /**
     * @returns Line Value
     */
    increase() {
        if (this.checkPoint()) {
            return;
        }

        return this.doIncrease();
    }

    /**
     * @returns Bet Denom Value
     */
    decrease() {
        if (this.checkPoint()) {
            return;
        }

        return this.doDecrease();
    }

    /**
     * This API only use by BetInfoManager
     * Please increase() instead  for normal update
     */
    autoIncrease() {
        if (this.checkLines()) {
            return;
        }

        return this.doIncrease();
    }

    /**
     * This API only use by BetInfoManager
     * Please decrease() instead for normal update
     */
    autoDecrease() {
        if (this.checkLines()) {
            return;
        }

        return this.doDecrease();
    }

    private doIncrease() {
        this.selectedIndex = this.checkSelectedIndex(this.selectedIndex + 1);

        return this.selectedLine;
    }

    private doDecrease() {
        this.selectedIndex = this.checkSelectedIndex(this.selectedIndex - 1);

        return this.selectedLine;
    }

    private checkPoint() {
        if (this.checkLines()) {
            return true;
        } else if (this.checkBetLineAdjusting()) {
            return true;
        }

        return false;
    }

    private checkSelectedIndex(selectedIndex: number) {
        const min = 0;
        const max = this.lines.length - 1;

        if (selectedIndex < min) {
            return max;
        } else if (selectedIndex > max) {
            return min;
        }

        return cc.misc.clampf(selectedIndex, min, max);
    }

    private checkLines() {
        if (this.lines.length === 0) {
            console.error('Bet Line Not Found. Please Setup Bet Line.');

            return true;
        }
    }

    private checkBetLineAdjusting() {
        if (this.betLineAdjusting) {
            console.error('Bet Line auto adjusting. Please try again later.');

            return true;
        }
    }
}
