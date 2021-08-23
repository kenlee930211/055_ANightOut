import { LocalizeText } from '../../../../scripts/manager/LocalizeManager';
import GeneralToastPanelBase from './base/GeneralToastPanelBase';

const { ccclass, property } = cc._decorator;

@ccclass
export default class InsufficientBalanceToastPanelPrefab extends GeneralToastPanelBase {
    async start() {
        this.setupLocalize();
    }

    show() {
        this.node.active = true;
    }

    hide() {
        this.node.active = false;
    }

    btnYes() {
        this.playClickSoundEffect();

        window.location.href = this.main.backURL;
    }

    btnNo() {
        this.playClickSoundEffect();

        this.hide();
    }

    private setupLocalize() {
        this.main.labelMessage.string = LocalizeText.InsufficientBalance;
    }
}
