import { gg } from '../../../scripts/framework/gg';
import { GlobalData } from '../../../scripts/GlobalData';
import { AsyncTask, UItools } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';
import HelpInformationModule from './HelpInformationModule';

const { ccclass, property } = cc._decorator;

interface Main {
    pageView: cc.PageView;
    indicatorOnList: cc.Node[];
    buttonDollarBall: cc.Button;
    helpPanelDollarBallInfo: cc.Animation;
    helpUISpriteAtlas: cc.SpriteAtlas;
}

@ccclass
export default class HelpInformationPrefab extends cc.Component {
    @property(cc.PageView)
    pageView: cc.PageView = null;

    @property()
    useCustomIndicator: boolean = false;

    @property(cc.Node)
    customIndicator: cc.Node = null;

    @property(cc.Button)
    buttonDollarBall: cc.Button = null;

    @property(cc.Animation)
    helpPanelDollarBallInfo: cc.Animation = null;

    private main: Main = {
        pageView: null,
        indicatorOnList: [],
        buttonDollarBall: null,
        helpPanelDollarBallInfo: null,
        helpUISpriteAtlas: null,
    };

    onLoad() {
        this.cacheProperty();

        this.registerEvent();
    }

    async start() {
        this.loadHelpInformationAssets();

        this.setupHelpInformationModule();
    }

    btnDollarBallInfoClicked() {
        let animState = null;

        if (this.main.helpPanelDollarBallInfo.node.active) {
            this.main.helpPanelDollarBallInfo.once(cc.Animation.EventType.FINISHED, () => {
                this.main.helpPanelDollarBallInfo.node.active = false;
            });

            animState = this.main.helpPanelDollarBallInfo.play('HelpPanelDollarBallAnimation');
            animState.wrapMode = cc.WrapMode.Reverse;
        } else {
            this.main.helpPanelDollarBallInfo.node.active = true;

            animState = this.main.helpPanelDollarBallInfo.play('HelpPanelDollarBallAnimation');
            animState.wrapMode = cc.WrapMode.Normal;
        }
    }

    btnExitClicked() {
        GameSystemManager.getInstance().setFPS(60);

        AudioManager.getInstance().play('Sfx_ButtonClicks');

        this.hideHelpInformation();
    }

    private setupHelpInformationModule() {
        HelpInformationModule.init();
    }

    private cacheProperty() {
        this.main.pageView = this.pageView;
        this.main.indicatorOnList = this.customIndicator.getChildByName('IndicatorOnGroup').children;
        this.main.buttonDollarBall = this.buttonDollarBall;
        this.main.helpPanelDollarBallInfo = this.helpPanelDollarBallInfo;
    }

    private registerEvent() {
        gg.eventManager.on('MenuPrefab.OnShowHelpInformation', this.onShowHelpInformation, this);
    }

    private onShowHelpInformation() {
        if (this.main.pageView.node.active) {
            this.hideHelpInformation();
        } else {
            this.showHelpInformation();
        }
    }

    private showHelpInformation() {
        GlobalData.flags.helpInformationPageShowning = true;

        this.registerPageViewEvent();

        this.updateCustomPageViewIndicator();

        gg.eventManager.emit('HUDPrefab.OnSpinButtonUpdate', 'disable');

        this.main.pageView.node.active = true;
    }

    private hideHelpInformation() {
        GlobalData.flags.helpInformationPageShowning = false;

        this.removePageViewEvent();

        gg.eventManager.emit('HUDPrefab.OnSpinButtonUpdate', 'enable');

        this.main.pageView.node.active = false;
    }

    private registerPageViewEvent() {
        this.main.pageView.node.on('page-turning', this.updateCustomPageViewIndicator, this);
    }

    private removePageViewEvent() {
        this.main.pageView.node.off('page-turning', this.updateCustomPageViewIndicator, this);
    }

    private updateCustomPageViewIndicator() {
        if (!this.useCustomIndicator) {
            return;
        }

        this.hideAllIndicatorOn();

        const pageViewIndex = this.main.pageView.getCurrentPageIndex();
        const indicatorOn = this.main.indicatorOnList[pageViewIndex];

        if (indicatorOn) {
            indicatorOn.active = true;
        }
    }

