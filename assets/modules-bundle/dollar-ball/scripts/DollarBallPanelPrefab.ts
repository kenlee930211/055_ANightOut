import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { AsyncTask, Delay, GetRandomInterger } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import CreditCoinConvertorManager, { CCConvertor } from '../../../scripts/manager/CreditCoinConvertorManager';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';
import JackpotPanelModule from '../../jackpot/scripts/JackpotPanelModule';
import { JackpotType, Status } from './DollarBallPanelEnum';
import { DollarBallPanelEvent } from './DollarBallPanelEvent';
import DollarBallPanelModule from './DollarBallPanelModule';

const { ccclass, property } = cc._decorator;

interface ResultObj {
    dollarBallAnim: cc.Animation;
    winIndicator: cc.Node;
    numberSprite: cc.Label;
}

interface ResultLabels {
    labelBet: cc.Node;
    labelWin: cc.Node;
}

export interface ResultsPanelPropertyCache {
    x: number;
    y: number;
    scaleX: number;
    scaleY: number;
}

/**
 * Dollar-ball module bundle dependecy to Jackpot module bundle
 * Please make sure Jackpot module is loaded before Dollar-ball module
 */
@ccclass
export default class DollarBallPanelPrefab extends PanelComponent {
    @property(cc.Node)
    DollaBallGroup: cc.Node = null;

    @property(cc.Node)
    numberSelectedSprite: cc.Node = null;

    @property(cc.Sprite)
    resultsPanel: cc.Sprite = null;

    @property()
    resultsPanelX: number = 0;

    @property()
    resultsPanelY: number = 0;

    @property()
    resultsPanelScaleX: number = 1;

    @property()
    resultsPanelScaleY: number = 1;

    @property(cc.Label)
    labelWinAmount: cc.Label = null;

    @property(cc.Label)
    labelBetAmount: cc.Label = null;

    @property(cc.Sprite)
    numberSelectionPanel: cc.Sprite = null;

    @property(cc.SpriteFrame)
    redBackgroud: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    blackBackgroud: cc.SpriteFrame = null;

    @property(cc.Button)
    btnDollaBall: cc.Button = null;

    @property(cc.Button)
    btnRandom: cc.Button = null;

    @property(cc.Button)
    btnActiveDollarBall: cc.Button = null;

    @property(cc.Button)
    btnInActiveDollarBall: cc.Button = null;

    @property(cc.AudioClip)
    buttonClickSound: cc.AudioClip = null;

    private maxPickableNumber = 5;
    private resultSprites: ResultObj[] = [];
    private resultLabels: ResultLabels = {
        labelBet: null,
        labelWin: null,
    };
    private resultsPanelPropertyCache: ResultsPanelPropertyCache = null;

    onLoad() {
        this.registerEvent();
    }

    async start() {
        await this.loadDollarBallAssets();

        this.setupDollarBallModule();
    }

    show(option: PanelShowOption): void {
        option.onShowed();
    }

    hide(option: PanelHideOption): void {
        option.onHided();
    }

    numberButtonClicked(event: cc.Component.EventHandler | null, selectedNumber: string) {
        event && AudioManager.getInstance().play('ClickSound');

        if (DollarBallPanelModule.numberIsSelected(selectedNumber)) {
            return;
        }

        const clickedButton = this.getClickedButton(selectedNumber);
        const clickedButtonLabel = cc.find(`Background/Label`, clickedButton.node);

        this.resetWhenNumberPickedMoreThan5();

        clickedButton.normalSprite = this.redBackgroud;

        const selectedNumberObj = DollarBallPanelModule.addNumber(selectedNumber, clickedButton);
        selectedNumberObj.numberSprite.active = true;

        selectedNumberObj.numberSprite.getComponent(cc.Sprite).spriteFrame = clickedButtonLabel.getComponent(cc.Sprite).spriteFrame;
    }

    randomPick() {
        AudioManager.getInstance().play('ClickSound');

        DollarBallPanelModule.clearNumber();

        this.resetSelectedNumberUI();

        const fiveRandomNumber = DollarBallPanelModule.get5RandomNumber();

        for (const selectedNumber of fiveRandomNumber) {
            this.numberButtonClicked(null, selectedNumber.toString());
        }
    }

