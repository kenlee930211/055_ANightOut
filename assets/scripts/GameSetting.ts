// What to change when develop new game?
// 1. symbolEnum (symbol format return by API)
// 2. symbolNameMap (map symbolEnum to our atlas sprite name)
// 3. winningLine (only use for game have winning line)

// API symbol code
enum symbolEnum {
    w = 'w', // wild
    fs = 'fs', // free spin
    bonus = 'bonus', // high payout 4
    LP1 = 'LP1', // low payout 1
    LP2 = 'LP2', // low payout 2
    LP3 = 'LP3', // low payout 3
    LP4 = 'LP4', // low payout 4
    LP5 = 'LP5', // low payout 5
    // LP6 = 'LP6', // low payout 6
    HP1 = 'HP1', // high payout 1
    HP2 = 'HP2', // high payout 2
    HP3 = 'HP3', // high payout 3
}

// Map API symbol code to atlas sprite symbol name
// example: set(symbolEnum, atlasSymbolName)
const symbolNameMap = new Map<string, string>();
symbolNameMap.set(symbolEnum.w, 'Symbol-11');
symbolNameMap.set(symbolEnum.fs, 'Symbol-12');
symbolNameMap.set(symbolEnum.LP1, 'Symbol-5');
symbolNameMap.set(symbolEnum.LP2, 'Symbol-6');
symbolNameMap.set(symbolEnum.LP3, 'Symbol-7');
symbolNameMap.set(symbolEnum.LP4, 'Symbol-8');
symbolNameMap.set(symbolEnum.LP5, 'Symbol-9');
// symbolNameMap.set(symbolEnum.LP6, 'Symbol-9');
symbolNameMap.set(symbolEnum.HP1, 'Symbol-1');
symbolNameMap.set(symbolEnum.HP2, 'Symbol-2');
symbolNameMap.set(symbolEnum.HP3, 'Symbol-4');
symbolNameMap.set(symbolEnum.bonus, 'Symbol-10');

const symbols = Object.values(symbolEnum);
const wildSymbol = symbolNameMap.get(symbolEnum.w);
const freeSpinSymbol = symbolNameMap.get(symbolEnum.fs);
const bonusGameSymbol = symbolNameMap.get(symbolEnum.bonus);
const highPointSymbol1 = symbolNameMap.get(symbolEnum.HP1);
const highPointSymbol2 = symbolNameMap.get(symbolEnum.HP2);
const highPointSymbol3 = symbolNameMap.get(symbolEnum.HP3);
const winningLine = [
    {
        lineNumber: 1,
        linePosition: [1, 1, 1, 1, 1],
    },
    {
        lineNumber: 2,
        linePosition: [0, 0, 0, 0, 0],
    },
    {
        lineNumber: 3,
        linePosition: [2, 2, 2, 2, 2],
    },
    {
        lineNumber: 4,
        linePosition: [0, 1, 2, 1, 0],
    },
    {
        lineNumber: 5,
        linePosition: [2, 1, 0, 1, 2],
    },
    {
        lineNumber: 6,
        linePosition: [1, 0, 0, 0, 1],
    },
    {
        lineNumber: 7,
        linePosition: [1, 2, 2, 2, 1],
    },
    {
        lineNumber: 8,
        linePosition: [0, 0, 1, 2, 2],
    },
    {
        lineNumber: 9,
        linePosition: [2, 2, 1, 0, 0],
    },
    {
        lineNumber: 10,
        linePosition: [1, 2, 1, 0, 1],
    },
    {
        lineNumber: 11,
        linePosition: [1, 0, 1, 2, 1],
    },
    {
        lineNumber: 12,
        linePosition: [0, 1, 1, 1, 0],
    },
    {
        lineNumber: 13,
        linePosition: [2, 1, 1, 1, 2],
    },
    {
        lineNumber: 14,
        linePosition: [0, 1, 0, 1, 0],
    },
    {
        lineNumber: 15,
        linePosition: [2, 1, 2, 1, 2],
    },
    {
        lineNumber: 16,
        linePosition: [1, 1, 0, 1, 1],
    },
    {
        lineNumber: 17,
        linePosition: [1, 1, 2, 1, 1],
    },
    {
        lineNumber: 18,
        linePosition: [0, 0, 2, 0, 0],
    },
    {
        lineNumber: 19,
        linePosition: [2, 2, 0, 2, 2],
    },
    {
        lineNumber: 20,
        linePosition: [0, 2, 2, 2, 0],
    },
];

export const GameSetting = {
    symbols: symbols,
    wildSymbolMappedName: wildSymbol,
    freeSpinSymbolMappedName: freeSpinSymbol,
    bonusGameSymbolMappedName: bonusGameSymbol,
    highPointSymbol1MappedName: highPointSymbol1,
    highPointSymbol2MappedName: highPointSymbol2,
    highPointSymbol3MappedName: highPointSymbol3,
    getSymbolMappingName: (symbolName: string): string => {
        return symbolNameMap.get(symbolName);
    },
    winningLine: winningLine,
};
