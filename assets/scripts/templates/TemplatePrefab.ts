import { AsyncTask } from '../HelperTools';
import GameSystemManager from '../manager/GameSystemManager';

const { ccclass, property } = cc._decorator;

interface Main {
    itemName: string;
}

@ccclass
export default class TemplatePrefab extends cc.Component {
    @property()
    itemName: string = null;

    private main: Main = {
        itemName: null,
    };

    onLoad() {
        this.cacheProperty();

        this.registerEvent();
    }

    async start() {
        // this.loadTemplateAssets();

        this.setupTemplateModule();
    }

    private registerEvent() {}

    private setupTemplateModule() {}

    private cacheProperty() {
        this.main.itemName = this.itemName;
    }

    private async loadTemplateAssets() {
        return new Promise<void>((resolve, reject) => {
            const lang = GameSystemManager.getInstance().getLanguageCode();

            /**
             * load sequence
             * 1. preloadCommonAssets
             * 2. preloadLocalizedAssets
             * 3. loadCommonAssets
             * 4. loadLocalizedAssets
             */
            const basePath = 'localized-assets/game-bundle';

            const loadCommonAssets = `${basePath}/load/common`;
            const preloadCommonAssets = `${basePath}/preload/common`;

            const loadLocalizedAssets = `${basePath}/load/${lang}`;
            const preloadLocalizedAssets = `${basePath}/preload/${lang}`;

            /**
             * Preload Common Assets
             * Use when common assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            // cc.resources.preloadDir(preloadCommonAssets, (err, assets) => {});

            /**
             * Preload Localized Assets
             * Use when localized assets do not need to display immediately.
             * Example: Jackpot winning animation events, it do not required trigger immediately.
             */
            // cc.resources.preloadDir(preloadLocalizedAssets, (err, assets) => {});

            /**
             * Load Common Assets
             * Use when Common assets needed to display immediately
             * Example: Common background need to show after game started.
             */
            const LoadCommonAssets = AsyncTask(async (resolve) => {
                // cc.resources.loadDir(loadCommonAssets, (err, assets) => {});

                resolve();
            });

            /**
             ** Load Localized Assets
             * Use when localized assets needed to display immediately
             * Example: Jackpot counter background need to show after game started.
             */
            const LoadLocalizedAssets = AsyncTask(async (resolve) => {
                cc.resources.loadDir(loadLocalizedAssets, (err, assets) => {
                    cc.resources.load(`${loadLocalizedAssets}/Btn`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {
                        // this.main.helpUISpriteAtlas = spriteAtlas;
                    });

                    resolve();
                });
            });

            // Await Promise
            Promise.all([LoadCommonAssets, LoadLocalizedAssets]).then(() => {
                resolve();
            });
        });
    }
}
