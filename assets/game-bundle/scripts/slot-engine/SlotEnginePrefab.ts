/* eslint-disable no-async-promise-executor */
import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { AsyncTask, Delay, SkippableDelay } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import { TweenEasing } from '../../../scripts/TweenEasing';
import { ResultWinningLine } from '../game/GamePanelModel';
import SlotSymbolPrefab from '../slot-symbol/SlotSymbolPrefab';
import { ReelStatus, SlotEngineState } from './SlotEngineEnum';
import SlotEngineModule from './SlotEngineModule';
import SlotReelStripPrefab from '../slot-reel-strip/SlotReelStripPrefab';
import { GlobalData } from '../../../scripts/GlobalData';
import { GameSetting } from '../../../scripts/GameSetting';

const { ccclass, property } = cc._decorator;

interface Main {
    slotReelSymbols: cc.Node[][];
    slotReelSymbolsAnimation: cc.Node[];
    slotReelSymbolsBlocking: cc.Node[];
    slotReelSpinAnim: cc.Node[];
    slotReelStrips: SlotReelStripPrefab[];
    // symbolSpriteFrameMap: Map<string, cc.SpriteFrame>;
}

@ccclass
export default class SlotEnginePrefab extends PanelComponent {
    @property()
    slotReelSpinningWithSpriteSheet: boolean = false;

    @property(cc.Node)
    slotReelSymbols: cc.Node = null;

    @property(cc.Node)
    slotReelSymbolsAnimation: cc.Node = null;

    @property(cc.Node)
    slotReelSymbolsBlocking: cc.Node = null;

    @property(cc.Node)
    slotReelSpinAnim: cc.Node = null;

    @property(cc.SpriteAtlas)
    mainUISpriteAtlas: cc.SpriteAtlas = null;

    private main: Main = {
        slotReelSymbols: [],
        slotReelSymbolsAnimation: [],
        slotReelSymbolsBlocking: [],
        slotReelSpinAnim: [],
        slotReelStrips: [],
        // symbolSpriteFrameMap: new Map(),
    };

    get isSpinning() {
        return SlotEngineModule.data.state === SlotEngineState.Spining;
    }

    get completedRecordReel() {
        return SlotEngineModule.completedRecordReel();
    }

    onLoad() {
        this.cacheSlotReelSymbols();

        this.cacheSlotReelSymbolsBlocking();

        this.cacheSlotReelSpinAnim();

        // this.cacheSymbolSpriteFrame();

        this.registerEvent();
    }

    async start() {
        // await this.loadSlotEngineAssets();

        this.setupSlotEngineModule();
    }

    show(option: PanelShowOption): void {
        option.onShowed();
    }

    hide(option: PanelHideOption): void {
        option.onHided();
    }

    startReelSpin() {
        // Note: will conbine with startReelSpinByReel function in future

        this.removeAllSymbolAimation();

        // Update HUD buttons status
        gg.eventManager.emit('SlotEnginePrefab.OnSpinStarted');

        AudioManager.getInstance().play('Sfx_ReelSpinning');

        SlotEngineModule.data.state = SlotEngineState.Spining;

        // Spin remaining idle reel
        if (SlotEngineModule.recordingReel()) {
            for (let i = 0; i < 5; i++) {
                const reelStatusObj = SlotEngineModule.data.reelsStatus[i];

                // Find Idling reel and start spin
                if (reelStatusObj.status === ReelStatus.Idle) {
                    if (this.slotReelSpinningWithSpriteSheet) {
                        // Method 1 - using sprite sheet animation
                        const reelSpinAnim = this.main.slotReelSpinAnim[i];
                        reelSpinAnim.active = true;
                    } else {
                        // Method 2 - using symbol moving animation
                        const slotReelStrip = this.main.slotReelStrips[i];
                        slotReelStrip.spin(true);
                    }

                    SlotEngineModule.recordReelStatus(i, ReelStatus.Spining);
                }
            }
        } else {
            for (let i = 0; i < 5; i++) {
                // Spin all reel
                if (this.slotReelSpinningWithSpriteSheet) {
                    // Method 1 - using sprite sheet animation
                    const reelSpinAnim = this.main.slotReelSpinAnim[i];
                    reelSpinAnim.active = true;

                    SlotEngineModule.recordReelStatus(i, ReelStatus.Spining);
                } else {
                    // Method 2 - using symbol moving animation
                    const slotReelStrip = this.main.slotReelStrips[i];
                    slotReelStrip.spin(true);

                    SlotEngineModule.recordReelStatus(i, ReelStatus.Spining);
                }
            }
        }
    }

