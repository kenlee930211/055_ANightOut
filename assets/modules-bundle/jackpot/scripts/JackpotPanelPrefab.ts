import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { AsyncTask, Delay, SkippableDelay } from '../../../scripts/HelperTools';
import { JackpotType } from './JackpotPanelEnum';
import JackpotPanelModule from './JackpotPanelModule';
import AudioManager from '../../../scripts/manager/AudioManager';
import CreditCoinConvertorManager, { CCConvertionType, CCConvertor } from '../../../scripts/manager/CreditCoinConvertorManager';
import EventQueueManager from '../../../scripts/manager/EventQueueManager';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';

const { ccclass, property } = cc._decorator;

/**
 * this class handle:
 * - Jackpot Minor, Random and Major counter
 * - Jacpout Winning Animation
 */
@ccclass
export default class JackpotPanelPrefab extends PanelComponent {
    @property(cc.Sprite)
    jackpotBg: cc.Sprite = null;

    @property(cc.Label)
    labelMajor: cc.Label = null;

    @property(cc.Label)
    labelRandom: cc.Label = null;

    @property(cc.Label)
    labelMinor: cc.Label = null;

    @property(cc.Node)
    jackpotWiningPanel: cc.Node = null;

    @property(cc.Label)
    labelJackpotWiningPanelAmount: cc.Label = null;

    @property(cc.Sprite)
    jackpotWiningBg: cc.Sprite = null;

    @property(cc.Sprite)
    minorJackpotAnimation: cc.Sprite = null;

    @property(cc.Sprite)
    randomJackpotAnimation: cc.Sprite = null;

    @property(cc.Sprite)
    majorJackpotAnimation: cc.Sprite = null;

    @property(cc.Node)
    coinRainPrefab01: cc.Node = null;

    @property({
        tooltip: 'Min Jackpot animation Time',
    })
    minJackpotAnimTime: number = 10;

    @property({
        tooltip: 'Max Jackpot animation Time',
    })
    maxJackpotAnimTime: number = 30;

    jackpotAnimStateMachine: StateMachine;

    private cacheAnimation: cc.Animation = null;
    private wonAmountObj = {};

    onLoad() {
        this.labelMajor.string = '0';
        this.labelRandom.string = '0';
        this.labelMinor.string = '0';

        this.registerEvent();
    }

    async start() {
        await this.loadJackpotAssets();

        this.setupJackpotModule();
    }

    show(option: PanelShowOption): void {
        option.onShowed();
    }

    hide(option: PanelHideOption): void {
        option.onHided();
    }

    triggerJackpot() {
        JackpotPanelModule.setJackpoWonResult({ jackpotType: JackpotType.Major, amount: 1000 });

        gg.eventManager.emit('JackporPanelEvent.OnJackpotWon');

        const btnTriggerJackpot = cc.find('SafeArea/BtnTriggerJackpot', this.node);

        btnTriggerJackpot.active = false;
    }

    /**
     * Register all JackpotPanel event here
     */
    private registerEvent() {
        gg.eventManager.on('JackporPanelEvent.OnJackpotWon', this.onStartJackpotWonAnimation, this);

        // testing code
        // cc.systemEvent.on(
        //     cc.SystemEvent.EventType.KEY_DOWN,
        //     (event: { keyCode: cc.macro.KEY }) => {
        //         if (event.keyCode === cc.macro.KEY.space) {
        //             gg.eventManager.emit('skip');
        //         }
        //     },
        //     this
        // );
    }

    private async setupJackpotModule() {
        // Initialize JackpotPanel Logic
        JackpotPanelModule.init();

        // Display Jackpot amount when loaded
        this.updateMinorJackpot();
        this.updateMajorJackpot();
        this.updateRandomJackpot();

        // Register schedules for updating Jackpot amount
        this.registerMajorJackpotSchedule();
        this.registerRandomJackpotSchedule();
        this.registerMinorJackpotSchedule();

        this.addLabelForCreditCoinUpdate();
    }

    private updateMinorJackpot() {
        const minorJackpotAmount = JackpotPanelModule.getJackpotAmount(JackpotType.Minor);

        this.labelMinor.string = CCConvertor(minorJackpotAmount.toFixed(2));
    }

    private updateMajorJackpot() {
        const majorJackpotAmount = JackpotPanelModule.getJackpotAmount(JackpotType.Major);

        this.labelMajor.string = CCConvertor(majorJackpotAmount.toFixed(2));
    }

