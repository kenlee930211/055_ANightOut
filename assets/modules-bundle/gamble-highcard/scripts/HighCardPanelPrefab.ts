import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { BeautifyNumber, Delay, Pad, RoundDown, RoundUp } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import { BetType, Status } from './HighCardPanelEnum';
import { HighCardResult } from './HighCardPanelModel';
import HighCardPanelModule from './HighCardPanelModule';

const { ccclass, property } = cc._decorator;

@ccclass
export default class HighCardPanelPrefab extends PanelComponent {
    @property(cc.Node)
    highCardGroup: cc.Node = null;

    @property(cc.Button)
    btnCollect: cc.Button = null;

    @property(cc.Button)
    btnDoubleHalf: cc.Button = null;

    @property(cc.Button)
    btnDouble: cc.Button = null;

    @property(cc.SpriteFrame)
    cardBack: cc.SpriteFrame = null;

    @property(cc.SpriteAtlas)
    cardAtlas: cc.SpriteAtlas = null;

    resultCardButton: cc.Button[] = [];

    dummyPlayerBalanceManager = {
        balance: 0,
    };

    labelLayer: {
        labelTotalbet: cc.Label;
        labelWinAmount: cc.Label;
        labelBank: cc.Label;
        labelDoubleHalfTo: cc.Label;
        labelDoubleTo: cc.Label;
    } = {
        labelTotalbet: null,
        labelWinAmount: null,
        labelBank: null,
        labelDoubleHalfTo: null,
        labelDoubleTo: null,
    };

    messageLayer: {
        labelChooseDouble: cc.Sprite;
        labelPickAHigherCard: cc.Sprite;
        labelWin: cc.Sprite;
    } = {
        labelChooseDouble: null,
        labelPickAHigherCard: null,
        labelWin: null,
    };

    async start() {
        // await this.loadRedBlackAssets();

        this.setupHighCardModule();
    }

    show(option: PanelShowOption): void {
        option.onShowed();
    }

    hide(option: PanelHideOption): void {
        option.onHided();
    }

    activeHighCardPanel() {
        if (this.dummyPlayerBalanceManager.balance <= 0) {
            this.dummyPlayerBalanceManager.balance = 91.01;
        }

        AudioManager.getInstance().play('ClickSound');

        this.resetBettingUI();

        HighCardPanelModule.setHighCardPanelStatus(Status.Active);

        this.highCardGroup.active = true;

        this.updateBettingInfomation();

        this.updateBank();
    }

    inActiveHighCardPanel() {
        HighCardPanelModule.setHighCardPanelStatus(Status.Inactive);

        this.highCardGroup.active = false;
    }

    collectMoney() {
        this.inActiveHighCardPanel();
    }

    async doubleHalfBet() {
        AudioManager.getInstance().play('ClickSound');

        this.disableCommonButtons();

        this.updateTotalBet(BetType.DoubleHalf);

        const result = await HighCardPanelModule.getHighCardResult(Number(this.labelLayer.labelDoubleHalfTo.string));

        this.showDealerCard(result);

        this.enableCardButtons();
    }

    async doubleBet() {
        AudioManager.getInstance().play('ClickSound');

        this.disableCommonButtons();

        this.updateTotalBet(BetType.Double);

        const result = await HighCardPanelModule.getHighCardResult(Number(this.labelLayer.labelDoubleTo.string));

        this.showDealerCard(result);

        this.enableCardButtons();
    }

    async playerPickCard(event: cc.Component.EventHandler | null, cardNumber: string) {
        AudioManager.getInstance().play('ClickSound');

        this.disableCardButtons();

        // make sure call HighCardPanelModule.getHighCardResult first before get result directly from here
        const result = { ...HighCardPanelModule.data.highCardResult };
        const playerCard = this.getCardSpriteFrame(result.playerCard);

        const playerButtonSprite = this.resultCardButton[cardNumber];
        playerButtonSprite.normalSprite = playerCard.bigCard;
        playerButtonSprite.node.getChildByName('Label').active = true;

        // Display Wining Information
        if (result.winAmount > 0) {
            this.dummyPlayerBalanceManager.balance = result.winAmount;

            this.labelLayer.labelWinAmount.string = result.winAmount.toString();
            this.labelLayer.labelWinAmount.node.active = true;

            this.messageLayer.labelWin.node.active = true;
        } else {
            this.dummyPlayerBalanceManager.balance = result.winAmount;
        }

        this.messageLayer.labelChooseDouble.node.active = false;
        this.messageLayer.labelPickAHigherCard.node.active = false;

        await Delay(1);

        // Display Remaining Card Result
        for (let i = 1; i <= 4; i++) {
            if (i.toString() === cardNumber) {
                continue;
            }

            const randomCard = this.getCardSpriteFrame(result.randomCard.pop());

            const playerButtonSprite = this.resultCardButton[i];
            playerButtonSprite.normalSprite = randomCard.bigCard;
            playerButtonSprite.node.getChildByName('LoseShader').active = true;

            await Delay(0.5);
        }

        await Delay(2);

        if (result.winAmount > 0) {
            this.resetBettingUI();
        } else {
            this.inActiveHighCardPanel();
        }
    }

