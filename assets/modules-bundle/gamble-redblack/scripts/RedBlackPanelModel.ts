export interface RedBlackResult {
    cardResult: number;
    winAmount: number;
    playerBalance: number;
}

export class RedBlackPanelModel {
    redBlackActive: boolean = false;

    redBlackResult: RedBlackResult = null;

    lastCardResults: number[] = [];
}
