import { gg } from '../../../scripts/framework/gg';
import { Delay, Pad, SkippableDelay, StringFormat } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import BetLineManager from '../../../scripts/manager/BetLineManager';
import { CCConvertor } from '../../../scripts/manager/CreditCoinConvertorManager';
import { LocalizeText } from '../../../scripts/manager/LocalizeManager';
import { ResultWinningLine } from '../game/GamePanelModel';
import { SlotWinningLineEnum, WinType } from './SlotWinningLineEnum';
import SlotWinningLineModule from './SlotWinningLineModule';

const { ccclass, property } = cc._decorator;

interface WinningLine {
    lineNo: string;
    line: cc.Node;
    lineSprite: cc.Sprite;
}

interface Main {
    winningLine: Map<string, WinningLine>;
    resultWinningLine: ResultWinningLine[];
}

@ccclass
export default class SlotWinningLinePrefab extends cc.Component {
    @property(cc.SpriteAtlas)
    mainUISpriteAtlas: cc.SpriteAtlas = null;

    private lineShowIndex = 0;

    main: Main = {
        winningLine: new Map(),
        resultWinningLine: [],
    };

    onLoad() {
        this.registerEvent();

        this.cacheWinningline();
    }

    start() {
        this.setupSlotWinningLine();

        this.showWinningLineWhenStart();
    }

    showWinningLineWhenStart() {
        for (let i = 1; i <= BetLineManager.getInstance().selectedLine; i++) {
            const lineName = 'Line' + i;

            this.showLine(lineName, true);
        }
    }

    async showWinningLine(winAmount: number, totalBet: number, resultWinningLine: ResultWinningLine[]) {
        if (resultWinningLine.length === 0) {
            return;
        }

        const winType = SlotWinningLineModule.getWinType(winAmount, totalBet);
        let delayTime = 0;

        switch (winType) {
            case WinType.WinSmall:
                AudioManager.getInstance().play('Sfx_ShowAllWin_Small');

                delayTime = 3.5;
                break;
            // case WinType.WinBig:
            //     AudioManager.getInstance().play('Sfx_ShowAllWin_Big');

            //     delayTime = 7;
            //     break;
            default:
                delayTime = 0.5;
                break;
        }

        this.main.resultWinningLine = resultWinningLine;

        for (const lineObj of this.main.resultWinningLine) {
            const lineName = 'Line' + lineObj.lineNumber;

            this.showLine(lineName);
        }
        cc.log(resultWinningLine)
        // Play All Winning Symbols Line
        gg.eventManager.emit('SlotWinningLinePrefab.OnShowAllWiningSymbol', this.main.resultWinningLine);

        // If more than 1 winnning line, show Total amount instead
        const showLineNumber = resultWinningLine.length > 1 ? null : resultWinningLine[0].lineNumber.toString();
        this.showWiningMessage(winAmount, showLineNumber);

        await SkippableDelay(delayTime, 'SkippableDelay.StopSpin');

        this.stopAllSoundEffect();

        this.registerLineByLineScheduler();
    }

    private registerEvent() {
        gg.eventManager.on('SlotEnginePrefab.OnSpinStarted', this.onSpinStartedOrByReel, this);
        gg.eventManager.on('SlotEnginePrefab.OnSpinStartedByReel', this.onSpinStartedOrByReel, this);
        gg.eventManager.on('HUDPrefab.OnWiningLineUpdate', this.onWinningLineUpdate, this);
        gg.eventManager.on('HUDPrefab.onWiningLineAndSymbolClear', this.onWiningLineAndSymbolClear, this);
    }

    private setupSlotWinningLine() {}

    private cacheWinningline() {
        const winninglines = cc.find('SafeArea/Lines', this.node);
        const leftLineIndicators = cc.find('SafeArea/LeftLineIndicator', this.node);
        const rightLineIndicators = cc.find('SafeArea/RightLineIndicator', this.node);
        const slotWinningLines = new Map();

        for (const winningline of winninglines.children) {
            slotWinningLines.set(winningline.name, winningline);
        }

        for (let i = 0, len = leftLineIndicators.children.length; i < len; i++) {
            const leftLineIndicator = leftLineIndicators.children[i];

            this.main.winningLine.set(leftLineIndicator.name, {
                lineNo: leftLineIndicator.name.replace('Line', ''),
                line: slotWinningLines.get(leftLineIndicator.name),
                lineSprite: leftLineIndicator.getComponent(cc.Sprite),
            });
        }

        for (let i = 0, len = rightLineIndicators.children.length; i < len; i++) {
            const rightLineIndicator = rightLineIndicators.children[i];

            this.main.winningLine.set(rightLineIndicator.name, {
                lineNo: rightLineIndicator.name.replace('Line', ''),
                line: slotWinningLines.get(rightLineIndicator.name),
                lineSprite: rightLineIndicator.getComponent(cc.Sprite),
            });
        }
    }

