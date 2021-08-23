import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { AsyncTask, Delay } from '../../../scripts/HelperTools';
import { LoadingPanelShowArgs } from '../../../common-bundle/scripts/pop-window/LoadingPanelPrefab';
import { ToastPanelShowArgs } from '../../../common-bundle/scripts/pop-window/ToastPanelPrefab';
import { PanelConfigs } from '../../../main-bundle/scripts/configs/PanelConfigs';
import NoSleepComponent from '../../../scripts/libs/components/noSleep/NoSleepComponent';
import GamePanelModule from './GamePanelModule';
import SlotEnginePrefab from '../slot-engine/SlotEnginePrefab';
import HUDPrefab from '../hud/HUDPrefab';
import AutoSpinPrefab from '../auto-spin/AutoSpinPrefab';
import BetDenomManager from '../../../scripts/manager/BetDenomManager';
import BetLineManager from '../../../scripts/manager/BetLineManager';
import BankManager, { BankReceipt, BankResponseCode } from '../../../scripts/manager/BankManager';
import BetInfoManager from '../../../scripts/manager/BetInfoManager';
import SlotWinningLinePrefab from '../slot-winning-line/SlotWinningLinePrefab';
import BigWinAnimPrefab from '../big-win-animation/BigWinAnimPrefab';
import AudioManager from '../../../scripts/manager/AudioManager';
import CreditCoinConvertorManager, { CCConvertionType } from '../../../scripts/manager/CreditCoinConvertorManager';
import BigWinAnimModule from '../big-win-animation/BigWinAnimModule';
import { BigWinType } from '../big-win-animation/BigWinAnimEnum';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';
import ModuleManager from '../../../scripts/manager/ModuleManager';

const { ccclass, property } = cc._decorator;

interface Main {
    gambleModuleLayer: cc.Node;
    menuModuleLayer: cc.Node;
    slotEnginePrefab: SlotEnginePrefab;
    HUDPrefab: HUDPrefab;
    autoSpinPrefab: AutoSpinPrefab;
    slotWinningLinePrefab: SlotWinningLinePrefab;
    bigWinAnimPrefab: BigWinAnimPrefab;
}

@ccclass
export default class GamePanelPrefab extends PanelComponent {
    @property(cc.Node)
    gambleModuleLayer: cc.Node = null;

    @property(cc.Node)
    menuModuleLayer: cc.Node = null;

    onLoad() {
        this.cacheProperty();

        this.setupDependencyModules();

        this.setupGameModule();

        this.loadModuleBundles();

        this.registerEvent();
    }

    private main: Main = {
        gambleModuleLayer: null,
        menuModuleLayer: null,
        slotEnginePrefab: null,
        HUDPrefab: null,
        autoSpinPrefab: null,
        slotWinningLinePrefab: null,
        bigWinAnimPrefab: null,
    };

    async start() {
        await this.loadGameAssets();
    }

    // Add Bundle Check Point - step 5
    show(option: PanelShowOption): void {
        option.onShowed();

        // console.log(dayjs().format('DD/MM/YYYY'));

        // gg.panelRouter.show({
        //     panel: PanelConfigs.jackpotPanel,
        // });

        // gg.panelRouter.show({
        //     panel: PanelConfigs.dollarBallPanel,
        // });

        // gg.panelRouter.show({
        //     panel: PanelConfigs.gambleRedBlackPanel,
        // });

        // gg.panelRouter.show({
        //     panel: PanelConfigs.gambleHighCardPanel,
        // });

        // gg.panelRouter.show({
        //     panel: PanelConfigs.gambleDicePanel,
        // });

        // gg.panelRouter.show({
        //     panel: PanelConfigs.gambleCoinPanel,
        // });

        // // 默认播放loading动画
        // this._playPanelShowAnim(() => {
        //     option.onShowed();
        // });
    }

    hide(option: PanelHideOption): void {
        option.onHided();
        // this._playPanelHideAnim(() => {
        //     option.onHided();
        // });
    }

    onShowToastPanelBtnClick() {
        //   // 提前加载 Pop 弹窗面板
        //   await gg.panelRouter.loadAsync(Panels.loadingPanel);
        //   await gg.panelRouter.loadAsync(Panels.toastPanel);
        gg.panelRouter.show({
            panel: PanelConfigs.toastPanel,
            data: <ToastPanelShowArgs>{
                text: '短Toast测试',
            },
        });
    }

    onShowLoadingPanelBtnClick() {
        // 打开面板弹窗
        gg.panelRouter.show({
            panel: PanelConfigs.loadingPanel,
            data: <LoadingPanelShowArgs>{
                playShowAnim: true,
                onCancelLoadingBtnClick: () => {
                    gg.panelRouter.hide({
                        panel: PanelConfigs.loadingPanel,
                    });
                },
            },
            onShowed: () => {},
        });
    }