    private updateRandomJackpot() {
        const randomJackpotAmount = JackpotPanelModule.getJackpotAmount(JackpotType.Random);

        this.labelRandom.string = CCConvertor(randomJackpotAmount.toFixed(2));
    }

    private registerMajorJackpotSchedule() {
        this.schedule(this.updateMajorJackpot, 1.0, Infinity, 0.0);
    }

    private registerRandomJackpotSchedule() {
        this.schedule(this.updateRandomJackpot, 0.1, Infinity, 0.0);
    }

    private registerMinorJackpotSchedule() {
        this.schedule(this.updateMinorJackpot, 1.0, Infinity, 0.0);
    }

    private addLabelForCreditCoinUpdate() {
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.labelMajor);
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.labelMinor);
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.labelRandom);
        CreditCoinConvertorManager.getInstance().addLabelSprite(this.labelJackpotWiningPanelAmount);
    }

    private async onStartJackpotWonAnimation() {
        if (!JackpotPanelModule.data.jackpoWonResult) {
            return;
        }

        this.coinRainPrefab01.active = true;

        this.jackpotAnimStateMachine = this.createjackpotAnimStateMachine();

        await this.jackpotAnimStateMachine.showJackpotWon();

        await this.jackpotAnimStateMachine.countingBalance();

        await this.jackpotAnimStateMachine.hideJackpotWin();

        this.coinRainPrefab01.active = false;

        // clear Jackpot data
        JackpotPanelModule.data.jackpoWonResult = null;

        this.jackpotAnimStateMachine = null;
    }

    /**
     * create JackpotWon State Machine to control animation
     * @returns StateMachine
     */
    private createjackpotAnimStateMachine() {
        return new StateMachine({
            init: 'idle',
            transitions: [
                { name: 'showJackpotWon', from: 'idle', to: 'showWining' },
                { name: 'countingBalance', from: 'showWining', to: 'showCounting' },
                { name: 'hideJackpotWin', from: 'showCounting', to: 'idle' },
            ],
            methods: {
                onShowJackpotWon: () => this.onShowJackpotWon(),
                onCountingBalance: () => this.onCountingBalance(),
                onHideJackpotWin: () => this.onHideJackpotWon(),
            },
        });
    }

    private async onShowJackpotWon() {
        AudioManager.getInstance().play('JackpotWinningBGM', true);

        switch (JackpotPanelModule.data.jackpoWonResult.jackpotType) {
            case JackpotType.Major: {
                this.cacheAnimation = this.majorJackpotAnimation.getComponent(cc.Animation);
                this.cacheAnimation.play('MajorJackpotAnim');

                this.majorJackpotAnimation.node.active = true;

                break;
            }
            case JackpotType.Random: {
                this.cacheAnimation = this.randomJackpotAnimation.getComponent(cc.Animation);
                this.cacheAnimation.play('RandomJackpotAnim');

                this.randomJackpotAnimation.node.active = true;

                break;
            }
            case JackpotType.Minor: {
                this.cacheAnimation = this.minorJackpotAnimation.getComponent(cc.Animation);
                this.cacheAnimation.play('MinorJackpotAnim');

                this.minorJackpotAnimation.node.active = true;

                break;
            }
        }

        this.labelJackpotWiningPanelAmount.string = CCConvertor(JackpotPanelModule.data.jackpoWonResult.amount.toFixed(2));

        this.jackpotWiningPanel.opacity = 0;
        this.jackpotWiningPanel.active = true;

        cc.tween<cc.Node>(this.jackpotWiningPanel)
            .to(1, { opacity: 255 }, { easing: 'sineOut' })
            .call(() => {
                const tween = cc.tween().to(0.25, { opacity: 0 }).delay(0.25).to(0.25, { opacity: 255 }).delay(1.5);

                cc.tween<cc.Node>(this.jackpotWiningPanel).repeatForever(tween).start();
            })
            .start();
    }

    private async onCountingBalance() {
        const jackpotWonAmount = CCConvertor(JackpotPanelModule.data.jackpoWonResult.amount.toFixed(2));

        this.wonAmountObj = { amount: Number(jackpotWonAmount) };

        switch (JackpotPanelModule.data.jackpoWonResult.jackpotType) {
            case JackpotType.Major: {
                this.unschedule(this.updateMajorJackpot);

                this.labelMajor.node.color = cc.Color.RED;
                this.labelMajor.string = jackpotWonAmount;

                // set jackpot new amount
                // JackpotPanelModule.data.jackpotCounterAmount.major = 'new amount here';

                this.jackpotWonAmountReducer(this.labelMajor, this.wonAmountObj);

                break;
            }
            case JackpotType.Random: {
                this.unschedule(this.updateRandomJackpot);

                this.labelRandom.node.color = cc.Color.RED;
                this.labelRandom.string = jackpotWonAmount;

                // set jackpot new amount
                // JackpotPanelModule.data.jackpotCounterAmount.random = 'new amount here';

                this.jackpotWonAmountReducer(this.labelRandom, this.wonAmountObj);

                break;
            }
            case JackpotType.Minor: {
                this.unschedule(this.updateMinorJackpot);

                this.labelMinor.node.color = cc.Color.RED;
                this.labelMinor.string = jackpotWonAmount;

                // set jackpot new amount
                // JackpotPanelModule.data.jackpotCounterAmount.minor = 'new amount here';

                this.jackpotWonAmountReducer(this.labelMinor, this.wonAmountObj);

                this.labelMinor.node.color = cc.Color.RED;

                break;
            }
        }

        // Add 'ShowJackpotAnim' event to 'SpaceOrSpinButton's EventQuene
        EventQueueManager.getInstance().addEvent('SpaceOrSpinButton', 'ShowJackpotAnim', () => {
            gg.eventManager.emit('JackpotWinAnim.OnSpaceOrSpinButtonDown');
        });

        // Disable spin button
        gg.eventManager.emit('HUDPrefab.OnSpinButtonUpdate', 'disable');

        // Force Delay
        await Delay(this.minJackpotAnimTime);

        // Enable spin button
        gg.eventManager.emit('HUDPrefab.OnSpinButtonUpdate', 'enable');

        // Skippable Delay
        await SkippableDelay(this.maxJackpotAnimTime - this.minJackpotAnimTime, 'JackpotWinAnim.OnSpaceOrSpinButtonDown');

        // Need to remove from EventQuene if no longer using
        EventQueueManager.getInstance().removeEventById('SpaceOrSpinButton', 'ShowJackpotAnim');
    }

    private jackpotWonAmountReducer(labelJackpot: cc.Label, wonAmountObj: {}) {
        let progressAmount = 0;
        const convertionType = CreditCoinConvertorManager.getInstance().getConvertionType();
        const fractionDigits = convertionType === CCConvertionType.Coin ? 0 : 2;

        // Prevent player changing convetion during balance updating
        CreditCoinConvertorManager.getInstance().enable = false;

        AudioManager.getInstance().play('Sfx_CoinLoop', true);

        // tween Jackpot amount to zero
        cc.tween(wonAmountObj)
            .to(
                this.maxJackpotAnimTime,
                { amount: 0 },
                {
                    // eslint-disable-next-line max-params
                    progress: (start: number, end: number, current: number, ratio: number) => {
                        progressAmount = cc.misc.lerp(start, end, ratio);

                        labelJackpot.string = progressAmount.toFixed(fractionDigits);

                        return progressAmount;
                    },
                }
            )
            .call(() => {
                // set jackpotWonAmount to zero manually here.
                // Reason: sometime 'progressAmount' stopped at number range 0.1 to 2;
                labelJackpot.string = '0';

                CreditCoinConvertorManager.getInstance().enable = true;

                AudioManager.getInstance().stop('Sfx_CoinLoop');
            })
            .start();

        // note: update player balance here as well
    }

    private async onHideJackpotWon() {
        this.cacheAnimation.stop();
        this.cacheAnimation = null;

        this.minorJackpotAnimation.node.active = false;
        this.randomJackpotAnimation.node.active = false;
        this.majorJackpotAnimation.node.active = false;

        cc.Tween.stopAllByTarget(this.wonAmountObj);
        cc.Tween.stopAllByTarget(this.jackpotWiningPanel);

        await AsyncTask(async (resolve) => {
            cc.tween<cc.Node>(this.jackpotWiningPanel)
                .to(1, { opacity: 0 }, { easing: 'sineOut' })
                .call(() => {
                    this.labelJackpotWiningPanelAmount.string = '0';

                    this.jackpotWiningPanel.active = false;

                    AudioManager.getInstance().stop('JackpotWinningBGM');

                    resolve();
                })
                .start();
        });

        this.resetJackpotWonCounter();

        const btnTriggerJackpot = cc.find('SafeArea/BtnTriggerJackpot', this.node);

        btnTriggerJackpot.active = true;
    }

    private resetJackpotWonCounter() {
        switch (JackpotPanelModule.data.jackpoWonResult.jackpotType) {
            case JackpotType.Major: {
                this.labelMajor.node.color = cc.Color.WHITE;

                this.updateMajorJackpot();

                this.registerMajorJackpotSchedule();

                break;
            }
            case JackpotType.Random: {
                this.labelRandom.node.color = cc.Color.WHITE;

                this.updateRandomJackpot();

                this.registerRandomJackpotSchedule();

                break;
            }
            case JackpotType.Minor: {
                this.labelMinor.node.color = cc.Color.WHITE;

                this.updateMinorJackpot();

                this.registerMinorJackpotSchedule();
                break;
            }
        }
    }

    private loadJackpotAssets() {
        return new Promise<void>((resolve, reject) => {
            const lang = GameSystemManager.getInstance().getLanguageCode();

            /**
             * load sequence
             * 1. preloadCommonAssets
             * 2. preloadLocalizedAssets
             * 3. loadCommonAssets
             * 4. loadLocalizedAssets
             */
            const basePath = 'localized-assets/modules-bundle/jackpot';

            const loadCommonAssets = `${basePath}/load/common`;
            const preloadCommonAssets = `${basePath}/preload/common`;

            const loadLocalizedAssets = `${basePath}/load/${lang}`;
            const preloadLocalizedAssets = `${basePath}/preload/${lang}`;

            /**
             * Preload Common Assets
             * Use when common assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            cc.resources.preloadDir(preloadCommonAssets, (err, assets) => {
                cc.resources.loadDir(`${preloadCommonAssets}/sounds`, cc.AudioClip, (err, audioClips: cc.AudioClip[]) => {
                    AudioManager.getInstance().addAll(audioClips);
                });

                cc.resources.load(`${preloadCommonAssets}/fonts/SafariBalanceNum`, cc.BitmapFont, (err, bitmapFont: cc.BitmapFont) => {
                    this.labelJackpotWiningPanelAmount.font = bitmapFont;
                });
            });

            /**
             * Preload Localized Assets
             * Use when localized assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            cc.resources.preloadDir(preloadLocalizedAssets, (err, assets) => {
                cc.resources.load(`${preloadLocalizedAssets}/GameBonusPic`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {
                    const spriteFrame = spriteAtlas.getSpriteFrame('GameBonusBG');

                    this.jackpotWiningBg.spriteFrame = spriteFrame;
                });

                cc.resources.load(`${preloadLocalizedAssets}/animation/MinorJackpotAnim`, cc.AnimationClip, (err, animationClip: cc.AnimationClip) => {
                    const animation = this.minorJackpotAnimation.getComponent(cc.Animation);

                    animation.addClip(animationClip);
                });

                cc.resources.load(`${preloadLocalizedAssets}/animation/RandomJackpotAnim`, cc.AnimationClip, (err, animationClip: cc.AnimationClip) => {
                    const animation = this.randomJackpotAnimation.getComponent(cc.Animation);

                    animation.addClip(animationClip);
                });

                cc.resources.load(`${preloadLocalizedAssets}/animation/MajorJackpotAnim`, cc.AnimationClip, (err, animationClip: cc.AnimationClip) => {
                    const animation = this.majorJackpotAnimation.getComponent(cc.Animation);

                    animation.addClip(animationClip);
                });
            });

            /**
             * Load Common Assets
             * Use when Common assets needed to display immediately
             * Example: Common background need to show after game started.
             */
            const LoadCommonAssets = AsyncTask(async (resolve) => {
                cc.resources.loadDir(loadCommonAssets, (err, assets) => {
                    cc.resources.load(`${loadCommonAssets}/animations/BigWinCoinsParticleAnim`, cc.AnimationClip, (err, animationClip: cc.AnimationClip) => {
                        this.coinRainPrefab01.getComponent(cc.Animation).addClip(animationClip);
                        this.coinRainPrefab01.getComponent(cc.Animation).play(animationClip.name);
                        this.coinRainPrefab01.active = false;
                    });
                });

                resolve();
            });

            /**
             ** Load Localized Assets
             * Use when localized assets needed to display immediately
             * Example: Jackpot counter background need to show after game started.
             */
            const LoadLocalizedAssets = AsyncTask(async (resolve) => {
                cc.resources.loadDir(loadLocalizedAssets, (err, assets) => {
                    cc.resources.load(`${loadLocalizedAssets}/Jackpot`, cc.SpriteFrame, (err, spriteFrame: cc.SpriteFrame) => {
                        this.jackpotBg.spriteFrame = spriteFrame;

                        resolve();
                    });
                });
            });

            // Await Promise
            Promise.all([LoadCommonAssets, LoadLocalizedAssets]).then(() => {
                resolve();
            });
        });
    }
}