    startDollarBallGame() {
        AudioManager.getInstance().play('ClickSound');

        if (DollarBallPanelModule.getSelectedNumberSpriteCount() < this.maxPickableNumber) {
            return;
        }

        DollarBallPanelModule.setDollarBallPanelStatus(Status.Active);

        this.numberSelectionPanel.node.active = false;

        this.changeDollaBallIntoLiteMode();
    }

    activeDollarBallPanel() {
        this.btnActiveDollarBall.node.active = false;

        this.btnInActiveDollarBall.node.active = true;

        this.DollaBallGroup.active = true;

        this.numberSelectionPanel.node.active = true;
    }

    inActiveDollarBallPanel() {
        DollarBallPanelModule.setDollarBallPanelStatus(Status.Inactive);

        this.btnActiveDollarBall.node.active = true;

        this.btnInActiveDollarBall.node.active = false;

        this.DollaBallGroup.active = false;

        this.changeDollaBallIntoFullMode();

        this.clearDollarBallResult();
    }

    /**
     * Register all JackpotPanel event here
     */
    private registerEvent() {
        gg.eventManager.on('SlotEnginePrefab.OnSpinStarted', this.onSpinStarted, this);
        gg.eventManager.on('SlotEnginePrefab.OnSpinStartedByReel', this.onSpinStarteByReel, this);
        gg.eventManager.on('GamePanelFrefab.OnGameRoundEnded', this.onGameRoundEnded, this);

        gg.eventManager.on(DollarBallPanelEvent.OnUpdateResultByReelStop, this.onUpdateResultByReelStop, this);
    }

    // testing dolla ball result
    async setDummyResult() {
        this.clearDollarBallResult();

        await Delay(0.5);

        DollarBallPanelModule.setDollarBallResult({ results: DollarBallPanelModule.get5RandomNumber(), winAmount: GetRandomInterger(0, 3), jackpotType: 0, jackpotAmount: 0 });
    }

    // testing jackpot
    async triggerJackpot() {
        this.clearDollarBallResult();

        await Delay(0.5);

        DollarBallPanelModule.setDollarBallResult({ results: DollarBallPanelModule.get5RandomNumber(), winAmount: GetRandomInterger(0, 3), jackpotType: JackpotType.Random, jackpotAmount: 200 });
    }

    private setupDollarBallModule() {
        // Initialize DollarBallPanel Logic
        DollarBallPanelModule.init();

        // Store numberSelectedSprite's children and use later
        DollarBallPanelModule.data.selectedNumberSpriteList = this.getNumberSelectedSprite();

        // Cache resultsPanel property value: x, y, and scale
        this.resultsPanelPropertyCache = {
            x: this.resultsPanel.node.x,
            y: this.resultsPanel.node.y,
            scaleX: this.resultsPanel.node.scaleX,
            scaleY: this.resultsPanel.node.scaleY,
        };

        this.addResultSpritesCache();

        this.addResultLabelsCache();

        this.addLabelForCreditCoinUpdate();
    }

    private onSpinStarted() {
        this.hideDollarBall();
    }

    private onSpinStarteByReel() {
        this.hideDollarBall();
    }

    private onGameRoundEnded(obj: any) {
        if (!obj.haveAutoSpin) {
            this.enableBtnActiveDollarBall();
        }
    }

    private hideDollarBall() {
        this.disableBtnActiveDollarBall();

        if (DollarBallPanelModule.getDollarBallPanelStatus() === Status.Inactive) {
            this.inActiveDollarBallPanel();
        }
    }

    private enableBtnActiveDollarBall() {
        this.btnActiveDollarBall.interactable = true;
        this.btnInActiveDollarBall.interactable = true;
    }

    private disableBtnActiveDollarBall() {
        this.btnActiveDollarBall.interactable = false;
        this.btnInActiveDollarBall.interactable = false;
    }

