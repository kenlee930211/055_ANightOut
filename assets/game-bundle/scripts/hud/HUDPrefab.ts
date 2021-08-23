import { gg } from '../../../scripts/framework/gg';
import { GlobalData } from '../../../scripts/GlobalData';
import { AsyncTask, SkippableDelay, UItools } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import BankManager, { BankReceipt, BankResponseCode, Action } from '../../../scripts/manager/BankManager';
import BetDenomManager from '../../../scripts/manager/BetDenomManager';
import BetLineManager from '../../../scripts/manager/BetLineManager';
import CreditCoinConvertorManager, { CCConvertionType, CCConvertor } from '../../../scripts/manager/CreditCoinConvertorManager';
import EventQueueManager from '../../../scripts/manager/EventQueueManager';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';
import { TweenEasing } from '../../../scripts/TweenEasing';
import { AutoSpinStatus, TurboStatus } from './HUDEnum';
import HUDModule from './HUDModule';

const { ccclass, property } = cc._decorator;

interface Main {
    hudUISpriteAtlas: cc.SpriteAtlas;
    slotReelButtons: cc.Node[];
    btnTurbo: cc.Button;
    btnAutoSpin: cc.Button;
    btnSpin: cc.Button;
    btnLineDecrease: cc.Button;
    btnLineIncrease: cc.Button;
    btnBetDecrease: cc.Button;
    btnBetIncrease: cc.Button;
    labelCredit: cc.Label;
    labelWin: cc.Label;
    labelCreditAmount: cc.Label;
    labelWinAmount: cc.Label;
    labelWinMessage: cc.Label;
    labelBetLine: cc.Label;
    labelBetDenom: cc.Label;
    availableBalanceAmountObj: { amount: number };
    wonAmountObj: { amount: number; callback: Function };
    lastClickTime: number;
}

@ccclass
export default class HUDPrefab extends cc.Component {
    @property(cc.Node)
    slotReelButtons: cc.Node = null;

    @property(cc.Node)
    informationGroup: cc.Node = null;

    @property(cc.Button)
    btnTurbo: cc.Button = null;

    @property(cc.Button)
    btnAutoSpin: cc.Button = null;

    @property(cc.Button)
    btnSpin: cc.Button = null;

    @property(cc.Button)
    btnLineDecrease: cc.Button = null;

    @property(cc.Button)
    btnLineIncrease: cc.Button = null;

    @property(cc.Button)
    btnBetDecrease: cc.Button = null;

    @property(cc.Button)
    btnBetIncrease: cc.Button = null;

    @property(cc.Label)
    labelBetLine: cc.Label = null;

    @property(cc.Label)
    LabelBetDenom: cc.Label = null;

    private main: Main = {
        hudUISpriteAtlas: null,
        slotReelButtons: [],
        btnTurbo: null,
        btnAutoSpin: null,
        btnSpin: null,
        btnLineDecrease: null,
        btnLineIncrease: null,
        btnBetDecrease: null,
        btnBetIncrease: null,
        labelCredit: null,
        labelWin: null,
        labelCreditAmount: null,
        labelWinAmount: null,
        labelWinMessage: null,
        labelBetLine: null,
        labelBetDenom: null,
        availableBalanceAmountObj: null,
        wonAmountObj: null,
        lastClickTime: 0,
    };

    get spaceKeyIsDown() {
        return HUDModule.data.spaceKeyIsDown;
    }

    get getTurboStatus() {
        return HUDModule.data.turboStatus === TurboStatus.Active;
    }

    get getAutoSpinStatus() {
        return HUDModule.data.autoSpinStatus === AutoSpinStatus.Active;
    }

    onLoad() {
        this.cacheButtons();

        this.cacheLabels();

        this.setupHUDModule();

        this.manuallyUpdateBalanceOnce();

        this.registerEvent();
    }

    async start() {
        await this.loadHUDAssets();

        this.updateBetLineAndBetDenomUI(true);
    }

    btnSpinClicked(event: cc.Component.EventHandler | null) {
        if (this.invalidPlayerInput()) {
            console.log('invalidPlayerInput');

            return;
        } else if (GlobalData.flags.helpInformationPageShowning) {
            console.log('helpInformationPageShowning');

            return;
        }

        this.resolveSpaceOrSpinButtonEventQueue();
    }