    private resetBettingUI() {
        for (const cardButton of this.resultCardButton) {
            cardButton.normalSprite = this.cardBack;
            cardButton.node.getChildByName('Label').active = false;
            cardButton.node.getChildByName('LoseShader').active = false;
        }

        this.messageLayer.labelChooseDouble.node.active = true;
        this.messageLayer.labelWin.node.active = false;

        this.labelLayer.labelBank.node.active = true;
        this.labelLayer.labelDoubleHalfTo.node.active = true;
        this.labelLayer.labelDoubleTo.node.active = true;
        this.labelLayer.labelWinAmount.node.active = false;

        this.disableCardButtons();

        this.enableCommonButtons();

        this.updateBettingInfomation();

        this.updateBank();
    }

    private showDealerCard(result: HighCardResult) {
        const dealerCard = this.getCardSpriteFrame(result.dealerCard);

        const dealerButtonSprite = this.resultCardButton[0];
        dealerButtonSprite.normalSprite = dealerCard.bigCard;
        dealerButtonSprite.node.getChildByName('Label').active = true;

        this.enableCardButtons();

        this.messageLayer.labelChooseDouble.node.active = false;
        this.messageLayer.labelPickAHigherCard.node.active = true;
    }

    private setupHighCardModule() {
        // Initialize RedBlackPanel Logic
        HighCardPanelModule.init();

        this.cacheResultCards();

        this.cacheMessagelayer();

        this.cacheLabellayer();
    }

    private cacheResultCards() {
        const cards = cc.find('Results/Cards', this.highCardGroup).children;

        for (const card of cards) {
            this.resultCardButton.push(card.getComponent(cc.Button));
        }
    }

    private cacheMessagelayer() {
        const messageLayer = cc.find('Results/MessageLayer', this.highCardGroup);

        this.messageLayer.labelChooseDouble = messageLayer.getChildByName('LabelChooseDouble').getComponent(cc.Sprite);
        this.messageLayer.labelPickAHigherCard = messageLayer.getChildByName('LabelPickAHigherCard').getComponent(cc.Sprite);
        this.messageLayer.labelWin = messageLayer.getChildByName('LabelWin').getComponent(cc.Sprite);
    }

    private cacheLabellayer() {
        const labelLayer = cc.find('LabelLayer', this.highCardGroup);

        this.labelLayer.labelTotalbet = labelLayer.getChildByName('LabelTotalbet').getComponent(cc.Label);
        this.labelLayer.labelWinAmount = labelLayer.getChildByName('LabelWinAmount').getComponent(cc.Label);
        this.labelLayer.labelBank = labelLayer.getChildByName('LabelBank').getComponent(cc.Label);
        this.labelLayer.labelDoubleHalfTo = labelLayer.getChildByName('LabelDoubleHalfTo').getComponent(cc.Label);
        this.labelLayer.labelDoubleTo = labelLayer.getChildByName('LabelDoubleTo').getComponent(cc.Label);
    }

    private getCardSpriteFrame(index: number) {
        const smallCard = this.cardAtlas.getSpriteFrame('Small_' + Pad(index, 2));
        const bigCard = this.cardAtlas.getSpriteFrame('Big_' + Pad(index, 2));

        return {
            smallCard: smallCard,
            bigCard: bigCard,
        };
    }

    private enableCommonButtons() {
        this.btnCollect.node.active = true;
        this.btnDoubleHalf.node.active = true;
        this.btnDouble.node.active = true;
    }

    private disableCommonButtons() {
        this.btnCollect.node.active = false;
        this.btnDoubleHalf.node.active = false;
        this.btnDouble.node.active = false;
    }

    private enableCardButtons() {
        for (const cardButton of this.resultCardButton) {
            cardButton.enabled = true;
        }
    }

    private disableCardButtons() {
        for (const cardButton of this.resultCardButton) {
            cardButton.enabled = false;
        }
    }

    private updateBettingInfomation() {
        const balance = this.dummyPlayerBalanceManager.balance;

        this.labelLayer.labelTotalbet.string = '';

        this.labelLayer.labelDoubleHalfTo.string = BeautifyNumber(balance / 2 + balance, 2);

        this.labelLayer.labelDoubleTo.string = BeautifyNumber(balance * 2);
    }

    private updateTotalBet(betType: BetType) {
        const bank = this.dummyPlayerBalanceManager.balance;
        let totalBet = 0;

        if (betType === BetType.DoubleHalf) {
            totalBet = RoundUp(bank / 2, 2);

            this.labelLayer.labelDoubleTo.node.active = false;
        } else if (betType === BetType.Double) {
            totalBet = bank;

            this.labelLayer.labelBank.node.active = false;
            this.labelLayer.labelDoubleHalfTo.node.active = false;
        }

        this.labelLayer.labelTotalbet.string = BeautifyNumber(totalBet, 2);

        this.dummyPlayerBalanceManager.balance = RoundDown(bank - totalBet, 2);

        this.updateBank();
    }

    private updateBank() {
        this.labelLayer.labelBank.string = BeautifyNumber(this.dummyPlayerBalanceManager.balance, 2);
    }
}