    private async onUpdateResultByReelStop(reelNumber: number) {
        const dollarBallResultObj = DollarBallPanelModule.data.dollarBallResult;

        if (dollarBallResultObj) {
            const result = dollarBallResultObj.results[reelNumber];

            const resultSprites = this.resultSprites[reelNumber];
            resultSprites.dollarBallAnim.play();
            resultSprites.numberSprite.string = result.toString();

            const WinIndicatorIndex = DollarBallPanelModule.getWinIndicatorIndexByResult(result);

            if (WinIndicatorIndex) {
                const winIndicator = this.resultSprites[WinIndicatorIndex].winIndicator;

                winIndicator.active = true;
            }

            if (reelNumber === 4) {
                await Delay(0.2);

                const winAmount = dollarBallResultObj.winAmount;

                this.labelWinAmount.string = winAmount === 0 ? '0' : CCConvertor(winAmount.toFixed(2));

                this.resultLabels.labelBet.active = false;

                this.resultLabels.labelWin.active = true;

                if (dollarBallResultObj.jackpotAmount > 0) {
                    JackpotPanelModule.setJackpoWonResult({ jackpotType: dollarBallResultObj.jackpotType, amount: dollarBallResultObj.jackpotAmount });
                }
            }
        }
    }

    private clearDollarBallResult() {
        DollarBallPanelModule.clearDollarBallResult();

        this.resultLabels.labelBet.active = true;

        this.resultLabels.labelWin.active = false;

        for (let i = 0; i < 5; i++) {
            const resultSprite = this.resultSprites[i];

            resultSprite.dollarBallAnim.node.getComponent(cc.Sprite).spriteFrame = null;

            resultSprite.numberSprite.string = '';

            resultSprite.winIndicator.active = false;
        }
    }

    private changeDollaBallIntoLiteMode() {
        this.resultsPanel.node.x = this.resultsPanelX;
        this.resultsPanel.node.y = this.resultsPanelY;
        this.resultsPanel.node.scaleX = this.resultsPanelScaleX;
        this.resultsPanel.node.scaleY = this.resultsPanelScaleY;
    }

    private changeDollaBallIntoFullMode() {
        const prop = this.resultsPanelPropertyCache;

        this.resultsPanel.node.x = prop.x;
        this.resultsPanel.node.y = prop.y;
        this.resultsPanel.node.scaleX = prop.scaleX;
        this.resultsPanel.node.scaleY = prop.scaleY;
    }

    private resetWhenNumberPickedMoreThan5() {
        if (DollarBallPanelModule.getSelectedNumberSpriteCount() >= this.maxPickableNumber) {
            DollarBallPanelModule.clearNumber();

            this.resetSelectedNumberUI();
        }
    }

    private resetSelectedNumberUI() {
        for (const numberSprite of DollarBallPanelModule.data.selectedNumberSpriteList) {
            const button = numberSprite.clickedButton;

            if (button) {
                button.normalSprite = this.blackBackgroud;
            }

            numberSprite.clickedButton = null;
        }
    }

    private getNumberSelectedSprite() {
        return DollarBallPanelModule.createNumberSelectedSpriteList(this.numberSelectedSprite);
    }

    private getClickedButton(selectedNumber: string) {
        const numbers = this.numberSelectionPanel.node.getChildByName('Numbers');
        const btnNumber = numbers.getChildByName('Number' + selectedNumber);
        const button = btnNumber.getComponent(cc.Button);

        return button;
    }

    private addResultSpritesCache() {
        const dollarBallAnims = cc.find(`Results/Anims`, this.resultsPanel.node);
        const winIndicators = cc.find('Results/WinIndicators', this.resultsPanel.node);
        const resultNumbers = cc.find(`Labels/ResultNumbers`, this.resultsPanel.node);

        for (let i = 0; i < 5; i++) {
            this.resultSprites.push({
                dollarBallAnim: dollarBallAnims.children[i].getComponent(cc.Animation),
                winIndicator: winIndicators.children[i],
                numberSprite: resultNumbers.children[i].getComponent(cc.Label),
            });
        }
    }

    private addResultLabelsCache() {
        const LabelBet = cc.find(`Labels/LabelBet`, this.resultsPanel.node);
        const labelWin = cc.find(`Labels/LabelWin`, this.resultsPanel.node);

        this.resultLabels.labelBet = LabelBet;
        this.resultLabels.labelWin = labelWin;
    }