    startReelSpinByReel(reelNumber: number) {
        this.removeAllSymbolAimation();

        SlotEngineModule.data.state = SlotEngineState.ReelSpining;

        SlotEngineModule.recordReelStatus(reelNumber, ReelStatus.Spining, true);

        const recordedReelStatusCount = SlotEngineModule.getRecordedReelStatusCount();
        // First reel started spin
        if (recordedReelStatusCount === 1) {
            // Update HUD buttons status
            gg.eventManager.emit('SlotEnginePrefab.OnSpinStartedByReel');
        } else if (recordedReelStatusCount === 5) {
            // Update Spin buttons status
            gg.eventManager.emit('SlotEnginePrefab.OnSpinStartedByReel', 5);

            AudioManager.getInstance().play('Sfx_ReelSpinning');
        }

        if (this.slotReelSpinningWithSpriteSheet) {
            // Method 1 - using sprite sheet animation
            const reelSpinAnim = this.main.slotReelSpinAnim[reelNumber];
            reelSpinAnim.active = true;
        } else {
            // Method 2 - using symbol moving animation
            const slotReelStrip = this.main.slotReelStrips[reelNumber];
            slotReelStrip.spin(true);
        }
    }

    async stopReelSpin(turboOn: boolean) {
        // Note: will conbine with stopReelSpinByReel function in future

        return new Promise<boolean>(async (resolve, reject) => {
            const stopSpinTriggerCallBack = () => {
                GlobalData.flags.stopSpinTrigger = true;
            };

            let delayTimeBetweenReel = turboOn ? 0.126 : 0.27;

            GlobalData.flags.stopSpinTrigger = false;

            gg.eventManager.onOnce('SkippableDelay.StopSpin', stopSpinTriggerCallBack);

            await AsyncTask(async (resolve) => {
                // Why Delay here?
                // - Make slow spin a while and create illusion
                await SkippableDelay(0.3, 'SkippableDelay.StopSpin');

                for (let i = 0, len = this.main.slotReelSpinAnim.length, lastItem = len - 1; i < len; i++) {
                    const reelStatusObj = SlotEngineModule.data.reelsStatus[i];

                    if (this.slotReelSpinningWithSpriteSheet) {
                        // Method 1 - using sprite sheet animation
                        const reelSpinAnim = this.main.slotReelSpinAnim[i];
                        reelSpinAnim.active = false;
                    } else {
                        // Method 2 - using symbol moving animation
                        const resultSymbols = this.getResultSymbolsByReel(SlotEngineModule.data.resultSymbols, i);
                        const slotReelStrip = this.main.slotReelStrips[i];

                        if (reelStatusObj.triggerByReel === false && reelStatusObj.status != ReelStatus.Completed) {
                            if (i === lastItem) {
                                await slotReelStrip.stop(resultSymbols);
                            } else {
                                slotReelStrip.stop(resultSymbols);
                            }
                        }
                    }

                    gg.eventManager.emit('SlotEnginePrefab.StopSpin.Reel' + i, i);

                    AudioManager.getInstance().play('Sfx_ReelStop');

                    // Quit loop when current item is last
                    // if (i === lastItem) {
                    //     break;
                    // }

                    // Continue next reel is current reel status is completed
                    if (reelStatusObj.status === ReelStatus.Completed) {
                        continue;
                    }

                    if (!GlobalData.flags.stopSpinTrigger) {
                        // If 'SkippableDelay.StopSpin' is triggered, stop all reel animation
                        await SkippableDelay(delayTimeBetweenReel, 'SkippableDelay.StopSpin');
                    }

                    // Only set reel status to completed if reel not trigger by single reel.
                    if (reelStatusObj.triggerByReel === false) {
                        SlotEngineModule.recordReelStatus(i, ReelStatus.Completed);

                        // console.log('getRecordedReelStatusCount', SlotEngineModule.completedRecordReel());
                    }
                }

                // await SkippableDelay(0.1, 'SkippableDelay.StopSpin');

                resolve();
            });

            // Clear event listener
            gg.eventManager.off('SkippableDelay.StopSpin', stopSpinTriggerCallBack);

            let completedRecordReel = false;

            if (SlotEngineModule.completedRecordReel()) {
                await Delay(0.05);

                // console.log('stopReelSpin', SlotEngineModule.completedRecordReel());

                completedRecordReel = true;

                // Set state to Idle
                SlotEngineModule.data.state = SlotEngineState.Idle;

                this.resetSlotEngine();

                // Update HUD buttons status
                gg.eventManager.emit('SlotEnginePrefab.OnSpinEnded');

                AudioManager.getInstance().stop('Sfx_ReelSpinning');

                GlobalData.flags.stopSpinTrigger = false;
            }

            resolve(completedRecordReel);
        });
    }

