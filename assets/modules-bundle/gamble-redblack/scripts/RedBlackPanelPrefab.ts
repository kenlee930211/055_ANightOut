import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { AsyncTask, Delay, GetRandomInterger, Pad } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';
import JackpotPanelModule from '../../jackpot/scripts/JackpotPanelModule';
import { Choices, Status } from './RedBlackPanelEnum';
import { RedBlackPanelEvent } from './RedBlackPanelEvent';
import { RedBlackResult } from './RedBlackPanelModel';
import RedBlackPanelModule from './RedBlackPanelModule';

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
export default class RedBlackPanelPrefab extends PanelComponent {
    @property(cc.Node)
    redBlackGroup: cc.Node = null;

    @property(cc.Button)
    btnActiveRedBlack: cc.Button = null;

    @property(cc.Button)
    btnCollect: cc.Button = null;

    @property(cc.Button)
    btnRed: cc.Button = null;

    @property(cc.Button)
    btnBlack: cc.Button = null;

    @property(cc.Sprite)
    labelChooseRedOrBlack: cc.Sprite = null;

    @property(cc.Sprite)
    labelYouWin: cc.Sprite = null;

    @property(cc.Label)
    labelBank: cc.Label = null;

    @property(cc.Label)
    labelDoubleTo: cc.Label = null;

    @property(cc.Label)
    labelWinAmount: cc.Label = null;

    @property(cc.Sprite)
    currentResult: cc.Sprite = null;

    @property(cc.Node)
    lastResults: cc.Node = null;

    @property(cc.SpriteAtlas)
    cardAtlas: cc.SpriteAtlas = null;

    dummyPlayerBalanceManager = {
        balance: 0,
    };

    onLoad() {
        this.registerEvent();
    }

    async start() {
        // await this.loadRedBlackAssets();

        this.setupRedBlackModule();
    }

    show(option: PanelShowOption): void {
        option.onShowed();
    }

    hide(option: PanelHideOption): void {
        option.onHided();
    }

    /**
     * Register all RedBlackPanel event here
     */
    private registerEvent() {
        // gg.eventManager.on(RedBlackPanelEvent.OnUpdateResultByReelStop, this.onUpdateResultByReelStop, this);
    }

    showGambleButton() {
        if (this.dummyPlayerBalanceManager.balance <= 0) {
            this.dummyPlayerBalanceManager.balance = 733.33;
        }

        this.btnActiveRedBlack.node.active = true;

        cc.tween<cc.Node>(this.btnActiveRedBlack.node).set({ x: 730 }).to(0.5, { x: 400 }, { easing: 'sineOut' }).start();
    }

    activeRedBlackPanel() {
        AudioManager.getInstance().play('ClickSound');

        RedBlackPanelModule.setRedBlackPanelStatus(Status.Active);

        this.btnActiveRedBlack.node.active = false;

        this.redBlackGroup.active = true;

        this.btnCollect.node.active = true;

        this.updateBettingInfomation();

        this.updateLastCardsResult();

        this.enableButtons();
    }

    inActiveRedBlackPanel() {
        RedBlackPanelModule.setRedBlackPanelStatus(Status.Inactive);

        this.redBlackGroup.active = false;
    }

    async pickedRed() {
        this.disableButtons();

        AudioManager.getInstance().play('ClickSound');

        this.btnCollect.node.active = false;

        const result = await this.getRedBlackResult(Choices.Red);

        this.updatePlayerBalance(result.playerBalance);

        this.showResult(result);
    }

    async pickedBlack() {
        this.disableButtons();

        AudioManager.getInstance().play('ClickSound');

        this.btnCollect.node.active = false;

        const result = await this.getRedBlackResult(Choices.Black);

        this.updatePlayerBalance(result.playerBalance);

        this.showResult(result);
    }

    collectMoney() {
        this.inActiveRedBlackPanel();
    }

    private async showResult(result: RedBlackResult) {
        const won = result.winAmount > 0;

        this.updateBettingLabelResult(result);

        this.updateCurrentCardsResult(result.cardResult);

        this.updateLastCardsResult();

        await Delay(2);

        this.resetBettingUI();

        if (won) {
            this.enableButtons();
        } else {
            this.inActiveRedBlackPanel();
        }
    }

    private updateBettingLabelResult(result: RedBlackResult) {
        const won = result.winAmount > 0;

        if (won) {
            this.labelWinAmount.string = result.winAmount.toString();
            this.labelBank.string = result.playerBalance.toString();
            this.labelDoubleTo.string = (result.playerBalance * 2).toString();

            this.labelChooseRedOrBlack.node.active = false;
            this.labelYouWin.node.active = true;
            this.labelWinAmount.node.active = true;
        } else {
            this.labelChooseRedOrBlack.node.active = false;
            this.labelYouWin.node.active = false;
            this.labelWinAmount.node.active = false;

            this.btnCollect.node.active = false;
        }
    }

    private updateCurrentCardsResult(cardResult: number) {
        const cardSpriteFrame = this.getCardSpriteFrame(cardResult);

        this.currentResult.getComponent(cc.Animation).stop();
        this.currentResult.spriteFrame = cardSpriteFrame.bigCard;
    }

