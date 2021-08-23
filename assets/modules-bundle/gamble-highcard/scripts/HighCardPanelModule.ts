import { gg } from '../../../scripts/framework/gg';
import { Card, HighCardPanelModel, HighCardResult } from './HighCardPanelModel';
import { CardType, Status } from './HighCardPanelEnum';
import { GetRandomFloat, GetRandomInterger, Pad, Shuffle } from '../../../scripts/HelperTools';

export default class HighCardPanelModule extends cc.Component {
    static data: HighCardPanelModel = null;

    /**
     * Initialize HighCardPanel Module
     */
    static init() {
        this.data = new HighCardPanelModel();

        this.addCardToDesk();

        this.data.numbersForRandom = this.generateRangeNumber(1, 52);
    }

    static getHighCardPanelStatus() {
        return this.data.highCardActive;
    }

    static setHighCardPanelStatus(value: Status) {
        this.data.highCardActive = Boolean(value);
    }

    static clearHighCardResult() {
        this.data.highCardResult = null;
    }

    static async getHighCardResult(payoutAmount: number) {
        return new Promise<HighCardResult>((resolve, reject) => {
            // get result

            const shuffleArray = Shuffle(this.data.numbersForRandom);
            const dealerCardId = shuffleArray[0];
            const playerCardId = shuffleArray[1];
            const randomCardId = [shuffleArray[2], shuffleArray[3], shuffleArray[4]];

            const dealerCard = this.getCardFromDesk(dealerCardId);
            const playerCard = this.getCardFromDesk(playerCardId);

            const isPlayerWin = this.compareCard(dealerCard, playerCard);
            const winAmount = isPlayerWin ? payoutAmount : 0;

            const highCardResult = {
                dealerCard: dealerCardId,
                playerCard: playerCardId,
                randomCard: randomCardId,
                winAmount: winAmount,
            };

            this.setHighCardResult(highCardResult);

            resolve(highCardResult);
        });
    }

    private static setHighCardResult(highCardResult: HighCardResult) {
        this.data.highCardResult = highCardResult;
    }

    private static getCardFromDesk(cardId: number) {
        return this.data.cardDesk.get(Pad(cardId, 2));
    }

    private static compareCard(dealerCard: Card, playerCard: Card) {
        const totalDealerCardPoint = dealerCard.cardValue + dealerCard.cardType;

        const totalPlayerCardPoint = playerCard.cardValue + playerCard.cardType;

        if (totalPlayerCardPoint > totalDealerCardPoint) {
            return true;
        }

        return false;
    }

    private static generateRangeNumber(from: number, to: number) {
        const numberList = [];

        for (let i = from; i <= to; i++) {
            numberList.push(i);
        }

        return numberList;
    }

    private static addCardToDesk() {
        this.data.cardDesk.set('01', { cardValue: 2, cardType: CardType.Spade });
        this.data.cardDesk.set('02', { cardValue: 3, cardType: CardType.Spade });
        this.data.cardDesk.set('03', { cardValue: 4, cardType: CardType.Spade });
        this.data.cardDesk.set('04', { cardValue: 5, cardType: CardType.Spade });
        this.data.cardDesk.set('05', { cardValue: 6, cardType: CardType.Spade });
        this.data.cardDesk.set('06', { cardValue: 7, cardType: CardType.Spade });
        this.data.cardDesk.set('07', { cardValue: 8, cardType: CardType.Spade });
        this.data.cardDesk.set('08', { cardValue: 9, cardType: CardType.Spade });
        this.data.cardDesk.set('09', { cardValue: 10, cardType: CardType.Spade });
        this.data.cardDesk.set('10', { cardValue: 11, cardType: CardType.Spade });
        this.data.cardDesk.set('11', { cardValue: 12, cardType: CardType.Spade });
        this.data.cardDesk.set('12', { cardValue: 13, cardType: CardType.Spade });
        this.data.cardDesk.set('13', { cardValue: 14, cardType: CardType.Spade });

        this.data.cardDesk.set('14', { cardValue: 2, cardType: CardType.Club });
        this.data.cardDesk.set('15', { cardValue: 3, cardType: CardType.Club });
        this.data.cardDesk.set('16', { cardValue: 4, cardType: CardType.Club });
        this.data.cardDesk.set('17', { cardValue: 5, cardType: CardType.Club });
        this.data.cardDesk.set('18', { cardValue: 6, cardType: CardType.Club });
        this.data.cardDesk.set('19', { cardValue: 7, cardType: CardType.Club });
        this.data.cardDesk.set('20', { cardValue: 8, cardType: CardType.Club });
        this.data.cardDesk.set('21', { cardValue: 9, cardType: CardType.Club });
        this.data.cardDesk.set('22', { cardValue: 10, cardType: CardType.Club });
        this.data.cardDesk.set('23', { cardValue: 11, cardType: CardType.Club });
        this.data.cardDesk.set('24', { cardValue: 12, cardType: CardType.Club });
        this.data.cardDesk.set('25', { cardValue: 13, cardType: CardType.Club });
        this.data.cardDesk.set('26', { cardValue: 14, cardType: CardType.Club });

        this.data.cardDesk.set('27', { cardValue: 2, cardType: CardType.Heart });
        this.data.cardDesk.set('28', { cardValue: 3, cardType: CardType.Heart });
        this.data.cardDesk.set('29', { cardValue: 4, cardType: CardType.Heart });
        this.data.cardDesk.set('30', { cardValue: 5, cardType: CardType.Heart });
        this.data.cardDesk.set('31', { cardValue: 6, cardType: CardType.Heart });
        this.data.cardDesk.set('32', { cardValue: 7, cardType: CardType.Heart });
        this.data.cardDesk.set('33', { cardValue: 8, cardType: CardType.Heart });
        this.data.cardDesk.set('34', { cardValue: 9, cardType: CardType.Heart });
        this.data.cardDesk.set('35', { cardValue: 10, cardType: CardType.Heart });
        this.data.cardDesk.set('36', { cardValue: 11, cardType: CardType.Heart });
        this.data.cardDesk.set('37', { cardValue: 12, cardType: CardType.Heart });
        this.data.cardDesk.set('38', { cardValue: 13, cardType: CardType.Heart });
        this.data.cardDesk.set('39', { cardValue: 14, cardType: CardType.Heart });

        this.data.cardDesk.set('40', { cardValue: 2, cardType: CardType.Diamond });
        this.data.cardDesk.set('41', { cardValue: 3, cardType: CardType.Diamond });
        this.data.cardDesk.set('42', { cardValue: 4, cardType: CardType.Diamond });
        this.data.cardDesk.set('43', { cardValue: 5, cardType: CardType.Diamond });
        this.data.cardDesk.set('44', { cardValue: 6, cardType: CardType.Diamond });
        this.data.cardDesk.set('45', { cardValue: 7, cardType: CardType.Diamond });
        this.data.cardDesk.set('46', { cardValue: 8, cardType: CardType.Diamond });
        this.data.cardDesk.set('47', { cardValue: 9, cardType: CardType.Diamond });
        this.data.cardDesk.set('48', { cardValue: 10, cardType: CardType.Diamond });
        this.data.cardDesk.set('49', { cardValue: 11, cardType: CardType.Diamond });
        this.data.cardDesk.set('50', { cardValue: 12, cardType: CardType.Diamond });
        this.data.cardDesk.set('51', { cardValue: 13, cardType: CardType.Diamond });
        this.data.cardDesk.set('52', { cardValue: 14, cardType: CardType.Diamond });
    }
}