    async stopReelSpinByReel(turboOn: boolean, reelNumber: number) {
        return new Promise<boolean>(async (resolve, reject) => {
            const delayTime = turboOn ? 0.25 : 0.5;

            if (!GlobalData.flags.stopSpinTrigger) {
                await SkippableDelay(delayTime, 'SkippableDelay.StopSpin');
            }

            if (this.slotReelSpinningWithSpriteSheet) {
                // Method 1 - using sprite sheet animation
                const reelSpinAnim = this.main.slotReelSpinAnim[reelNumber];
                reelSpinAnim.active = false;
            } else {
                // Method 2 - using symbol moving animation
                const resultSymbols = this.getResultSymbolsByReel(SlotEngineModule.data.resultSymbols, reelNumber);
                const slotReelStrip = this.main.slotReelStrips[reelNumber];

                await slotReelStrip.stop(resultSymbols);
            }

            const slotReelSymbolBlocking = this.main.slotReelSymbolsBlocking[reelNumber];
            slotReelSymbolBlocking.active = true;

            gg.eventManager.emit('SlotEnginePrefab.StopSpin.Reel' + reelNumber, reelNumber);

            AudioManager.getInstance().play('Sfx_ReelStop');

            // Set reel status to completed
            SlotEngineModule.recordReelStatus(reelNumber, ReelStatus.Completed, true);

            let completedRecordReel = false;

            if (SlotEngineModule.completedRecordReel()) {
                await Delay(0.1);

                // console.log('stopReelSpinByReel', SlotEngineModule.completedRecordReel());

                completedRecordReel = true;

                // Set state to Idle
                SlotEngineModule.data.state = SlotEngineState.Idle;

                this.resetSlotEngine();

                // Update HUD buttons status
                gg.eventManager.emit('SlotEnginePrefab.OnSpinEnded');

                AudioManager.getInstance().stop('Sfx_ReelSpinning');

                GlobalData.flags.stopSpinTrigger = false;
            }

            resolve(completedRecordReel);
        });
    }

    updateReelSymbols(resultSymbols: string[]) {
        SlotEngineModule.data.resultSymbols = resultSymbols;

        let count = 0;

        for (const slotReel of this.main.slotReelSymbols) {
            for (const slotSymbol of slotReel) {
                const slotSymbolPrefab = slotSymbol.getComponent(SlotSymbolPrefab);

                if (slotSymbolPrefab.isExtraSymbol) {
                    continue;
                }

                const symbolId = resultSymbols[count];

                slotSymbolPrefab.setSymbolId(symbolId);

                slotSymbol.getChildByName('Symbol').getComponent(cc.Sprite).spriteFrame = this.mainUISpriteAtlas.getSpriteFrame(symbolId);

                count++;
            }
        }
    }