    btnReelClicked(event: cc.Component.EventHandler | null, reelNumberString: string) {
        if (!this.eventQueueIsComplete()) {
            return;
        }

        this.disableSingleSlotReelButton(Number(reelNumberString));

        gg.eventManager.emit('HUDPrefab.OnBtnReelClicked', Number(reelNumberString));
    }

    btnAutoClicked(event: cc.Component.EventHandler | null, forceUpdate?: boolean) {
        if (forceUpdate) {
            // skip bankIsBroke checking
        } else if (!this.eventQueueIsComplete()) {
            // disable auto spin when eventQueue is not complete
        } else if (this.bankIsBroke) {
            return;
        }

        if (HUDModule.data.autoSpinStatus === AutoSpinStatus.Active) {
            HUDModule.setAutoSpinStatus(AutoSpinStatus.Inactive);

            UItools.ChangeButtonSpriteFrame(this.main.btnAutoSpin, this.main.hudUISpriteAtlas, {
                normalSprite: 'BtnAutoPlay_01',
                pressedSprite: 'BtnAutoPlay_02',
                disabledSprite: 'BtnAutoPlay_03',
            });

            // this.enableSlotReelButtons();

            this.main.btnAutoSpin.interactable = false;

            gg.eventManager.emit('HUDPrefab.OnBtnAutoClicked', 'turnOff');
        } else {
            HUDModule.setAutoSpinStatus(AutoSpinStatus.Active);

            UItools.ChangeButtonSpriteFrame(this.main.btnAutoSpin, this.main.hudUISpriteAtlas, {
                normalSprite: 'BtnStopAuto_01',
                pressedSprite: 'BtnStopAuto_02',
                disabledSprite: 'BtnStopAuto_03',
            });

            this.disableSlotReelButtons();

            gg.eventManager.emit('HUDPrefab.OnBtnAutoClicked', 'turnOn', -1);
        }
    }

    btnTurboClicked(event: cc.Component.EventHandler | null) {
        this.playClickSoundEffect();

        if (HUDModule.data.turboStatus === TurboStatus.Active) {
            HUDModule.setTurboStatus(TurboStatus.Inactive);

            UItools.ChangeButtonSpriteFrame(this.main.btnTurbo, this.main.hudUISpriteAtlas, {
                normalSprite: 'BtnTurboOFF_01',
                pressedSprite: 'BtnTurboOFF_02',
                disabledSprite: 'BtnTurboOFF_03',
            });
        } else {
            HUDModule.setTurboStatus(TurboStatus.Active);

            UItools.ChangeButtonSpriteFrame(this.main.btnTurbo, this.main.hudUISpriteAtlas, {
                normalSprite: 'BtnTurboON_01',
                pressedSprite: 'BtnTurboON_02',
                disabledSprite: 'BtnTurboON_03',
            });
        }
    }

    btnLineIncreaseClicked(event: cc.Component.EventHandler | null) {
        this.updateBetLine('increase');
    }

    btnLineDecreaseClicked(event: cc.Component.EventHandler | null) {
        this.updateBetLine('decrease');
    }

    btnBetIncreaseClicked(event: cc.Component.EventHandler | null) {
        this.updateBetDenom('increase');
    }

    btnBetDecreaseClicked(event: cc.Component.EventHandler | null) {
        this.updateBetDenom('decrease');
    }

    btnLabelCreditAmountClicked() {
        if (this.invalidPlayerInput()) {
            console.log('invalidPlayerInput');

            return;
        }

        const convertionType = CreditCoinConvertorManager.getInstance().getConvertionType();
        const newConvertionType = convertionType === CCConvertionType.Coin ? CCConvertionType.Credit : CCConvertionType.Coin;

        CreditCoinConvertorManager.getInstance().updateConvetionType(newConvertionType);

        gg.eventManager.emit('HUDPrefab.onWiningLineAndSymbolClear');

        this.hideWinMessage();
    }

    enableBtnSpin() {
        this.main.btnSpin.interactable = true;
        this.main.btnSpin.enabled = true;
    }

    disableBtnSpin() {
        this.main.btnSpin.interactable = false;
        this.main.btnSpin.enabled = false;
    }

    showBtnSpinAndDim() {
        this.disableBtnSpin();

        this.updateBtnSpinSprite('spin');
    }

