import { gg } from './framework/gg';

interface ButtonKeys {
    normalSprite: string;
    pressedSprite?: string;
    hoverSprite?: string;
    disabledSprite?: string;
}

export function GetRandomInterger(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function GetRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

export async function AsyncTask(callback: (taskResolve: (value: void | PromiseLike<void>) => void) => void) {
    return new Promise<void>((resolve, reject) => {
        callback(resolve);
    });
}

/**
 * Delay with Promise method
 * @param second - default 1 second
 */
export async function Delay(second: number = 1) {
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, second * 1000);
    });
}

/**
 * Skippable Delay with Promise method
 * @param second - default 1 second
 * @param eventName - register gg.eventManager listener to manual trigger promise's resolve
 * @returns Promise
 */
export async function SkippableDelay(second: number = 1, eventName: string) {
    if (second <= 0) {
        return;
    }

    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            resolve();
        }, second * 1000);

        if (eventName) {
            gg.eventManager.onOnce(eventName, () => {
                resolve();
            });
        }
    });
}

/**
 * The de-facto unbiased shuffle algorithm is the Fisher-Yates (aka Knuth) Shuffle.
 * @param array
 * @returns Shuffle Array
 */
export function Shuffle(array: any[]) {
    let currentIndex = array.length;
    let temporaryValue: any;
    let randomIndex: number;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

export function Pad(num: number, size: number) {
    const s = '000000000' + num;

    return s.substr(s.length - size);
}

/**
 * Beautify digit number by remove zero string behind.
 * Example: convert 100.00 to 100
 * @param num
 * @returns string
 */
export function BeautifyNumber(num: number, fractionDigits?: number) {
    if (num === 0) {
        return num.toFixed(fractionDigits);
    }

    if (Number.isInteger(num)) {
        return num.toFixed(0);
    }

    if (fractionDigits) {
        return num.toFixed(fractionDigits);
    }

    return num.toString();
}

export function RoundUp(num: number, numDigits: number = 2) {
    const decimalPoint = Math.pow(10, numDigits);

    return Math.ceil(num * decimalPoint) / decimalPoint;
}

export function RoundDown(num: number, numDigits: number = 2) {
    const decimalPoint = Math.pow(10, numDigits);

    return Math.floor(num * decimalPoint) / decimalPoint;
}

export const UItools = {
    ChangeButtonSpriteFrame: (button: cc.Button, spriteAtlas: cc.SpriteAtlas, keys: ButtonKeys) => {
        button.normalSprite = spriteAtlas.getSpriteFrame(keys.normalSprite);
        button.pressedSprite = spriteAtlas.getSpriteFrame(keys.pressedSprite);
        button.hoverSprite = spriteAtlas.getSpriteFrame(keys.hoverSprite);
        button.disabledSprite = spriteAtlas.getSpriteFrame(keys.disabledSprite);
    },
};

export const StringFormat = (str: string, ...args: string[]) => str.replace(/{(\d+)}/g, (match, index) => args[index] || '');

export function GetURLParameter(name: string) {
    // eslint-disable-next-line no-useless-concat
    let regExp = new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search);
    let result: string;
    let decodeURI: string;

    if (regExp) {
        // eslint-disable-next-line no-sparse-arrays
        result = (regExp || [, ''])[1].replace(/\+/g, '%20');
        decodeURI = decodeURIComponent(result);
    }

    return decodeURI || null;
}

export function RequestDeviceFullScreen() {
    cc.view.enableAutoFullScreen(true);
}

export function RegisterDeviceFullScreen() {
    if (!cc.sys.isMobile) return;

    const theElement = document.getElementById('GameCanvas');

    theElement.addEventListener(
        'touchend',
        () => {
            RequestDeviceFullScreen();
        },
        false
    );
}