    updateReelSymbolsByReel(resultSymbols: string[], reelNumber: number) {
        SlotEngineModule.data.resultSymbols = resultSymbols;

        const slotReel = this.main.slotReelSymbols[reelNumber];
        const reelResultSymbols = this.getResultSymbolsByReel(resultSymbols, reelNumber);

        let count = 0;

        for (const slotSymbol of slotReel) {
            const slotSymbolPrefab = slotSymbol.getComponent(SlotSymbolPrefab);
            if (slotSymbolPrefab.isExtraSymbol) {
                continue;
            }

            const symbolId = reelResultSymbols[count];

            slotSymbolPrefab.setSymbolId(symbolId);

            slotSymbol.getChildByName('Symbol').getComponent(cc.Sprite).spriteFrame = this.mainUISpriteAtlas.getSpriteFrame(symbolId);

            count++;
        }
    }

    private onShowAllWinningSymbol(resultWinningLines: ResultWinningLine[]) {
        const winningPosition = this.getWinningPosition(resultWinningLines);

        this.playSymbolAimation(winningPosition);
    }

    private onShowWiningSymbol(resultWinningLines: ResultWinningLine[], lineNumber: string) {
        this.removeAllSymbolAimation();

        const winningPosition = this.getWinningPosition(resultWinningLines, Number(lineNumber));

        this.playSymbolAimation(winningPosition);
    }

    private onWiningLineAndSymbolClear() {
        this.removeAllSymbolAimation();
    }

    private getWinningPosition(resultWinningLines: ResultWinningLine[], lineNumber?: number) {
        const winningPosition = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        for (let i = 0, len = resultWinningLines.length; i < len; i++) {
            const winningLine = resultWinningLines[i];
            const lineWinPosition = winningLine.lineWinPosition;

            if (lineNumber) {
                if (winningLine.lineNumber === lineNumber) {
                    for (let x = 0; x < 5; x++) {
                        const y = lineWinPosition[x];

                        if (y >= 0) {
                            winningPosition[x * 3 + y] = 1;
                        }
                    }

                    break;
                }
            } else {
                for (let x = 0; x < 5; x++) {
                    const y = lineWinPosition[x];

                    if (y >= 0) {
                        winningPosition[x * 3 + y] = 1;
                    }
                }
            }
        }

        return winningPosition;
    }

