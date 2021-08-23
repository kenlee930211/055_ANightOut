import { GetURLParameter } from '../HelperTools';

const { ccclass } = cc._decorator;

@ccclass
export default class GameSystemManager {
    private static instance: GameSystemManager;
    private languageCodeWhiteList = ['en', 'th', 'zh'];
    private languageCode = 'en';
    private config: any = null;

    static getInstance(): GameSystemManager {
        if (!GameSystemManager.instance) {
            GameSystemManager.instance = new GameSystemManager();

            GameSystemManager.instance.init();
        }

        return GameSystemManager.instance;
    }

    init() {
        this.setupGameLanguageCode();
    }

    getConfig() {
        return this.config;
    }

    setConfig(config: any) {
        this.config = config;
    }

    /**
     * Range from 30-60 fps
     * @param fps
     */
    setFPS(fps: number) {
        cc.game.setFrameRate(cc.misc.clampf(fps, 30, 60));
    }

    getFPS() {
        return cc.game.getFrameRate();
    }

    setDownloadConcurrency() {
        cc.assetManager.presets.preload = { maxConcurrency: 10, maxRequestsPerFrame: 10, priority: -1 };
    }

    getLanguageCode() {
        return this.languageCode;
    }

    setupGameLanguageCode() {
        const languageCode = GetURLParameter('lang');

        this.languageCode = this.languageCodeWhiteList.includes(languageCode) ? languageCode : 'en';
    }
}
