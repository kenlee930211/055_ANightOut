import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { AsyncTask, BeautifyNumber, Delay, GetRandomInterger, Pad, RoundDown, RoundUp } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import { BetType, Status } from './DicePanelEnum';
import { DiceResult } from './DicePanelModel';
import DicePanelModule from './DicePanelModule';

const { ccclass, property } = cc._decorator;

@ccclass
export default class DicePanelPrefab extends PanelComponent {
    @property(cc.Node)
    diceGroup: cc.Node = null;

    @property(cc.Sprite)
    currentDiceResult: cc.Sprite = null;

    @property(cc.Button)
    btnTakeWin: cc.Button = null;

    @property(cc.Node)
    lastResults: cc.Node = null;

    @property(cc.SpriteAtlas)
    diceAtlas: cc.SpriteAtlas = null;

    @property(cc.Animation)
    cupOpenAnimation: cc.Animation = null;

    @property(cc.Animation)
    cupShakeAnimation: cc.Animation = null;

    @property(cc.Sprite)
    cupButtom: cc.Sprite = null;

    @property(cc.AudioClip)
    shaziSound: cc.AudioClip = null;

    @property(cc.AudioClip)
    gameWinSound: cc.AudioClip = null;

    @property(cc.AudioClip)
    gameLooseSound: cc.AudioClip = null;

    dummyPlayerBalanceManager = {
        balance: 0,
    };

    labelLayer: {
        LabelBank: cc.Label;
        LabelMultiply2To: cc.Label;
        LabelMultiply6To: cc.Label;
    } = {
        LabelBank: null,
        LabelMultiply2To: null,
        LabelMultiply6To: null,
    };

    smallBettingGroup: cc.Button[] = [];

    bigBettingGroup: cc.Button[] = [];

    async start() {
        // await this.loadDiceAssets();

        this.setupDiceModule();
    }

    show(option: PanelShowOption): void {
        option.onShowed();
    }

    hide(option: PanelHideOption): void {
        option.onHided();
    }

    async activeDicePanel() {
        if (this.dummyPlayerBalanceManager.balance <= 0) {
            this.dummyPlayerBalanceManager.balance = 13.31;
        }

        AudioManager.getInstance().play('ClickSound');

        this.resetBettingUI();

        DicePanelModule.setDicePanelStatus(Status.Active);

        this.diceGroup.active = true;

        this.disableCommonButtons();

        this.disableBettingButtons();

        await this.playCupShakeAimation();

        this.enableCommonButtons();

        this.enableBettingButtons();
    }

    inActiveDicePanel() {
        DicePanelModule.setDicePanelStatus(Status.Inactive);

        this.diceGroup.active = false;
    }

    takeWin() {
        this.inActiveDicePanel();
    }

    async placeBet(event: cc.Component.EventHandler | null, betType: string) {
        AudioManager.getInstance().play('ClickSound');

        this.disableCommonButtons();

        this.disableBettingButtons();

        const result = await DicePanelModule.getDiceResult(Number(betType), this.dummyPlayerBalanceManager.balance);

        this.showDiceResult(result);

        await this.playCupOpenAimation(result);

        this.dummyPlayerBalanceManager.balance = result.winAmount;

        if (result.winAmount > 0) {
            await Delay(0.25);

            await this.playCupShakeAimation();

            this.resetBettingUI();
        } else {
            await Delay(2);

            this.inActiveDicePanel();
        }
    }

    private resetBettingUI() {
        this.enableCommonButtons();

        this.enableBettingButtons();

        this.updateBettingInfomation();

        this.updateBank();
    }

    private showDiceResult(result: DiceResult) {
        const diceSpriteFrame = this.getDiceSpriteFrame(result.betType);

        this.currentDiceResult.spriteFrame = diceSpriteFrame.bigDice;
    }

    private async playCupShakeAimation() {
        await AsyncTask((resolve) => {
            AudioManager.getInstance().play('ShaziSound');

            this.cupButtom.node.active = false;
            this.cupShakeAnimation.node.active = true;

            this.cupShakeAnimation.play();
            this.cupShakeAnimation.once(cc.Animation.EventType.FINISHED, () => {
                this.cupButtom.node.active = true;
                this.cupShakeAnimation.node.active = false;

                resolve();
            });
        });
    }

