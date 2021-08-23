import { GameSetting } from '../../../scripts/GameSetting';
import { AsyncTask, Shuffle } from '../../../scripts/HelperTools';
import { TweenEasing } from '../../../scripts/TweenEasing';
import SlotSymbolPrefab from '../slot-symbol/SlotSymbolPrefab';

const { ccclass, property } = cc._decorator;

interface Main {
    mainUIAtlas: cc.SpriteAtlas;
    slotReelNumber: number;
    reelSymbols: cc.Node[];
    reelResult: string[];
    reelResultReducer: string[];
    winSymbolColletor: cc.Node[];
    blurSymbol: boolean;
    isSpinning: boolean;
    cooldown: number;
    speed: number;
    distanceBetweenSymbol: number;
    stepY: number;
    highestY: number;
    lowestY: number;
    symbolOriginPosition: cc.Vec2[];
}

@ccclass
export default class SlotReelStrip extends cc.Component {
    @property(cc.SpriteAtlas)
    mainUIAtlas: cc.SpriteAtlas = null;

    @property()
    slotReelNumber: number = -1;

    @property(cc.Node)
    reelSymbols: cc.Node = null;

    private main: Main = {
        mainUIAtlas: null,
        slotReelNumber: null,
        reelSymbols: [],
        reelResult: [],
        reelResultReducer: [],
        winSymbolColletor: [],
        blurSymbol: false,
        isSpinning: false,
        cooldown: -1,
        speed: 2,
        distanceBetweenSymbol: 0,
        stepY: 0,
        highestY: 0,
        lowestY: 0,
        symbolOriginPosition: [],
    };

    private eventCallBack = {
        onReelStart: (reelNumber: number) => {},
        onReelBounce: (reelNumber: number) => {},
        onReelStop: (reelNumber: number, reelResult: string[]) => {},
    };

    private stopResolve: (value: void | PromiseLike<void>) => void = null;

    onLoad() {
        this.cacheProperty();
    }

    start() {
        this.setupReelStrip();
    }

    get registerEventCallBack() {
        return this.eventCallBack;
    }

    get reelNumber() {
        return this.slotReelNumber;
    }

    spin(blurSymbol: boolean) {
        this.eventCallBack.onReelStart(this.main.slotReelNumber);

        this.main.reelResult = [];

        this.main.reelResultReducer = [];

        this.main.winSymbolColletor = [];

        this.showAllSymbol();

        this.main.blurSymbol = blurSymbol;

        this.main.isSpinning = true;
    }

    async stop(reelResult: string[]) {
        await AsyncTask(async (resolve) => {
            this.main.blurSymbol = false;

            this.main.reelResult = reelResult;

            this.main.reelResultReducer = [...reelResult];

            this.stopResolve = resolve;
        });
    }

    private showAllSymbol() {
        for (const symbol of this.main.reelSymbols) {
            symbol.active = true;
        }
    }

    private hideAllSymbol() {
        for (const symbol of this.main.reelSymbols) {
            symbol.active = false;
        }
    }

    update(dt: number) {
        this.reelStopReducer();

        if (!this.main.isSpinning) {
            return;
        }

        for (const symbol of this.main.reelSymbols) {
            // Move symbol
            symbol.y += this.main.stepY * this.main.speed;

            // When symbol hit lowest Y
            if (symbol.y <= this.main.lowestY) {
                // Adjust movement lost unit
                const lostUnit = symbol.y - this.main.lowestY;
                symbol.y = this.main.highestY + lostUnit;

                // When result is retrieved from 'stop(reelResult: number[])', start assign result to symbol and prepare for reel stop
                if (this.main.reelResultReducer.length > 0) {
                    // Assign result to symbol
                    const symbolIndex = this.main.reelResultReducer.shift();
                    symbol.getChildByName('Symbol').getComponent(cc.Sprite).spriteFrame = this.getSymbolSpriteFrame(symbolIndex);

                    // Quit reel spining and prepare for stop
                    if (this.main.reelResultReducer.length === 0) {
                        // Add cooldown for 'reelStopReducer()'
                        this.main.cooldown = this.main.distanceBetweenSymbol;
                    }
                } else {
                    // Random assign result to symbol
                    symbol.getChildByName('Symbol').getComponent(cc.Sprite).spriteFrame = this.getRandomSpriteFrame();
                }
            }
        }
    }

    private reelStopReducer() {
        if (this.main.cooldown > -1) {
            this.main.cooldown += this.main.stepY * this.main.speed * 1.5;

            // Stop the reel when cooldown is done
            if (this.main.cooldown < 0) {
                this.main.cooldown = -1;

                this.main.isSpinning = false;

                this.hideAllSymbol();

                this.resetSymbolPosition();

                this.symbolBounceEffect();
            }
        }
    }

    private async resetSymbolPosition() {
        for (let i = 0, len = this.main.reelSymbols.length; i < len; i++) {
            const symbol = this.main.reelSymbols[i];

            if (i === 0) {
                symbol.getComponent(SlotSymbolPrefab).isExtraSymbol = true;
                symbol.active = true;
                symbol.y = this.main.symbolOriginPosition[i].y;
            } else {
                const symbolIndex = this.main.reelResult[i - 1];
                symbol.getChildByName('Symbol').getComponent(cc.Sprite).spriteFrame = this.getSymbolSpriteFrame(symbolIndex);
                symbol.getComponent(SlotSymbolPrefab).isExtraSymbol = false;
                symbol.active = true;
                symbol.y = this.main.symbolOriginPosition[i].y;
            }
        }
    }

    private symbolBounceEffect() {
        this.eventCallBack.onReelBounce(this.main.slotReelNumber);

        cc.tween(this.node)
            .by(0.1, { y: -25 }, { easing: TweenEasing.sineOut as cc.TweenEasing })
            .by(0.2, { y: 25 }, { easing: TweenEasing.sineOut as cc.TweenEasing })
            .call(() => {
                this.eventCallBack.onReelStop(this.main.slotReelNumber, this.main.reelResult);

                this.stopResolve && this.stopResolve();
            })
            .start();
    }

    private cacheProperty() {
        this.main.mainUIAtlas = this.mainUIAtlas;
        this.main.slotReelNumber = this.slotReelNumber;
        this.main.reelSymbols = this.reelSymbols.children;
    }

    private setupReelStrip() {
        const lastSymbolY = this.main.reelSymbols[this.main.reelSymbols.length - 1].y;

        this.main.stepY = lastSymbolY / 5;
        this.main.lowestY = lastSymbolY + lastSymbolY;
        this.main.highestY = Math.abs(this.main.lowestY);
        this.main.distanceBetweenSymbol = Math.abs(lastSymbolY);

        for (const symbol of this.main.reelSymbols) {
            this.main.symbolOriginPosition.push(symbol.getPosition());
        }
    }

    private getRandomSpriteFrame() {
        const symbolToRandom = GameSetting.symbols;
        const symbolName = GameSetting.getSymbolMappingName(Shuffle(symbolToRandom)[0]);

        return this.getSymbolSpriteFrame(symbolName, this.main.blurSymbol);
    }

    private getSymbolSpriteFrame(symbolName: string, blurSymbol?: boolean) {
        let symbolSpriteFrame = null;

        if (blurSymbol) {
            symbolSpriteFrame = this.main.mainUIAtlas.getSpriteFrame(symbolName);
        } else {
            symbolSpriteFrame = this.main.mainUIAtlas.getSpriteFrame(symbolName);
        }

        return symbolSpriteFrame;
    }
}
