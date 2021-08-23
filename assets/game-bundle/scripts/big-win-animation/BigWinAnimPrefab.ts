import { gg } from '../../../scripts/framework/gg';
import { AsyncTask, Delay, SkippableDelay } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import EventQueueManager from '../../../scripts/manager/EventQueueManager';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';
import { BigWinType } from './BigWinAnimEnum';
import BigWinAnimModule from './BigWinAnimModule';

const { ccclass, property } = cc._decorator;

interface AnimationConfig {
    delayTime: {
        BigWin: number;
        MegaBigWin: number;
        SuperBigWin: number;
        UltraBigWin: number;
        UltraMegaBigWin: number;
    };
}

interface Main {
    bigWinGroup: cc.Node;
    bigWinBackground: cc.Node;
    bigWinGraphicTextAnim: cc.Animation;
    bigWinDecorationAnim: cc.Animation;
    bigWinLightAnim: cc.Animation;
    coinRainPrefab01: cc.Node;
    animationConfig: AnimationConfig;
}

@ccclass
export default class BigWinAnimPrefab extends cc.Component {
    @property(cc.Node)
    bigWinBackground: cc.Node = null;

    @property(cc.Node)
    bigWinGroup: cc.Node = null;

    @property(cc.Node)
    bigWinDecoration: cc.Node = null;

    @property(cc.Node)
    bigWinLight: cc.Node = null;

    @property(cc.Node)
    bigWinGraphicText: cc.Node = null;

    @property(cc.Node)
    coinRainPrefab01: cc.Node = null;

    private main: Main = {
        bigWinGroup: null,
        bigWinBackground: null,
        bigWinGraphicTextAnim: null,
        bigWinDecorationAnim: null,
        bigWinLightAnim: null,
        coinRainPrefab01: null,
        animationConfig: null,
    };

    onLoad() {
        this.setupAnimationConfig();

        this.cachePropertyNode();

        this.cacheAnimationNode();

        this.registerEvent();
    }

    async start() {
        await this.loadBigWinAnimAssets();

        this.setupBigWinAnimModule();
    }

    async showBigWinAnimation(winAmount: number, totalBet: number) {
        const bigWinType = BigWinAnimModule.getBigWinType(winAmount, totalBet);
        let delayTime = 0;

        if (bigWinType === BigWinType.None) {
            return;
        }

        // Force delay
        await Delay(0.5);

        this.main.bigWinGroup.active = true;

        this.main.coinRainPrefab01.active = true;

        this.main.bigWinDecorationAnim.play('BigWinDecorationAnimation');

        this.main.bigWinLightAnim.play('BigWinLightAnim');

        switch (bigWinType) {
            case BigWinType.BigWin:
                this.main.bigWinGraphicTextAnim.play('BigWinAnimation');

                AudioManager.getInstance().play('Sfx_BigWin');

                delayTime = this.main.animationConfig.delayTime.BigWin;
                break;
            case BigWinType.MegaBigWin:
                this.main.bigWinGraphicTextAnim.play('MegaBigWinAnimation');

                AudioManager.getInstance().play('Sfx_MegaBigWin');

                delayTime = this.main.animationConfig.delayTime.MegaBigWin;
                break;
            case BigWinType.SuperBigWin:
                this.main.bigWinGraphicTextAnim.play('SuperBigWinAnimation');

                AudioManager.getInstance().play('Sfx_SuperBigWin');

                delayTime = this.main.animationConfig.delayTime.SuperBigWin;
                break;
            case BigWinType.UltraBigWin:
                this.main.bigWinGraphicTextAnim.play('UltraBigWinAnimation');

                AudioManager.getInstance().play('Sfx_UltraBigWin');

                delayTime = this.main.animationConfig.delayTime.UltraBigWin;
                break;
            case BigWinType.UltraMegaBigWin:
                this.main.bigWinGraphicTextAnim.play('UltraMegaBigWinAnimation');

                AudioManager.getInstance().play('Sfx_UltraMegaBigWin');

                delayTime = this.main.animationConfig.delayTime.UltraMegaBigWin;
                break;
        }

        // Add 'ShowBigWinAnim' event to 'SpaceOrSpinButton's EventQuene
        EventQueueManager.getInstance().addEvent('SpaceOrSpinButton', 'ShowBigWinAnim', () => {
            gg.eventManager.emit('BigWinAnim.OnSpaceOrSpinButtonDown');
        });

        // Disable spin button
        gg.eventManager.emit('HUDPrefab.OnSpinButtonUpdate', 'disable');

        // Player not allow to skip for first 5 second
        await Delay(5);

        // Enable spin button
        gg.eventManager.emit('HUDPrefab.OnSpinButtonUpdate', 'enable');

        const skippableDelayTime = delayTime - 5;
        await SkippableDelay(cc.misc.clampf(skippableDelayTime, 0, skippableDelayTime), 'BigWinAnim.OnSpaceOrSpinButtonDown');

        this.stopAllAnimation();

        this.stopAllSoundEffect();

        this.main.bigWinGroup.active = false;

        // Play and loop until player hit next spin
        AudioManager.getInstance().play('Sfx_bwinreact', true);

        // Need to remove from EventQuene if no longer using
        EventQueueManager.getInstance().removeEventById('SpaceOrSpinButton', 'ShowBigWinAnim');
    }

    private stopAllAnimation() {
        this.main.bigWinGraphicTextAnim.stop();
        this.main.bigWinDecorationAnim.stop();
        this.main.bigWinLightAnim.stop();
    }