    private async playCupOpenAimation(result: DiceResult) {
        await AsyncTask((resolve) => {
            const cupOpenAnimation = this.cupOpenAnimation.play();
            cupOpenAnimation.wrapMode = cc.WrapMode.Normal;

            this.scheduleOnce(() => {
                if (result.winAmount > 0) {
                    AudioManager.getInstance().play('GameWinSound');
                } else {
                    AudioManager.getInstance().play('GameLooseSound');
                }
            }, 0.4);

            this.cupOpenAnimation.once(cc.Animation.EventType.FINISHED, async () => {
                await Delay(2);

                this.updateLastCardsResult();

                resolve();
            });
        });

        await AsyncTask((resolve) => {
            const cupOpenAnimation = this.cupOpenAnimation.play();
            cupOpenAnimation.wrapMode = cc.WrapMode.Reverse;

            this.cupOpenAnimation.once(cc.Animation.EventType.FINISHED, () => {
                resolve();
            });
        });
    }

    private setupDiceModule() {
        // Initialize DicePanel Logic
        DicePanelModule.init();

        this.cacheBettingGroupButton();

        this.cacheLabellayer();

        AudioManager.getInstance().add('ShaziSound', this.shaziSound);
        AudioManager.getInstance().add('GameWinSound', this.gameWinSound);
        AudioManager.getInstance().add('GameLooseSound', this.gameLooseSound);
    }

    private cacheBettingGroupButton() {
        const smallBettingGroup = cc.find('Buttons/SmallBettingGroup', this.diceGroup).children;

        for (const bet of smallBettingGroup) {
            this.smallBettingGroup.push(bet.getComponent(cc.Button));
        }

        const bigBettingGroup = cc.find('Buttons/BigBettingGroup', this.diceGroup).children;

        for (const bet of bigBettingGroup) {
            this.bigBettingGroup.push(bet.getComponent(cc.Button));
        }
    }

    private cacheLabellayer() {
        const labelLayer = cc.find('LabelLayer', this.diceGroup);

        this.labelLayer.LabelBank = labelLayer.getChildByName('LabelBank').getComponent(cc.Label);
        this.labelLayer.LabelMultiply2To = labelLayer.getChildByName('LabelMultiply2To').getComponent(cc.Label);
        this.labelLayer.LabelMultiply6To = labelLayer.getChildByName('LabelMultiply6To').getComponent(cc.Label);
    }

    private getDiceSpriteFrame(diceNumber: number) {
        const smallDice = this.diceAtlas.getSpriteFrame('History_' + Pad(diceNumber, 2));

        const newDiceNumber = this.getDiceWithDifferentAngle(diceNumber);
        const bigDice = this.diceAtlas.getSpriteFrame('Result_' + Pad(newDiceNumber, 2));

        return {
            smallDice: smallDice,
            bigDice: bigDice,
        };
    }

    private getDiceWithDifferentAngle(diceNumber: number) {
        const max = diceNumber * 4;
        const min = max - 3;

        const random = GetRandomInterger(min, max);

        return random;
    }

    private enableCommonButtons() {
        this.btnTakeWin.node.active = true;
    }

    private disableCommonButtons() {
        this.btnTakeWin.node.active = false;
    }

    private enableBettingButtons() {
        for (const cardButton of this.smallBettingGroup) {
            cardButton.enabled = true;
        }

        for (const cardButton of this.bigBettingGroup) {
            cardButton.enabled = true;
        }
    }

    private disableBettingButtons() {
        for (const cardButton of this.smallBettingGroup) {
            cardButton.enabled = false;
        }

        for (const cardButton of this.bigBettingGroup) {
            cardButton.enabled = false;
        }
    }

    private updateBettingInfomation() {
        const balance = this.dummyPlayerBalanceManager.balance;

        this.labelLayer.LabelMultiply2To.string = BeautifyNumber(balance * 2, 2);
        this.labelLayer.LabelMultiply6To.string = BeautifyNumber(balance * 6, 2);
    }

    private updateBank() {
        this.labelLayer.LabelBank.string = BeautifyNumber(this.dummyPlayerBalanceManager.balance, 2);
    }

    private updateLastCardsResult() {
        const lastDicesResults = DicePanelModule.getLastDiceResults();

        for (let i = 0, len = lastDicesResults.length; i < len; i++) {
            const diceNode = this.lastResults.children[i];
            const diceResult = lastDicesResults[i];
            const diceSpriteFrame = this.getDiceSpriteFrame(diceResult);

            diceNode.active = true;
            diceNode.getComponent(cc.Sprite).spriteFrame = diceSpriteFrame.smallDice;
        }
    }
}