    private playSymbolAimation(winningPosition: number[]) {
        const wildSymbolId = GameSetting.wildSymbolMappedName;
        const scatterSymbolId = GameSetting.freeSpinSymbolMappedName;
        const bonusSymbolId = GameSetting.bonusGameSymbolMappedName;
        const highPointSymbol1Id = GameSetting.highPointSymbol1MappedName;
        const highPointSymbol2Id = GameSetting.highPointSymbol2MappedName;
        const highPointSymbol3Id = GameSetting.highPointSymbol3MappedName;

        let count = 0;

        for (const slotReel of this.main.slotReelSymbols) {
            for (const slotSymbol of slotReel) {
                const slotSymbolPrefab = slotSymbol.getComponent(SlotSymbolPrefab);

                if (slotSymbolPrefab.isExtraSymbol) {
                    continue;
                }

                const win = winningPosition[count];

                if (win > 0) {
                    slotSymbol.active = false;

                    const symbolId = slotSymbolPrefab.getSymbolId();

                    const slotSymbolAnim = this.main.slotReelSymbolsAnimation[count];
                    slotSymbolAnim.active = true;

                    const symbolAnim = slotSymbolAnim.getChildByName('Symbol');
                    symbolAnim.getComponent(cc.Sprite).spriteFrame = slotSymbol.getChildByName('Symbol').getComponent(cc.Sprite).spriteFrame;
                    
                    const symbolAnimation = symbolAnim.getComponent(cc.Animation);

                    if (symbolId === wildSymbolId) {
                        symbolAnimation.play('WildSymbolAnimation');
                    } else if (symbolId === scatterSymbolId) {
                        symbolAnimation.play('ScatterSymbolAnimation');
                    } else if (symbolId === bonusSymbolId) {
                        symbolAnimation.play('BonusSymbolAnimation');
                    } else if (symbolId === highPointSymbol1Id) {
                        symbolAnimation.play('HighPointAnimation1');
                    } else if (symbolId === highPointSymbol2Id) {
                        symbolAnimation.play('HighPointAnimation2');
                    } else if (symbolId === highPointSymbol3Id) {
                        symbolAnimation.play('HighPointAnimation3');
                    } else {
                        const tween = cc
                            .tween()
                            .set({
                                scale: 1,
                            })
                            .to(0.5, { scale: 1.25 }, { easing: TweenEasing.sineOut as cc.TweenEasing })
                            .to(0.5, { scale: 1 }, { easing: TweenEasing.sineOut as cc.TweenEasing });

                        cc.tween<cc.Node>(symbolAnim).repeatForever(tween).start();
                    }
                }

                //#region OLD FUNCTION ANIMATION
                // if (win > 0) {
                    // Normal Symbol Aimation
                    // const symbol = slotSymbol.getChildByName('Symbol');

                    // const tween = cc
                    //     .tween()
                    //     .set({
                    //         scale: 1,
                    //     })
                    //     .to(0.5, { scale: 0.85 }, { easing: TweenEasing.sineOut as cc.TweenEasing })
                    //     .to(0.5, { scale: 1 }, { easing: TweenEasing.sineOut as cc.TweenEasing });

                    // cc.tween<cc.Node>(symbol).repeatForever(tween).start();

                    // // Special Symbol Animation
                    // const symbolId = slotSymbolPrefab.getSymbolId();

                    // if (symbolId === wildSymbolId || symbolId === scatterSymbolId) {
                    //     const frontEffect = slotSymbol.getChildByName('FrontEffect');
                    //     const frontEffectAnimation = frontEffect.getComponent(cc.Animation);

                    //     frontEffect.active = true;

                    //     if (symbolId === wildSymbolId) {
                    //         frontEffectAnimation.play('WildSymbolAnimation');
                    //     } else if (symbolId === scatterSymbolId) {
                    //         frontEffectAnimation.play('ScatterSymbolAnimation');
                    //     }
                    // }

                    // const backEffect = slotSymbol.getChildByName('BackEffect');
                    // const backEffectAnimation = frontEffect.getComponent(cc.Animation);
                // }
                //#endregion
                count++;
            }
        }
    }

    private removeAllSymbolAimation() {
        for (const slotReel of this.main.slotReelSymbols) {
            for (const slotSymbol of slotReel) {
                slotSymbol.active = true;
            }
        }

        for (const slotSymbolAnim of this.main.slotReelSymbolsAnimation) {
            slotSymbolAnim.active = false;

            const symbol = slotSymbolAnim.getChildByName('Symbol');
            symbol.scaleX = 1;
            symbol.scaleY = 1;

            cc.Tween.stopAllByTarget(symbol);

            const symbolAnimation = slotSymbolAnim.getChildByName('Symbol').getComponent(cc.Animation);
            symbolAnimation.stop();
        }


        // for (const slotReel of this.main.slotReelSymbols) {
        //     for (const slotSymbol of slotReel) {
        //         const symbol = slotSymbol.getChildByName('Symbol');

        //         symbol.scaleX = 1;
        //         symbol.scaleY = 1;

        //         cc.Tween.stopAllByTarget(symbol);

        //         const frontEffect = slotSymbol.getChildByName('FrontEffect');
        //         const frontEffectAnimation = frontEffect.getComponent(cc.Animation);

        //         frontEffect.active = false;
        //         frontEffectAnimation.stop();

        //         // const backEffect = slotSymbol.getChildByName('BackEffect');
        //         // const backEffectAnimation = frontEffect.getComponent(cc.Animation);
        //     }
        // }
    }