    onShowGameSettingPanelBtnClick() {
        gg.panelRouter.show({
            panel: PanelConfigs.gameSettingPanel,
        });
    }

    async onBtnSpinClicked() {
        // Note: will conbine with onBtnReelClicked function in future

        if (this.main.slotEnginePrefab.isSpinning) {
            this.main.HUDPrefab.showBtnSpinAndDim();

            gg.eventManager.emit('SkippableDelay.StopSpin');

            return;
        }

        gg.eventManager.emit('GamePanelFrefab.OnGameRoundStart');

        const betInfo = BetInfoManager.getInstance().betInfo;

        // Check current round result first, it may trigger by single reel before
        let gameResult = GamePanelModule.getGameResult();

        let withdrawalReceipt: BankReceipt = null;

        if (!gameResult) {
            const withdrawAmount = this.checkFreeGameAvailability() === true ? 0 : betInfo.totalBet;

            withdrawalReceipt = BankManager.getInstance().withdraw(withdrawAmount);

            if (withdrawalReceipt.responseCode === BankResponseCode.InsufficientBalance) {
                gg.panelRouter.show({
                    panel: PanelConfigs.insufficientBalanceToastPanel,
                });

                this.main.HUDPrefab.insufficientBalanceDisable();

                return;
            } else if (withdrawalReceipt.responseCode === BankResponseCode.Failed) {
                // Handle error message here
                // console.log(withdrawalReceipt.responseMessage);

                return;
            }

            // Update balance UI
            this.main.HUDPrefab.updateBalance(withdrawalReceipt);
        }

        await AsyncTask(async (resolve) => {
            this.main.slotEnginePrefab.startReelSpin();

            if (!gameResult && withdrawalReceipt.responseCode === BankResponseCode.Successful) {
                this.main.HUDPrefab.disableBtnSpin();

                gameResult = await GamePanelModule.callGameResultAPI(betInfo.selectedLine, betInfo.selectedBetDenom, betInfo.totalBet);

                this.main.HUDPrefab.enableBtnSpin();
            }

            this.main.slotEnginePrefab.updateReelSymbols(gameResult.symbols);

            const turbo = this.main.HUDPrefab.getTurboStatus;
            const completedRecordReel = await this.main.slotEnginePrefab.stopReelSpin(turbo);

            if (completedRecordReel) {
                // Update current game result to last result immediately after spin ended
                GamePanelModule.updateGameResultToLastResult();

                // Display Winning Line and Symbol Animation
                this.main.slotWinningLinePrefab.showWinningLine(gameResult.totalWinAmount, betInfo.totalBet, gameResult.winingLine);

                // Update bank balance
                const depositReceipt = BankManager.getInstance().deposit(gameResult.totalWinAmount);

                // Update balance UI
                this.main.HUDPrefab.updateBalance(depositReceipt);

                // Display BigWin Animation
                await this.main.bigWinAnimPrefab.showBigWinAnimation(gameResult.totalWinAmount, betInfo.totalBet);

                // Do delay before Next Spin
                await this.delayBeforeNextSpin(gameResult.totalWinAmount, betInfo.totalBet);

                gg.eventManager.emit('GamePanelFrefab.OnGameRoundEnded', {
                    haveAutoSpin: this.checkAutoSpinAvailability(),
                });
            }
            cc.log(gameResult);
            resolve();
        });

        if (this.checkFreeGameAvailability()) {
            // spin free game

            NoSleepComponent.getInstance().enable();
        } else if (this.checkAutoSpinAvailability()) {
            await Delay(0.2);

            NoSleepComponent.getInstance().enable();

            this.main.autoSpinPrefab.consumeAutoSpin();

            this.onBtnSpinClicked();
        } else {
            NoSleepComponent.getInstance().disable();
        }
    }

