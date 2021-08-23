import { AsyncTask, GetRandomFloat } from '../../../scripts/HelperTools';
import CreditCoinConvertorManager, { CCConvertor } from '../../../scripts/manager/CreditCoinConvertorManager';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';

const { ccclass, property } = cc._decorator;

interface Main {
    lblProgressiveAmount: cc.Label;
}

@ccclass
export default class ProgressiveJackpotPrefab extends cc.Component {
    @property(cc.Sprite)
    labelProgressiveJackpot: cc.Sprite = null;

    @property(cc.Label)
    labelProgressiveAmount: cc.Label = null;

    private main: Main = {
        lblProgressiveAmount: null,
    };

    onLoad() {
        this.cacheProperty();

        this.registerEvent();
    }

    async start() {
        await this.loadAssets();

        this.setupProgressiveJackpotModule();
    }

    private registerEvent() {}

    private setupProgressiveJackpotModule() {
        const random = GetRandomFloat(300000, 500000) as number;

        this.main.lblProgressiveAmount.string = CCConvertor(random.toFixed(2));

        CreditCoinConvertorManager.getInstance().addLabelSprite(this.main.lblProgressiveAmount);
    }

    private cacheProperty() {
        this.main.lblProgressiveAmount = this.labelProgressiveAmount;
    }

    private async loadAssets() {
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
                // special case: 'Btn' loaded inside LocalizeManager first
                // to make sure no delay when game show up
                // here only take from cache and assign sprite frame to node
                cc.resources.load(`${loadLocalizedAssets}/Btn`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {
                    this.labelProgressiveJackpot.getComponent(cc.Sprite).spriteFrame = spriteAtlas.getSpriteFrame('Jackpotpic');

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