    private addLabelForCreditCoinUpdate() {
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.labelWinAmount);
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.labelBetAmount);
    }

    private async loadDollarBallAssets() {
        return new Promise<void>((resolve, reject) => {
            const lang = GameSystemManager.getInstance().getLanguageCode();

            /**
             * load sequence
             * 1. preloadCommonAssets
             * 2. preloadLocalizedAssets
             * 3. loadCommonAssets
             * 4. loadLocalizedAssets
             */
            const basePath = 'localized-assets/modules-bundle/dollar-ball';

            const loadCommonAssets = `${basePath}/load/common`;
            const preloadCommonAssets = `${basePath}/preload/common`;

            const loadLocalizedAssets = `${basePath}/load/${lang}`;
            const preloadLocalizedAssets = `${basePath}/preload/${lang}`;

            /**
             * Preload Common Assets
             * Use when common assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            // cc.resources.preloadDir(preloadCommonAssets, (err, assets) => {
            // });

            /**
             * Preload Localized Assets
             * Use when localized assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            // cc.resources.preloadDir(preloadLocalizedAssets, (err, assets) => {
            // });

            /**
             * Load Common Assets
             * Use when Common assets needed to display immediately
             * Example: Common background need to show after game started.
             */
            const LoadCommonAssets = AsyncTask(async (resolve) => {
                resolve();
            });

            /**
             ** Load Localized Assets
             * Use when localized assets needed to display immediately
             * Example: Jackpot counter background need to show after game started.
             */
            const LoadLocalizedAssets = AsyncTask(async (resolve) => {
                cc.resources.loadDir(loadLocalizedAssets, (err, assets) => {
                    cc.resources.load(`${loadLocalizedAssets}/dollarball`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {
                        const btnEnable_01 = spriteAtlas.getSpriteFrame('BtnEnable_01');
                        const btnEnable_02 = spriteAtlas.getSpriteFrame('BtnEnable_02');
                        const btnEnable_03 = spriteAtlas.getSpriteFrame('BtnEnable_03');

                        this.btnActiveDollarBall.normalSprite = btnEnable_01;
                        this.btnActiveDollarBall.pressedSprite = btnEnable_02;
                        this.btnActiveDollarBall.disabledSprite = btnEnable_03;

                        const btnDisable_01 = spriteAtlas.getSpriteFrame('BtnDisable_01');
                        const btnDisable_02 = spriteAtlas.getSpriteFrame('BtnDisable_02');
                        const btnDisable_03 = spriteAtlas.getSpriteFrame('BtnDisable_03');

                        this.btnInActiveDollarBall.normalSprite = btnDisable_01;
                        this.btnInActiveDollarBall.pressedSprite = btnDisable_02;
                        this.btnInActiveDollarBall.disabledSprite = btnDisable_03;

                        const rrndomPick_01 = spriteAtlas.getSpriteFrame('RrndomPick_01');
                        const rrndomPick_02 = spriteAtlas.getSpriteFrame('RrndomPick_02');
                        const bActivate_01 = spriteAtlas.getSpriteFrame('bActivate_01');
                        const bActivate_02 = spriteAtlas.getSpriteFrame('bActivate_02');

                        const buttons = this.numberSelectionPanel.node.getChildByName('Buttons');
                        const btnRandom = buttons.getChildByName('BtnRandom').getComponent(cc.Button);
                        const btnAcivate = buttons.getChildByName('BtnAcivate').getComponent(cc.Button);

                        btnRandom.normalSprite = rrndomPick_01;
                        btnRandom.pressedSprite = rrndomPick_02;

                        btnAcivate.normalSprite = bActivate_01;
                        btnAcivate.pressedSprite = bActivate_02;

                        const bBet_310 = spriteAtlas.getSpriteFrame('bBet_310');
                        const Win0 = spriteAtlas.getSpriteFrame('Win0');
                        const labelBet = cc.find(`Labels/LabelBet`, this.resultsPanel.node).getComponent(cc.Sprite);
                        const labelWin = cc.find(`Labels/LabelWin`, this.resultsPanel.node).getComponent(cc.Sprite);

                        labelBet.spriteFrame = bBet_310;
                        labelWin.spriteFrame = Win0;

                        resolve();
                    });
                });
            });

            // Await Promise
            Promise.all([LoadCommonAssets, LoadLocalizedAssets]).then(() => {
                resolve();
            });

            AudioManager.getInstance().add('ClickSound', this.buttonClickSound);

            resolve();
        });
    }
}
