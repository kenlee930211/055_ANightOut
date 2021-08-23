import { AutoSpinStatus, TurboStatus } from './HUDEnum';
import HUDModel from './HUDModel';

export default class HUDModule {
    static data: HUDModel = null;

    /**
     * Initialize HUD Module
     */
    static init() {
        this.data = new HUDModel();
    }

    static setTurboStatus(status: TurboStatus) {
        this.data.turboStatus = status;
    }

    static setAutoSpinStatus(status: AutoSpinStatus) {
        this.data.autoSpinStatus = status;
    }
}
