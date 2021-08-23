import { gg } from '../framework/gg';

export enum CCConvertionType {
    Credit = 'credit',
    Coin = 'coin',
}

export default class CreditCoinConvertorManager {
    private static instance: CreditCoinConvertorManager;
    private status = true;
    private convertionType: CCConvertionType = CCConvertionType.Credit;
    private multiplier: number = 1;
    private labelSpriteList: Map<string, cc.Label> = new Map();

    static getInstance(): CreditCoinConvertorManager {
        if (!CreditCoinConvertorManager.instance) {
            CreditCoinConvertorManager.instance = new CreditCoinConvertorManager();
        }

        return CreditCoinConvertorManager.instance;
    }

    get enable() {
        return this.status;
    }

    set enable(value: boolean) {
        this.status = value;
    }

    getConvertionType() {
        return this.convertionType;
    }

    setupCreditCoinConvertor(convertionType: CCConvertionType, multiplier: number) {
        if (convertionType === CCConvertionType.Coin) {
            this.convertionType = CCConvertionType.Coin;
        } else {
            this.convertionType = CCConvertionType.Credit;
        }

        this.multiplier = multiplier;
    }

    updateConvetionType(convertionType: CCConvertionType) {
        if (!this.enable) {
            return;
        }

        this.convertionType = convertionType;

        this.updateLabelSprite();

        // gg.eventManager.emit('CreditCoinConvetionManager.OnUpdateConventionType', convertionType);
    }

    convertor(value: string, valueConvertionType?: CCConvertionType) {
        if (!value) {
            return '';
        }

        // If current value is  same convertion type, can ignore it
        if (valueConvertionType && valueConvertionType === this.convertionType) {
            return value;
        }

        const amount = Number(value);

        let result = value;

        if (this.convertionType === CCConvertionType.Coin) {
            result = (amount * this.multiplier).toFixed(0);

            this.convertionType = CCConvertionType.Coin;
        } else if (this.convertionType === CCConvertionType.Credit) {
            result = (amount / this.multiplier).toFixed(2);

            this.convertionType = CCConvertionType.Credit;
        }

        return result;
    }

    /**
     * Add label to do instant Update
     * @param label
     */
    addLabelSprite(label: cc.Label) {
        const uuid = label.node.uuid;
        const existing = this.labelSpriteList.get(uuid);

        if (!existing) {
            this.labelSpriteList.set(uuid, label);
        }
    }

    removeLabelSprite(label: cc.Label) {
        const uuid = label.node.uuid;
        const existing = this.labelSpriteList.get(uuid);

        if (existing) {
            this.labelSpriteList.delete(uuid);
        }
    }

    clearLabelSpriteList() {
        this.labelSpriteList.clear();
    }

    updateLabelSprite() {
        for (let [key, label] of this.labelSpriteList) {
            const value = label.string;
            const convertedValue = this.convertor(value);

            label.string = convertedValue;
        }
    }
}

/**
 * Credit and Point Convertor
 * @param Value Credit or Point
 */
export const CCConvertor = (value: string) => {
    return CreditCoinConvertorManager.getInstance().convertor(value, CCConvertionType.Credit);
};