    async onBtnReelClicked(reelNumber: number) {
        const betInfo = BetInfoManager.getInstance().betInfo;

        let withdrawalReceipt: BankReceipt = null;

        // Check current round result first, it may trigger by single reel before
        let gameResult = GamePanelModule.getGameResult();

        if (!gameResult) {
            const withdrawAmount = this.checkFreeGameAvailability() === true ? 0 : betInfo.totalBet;

            withdrawalReceipt = BankManager.getInstance().withdraw(withdrawAmount);

            if (withdrawalReceipt.responseCode === BankResponseCode.InsufficientBalance) {
                gg.panelRouter.show({
                    panel: PanelConfigs.insufficientBalanceToastPanel,
                });

                this.main.HUDPrefab.insufficientBalanceDisable();

                return;
            } else if (withdrawalReceipt.responseCode === BankResponseCode.Failed) {
                // Handle error message here
                // console.log(withdrawalReceipt.responseMessage);

                return;
            }

            // Update balance UI
            this.main.HUDPrefab.updateBalance(withdrawalReceipt);
        }

        await AsyncTask(async (resolve) => {
            this.main.slotEnginePrefab.startReelSpinByReel(reelNumber);

            if (!gameResult && withdrawalReceipt.responseCode === BankResponseCode.Successful) {
                gameResult = await GamePanelModule.callGameResultAPI(betInfo.selectedLine, betInfo.selectedBetDenom, betInfo.totalBet);
            }

            this.main.slotEnginePrefab.updateReelSymbolsByReel(gameResult.symbols, reelNumber);

            const turbo = this.main.HUDPrefab.getTurboStatus;
            const completedRecordReel = await this.main.slotEnginePrefab.stopReelSpinByReel(turbo, reelNumber);

            if (completedRecordReel) {
                // Update current game result to last result immediately after spin ended
                GamePanelModule.updateGameResultToLastResult();

                // Display Winning Line and Symbol Animation
                this.main.slotWinningLinePrefab.showWinningLine(gameResult.totalWinAmount, betInfo.totalBet, gameResult.winingLine);

                // Update bank balance
                const depositReceipt = BankManager.getInstance().deposit(gameResult.totalWinAmount);

                // Update balance UI
                this.main.HUDPrefab.updateBalance(depositReceipt);

                // Display BigWin Animation
                await this.main.bigWinAnimPrefab.showBigWinAnimation(gameResult.totalWinAmount, betInfo.totalBet);

                // Do delay before Next Spin
                await this.delayBeforeNextSpin(gameResult.totalWinAmount, betInfo.totalBet);

                gg.eventManager.emit('GamePanelFrefab.OnGameRoundEnded', {
                    haveAutoSpin: this.checkAutoSpinAvailability(),
                });
            }

            resolve();
        });
    }

    onBtnAutoSpinClicked(status: 'turnOn' | 'turnOff', targetSpinCount: number = -1) {
        if (status === 'turnOn') {
            NoSleepComponent.getInstance().enable();

            this.main.autoSpinPrefab.turnOn(targetSpinCount);

            if (this.main.autoSpinPrefab.canAutoSpin) {
                this.main.autoSpinPrefab.consumeAutoSpin();

                this.onBtnSpinClicked();
            }
        } else if (status === 'turnOff') {
            NoSleepComponent.getInstance().disable();

            this.main.autoSpinPrefab.turnOff();
        }
    }

    /**
     * Register all GamePanelPrefab event here
     */
    private registerEvent() {
        gg.eventManager.on('HUDPrefab.OnBtnSpinClicked', this.onBtnSpinClicked, this);
        gg.eventManager.on('HUDPrefab.OnBtnReelClicked', this.onBtnReelClicked, this);
        gg.eventManager.on('HUDPrefab.OnBtnAutoClicked', this.onBtnAutoSpinClicked, this);
    }

    private setupGameModule() {
        // Initialize GamePanelModule Logic
        GamePanelModule.init();

        this.main.slotEnginePrefab = this.getComponentInChildren(SlotEnginePrefab);

        this.main.HUDPrefab = this.getComponentInChildren(HUDPrefab);

        this.main.autoSpinPrefab = this.getComponentInChildren(AutoSpinPrefab);

        this.main.slotWinningLinePrefab = this.getComponentInChildren(SlotWinningLinePrefab);

        this.main.bigWinAnimPrefab = this.getComponentInChildren(BigWinAnimPrefab);
    }