    private async registerLineByLineScheduler() {
        if (this.main.resultWinningLine.length > 1) {
            this.lineShowIndex = 0;

            await SkippableDelay(0.5, 'SkippableDelay.StopSpin');

            this.showLineByLine();

            this.schedule(this.showLineByLine, 3, Infinity, 0.0);
        }
    }

    private removeLineByLineScheduler() {
        this.unschedule(this.showLineByLine);
    }

    private onWinningLineUpdate(lineNumber: number) {
        this.hideAllWinningLine();

        for (let i = 0; i < lineNumber; i++) {
            const lineName = 'Line' + (i + 1);

            this.showLine(lineName, true);
        }
    }

    private hideAllWinningLine() {
        for (let i = 0, len = this.main.winningLine.size; i < len; i++) {
            const lineName = 'Line' + (i + 1);

            this.hideLine(lineName);
        }
    }

    private async showLineByLine() {
        this.hideAllWinningLine();

        if (this.main.resultWinningLine.length === 0) {
            return;
        }

        const lineObj = this.main.resultWinningLine[this.lineShowIndex];
        const lineName = 'Line' + lineObj.lineNumber;

        this.showLine(lineName);

        this.showWiningMessage(lineObj.amount, lineObj.lineNumber.toString());

        this.lineShowIndex++;

        if (this.lineShowIndex > this.main.resultWinningLine.length - 1) {
            this.lineShowIndex = 0;
        }
    }

    private showLine(lineName: string, disableEventEmit?: boolean) {
        const winningLineObj = this.main.winningLine.get(lineName);

        if (winningLineObj.line.active === false) {
            winningLineObj.line.active = true;

            this.updateLineIndicator(winningLineObj, SlotWinningLineEnum.Show, true);

            if (disableEventEmit) {
                return;
            }

            // Play Single Winning Symbols Line
            gg.eventManager.emit('SlotWinningLinePrefab.OnShowWiningSymbol', this.main.resultWinningLine, winningLineObj.lineNo);
        }
    }

    private hideLine(lineName: string) {
        const winningLineObj = this.main.winningLine.get(lineName);

        if (winningLineObj.line.active === true) {
            winningLineObj.line.active = false;

            this.updateLineIndicator(winningLineObj, SlotWinningLineEnum.Hide, false);
        }
    }

    private updateLineIndicator(winningLineObj: WinningLine, status: SlotWinningLineEnum, show: boolean) {
        const lineNumber = Number(winningLineObj.lineNo);

        const indicatorType = status === SlotWinningLineEnum.Hide ? '_2' : '_1';
        const indicatorName = 'LineBtn' + Pad(lineNumber, 2) + indicatorType;
        const indicatorSpriteFrame = this.getMainUISpriteFrame(indicatorName);

        if (indicatorSpriteFrame) {
            winningLineObj.lineSprite.spriteFrame = indicatorSpriteFrame;
            // winningLineObj.right.spriteFrame = indicatorSpriteFrame;
        }

        if (show) {
            winningLineObj.lineSprite.node.active = true;
            // winningLineObj.right.node.active = true;
        } else if (lineNumber > BetLineManager.getInstance().selectedLine) {
            winningLineObj.lineSprite.node.active = true;
            // winningLineObj.right.node.active = false;
        }
    }

    private onSpinStartedOrByReel() {
        this.clearWiningLine();
    }

    private onWiningLineAndSymbolClear() {
        this.clearWiningLine();
    }

    private clearWiningLine() {
        this.removeLineByLineScheduler();

        this.main.resultWinningLine = [];

        this.hideAllWinningLine();

        this.stopAllSoundEffect();
    }

    private stopAllSoundEffect() {
        AudioManager.getInstance().stop(['Sfx_ShowAllWin_Small', 'Sfx_ShowAllWin_Big']);
    }

    private showWiningMessage(winAmount: number, lineNumber: string) {
        if (winAmount === 0) {
            return;
        }

        let msg = '';

        if (lineNumber) {
            msg = StringFormat(LocalizeText.WinningLine.WonOnLine, CCConvertor(winAmount.toFixed(2)), lineNumber.toString());
        } else {
            msg = StringFormat(LocalizeText.WinningLine.TotalWin, CCConvertor(winAmount.toFixed(2)));
        }

        if (msg) {
            gg.eventManager.emit('SlotWinningLinePrefab.OnShowWinMessage', msg);
        }

        // You won 1.80 on extra
    }

    private getMainUISpriteFrame(spriteFrameName: string) {
        return this.mainUISpriteAtlas.getSpriteFrame(spriteFrameName);
    }
}