    private stopAllSoundEffect() {
        AudioManager.getInstance().stop(['Sfx_BigWin', 'Sfx_MegaBigWin', 'Sfx_SuperBigWin', 'Sfx_UltraBigWin', 'Sfx_UltraMegaBigWin', 'Sfx_bwinreact']);
    }

    private setupBigWinAnimModule() {
        // Initialize BigWinAnimModule Logic
        BigWinAnimModule.init();
    }

    private registerEvent() {
        gg.eventManager.on('SlotEnginePrefab.OnSpinStarted', this.onSpinStartedOrByReel, this);
        gg.eventManager.on('SlotEnginePrefab.OnSpinStartedByReel', this.onSpinStartedOrByReel, this);
        gg.eventManager.on('HUDPrefab.onWiningLineAndSymbolClear', this.onWiningLineAndSymbolClear, this);
    }

    private setupAnimationConfig() {
        this.main.animationConfig = {
            delayTime: {
                BigWin: 6,
                MegaBigWin: 9,
                SuperBigWin: 7,
                UltraBigWin: 11,
                UltraMegaBigWin: 14,
            },
        };
    }

    private cachePropertyNode() {
        this.main.bigWinGroup = this.bigWinGroup;
        this.main.coinRainPrefab01 = this.coinRainPrefab01;
    }

    private cacheAnimationNode() {
        this.main.bigWinBackground = this.bigWinBackground;
        this.main.bigWinGraphicTextAnim = this.bigWinGraphicText.getComponent(cc.Animation);
        this.main.bigWinDecorationAnim = this.bigWinDecoration.getComponent(cc.Animation);
        this.main.bigWinLightAnim = this.bigWinLight.getComponent(cc.Animation);
    }

    private onSpinStartedOrByReel() {
        gg.eventManager.emit('BigWinAnim.OnSpaceOrSpinButtonDown');

        this.stopAllSoundEffect();
    }

    private onWiningLineAndSymbolClear() {
        this.stopAllSoundEffect();
    }

    private async loadBigWinAnimAssets() {
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
            cc.resources.preloadDir(preloadCommonAssets, (err, assets) => {
                cc.resources.loadDir(`${preloadCommonAssets}/sounds`, cc.AudioClip, (err, audioClips: cc.AudioClip[]) => {
                    AudioManager.getInstance().addAll(audioClips);
                });
            });

            /**
             * Preload Localized Assets
             * Use when localized assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            // cc.resources.preloadDir(preloadLocalizedAssets, (err, assets) => {
            //     cc.resources.load(
            //         [
            //             `${preloadLocalizedAssets}/animation/BigWinAnimation`,
            //             `${preloadLocalizedAssets}/animation/MegaBigWinAnimation`,
            //             `${preloadLocalizedAssets}/animation/SuperBigWinAnimation`,
            //             `${preloadLocalizedAssets}/animation/UltraBigWinAnimation`,
            //             `${preloadLocalizedAssets}/animation/UltraMegaBigWinAnimation`,
            //         ],
            //         cc.AnimationClip,
            //         (err, animationClips: cc.AnimationClip[]) => {
            //             if (animationClips.length > 0) {
            //                 for (const animationClip of animationClips) {
            //                     this.main.bigWinGraphicTextAnim.addClip(animationClip);
            //                 }
            //             }
            //         }
            //     );
            // });

            /**
             * Load Common Assets
             * Use when Common assets needed to display immediately
             * Example: Common background need to show after game started.
             */
            const LoadCommonAssets = AsyncTask(async (resolve) => {
                cc.resources.loadDir(loadCommonAssets, (err, assets) => {
                    cc.resources.load(`${loadCommonAssets}/textures/BigWinEffect`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {
                        this.main.bigWinBackground.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('BigWinBg2_01');
                    });

                    cc.resources.load(`${loadCommonAssets}/animations/BigWinCoinsParticleAnim`, cc.AnimationClip, (err, animationClip: cc.AnimationClip) => {
                        this.main.coinRainPrefab01.getComponent(cc.Animation).addClip(animationClip);
                    });

                    cc.resources.load(`${loadCommonAssets}/animations/BigWinDecorationAnimation`, cc.AnimationClip, (err, animationClip: cc.AnimationClip) => {
                        this.main.bigWinDecorationAnim.addClip(animationClip);
                    });

                    cc.resources.load(`${loadCommonAssets}/animations/BigWinLightAnim`, cc.AnimationClip, (err, animationClip: cc.AnimationClip) => {
                        this.main.bigWinLightAnim.addClip(animationClip);
                    });

                    resolve();
                });
            });

            /**
             ** Load Localized Assets
             * Use when localized assets needed to display immediately
             * Example: Jackpot counter background need to show after game started.
             */
            const LoadLocalizedAssets = AsyncTask(async (resolve) => {
                cc.resources.loadDir(loadLocalizedAssets, (err, assets) => {
                    cc.resources.load(
                        [
                            `${loadLocalizedAssets}/animation/BigWinAnimation`,
                            `${loadLocalizedAssets}/animation/MegaBigWinAnimation`,
                            `${loadLocalizedAssets}/animation/SuperBigWinAnimation`,
                            `${loadLocalizedAssets}/animation/UltraBigWinAnimation`,
                            `${loadLocalizedAssets}/animation/UltraMegaBigWinAnimation`,
                        ],
                        cc.AnimationClip,
                        (err, animationClips: cc.AnimationClip[]) => {
                            if (animationClips.length > 0) {
                                for (const animationClip of animationClips) {
                                    this.main.bigWinGraphicTextAnim.addClip(animationClip);
                                }
                            }
                        }
                    );

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
