const { ccclass } = cc._decorator;

@ccclass
export default class BetDenomManager {
    private static instance: BetDenomManager;
    private selectedIndex = 0;
    private betDenomList: number[] = [];
    private betDenomAdjusting = false;

    static getInstance(): BetDenomManager {
        if (!BetDenomManager.instance) {
            BetDenomManager.instance = new BetDenomManager();
        }

        return BetDenomManager.instance;
    }

    /**
     * @returns Bet Denom Value
     */
    get selectedBetDenom() {
        return this.betDenomList[this.selectedIndex];
    }

    /**
     * @returns Bet Denom Selected Index
     */
    get selectedBetDenomIndex() {
        return this.selectedIndex;
    }

    get isMax() {
        return this.selectedBetDenomIndex === this.betDenomList.length - 1;
    }

    get isMin() {
        return this.selectedBetDenomIndex === 0;
    }

    /**
     * @returns Get adjustInProgress status
     */
    get adjustInProgress() {
        return this.betDenomAdjusting;
    }

    /**
     * Set adjustInProgress status
     */
    set adjustInProgress(value: boolean) {
        this.betDenomAdjusting = value;
    }

    setupBetDenom(betDenomList: number[], selectedIndex: number) {
        this.betDenomList = betDenomList;

        this.selectedIndex = selectedIndex;
    }

    /**
     * @returns Bet Denom Value
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

        const max = this.betDenomList.length - 1;

        let isMax = false;

        if (this.selectedIndex === max) {
            isMax = true;
        }

        return {
            selectedBetDenom: this.selectedBetDenom,
            disableButton: isMax,
        };
    }

    private doDecrease() {
        this.selectedIndex = this.checkSelectedIndex(this.selectedIndex - 1);

        const min = 0;

        let isMin = false;

        if (this.selectedIndex === min) {
            isMin = true;
        }

        return {
            selectedBetDenom: this.selectedBetDenom,
            disableButton: isMin,
        };
    }

    private checkPoint() {
        if (this.checkLines()) {
            return true;
        } else if (this.checkBetDenomAdjusting()) {
            return true;
        }

        return false;
    }

    private checkSelectedIndex(selectedIndex: number) {
        const min = 0;
        const max = this.betDenomList.length - 1;

        // if (selectedIndex < min) {
        //     return max;
        // } else if (selectedIndex > max) {
        //     return min;
        // }

        return cc.misc.clampf(selectedIndex, min, max);
    }

    private checkLines() {
        if (this.betDenomList.length === 0) {
            console.error('Bet Denom Not Found. Please Setup Bet Denom');

            return true;
        }
    }

    private checkBetDenomAdjusting() {
        if (this.betDenomAdjusting) {
            console.error('Bet Denom auto adjusting. Please try again later.');

            return true;
        }
    }
}