    private updateLastCardsResult() {
        const lastCardsResults = RedBlackPanelModule.getLastCardsResults();

        for (let i = 0, len = lastCardsResults.length; i < len; i++) {
            const cardNode = this.lastResults.children[i];
            const cardResult = lastCardsResults[i];
            const cardSpriteFrame = this.getCardSpriteFrame(cardResult);

            cardNode.active = true;
            cardNode.getComponent(cc.Sprite).spriteFrame = cardSpriteFrame.smallCard;
        }
    }

    private resetBettingUI() {
        this.labelChooseRedOrBlack.node.active = true;

        this.labelYouWin.node.active = false;
        this.labelWinAmount.node.active = false;

        this.labelWinAmount.string = '0';

        this.labelBank.string = this.dummyPlayerBalanceManager.balance.toString();
        this.labelDoubleTo.string = (this.dummyPlayerBalanceManager.balance * 2).toString();

        this.btnCollect.node.active = true;

        this.currentResult.getComponent(cc.Animation).play();
    }

    private getRedBlackResult(choices: Choices) {
        return RedBlackPanelModule.getRedBlackResult(choices, this.dummyPlayerBalanceManager.balance);
    }

    private setupRedBlackModule() {
        // Initialize RedBlackPanel Logic
        RedBlackPanelModule.init();
    }

    private updateBettingInfomation() {
        this.labelBank.string = this.dummyPlayerBalanceManager.balance.toString();
        this.labelDoubleTo.string = (this.dummyPlayerBalanceManager.balance * 2).toString();
    }

    private updatePlayerBalance(balance: number) {
        this.dummyPlayerBalanceManager.balance = balance;
    }

    private disableButtons() {
        this.btnRed.getComponent(cc.Button).enabled = false;
        this.btnBlack.getComponent(cc.Button).enabled = false;
        this.btnCollect.getComponent(cc.Button).enabled = false;
    }

    private enableButtons() {
        this.btnRed.getComponent(cc.Button).enabled = true;
        this.btnBlack.getComponent(cc.Button).enabled = true;
        this.btnCollect.getComponent(cc.Button).enabled = true;
    }

    private getCardSpriteFrame(cardNumber: number) {
        const smallCard = this.cardAtlas.getSpriteFrame('Small_' + Pad(cardNumber, 2));
        const bigCard = this.cardAtlas.getSpriteFrame('Big_' + Pad(cardNumber, 2));

        return {
            smallCard: smallCard,
            bigCard: bigCard,
        };
    }

    private async loadRedBlackAssets() {
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
                        // const btnEnable_01 = spriteAtlas.getSpriteFrame('BtnEnable_01');
                        // const btnEnable_02 = spriteAtlas.getSpriteFrame('BtnEnable_02');
                        // const btnEnable_03 = spriteAtlas.getSpriteFrame('BtnEnable_03');

                        // this.btnActiveRedBlack.normalSprite = btnEnable_01;
                        // this.btnActiveRedBlack.pressedSprite = btnEnable_02;
                        // this.btnActiveRedBlack.disabledSprite = btnEnable_03;

                        // const btnDisable_01 = spriteAtlas.getSpriteFrame('BtnDisable_01');
                        // const btnDisable_02 = spriteAtlas.getSpriteFrame('BtnDisable_02');
                        // const btnDisable_03 = spriteAtlas.getSpriteFrame('BtnDisable_03');

                        // this.btnInActiveRedBlack.normalSprite = btnDisable_01;
                        // this.btnInActiveRedBlack.pressedSprite = btnDisable_02;
                        // this.btnInActiveRedBlack.disabledSprite = btnDisable_03;

                        // const rrndomPick_01 = spriteAtlas.getSpriteFrame('RrndomPick_01');
                        // const rrndomPick_02 = spriteAtlas.getSpriteFrame('RrndomPick_02');
                        // const bActivate_01 = spriteAtlas.getSpriteFrame('bActivate_01');
                        // const bActivate_02 = spriteAtlas.getSpriteFrame('bActivate_02');

                        // const buttons = this.numberSelectionPanel.node.getChildByName('Buttons');
                        // const btnRandom = buttons.getChildByName('BtnRandom').getComponent(cc.Button);
                        // const btnAcivate = buttons.getChildByName('BtnAcivate').getComponent(cc.Button);

                        // btnRandom.normalSprite = rrndomPick_01;
                        // btnRandom.pressedSprite = rrndomPick_02;

                        // btnAcivate.normalSprite = bActivate_01;
                        // btnAcivate.pressedSprite = bActivate_02;

                        // const bBet_310 = spriteAtlas.getSpriteFrame('bBet_310');
                        // const Win0 = spriteAtlas.getSpriteFrame('Win0');
                        // const labelBet = cc.find(`Labels/LabelBet`, this.resultsPanel.node).getComponent(cc.Sprite);
                        // const labelWin = cc.find(`Labels/LabelWin`, this.resultsPanel.node).getComponent(cc.Sprite);

                        // labelBet.spriteFrame = bBet_310;
                        // labelWin.spriteFrame = Win0;

                        resolve();
                    });
                });
            });

            // Await Promise
            Promise.all([LoadCommonAssets, LoadLocalizedAssets]).then(() => {
                resolve();
            });

            // AudioManager.getInstance().add('ClickSound', this.buttonClickSound);

            resolve();
        });
    }
}
