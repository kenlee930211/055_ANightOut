import { gg } from '../framework/gg';
import BetInfoManager from './BetInfoManager';

const { ccclass } = cc._decorator;

export enum Action {
    Withdraw = 'Withdraw',
    Deposit = 'Deposit',
}

export enum BankResponseCode {
    void = -1,
    Successful = 1,
    InsufficientBalance = 2,
    Failed = 0,
}

export interface AccountInfo {
    currecy: string;
    balance: number;
}

export interface BankReceipt {
    action: string;
    amount: number;
    availableBalance: number;
    responseCode: number;
    responseMessage: string;
}

@ccclass
export default class BankManager {
    private static instance: BankManager;
    private currecy: string;
    private balance: number;

    static getInstance(): BankManager {
        if (!BankManager.instance) {
            BankManager.instance = new BankManager();
        }

        return BankManager.instance;
    }

    get accountInfo(): AccountInfo {
        const accountInfo: AccountInfo = {
            currecy: this.currecy,
            balance: this.balance,
        };

        return accountInfo;
    }

    setupBank(currecy: string, balance: number) {
        this.currecy = currecy;

        this.balance = balance;

        // this.updateLabelBalance(null);
    }

    withdraw(amount: number): BankReceipt {
        if (amount === 0) {
            return this.getEmptyBankReceipt(Action.Withdraw, amount);
        } else if (amount < 0) {
            return this.getInvalidBankReceipt(Action.Withdraw, amount);
        }

        const bankReceipt = this.bankCounter(Action.Withdraw, amount);

        // if (bankReceipt.responseCode === BankResponseCode.Successful) {
        //     this.updateLabelBalance(bankReceipt);
        // }

        return bankReceipt;
    }

    deposit(amount: number): BankReceipt {
        if (amount === 0) {
            return this.getEmptyBankReceipt(Action.Deposit, amount);
        } else if (amount < 0) {
            return this.getInvalidBankReceipt(Action.Deposit, amount);
        }

        const bankReceipt = this.bankCounter(Action.Deposit, amount);

        // if (bankReceipt.responseCode === BankResponseCode.Successful) {
        //     this.updateLabelBalance(bankReceipt);
        // }

        return bankReceipt;
    }

    private getInvalidBankReceipt(action: Action, amount: number) {
        const bankReceipt = {
            action: action,
            amount: amount,
            availableBalance: this.balance,
            responseCode: BankResponseCode.Failed,
            responseMessage: 'Rejected: Invalid Amount',
        };

        return bankReceipt;
    }

    private getEmptyBankReceipt(action: Action, amount: number) {
        const bankReceipt = {
            action: action,
            amount: amount,
            availableBalance: this.balance,
            responseCode: BankResponseCode.Successful,
            responseMessage: 'Bank no perform any action because amount is 0',
        };

        return bankReceipt;
    }

    private bankCounter(action: Action, amount: number): BankReceipt {
        let responseCode = BankResponseCode.void;
        let responseMessage = '';

        if (action === Action.Withdraw) {
            const betInfo = BetInfoManager.getInstance().betInfo;
            const totalBet = betInfo.totalBet;

            if (this.balance <= 0 || totalBet > this.balance) {
                responseCode = BankResponseCode.InsufficientBalance;
                responseMessage = 'Withdrawal Rejected: Insufficient Balance';
            } else if (this.balance >= totalBet) {
                const decimalBalance = new Decimal(this.balance);

                this.balance = decimalBalance.minus(totalBet).toNumber();

                responseCode = BankResponseCode.Successful;
                responseMessage = 'Withdraw Successful';
            }

            const bankReceipt = {
                action: action,
                amount: amount,
                availableBalance: this.balance,
                responseCode: responseCode,
                responseMessage: responseMessage,
            };

            return bankReceipt;
        } else if (action === Action.Deposit) {
            const decimalBalance = new Decimal(this.balance);

            this.balance = decimalBalance.add(amount).toNumber();

            responseCode = BankResponseCode.Successful;
            responseMessage = 'Deposit Successful';

            const bankReceipt = {
                action: action,
                amount: amount,
                availableBalance: this.balance,
                responseCode: responseCode,
                responseMessage: responseMessage,
            };

            return bankReceipt;
        }
    }

    private updateLabelBalance(bankReceipt: BankReceipt) {
        // gg.eventManager.emit('BankManager.OnBalanceUpdate', bankReceipt);
    }
}
