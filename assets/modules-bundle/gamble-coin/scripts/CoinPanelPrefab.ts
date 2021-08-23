import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { AsyncTask, BeautifyNumber, Delay, GetRandomInterger, Pad, RoundDown, RoundUp } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import { BetType, Status } from './CoinPanelEnum';
import { CoinResult } from './CoinPanelModel';
import CoinPanelModule from './CoinPanelModule';

const { ccclass, property } = cc._decorator;

@ccclass
export default class CoinPanelPrefab extends PanelComponent {
    @property(cc.Node)
    coinGroup: cc.Node = null;

    @property(cc.Sprite)
    currentCoinResult: cc.Sprite = null;

    @property(cc.Button)
    btnTakeWin: cc.Button = null;

    @property(cc.Button)
    btnTail: cc.Button = null;

    @property(cc.Button)
    btnHead: cc.Button = null;

    @property(cc.Node)
    lastResults: cc.Node = null;

    @property(cc.Node)
    payoutMultiplier: cc.Node = null;

    @property(cc.Sprite)
    charactor: cc.Sprite = null;

    @property(cc.SpriteAtlas)
    charactorAtlas: cc.SpriteAtlas = null;

    @property(cc.SpriteAtlas)
    coinAtlas: cc.SpriteAtlas = null;

    @property(cc.AudioClip)
    coinSound: cc.AudioClip = null;

    @property(cc.AudioClip)
    gameWinSound: cc.AudioClip = null;

    @property(cc.AudioClip)
    gameLooseSound: cc.AudioClip = null;

    @property(cc.AudioClip)
    backgroundMusic: cc.AudioClip = null;

    dummyPlayerBalanceManager = {
        balance: 0,
    };

    labelLayer: {
        labelBank: cc.Label;
        labelGambleWon: cc.Label;
        labelMultiplyTo: cc.Label;
    } = {
        labelBank: null,
        labelGambleWon: null,
        labelMultiplyTo: null,
    };

    headTailSriteFrame: {
        smallCoinHead: cc.SpriteFrame;
        smallCoinTail: cc.SpriteFrame;
        bigCoinHead: cc.SpriteFrame;
        bigCoinTail: cc.SpriteFrame;
    } = {
        smallCoinHead: null,
        smallCoinTail: null,
        bigCoinHead: null,
        bigCoinTail: null,
    };

    coinResultInitBetType = null;

    async start() {
        // await this.loadRedBlackAssets();

        this.setupCoinModule();
    }

    show(option: PanelShowOption): void {
        option.onShowed();
    }

    hide(option: PanelHideOption): void {
        option.onHided();
    }

    async activeCoinPanel() {
        if (this.dummyPlayerBalanceManager.balance <= 0) {
            this.dummyPlayerBalanceManager.balance = 13.31;
        }

        AudioManager.getInstance().play('ClickSound');

        AudioManager.getInstance().play('CoinBackgroundMusic', true);

        this.resetBettingUI();

        this.updateLastCoinResult();

        this.randomCurrentCoinResultSpriteFrame();

        CoinPanelModule.setCoinPanelStatus(Status.Active);

        this.coinGroup.active = true;
    }

    inActiveCoinPanel() {
        CoinPanelModule.setCoinPanelStatus(Status.Inactive);

        this.coinGroup.active = false;

        AudioManager.getInstance().stop('CoinBackgroundMusic');
    }

    takeWin() {
        this.inActiveCoinPanel();
    }

    async placeBet(event: cc.Component.EventHandler | null, betType: string) {
        AudioManager.getInstance().play('ClickSound');

        this.disableCommonButtons();

        this.disableBettingButtons();

        const result = await CoinPanelModule.getCoinResult(Number(betType), this.dummyPlayerBalanceManager.balance);

        await this.playCoinAnimation(result);

        await Delay(0.1);

        this.updateLastCoinResult();

        this.updateGambleWon(this.dummyPlayerBalanceManager.balance, result.winAmount);

        this.updateCharacterCostume(result);

        this.updatePayoutMultiplier(result.winningStreak);

        // Update player balance
        this.dummyPlayerBalanceManager.balance = result.winAmount;

        this.updateBettingInfomation();

        this.updateBank();

        if (result.winAmount > 0) {
            await Delay(0.25);

            this.updateBettingUI();
        } else {
            await Delay(1);

            this.inActiveCoinPanel();
        }
    }

    private updateBettingUI() {
        this.enableCommonButtons();

        this.enableBettingButtons();

        this.updateBettingInfomation();

        this.updateBank();
    }

    private resetBettingUI() {
        this.updateBettingUI();

        this.updateGambleWon(0, 0);

        this.updatePayoutMultiplier(0);

        // Use fake result to Initilize Character Costume
        this.updateCharacterCostume({ betType: BetType.Head, winAmount: 1, winningStreak: 0 });
    }

    private async playCoinAnimation(result: CoinResult) {
        await AsyncTask((resolve) => {
            AudioManager.getInstance().play('CoinSound');

            const coinAnimations = this.currentCoinResult.getComponent(cc.Animation);
            const lastCoinResults = CoinPanelModule.getLastCoinResults();

            const currentResultBetType = lastCoinResults[lastCoinResults.length - 1];
            const currentResultBetTypeName = this.getBetTypeName(currentResultBetType);

            const lastResultBetType = lastCoinResults[lastCoinResults.length - 2];
            let lastResultBetTypeName = this.getBetTypeName(lastResultBetType);

            if (!lastResultBetTypeName) {
                lastResultBetTypeName = this.coinResultInitBetType === BetType.Head ? 'Head' : 'Tail';
            }

            const animationName = lastResultBetTypeName + 'To' + currentResultBetTypeName + 'Animation';

            coinAnimations.play(animationName);

            coinAnimations.once(cc.Animation.EventType.FINISHED, () => {
                if (result.winAmount > 0) {
                    AudioManager.getInstance().play('CoinGameWinSound');
                } else {
                    AudioManager.getInstance().play('CoinGameLooseSound');
                }

                resolve();
            });
        });
    }

