import { ReelStatus, SlotEngineState } from './SlotEngineEnum';

export interface ReelStatusObj {
    triggerByReel: boolean;
    status: ReelStatus;
}

export default class SlotEngineModel {
    resultSymbols: string[] = [];
    state: SlotEngineState = SlotEngineState.Idle;
    reelsStatus: ReelStatusObj[] = [];
}
