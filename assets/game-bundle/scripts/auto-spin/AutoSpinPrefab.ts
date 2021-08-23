import { AutoSpinConst } from './AutoSpinConst';
import AutoSpinModule, { AutoSpinInfo } from './AutoSpinModule';

const { ccclass, property } = cc._decorator;

interface Main {
    labelRemainingSpinCount: cc.Label;
    labelTargetSpinCount: cc.Label;
}

@ccclass
export default class AutoSpinPrefab extends cc.Component {
    @property(cc.Node)
    autoSpinGroup: cc.Node = null;

    private main: Main = {
        labelRemainingSpinCount: null,
        labelTargetSpinCount: null,
    };

    start() {
        this.setupAutoSpinModule();
    }

    get canAutoSpin() {
        return AutoSpinModule.getAutoSpinAvailability();
    }

    get autoSpinInfo() {
        return AutoSpinModule.getAutoSpinInfo();
    }

    consumeAutoSpin(): AutoSpinInfo {
        if (AutoSpinModule.data.targetSpinCount === AutoSpinConst.Infinity) {
            return {
                currentSpinCount: 0,
                targetSpinCount: -1,
                remainingSpinCount: -1,
            };
        }

        if (this.canAutoSpin) {
            const autoSpinInfo = AutoSpinModule.deductAutoSpinCount();

            this.updateAutoSpinLabels();

            if (autoSpinInfo.remainingSpinCount <= 0) {
                this.turnOff();
            }

            return autoSpinInfo;
        }

        return undefined;
    }

    turnOn(targetSpinCount: number) {
        AutoSpinModule.data.targetSpinCount = cc.misc.clampf(targetSpinCount, -1, targetSpinCount);

        this.updateAutoSpinLabels();
    }

    turnOff() {
        AutoSpinModule.data.targetSpinCount = 0;
        AutoSpinModule.data.currentSpinCount = 0;
    }

    private setupAutoSpinModule() {
        // Initialize AutoSpinModule Logic
        AutoSpinModule.init();

        this.cacheLabels();
    }

    private cacheLabels() {
        this.main.labelRemainingSpinCount = cc.find('LabelRemainingSpinCount', this.autoSpinGroup).getComponent(cc.Label);
        this.main.labelTargetSpinCount = cc.find('LabelTargetSpinCount', this.autoSpinGroup).getComponent(cc.Label);
    }

    private updateAutoSpinLabels() {
        this.main.labelRemainingSpinCount.string = this.autoSpinInfo.remainingSpinCount.toString();
        this.main.labelTargetSpinCount.string = this.autoSpinInfo.targetSpinCount.toString();
    }
}