    private getBetTypeName(betType: BetType) {
        if (betType === BetType.Head) {
            return 'Head';
        } else if (betType === BetType.Tail) {
            return 'Tail';
        }

        return undefined;
    }

    private setupCoinModule() {
        // Initialize CooinPanel Logic
        CoinPanelModule.init();

        CoinPanelModule.data.coinMultiplier = [2, 4, 6, 8, 10, 12];

        this.cacheLabellayer();

        this.cacheHeadTailSpriteFrame();

        AudioManager.getInstance().add('CoinSound', this.coinSound);
        AudioManager.getInstance().add('CoinGameWinSound', this.gameWinSound);
        AudioManager.getInstance().add('CoinGameLooseSound', this.gameLooseSound);
        AudioManager.getInstance().add('CoinBackgroundMusic', this.backgroundMusic);
    }

    private cacheLabellayer() {
        const labelLayer = cc.find('LabelLayer', this.coinGroup);

        this.labelLayer.labelBank = labelLayer.getChildByName('LabelBank').getComponent(cc.Label);
        this.labelLayer.labelGambleWon = labelLayer.getChildByName('LabelGambleWon').getComponent(cc.Label);
        this.labelLayer.labelMultiplyTo = labelLayer.getChildByName('LabelMultiplyTo').getComponent(cc.Label);
    }

    private cacheHeadTailSpriteFrame() {
        this.headTailSriteFrame.bigCoinHead = this.coinAtlas.getSpriteFrame('qtoq01');
        this.headTailSriteFrame.bigCoinTail = this.coinAtlas.getSpriteFrame('xtox01');
        this.headTailSriteFrame.smallCoinHead = this.coinAtlas.getSpriteFrame('hisquan01');
        this.headTailSriteFrame.smallCoinTail = this.coinAtlas.getSpriteFrame('hisxing01');
    }

    /**
     * Random set CurrentCoinResult SpriteFrame when no last result
     */
    private randomCurrentCoinResultSpriteFrame() {
        const lastCoinResults = CoinPanelModule.getLastCoinResults();

        if (lastCoinResults.length === 0) {
            let spriteFrame = this.headTailSriteFrame.bigCoinHead;

            this.coinResultInitBetType = BetType.Head;

            if (GetRandomInterger(BetType.Head, BetType.Tail) === BetType.Tail) {
                spriteFrame = this.headTailSriteFrame.bigCoinTail;

                this.coinResultInitBetType = BetType.Tail;
            }

            this.currentCoinResult.spriteFrame = spriteFrame;
        }
    }

    private getCharactorCostumeSpriteFrame(winningStreak: number) {
        return this.charactorAtlas.getSpriteFrame('dbact0' + winningStreak);
    }

    private enableCommonButtons() {
        this.btnTakeWin.enabled = true;
    }

    private disableCommonButtons() {
        this.btnTakeWin.enabled = false;
    }

    private enableBettingButtons() {
        this.btnHead.enabled = true;
        this.btnTail.enabled = true;
    }

    private disableBettingButtons() {
        this.btnHead.enabled = false;
        this.btnTail.enabled = false;
    }

    private updatePayoutMultiplier(winningStreak: number) {
        for (const child of this.payoutMultiplier.children) {
            child.active = false;
        }

        this.payoutMultiplier.children[winningStreak].active = true;
    }

    private updateCharacterCostume(result: CoinResult) {
        if (result.winAmount === 0) {
            return;
        }

        let index = result.winningStreak + 1;
        index = index === 6 ? 7 : index;

        const charactorCostumeSpriteFrame = this.getCharactorCostumeSpriteFrame(index);

        this.charactor.spriteFrame = charactorCostumeSpriteFrame;
    }

    private updateBettingInfomation() {
        const balance = this.dummyPlayerBalanceManager.balance;
        const coinMultiplier = CoinPanelModule.getCoinMultiplier();

        this.labelLayer.labelMultiplyTo.string = BeautifyNumber(balance * coinMultiplier, 2);
    }

    private updateGambleWon(betAmount: number, winAmount: number) {
        if (winAmount === 0) {
            this.labelLayer.labelGambleWon.string = '0.00';
        } else {
            this.labelLayer.labelGambleWon.string = BeautifyNumber(winAmount - betAmount, 2);
        }
    }

    private updateBank() {
        this.labelLayer.labelBank.string = BeautifyNumber(this.dummyPlayerBalanceManager.balance, 2);
    }

    private updateLastCoinResult() {
        const lastCoinResults = [...CoinPanelModule.getLastCoinResults()].reverse();

        for (let i = 0, len = lastCoinResults.length; i < len; i++) {
            const coinNode = this.lastResults.children[i];
            const coinResult = lastCoinResults[i];

            coinNode.active = true;

            if (coinResult === BetType.Head) {
                coinNode.getComponent(cc.Sprite).spriteFrame = this.headTailSriteFrame.smallCoinHead;
            } else if (coinResult === BetType.Tail) {
                coinNode.getComponent(cc.Sprite).spriteFrame = this.headTailSriteFrame.smallCoinTail;
            }
        }
    }
}
