import { ReelStatus } from './SlotEngineEnum';
import SlotEngineModel, { ReelStatusObj } from './SlotEngineModel';

export default class SlotEngineModule extends cc.Component {
    static data: SlotEngineModel = null;

    /**
     * Initialize SlotEngine Module
     */
    static init() {
        this.data = new SlotEngineModel();

        this.resetReelsStatus();
    }

    static recordReelStatus(reelNumber: number, status: ReelStatus, triggerByReel: boolean = false) {
        const reelStatusObj = this.data.reelsStatus[reelNumber];
        reelStatusObj.status = status;
        reelStatusObj.triggerByReel = triggerByReel;
    }

    static getRecordedReelStatusCount() {
        return this.data.reelsStatus.filter((reelStatusObj: ReelStatusObj) => reelStatusObj.status === ReelStatus.Spining || reelStatusObj.status === ReelStatus.Completed).length;
    }

    static recordingReel() {
        return this.getRecordedReelStatusCount() > 0;
    }

    static completedRecordReel() {
        const completedCount = this.data.reelsStatus.filter((reelStatusObj: ReelStatusObj) => reelStatusObj.status === ReelStatus.Completed).length;

        return completedCount === 5;
    }

    static resetResult() {
        this.resetReelsStatus();
    }

    private static resetReelsStatus() {
        this.data.reelsStatus = [
            {
                triggerByReel: false,
                status: ReelStatus.Idle,
            },
            {
                triggerByReel: false,
                status: ReelStatus.Idle,
            },
            {
                triggerByReel: false,
                status: ReelStatus.Idle,
            },
            {
                triggerByReel: false,
                status: ReelStatus.Idle,
            },
            {
                triggerByReel: false,
                status: ReelStatus.Idle,
            },
        ];
    }
}
