import { gg } from '../framework/gg';
import { Delay } from '../HelperTools';
import BankManager from './BankManager';
import BetDenomManager from './BetDenomManager';
import BetLineManager from './BetLineManager';

const { ccclass } = cc._decorator;

export interface BetInfo {
    selectedLine: number;
    selectedBetDenom: number;
    totalBet: number;
}

@ccclass
export default class BetInfoManager {
    private static instance: BetInfoManager;

    static getInstance(): BetInfoManager {
        if (!BetInfoManager.instance) {
            BetInfoManager.instance = new BetInfoManager();

            BetInfoManager.instance.init();
        }

        return BetInfoManager.instance;
    }

    init() {
        this.registerEvent();
    }

    get betInfo(): BetInfo {
        const selectedLine = BetLineManager.getInstance().selectedLine;
        const selectedBetDenom = BetDenomManager.getInstance().selectedBetDenom;
        let totalBet = selectedLine * selectedBetDenom;

        const betInfo = {
            selectedLine: selectedLine,
            selectedBetDenom: selectedBetDenom,
            totalBet: totalBet,
        };

        return betInfo;
    }

    private checkFreeGameAvailability() {
        // Work In Progress
        return false;
    }

    private registerEvent() {
        gg.eventManager.on('GamePanelFrefab.OnGameRoundStart', this.onGameRoundStart, this);
        gg.eventManager.on('BetInfoManager.OnAutoAdjustBetLineAndDenom', this.onAutoAdjustBetLineAndDenom, this);
    }

    private onGameRoundStart() {
        this.onAutoAdjustBetLineAndDenom();
    }

    private async onAutoAdjustBetLineAndDenom() {
        if (this.checkFreeGameAvailability()) {
            return;
        }

        const amount = BankManager.getInstance().accountInfo.balance;

        if (amount < this.betInfo.totalBet) {
            if (this.adjustBetDenom(amount)) {
                gg.eventManager.emit('BetInfoManager.OnUpdateBetLineAndBetDenomUI');

                return;
            }

            if (this.adjustBetLine(amount)) {
                gg.eventManager.emit('BetInfoManager.OnUpdateBetLineAndBetDenomUI');

                return;
            }
        }
    }

    private adjustBetDenom(balance: number): boolean {
        let selectedBetDenomIndex = BetDenomManager.getInstance().selectedBetDenomIndex;
        let resolve = false;

        // Prevent user change Bet Denom while auto adjusting
        BetDenomManager.getInstance().adjustInProgress = true;

        while (selectedBetDenomIndex > 0) {
            BetDenomManager.getInstance().autoDecrease();

            if (balance >= this.betInfo.totalBet) {
                resolve = true;

                break;
            }

            selectedBetDenomIndex--;
        }

        BetDenomManager.getInstance().adjustInProgress = false;

        return resolve;
    }

    private adjustBetLine(balance: number): boolean {
        let selectedLineIndex = BetLineManager.getInstance().selectedLineIndex;
        let resolve = false;

        // Prevent user change Bet Line while auto adjusting
        BetLineManager.getInstance().adjustInProgress = true;

        while (selectedLineIndex > 0) {
            BetLineManager.getInstance().autoDecrease();

            if (balance >= this.betInfo.totalBet) {
                resolve = true;

                break;
            }

            selectedLineIndex--;
        }

        BetLineManager.getInstance().adjustInProgress = false;

        return resolve;
    }
}