    updateBalance(bankReceipt: BankReceipt) {
        if (bankReceipt.responseCode != BankResponseCode.Successful) {
            return;
        }

        if (bankReceipt.action === Action.Withdraw) {
            this.main.labelCreditAmount.string = CCConvertor(bankReceipt.availableBalance.toFixed(2));
        } else if (bankReceipt.action === Action.Deposit) {
            const balance = bankReceipt.availableBalance;
            const winAmount = bankReceipt.amount;

            if (winAmount > 0) {
                this.winAmountReducer(winAmount, balance);
            } else {
                gg.eventManager.emit('BetInfoManager.OnAutoAdjustBetLineAndDenom');
            }
        }
    }

    insufficientBalanceDisable() {
        if (this.bankIsBroke) {
            this.disableBetSettingButtons();
        }

        this.addSpaceOrSpinButtonEvent();
    }

    private setupHUDModule() {
        // Initialize HUDModule Logic
        HUDModule.init();

        this.addLabelForCreditCoinUpdate();
    }

    private addLabelForCreditCoinUpdate() {
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.main.labelCreditAmount);
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.main.labelWinAmount);
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.main.labelBetDenom);
    }

    /**
     * Register all HUD event here
     */
    private registerEvent() {
        gg.eventManager.on('SlotEnginePrefab.OnSpinStarted', this.onSpinStarted, this);
        gg.eventManager.on('SlotEnginePrefab.OnSpinStartedByReel', this.onSpinStarteByReel, this);
        gg.eventManager.on('SlotEnginePrefab.OnSpinEnded', this.onSpinEnded, this);
        gg.eventManager.on('GamePanelFrefab.OnGameRoundEnded', this.onGameRoundEnded, this);

        gg.eventManager.on('BetInfoManager.OnUpdateBetLineAndBetDenomUI', this.onUpdateBetLineAndBetDenomUI, this);
        gg.eventManager.on('SlotWinningLinePrefab.OnShowWinMessage', this.onShowWinMessage, this);
        gg.eventManager.on('HUDPrefab.OnSpinButtonUpdate', this.onSpinButtonUpdate, this);
        gg.eventManager.on('HUDPrefab.TriggerBtnReelClick', this.btnReelClicked, this);

        // 'SpaceOrSpinButton' EventQueue
        this.createSpaceOrSpinButtonEventQueue();

        // Add event to 'SpaceOrSpinButton' EventQueue
        this.addSpaceOrSpinButtonEvent();

        // Added keyboard 'Space' button listener
        if (!cc.sys.isMobile) {
            cc.systemEvent.on(
                cc.SystemEvent.EventType.KEY_DOWN,
                (event: { keyCode: cc.macro.KEY }) => {
                    if (event.keyCode === cc.macro.KEY.space && this.main.btnSpin.enabled) {
                        HUDModule.data.spaceKeyIsDown = true;

                        this.btnSpinClicked(null);
                    }
                },
                this
            );

            cc.systemEvent.on(
                cc.SystemEvent.EventType.KEY_UP,
                (event: { keyCode: cc.macro.KEY }) => {
                    if (event.keyCode === cc.macro.KEY.space) {
                        HUDModule.data.spaceKeyIsDown = false;
                    }
                },
                this
            );
        }
    }

    private createSpaceOrSpinButtonEventQueue() {
        EventQueueManager.getInstance().createEventQueue('SpaceOrSpinButton');
    }

    private addSpaceOrSpinButtonEvent() {
        EventQueueManager.getInstance().addEvent('SpaceOrSpinButton', 'btnSpinClicked', () => {
            this.emitBtnSpinClicked();
        });
    }

    private resolveSpaceOrSpinButtonEventQueue() {
        // What happened here?
        // [
        //   1: 'ShowBigWinAnim'
        //   0: 'btnSpinClicked'
        // ]
        // Spin and Space Button will call EventQueueManager resolver and clear all events before emit 'btnSpinClicked'.
        // Example: current showing BigWin Animation, player click spin button once and EventQueueManager will resolve
        //          BigWin Animation event first then only emit 'btnSpinClicked'
        // Tips: search and follow 'SpaceOrSpinButton' event queue name to understand more.

        return EventQueueManager.getInstance().resolveEvent('SpaceOrSpinButton', 'LastToFirst');
    }

    private eventQueueIsComplete() {
        const eventQueue = EventQueueManager.getInstance().getEventQueue('SpaceOrSpinButton');

        // 'btnSpinClicked' is base event, will always keep in queue
        // if more than 'btnSpinClicked' event in queue, need to resolve/remove it after event done
        if (eventQueue.length === 1 && eventQueue[0].callbackId === 'btnSpinClicked') {
            return true;
        }

        return false;
    }

    private emitBtnSpinClicked() {
        gg.eventManager.emit('HUDPrefab.OnBtnSpinClicked');
    }

    private cacheButtons() {
        this.main.btnTurbo = this.btnTurbo;
        this.main.btnAutoSpin = this.btnAutoSpin;
        this.main.btnSpin = this.btnSpin;
        this.main.btnLineDecrease = this.btnLineDecrease;
        this.main.btnLineIncrease = this.btnLineIncrease;
        this.main.btnBetDecrease = this.btnBetDecrease;
        this.main.btnBetIncrease = this.btnBetIncrease;

        for (const slotReelButton of this.slotReelButtons.children) {
            this.main.slotReelButtons.push(slotReelButton);
        }
    }

    private cacheLabels() {
        this.main.labelCredit = cc.find('LabelCredit', this.informationGroup).getComponent(cc.Label);
        this.main.labelWin = cc.find('LabelWin', this.informationGroup).getComponent(cc.Label);
        this.main.labelCreditAmount = cc.find('LabelCreditAmount', this.informationGroup).getComponent(cc.Label);
        this.main.labelWinAmount = cc.find('LabelWinAmount', this.informationGroup).getComponent(cc.Label);
        this.main.labelWinMessage = cc.find('LabelWinMessage', this.informationGroup).getComponent(cc.Label);

        this.main.labelBetLine = this.labelBetLine;
        this.main.labelBetDenom = this.LabelBetDenom;
    }

    private enableSlotReelButtons() {
        for (const slotReelButton of this.main.slotReelButtons) {
            slotReelButton.active = true;
        }
    }

    private disableSlotReelButtons() {
        for (const slotReelButton of this.main.slotReelButtons) {
            slotReelButton.active = false;
        }
    }

    private disableSingleSlotReelButton(reelNumber: number) {
        const slotReelButton = this.main.slotReelButtons[reelNumber];
        slotReelButton.active = false;
    }

    private updateBtnSpinSprite(name: 'spin' | 'stop') {
        if (name === 'spin') {
            UItools.ChangeButtonSpriteFrame(this.main.btnSpin, this.main.hudUISpriteAtlas, {
                normalSprite: 'BtnSpin_01',
                pressedSprite: 'BtnSpin_02',
                disabledSprite: 'BtnSpin_03',
            });
        } else if (name === 'stop') {
            UItools.ChangeButtonSpriteFrame(this.main.btnSpin, this.main.hudUISpriteAtlas, {
                normalSprite: 'BtnStop_01',
                pressedSprite: 'BtnStop_02',
                disabledSprite: 'BtnStop_03',
            });
        }
    }

    private enableBetSettingButtons() {
        this.main.btnAutoSpin.interactable = true;

        this.main.btnLineDecrease.interactable = true;
        this.main.btnLineIncrease.interactable = true;

        // If current is Min bet index, disable it
        if (BetDenomManager.getInstance().isMax) {
            this.main.btnBetIncrease.interactable = false;
        } else {
            this.main.btnBetIncrease.interactable = true;
        }

        // If current is Max bet index, disable it
        if (BetDenomManager.getInstance().isMin) {
            this.main.btnBetDecrease.interactable = false;
        } else {
            this.main.btnBetDecrease.interactable = true;
        }
    }

    private disableBetSettingButtons() {
        if (!this.getAutoSpinStatus) {
            this.main.btnAutoSpin.interactable = false;
        }

        this.main.btnLineDecrease.interactable = false;
        this.main.btnLineIncrease.interactable = false;
        this.main.btnBetDecrease.interactable = false;
        this.main.btnBetIncrease.interactable = false;
    }

    private updateBetLineAndBetDenomUI(init?: boolean) {
        const betLine = BetLineManager.getInstance().selectedLine;
        const betDenom = BetDenomManager.getInstance().selectedBetDenom;

        this.main.labelBetLine.string = betLine.toString();

        this.main.labelBetDenom.string = CCConvertor((betLine * betDenom).toFixed(2));

        this.hideWinMessage();

        if (!init) {
            gg.eventManager.emit('HUDPrefab.onWiningLineAndSymbolClear');
        }
    }

    private manuallyUpdateBalanceOnce() {
        const accountInfo = BankManager.getInstance().accountInfo;

        this.balanceUpdate(accountInfo.balance);
    }

    private onSpinStarted() {
        this.addSpaceOrSpinButtonEvent();

        this.disableSlotReelButtons();

        this.updateBtnSpinSprite('stop');

        this.disableBetSettingButtons();

        this.hideWinMessage();

        this.clearWinAmountReducer();
    }

    private onSpinStarteByReel(recordedReelStatusCount: number) {
        if (recordedReelStatusCount === 5) {
            this.addSpaceOrSpinButtonEvent();

            this.updateBtnSpinSprite('stop');
        }

        this.disableBetSettingButtons();

        this.hideWinMessage();

        this.clearWinAmountReducer();
    }

    private onSpinEnded() {
        this.main.labelWinMessage.node.active = true;

        this.updateBtnSpinSprite('spin');

        this.disableBtnSpin();
    }

    private onGameRoundEnded(obj: any) {
        this.addSpaceOrSpinButtonEvent();

        this.enableSlotReelButtons();

        this.main.btnAutoSpin.interactable = true;

        if (!obj.haveAutoSpin) {
            this.enableBetSettingButtons();
        }

        this.enableBtnSpin();

        if (this.bankIsBroke) {
            this.insufficientBalanceDisable();

            if (HUDModule.data.autoSpinStatus === AutoSpinStatus.Active) {
                this.btnAutoClicked(null, true);
            }
        }
    }

    private onUpdateBetLineAndBetDenomUI() {
        this.updateBetLineAndBetDenomUI();
    }

    private onShowWinMessage(message: string) {
        this.main.labelWinMessage.string = message;
    }

    private onSpinButtonUpdate(status: string) {
        if (status === 'enable') {
            this.enableBtnSpin();
        } else if (status === 'disable') {
            this.disableBtnSpin();
        }
    }

    private hideWinMessage() {
        this.main.labelWinMessage.node.active = false;

        this.main.labelWinMessage.string = '';
    }

    private playClickSoundEffect() {
        AudioManager.getInstance().play('Sfx_ButtonClicks');
    }

    private get bankIsBroke() {
        return BankManager.getInstance().accountInfo.balance <= 0;
    }

    private balanceUpdate(amount: number) {
        this.main.labelCreditAmount.string = CCConvertor(amount.toFixed(2));
    }

    private async winAmountReducer(winAmount: number, balance: number) {
        const targetAmount = Number(CCConvertor(winAmount.toFixed(2)));
        const availableBalance = Number(CCConvertor(balance.toFixed(2)));

        // Prevent player changing convetion during balance updating
        CreditCoinConvertorManager.getInstance().enable = false;

        AudioManager.getInstance().play('Sfx_CoinLoop', true);

        const progressTime = winAmount < 10 ? 2 : cc.misc.clampf(Math.sqrt(winAmount / 10), 4, 10);
        const convertionType = CreditCoinConvertorManager.getInstance().getConvertionType();
        const fractionDigits = convertionType === CCConvertionType.Coin ? 0 : 2;

        let progressAmount = 0;
        let fromBalance = availableBalance - targetAmount;

        this.main.wonAmountObj = {
            amount: 0,
            callback: () => {
                this.main.labelWinAmount.string = CCConvertor(winAmount.toFixed(2));
                // this.main.labelCreditAmount.string = CCConvertor(balance.toFixed(2));

                CreditCoinConvertorManager.getInstance().enable = true;

                AudioManager.getInstance().stop('Sfx_CoinLoop');
            },
        };

        cc.tween(this.main.wonAmountObj)
            .to(
                progressTime,
                { amount: targetAmount },
                {
                    // eslint-disable-next-line max-params
                    progress: (start: number, end: number, current: number, ratio: number) => {
                        progressAmount = cc.misc.lerp(start, end, ratio);

                        this.main.labelWinAmount.string = progressAmount.toFixed(fractionDigits);
                        this.main.labelCreditAmount.string = (fromBalance + progressAmount).toFixed(fractionDigits);

                        return progressAmount;
                    },
                    easing: TweenEasing.circOut as cc.TweenEasing,
                }
            )
            .call(() => {
                // set amount manually here.
                // Reason: sometime 'progressAmount' stopped at number range 0.1 to 2;
                this.main.wonAmountObj && this.main.wonAmountObj.callback();

                this.main.wonAmountObj = null;

                gg.eventManager.emit('BetInfoManager.OnAutoAdjustBetLineAndDenom');
            })
            .start();
    }

    private async clearWinAmountReducer() {
        if (this.main.wonAmountObj) {
            cc.Tween.stopAllByTarget(this.main.wonAmountObj);

            this.main.wonAmountObj.callback();

            await SkippableDelay(0.5, 'SkippableDelay.StopSpin');

            this.main.wonAmountObj = null;
        }

        this.main.labelWinAmount.string = '';
    }

    private invalidPlayerInput() {
        if (new Date().getTime() < this.main.lastClickTime) {
            // Player input too frequency

            return true;
        }

        this.main.lastClickTime = new Date().getTime() + 100;

        return false;
    }

    private updateBetLine(action: 'increase' | 'decrease') {
        let lineValue: number;

        this.playClickSoundEffect();

        if (this.bankIsBroke) {
            return;
        }

        if (action === 'increase') {
            lineValue = BetLineManager.getInstance().increase();
        } else {
            lineValue = BetLineManager.getInstance().decrease();
        }

        if (!lineValue) {
            return;
        }

        this.updateBetLineAndBetDenomUI();

        this.clearWinAmountReducer();

        gg.eventManager.emit('HUDPrefab.OnWiningLineUpdate', BetLineManager.getInstance().selectedLine);
    }

    private updateBetDenom(action: 'increase' | 'decrease') {
        this.playClickSoundEffect();

        if (this.bankIsBroke) {
            return;
        }

        if (action === 'increase') {
            const response = BetDenomManager.getInstance().increase();

            if (!response) {
                return;
            }

            if (response.disableButton) {
                this.main.btnBetIncrease.interactable = false;
                this.main.btnBetIncrease.enabled = false;
            } else {
                this.main.btnBetIncrease.interactable = true;
                this.main.btnBetIncrease.enabled = true;

                this.main.btnBetDecrease.interactable = true;
                this.main.btnBetDecrease.enabled = true;
            }
        } else {
            const response = BetDenomManager.getInstance().decrease();

            if (!response) {
                return;
            }

            if (response.disableButton) {
                this.main.btnBetDecrease.interactable = false;
                this.main.btnBetDecrease.enabled = false;
            } else {
                this.main.btnBetIncrease.interactable = true;
                this.main.btnBetIncrease.enabled = true;

                this.main.btnBetDecrease.interactable = true;
                this.main.btnBetDecrease.enabled = true;
            }
        }

        this.updateBetLineAndBetDenomUI();

        this.clearWinAmountReducer();
    }

    private async loadHUDAssets() {
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
                // special case: 'Btn' loaded inside LocalizeManager first
                // to make sure no delay when game show up
                // here only take from cache and assign sprite frame to node
                cc.resources.load(`${loadLocalizedAssets}/Btn`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {
                    this.main.hudUISpriteAtlas = spriteAtlas;

                    UItools.ChangeButtonSpriteFrame(this.main.btnSpin, this.main.hudUISpriteAtlas, {
                        normalSprite: 'BtnSpin_01',
                        pressedSprite: 'BtnSpin_02',
                        disabledSprite: 'BtnSpin_03',
                    });

                    UItools.ChangeButtonSpriteFrame(this.main.btnAutoSpin, this.main.hudUISpriteAtlas, {
                        normalSprite: 'BtnAutoPlay_01',
                        pressedSprite: 'BtnAutoPlay_02',
                        disabledSprite: 'BtnAutoPlay_03',
                    });

                    UItools.ChangeButtonSpriteFrame(this.main.btnTurbo, this.main.hudUISpriteAtlas, {
                        normalSprite: 'BtnTurboOFF_01',
                        pressedSprite: 'BtnTurboOFF_02',
                        disabledSprite: 'BtnTurboOFF_03',
                    });

                    const lineBackground = cc.find('UILayer/Buttons/BetLineGroup/LineBackground', this.node);
                    const betBackground = cc.find('UILayer/Buttons/BetDenomGroup/BetBackground', this.node);
                    const labelCredit = cc.find('LabelLayer/InformationGroup/LabelCredit', this.node);
                    const labelWin = cc.find('LabelLayer/InformationGroup/LabelWin', this.node);

                    lineBackground.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('LinesBG');
                    betBackground.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('BetBG');
                    labelCredit.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('Credit');
                    labelWin.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('Win');
                });

                cc.resources.loadDir(loadLocalizedAssets, (err, assets) => {
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