    private getResultSymbolsByReel(resultSymbols: string[], reelNumber: number) {
        const endIndex = reelNumber * 3 + 3;
        const startIndex = endIndex - 3;
        const reelResultSymbols = resultSymbols.slice(startIndex, endIndex);

        return reelResultSymbols;
    }

    /**
     * Register all SlotEnginePrefab event here
     */
    private registerEvent() {
        gg.eventManager.on('SlotWinningLinePrefab.OnShowAllWiningSymbol', this.onShowAllWinningSymbol, this);
        gg.eventManager.on('SlotWinningLinePrefab.OnShowWiningSymbol', this.onShowWiningSymbol, this);
        gg.eventManager.on('HUDPrefab.onWiningLineAndSymbolClear', this.onWiningLineAndSymbolClear, this);
    }

    private async setupSlotEngineModule() {
        // Initialize SlotEngineModule Logic
        SlotEngineModule.init();

        if (this.slotReelSpinningWithSpriteSheet) {
            // Make sure have setup up Reel Spinning SpriteSheet Animation
        } else {
            this.setupSlotReelStrip();
        }
    }

    private setupSlotReelStrip() {
        const masking = this.slotReelSymbols.getComponent(cc.Mask);
        masking.enabled = true;

        for (let i = 0; i < 5; i++) {
            const slotReelStrip = this.slotReelSymbols.getChildByName('Reel' + i).getComponent(SlotReelStripPrefab);

            this.main.slotReelStrips[i] = slotReelStrip;

            slotReelStrip.registerEventCallBack.onReelStart = (reelNumber: number) => {
                // console.log(reelNumber, 'onReelStart');
                // play sound
            };

            slotReelStrip.registerEventCallBack.onReelStop = (reelNumber: number, reelResult: string[]) => {
                // console.log(reelNumber, 'onReelStop', reelResult);
                // play sound
            };

            slotReelStrip.registerEventCallBack.onReelBounce = (reelNumber: number) => {
                // console.log(reelNumber, 'onReelBounce');
                // play sound
            };
        }
    }

    private cacheSlotReelSymbols() {
        const slotReels = this.slotReelSymbols.children;
        const slotReelsAnimation = this.slotReelSymbolsAnimation.children;

        for (const slotReel of slotReels) {
            const symbols = slotReel.children;
            const symbolArray: cc.Node[] = [];

            for (const symbol of symbols) {
                symbolArray.push(symbol);
            }

            this.main.slotReelSymbols.push(symbolArray);
        }

        for (const slotReel of slotReelsAnimation) {
            const symbols = slotReel.children;
            const symbolArray: cc.Node[] = [];

            for (const symbol of symbols) {
                // symbolArray.push(symbol);
                this.main.slotReelSymbolsAnimation.push(symbol);
            }
        }
    }

    private cacheSlotReelSymbolsBlocking() {
        const reelsBlocking = this.slotReelSymbolsBlocking.children;

        for (const blocking of reelsBlocking) {
            this.main.slotReelSymbolsBlocking.push(blocking);
        }
    }

    private cacheSlotReelSpinAnim() {
        const reelSpinAnims = this.slotReelSpinAnim.children;

        for (const reelSpinAnim of reelSpinAnims) {
            this.main.slotReelSpinAnim.push(reelSpinAnim);
        }
    }

    // private cacheSymbolSpriteFrame() {
    //     for (let i = 1; i <= 13; i++) {
    //         const symboleId = i;
    //         const symbolSpriteFrame = this.mainUISpriteAtlas.getSpriteFrame(symboleId);

    //         if (symbolSpriteFrame) {
    //             this.main.symbolSpriteFrameMap.set(symboleId, symbolSpriteFrame);
    //         }
    //     }
    // }

    private resetSlotEngine() {
        // Reset current result
        SlotEngineModule.resetResult();

        // Reset SlotReelSymbolsBlocking
        this.resetSlotReelSymbolsBlocking();
    }

    private resetSlotReelSymbolsBlocking() {
        for (const blocking of this.main.slotReelSymbolsBlocking) {
            blocking.active = false;
        }
    }
}
