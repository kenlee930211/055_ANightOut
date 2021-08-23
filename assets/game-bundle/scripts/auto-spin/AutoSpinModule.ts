import { AutoSpinStatus } from '../hud/HUDEnum';
import { AutoSpinConst } from './AutoSpinConst';
import AutoSpinModel from './AutoSpinModel';

export interface AutoSpinInfo {
    currentSpinCount: Number;
    targetSpinCount: Number;
    remainingSpinCount: Number;
}

export default class AutoSpinModule extends cc.Component {
    static data: AutoSpinModel = null;

    /**
     * Initialize AutoSpin Module
     */
    static init() {
        this.data = new AutoSpinModel();
    }

    static deductAutoSpinCount(): AutoSpinInfo {
        const currentSpinCount = this.data.currentSpinCount + 1;
        const targetSpinCount = this.data.targetSpinCount;
        const remainingSpinCount = this.data.targetSpinCount - currentSpinCount;

        this.data.currentSpinCount = currentSpinCount;

        return {
            currentSpinCount: currentSpinCount,
            targetSpinCount: targetSpinCount,
            remainingSpinCount: remainingSpinCount,
        };
    }

    static getAutoSpinAvailability() {
        if (this.data.targetSpinCount === AutoSpinConst.Infinity) {
            return true;
        }

        return this.data.currentSpinCount < this.data.targetSpinCount;
    }

    static getAutoSpinInfo() {
        return {
            currentSpinCount: this.data.currentSpinCount,
            targetSpinCount: this.data.targetSpinCount,
            remainingSpinCount: this.data.targetSpinCount - this.data.currentSpinCount,
        };
    }
}