    private hideAllIndicatorOn() {
        for (const indicatorOn of this.main.indicatorOnList) {
            indicatorOn.active = false;
        }
    }

    private onActivateDollaBallButton() {
        this.main.buttonDollarBall.node.active = true;
    }

    private async loadHelpInformationAssets() {
        return new Promise<void>((resolve, reject) => {
            const lang = GameSystemManager.getInstance().getLanguageCode();

            /**
             * load sequence
             * 1. preloadCommonAssets
             * 2. preloadLocalizedAssets
             * 3. loadCommonAssets
             * 4. loadLocalizedAssets
             */
            const basePath = 'localized-assets/game-bundle';

            const loadCommonAssets = `${basePath}/load/common`;
            const preloadCommonAssets = `${basePath}/preload/common`;

            const loadLocalizedAssets = `${basePath}/load/${lang}`;
            const preloadLocalizedAssets = `${basePath}/preload/${lang}`;

            /**
             * Preload Common Assets
             * Use when common assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            // cc.resources.preloadDir(preloadCommonAssets, (err, assets) => {});

            /**
             * Preload Localized Assets
             * Use when localized assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            // cc.resources.preloadDir(preloadLocalizedAssets, (err, assets) => {});

            /**
             * Load Common Assets
             * Use when Common assets needed to display immediately
             * Example: Common background need to show after game started.
             */
            const LoadCommonAssets = AsyncTask(async (resolve) => {
                // cc.resources.loadDir(loadCommonAssets, (err, assets) => {});

                resolve();
            });

            /**
             ** Load Localized Assets
             * Use when localized assets needed to display immediately
             * Example: Jackpot counter background need to show after game started.
             */
            const LoadLocalizedAssets = AsyncTask(async (resolve) => {
                cc.resources.loadDir(loadLocalizedAssets, (err, assets) => {
                    cc.resources.load(`${loadLocalizedAssets}/Btn`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {
                        this.main.helpUISpriteAtlas = spriteAtlas;

                        const buttonExit = cc.find('View/Content/Page_1/ButtonExit', this.pageView.node);

                        UItools.ChangeButtonSpriteFrame(buttonExit.getComponent(cc.Button), this.main.helpUISpriteAtlas, {
                            normalSprite: 'ReturnBtn1',
                            pressedSprite: 'ReturnBtn2',
                            disabledSprite: 'ReturnBtn3',
                        });

                        const labelLayer = cc.find('View/Content/Page_1/HelpInfoGroup/LabelLayer/LabelHits', this.pageView.node);
                        const labelScatterPays = cc.find('View/Content/Page_1/HelpInfoGroup/LabelLayer/LabelScatterPays', this.pageView.node);
                        const labelWinDescription = cc.find('View/Content/Page_1/HelpInfoGroup/LabelLayer/LabelWinDescription', this.pageView.node);
                        const labelWild = cc.find('View/Content/Page_1/HelpInfoGroup/LabelLayer/LabelWild', this.pageView.node);
                        const labelWildDescription = cc.find('View/Content/Page_1/HelpInfoGroup/LabelLayer/LabelWildDescription', this.pageView.node);

                        labelLayer.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('HelpFont_01');
                        labelScatterPays.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('HelpFont_02');
                        labelWinDescription.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('HelpFont_04');
                        labelWild.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('HelpFont_03');
                        labelWildDescription.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('HelpFont_05');

                        const helpPanelDollarBallInfo = cc.find('View/Content/Page_1/DollaBallGroup/HelpPanelDollarBallInfo', this.pageView.node);
                        const dollaBallGroup = cc.find('View/Content/Page_1/DollaBallGroup/ButtonDollarBallInfo', this.pageView.node);

                        helpPanelDollarBallInfo.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('JIEMIAN002');
                        UItools.ChangeButtonSpriteFrame(dollaBallGroup.getComponent(cc.Button), this.main.helpUISpriteAtlas, {
                            normalSprite: 'Button1',
                            pressedSprite: 'Button2',
                            disabledSprite: 'Button3',
                        });
                    });

                    resolve();
                });
            });

            // Await Promise
            Promise.all([LoadCommonAssets, LoadLocalizedAssets]).then(() => {
                resolve();
            });
        });
    }
}
