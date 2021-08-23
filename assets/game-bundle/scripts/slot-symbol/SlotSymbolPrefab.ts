const { ccclass, property } = cc._decorator;

interface Data {
    symbolId: string;
}

@ccclass
export default class SlotSymbolPrefab extends cc.Component {
    @property()
    isExtraSymbol: boolean = false;

    private data: Data = {
        symbolId: null,
    };

    onLoad() {}

    start() {}

    setSymbolId(symbolId: string) {
        this.data.symbolId = symbolId;
    }

    getSymbolId() {
        return this.data.symbolId;
    }

    clearSymbolId() {
        this.data.symbolId = null;
    }
}
