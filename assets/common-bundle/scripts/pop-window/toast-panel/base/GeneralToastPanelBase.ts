import { PanelComponent } from '../../../../../scripts/framework/lib/router/PanelComponent';
import { UItools } from '../../../../../scripts/HelperTools';
import AudioManager from '../../../../../scripts/manager/AudioManager';
import GameSystemManager from '../../../../../scripts/manager/GameSystemManager';

const { ccclass, property } = cc._decorator;

interface Main {
    toastGroup: cc.Node;
    labelMessage: cc.Label;
    modalDlgSpriteAtlas: cc.SpriteAtlas;
    backURL: string;
    logoutURL: string;
}

@ccclass
export default abstract class GeneralToastPanelBase extends PanelComponent {
    @property(cc.Node)
    toastGroup: cc.Node = null;

    @property(cc.Label)
    labelMessage: cc.Label = null;

    @property(cc.SpriteAtlas)
    modalDlgSpriteAtlas: cc.SpriteAtlas = null;

    protected main: Main = {
        toastGroup: null,
        labelMessage: null,
        modalDlgSpriteAtlas: null,
        backURL: null,
        logoutURL: null,
    };

    onLoad() {
        this.cacheProperty();

        this.setupBaseLocalize();

        this.setupGeneralToastPanelPrefab();
    }

    abstract btnYes(): void;

    abstract btnNo(): void;

    private cacheProperty() {
        this.main.toastGroup = this.toastGroup;
        this.main.labelMessage = this.labelMessage;
        this.main.modalDlgSpriteAtlas = this.modalDlgSpriteAtlas;
    }

    private setupGeneralToastPanelPrefab() {
        const config = GameSystemManager.getInstance().getConfig();

        this.main.backURL = config.backURL;
        this.main.logoutURL = config.logoutURL;
    }

    protected playClickSoundEffect() {
        AudioManager.getInstance().play('Sfx_ButtonClicks');
    }

    private setupBaseLocalize() {
        const lang = GameSystemManager.getInstance().getLanguageCode();
        const btnYes = cc.find('SafeArea/ToastGroup/Content/BtnYes', this.node);
        const btnNo = cc.find('SafeArea/ToastGroup/Content/BtnNo', this.node);

        let LangName = '';

        switch (lang) {
            case 'th':
                LangName = 'Thai';
                break;
            case 'zh':
                LangName = 'CN';
                break;
            default:
                LangName = 'EN';
                break;
        }

        UItools.ChangeButtonSpriteFrame(btnYes.getComponent(cc.Button), this.main.modalDlgSpriteAtlas, {
            normalSprite: 'Yes' + LangName + '0',
            pressedSprite: 'Yes' + LangName + '1',
        });

        UItools.ChangeButtonSpriteFrame(btnNo.getComponent(cc.Button), this.main.modalDlgSpriteAtlas, {
            normalSprite: 'No' + LangName + '0',
            pressedSprite: 'No' + LangName + '1',
        });
    }
}
