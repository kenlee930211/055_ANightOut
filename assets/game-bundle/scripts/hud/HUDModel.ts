import { AutoSpinStatus, HUDStatus, TurboStatus } from './HUDEnum';

export default class HUDModel {
    state: HUDStatus = HUDStatus.Inactive;
    turboStatus: TurboStatus = TurboStatus.Inactive;
    autoSpinStatus: AutoSpinStatus = AutoSpinStatus.Inactive;
    spaceKeyIsDown: boolean = false;
}