    private loadModuleBundles() {
        const moduleList = ModuleManager.getInstance().getModuleList();

        // Check module-bundle info here
        // console.log(moduleList);

        for (const module of moduleList) {
            // Load Bundle
            cc.assetManager.loadBundle(module.bundleName, (err, bundle) => {
                if (err) {
                    return console.error(err);
                }

                // Load LoadPrefab
                bundle.load(module.bundlePrefabPath, cc.Prefab, (err, prefab: cc.Prefab) => {
                    // if your game need Custom Property to fix UI problem, create a `case` .
                    // Example: JackpotPanelPrefab, DollarBallBundle, menuBundle

                    switch (module.moduleCode.toLowerCase()) {
                        case 'jackpotprogression': {
                            // Custom JackpotPanelPrefab for NNYU Theme
                            // 1. Load JackpotPanelPrefab
                            const jackpotPanelPrefab = cc.instantiate(prefab);

                            // Custom property
                            const jackpotCounter = jackpotPanelPrefab.getChildByName('SafeArea').getChildByName('JackpotCounter');
                            jackpotCounter.scaleX = 1.5;
                            jackpotCounter.scaleY = 1.2;

                            this.main.gambleModuleLayer.getChildByName('JackpotLayer').addChild(jackpotPanelPrefab);

                            break;
                        }
                        case 'jackpotwin': {
                            const jackpotPanelPrefab = cc.instantiate(prefab);

                            // Custom property
                            jackpotPanelPrefab.setParent(this.main.gambleModuleLayer.getChildByName('JackpotLayer'));
                            break;
                        }
                        case 'dollarball': {
                            // Custom DollarBallBundle for NNYU Theme
                            // 2. Load DollarBallBundle
                            const dollarBallPanelPrefab = cc.instantiate(prefab);

                            // Custom property
                            const activateButtons = dollarBallPanelPrefab.getChildByName('SafeArea').getChildByName('ActivateButtons');
                            activateButtons.scaleX = 1.6;
                            activateButtons.scaleY = 1.2;
                            activateButtons.x = -950;
                            activateButtons.y = -50;

                            const dollarBallPanelPrefabComponent = dollarBallPanelPrefab.getComponent('DollarBallPanelPrefab');
                            dollarBallPanelPrefabComponent.resultsPanelScaleX *= 1.3;
                            dollarBallPanelPrefabComponent.resultsPanelX = -170;
                            dollarBallPanelPrefabComponent.resultsPanelY = 220;

                            this.main.gambleModuleLayer.addChild(dollarBallPanelPrefab);

                            break;
                        }
                        case 'menu': {
                            // Custom DollarBallBundle for NNYU Theme
                            // 3. Load MenuPrefab
                            const menuPrefab = cc.instantiate(prefab);

                            // Custom Layer
                            this.main.menuModuleLayer.addChild(menuPrefab);

                            break;
                        }
                        case 'bigwin': {
                            // Custom BigwinBundle for NNYU Theme

                            break;
                        }
                        default: {
                            // Bundle that no need customise
                            const gambleModulePrefab = cc.instantiate(prefab);

                            this.main.gambleModuleLayer.addChild(gambleModulePrefab);

                            break;
                        }
                    }
                });
            });
        }
    }

    private cacheProperty() {
        this.main.gambleModuleLayer = this.gambleModuleLayer;
        this.main.menuModuleLayer = this.menuModuleLayer;
    }

    private setupDependencyModules() {
        const config = GameSystemManager.getInstance().getConfig();

        const convertionType = config.defaultConvertionType === 'point' ? CCConvertionType.Coin : CCConvertionType.Credit;
        CreditCoinConvertorManager.getInstance().setupCreditCoinConvertor(convertionType, config.convertionMultiplier);

        BetDenomManager.getInstance().setupBetDenom(config.betDenom.coins, config.betDenom.defaultIndex);

        BetLineManager.getInstance().setupBetLine(config.betLine.lines, config.betLine.defaultIndex);

        BankManager.getInstance().setupBank(config.currency, config.playerBalance);
    }

    private checkFreeGameAvailability() {
        // free game logic here
        return false;
    }

    private checkAutoSpinAvailability() {
        if (this.main.autoSpinPrefab.canAutoSpin) {
            return true;
        }

        return false;
    }

    private async delayBeforeNextSpin(totalWinAmount: number, totalBet: number) {
        if (this.checkAutoSpinAvailability()) {
            const bigWinType = BigWinAnimModule.getBigWinType(totalWinAmount, totalBet);

            if (totalWinAmount > 0 && bigWinType === BigWinType.None) {
                // When auto spin have win line or win, need to stay 2 seconds only proceed to next spin
                await Delay(2);
            } else {
                // When auto spin dont have any win line, need to hold 0.5 seconds only go for next spin
                await Delay(0.5);
            }
        } else if (this.main.HUDPrefab.spaceKeyIsDown) {
            if (totalWinAmount > 0) {
                //  Need to have have some delay for enable spin button like 0.5seconds during have win line.
                await Delay(0.5);
            } else {
                // Need to have have some delay for enable spin button like 0.2 seconds for no win,
                await Delay(0.2);
            }
        }
    }

    private async loadGameAssets() {
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
                cc.resources.loadDir(`${loadCommonAssets}/sounds`, cc.AudioClip, (err, audioClips: cc.AudioClip[]) => {
                    AudioManager.getInstance().addAll(audioClips);

                    resolve();
                });
            });

            /**
             ** Load Localized Assets
             * Use when localized assets needed to display immediately
             * Example: Jackpot counter background need to show after game started.
             */
            const LoadLocalizedAssets = AsyncTask(async (resolve) => {
                // cc.resources.loadDir(loadLocalizedAssets, (err, assets) => {
                // cc.resources.load(`${loadLocalizedAssets}/Btn`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {
                //     this.main.hudUISpriteAtlas = spriteAtlas;
                // });

                resolve();
                // });
            });

            // Await Promise
            Promise.all([LoadCommonAssets, LoadLocalizedAssets]).then(() => {
                resolve();
            });
        });
    }
}
