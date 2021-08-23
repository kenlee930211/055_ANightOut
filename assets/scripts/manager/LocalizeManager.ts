import GameSystemManager from './GameSystemManager';

const { ccclass } = cc._decorator;

@ccclass
export default class LocalizeManager {
    private static instance: LocalizeManager;
    private LocalizeText = null;

    static getInstance(): LocalizeManager {
        if (!LocalizeManager.instance) {
            LocalizeManager.instance = new LocalizeManager();
        }

        return LocalizeManager.instance;
    }

    downloadLanguageFile() {
        cc.resources.load('i18n/' + GameSystemManager.getInstance().getLanguageCode(), (err, jsonAsset: any) => {
            this.LocalizeText = jsonAsset.json;

            LocalizeText = this.LocalizeText;
        });

        // load localize asset
        const basePath = 'localized-assets/game-bundle';
        const loadLocalizedAssets = `${basePath}/load/${GameSystemManager.getInstance().getLanguageCode()}`;

        cc.resources.load(`${loadLocalizedAssets}/Btn`, cc.SpriteAtlas, (err, spriteAtlas: cc.SpriteAtlas) => {});
    }

    getLocalizeText() {
        return this.LocalizeText;
    }
}

export let LocalizeText = null;
