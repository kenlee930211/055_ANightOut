import { PanelConfigs } from '../../../main-bundle/scripts/configs/PanelConfigs';
import { gg } from '../../../scripts/framework/gg';
import { PanelComponent, PanelHideOption, PanelShowOption } from '../../../scripts/framework/lib/router/PanelComponent';
import { AsyncTask, Delay } from '../../../scripts/HelperTools';
import AudioManager from '../../../scripts/manager/AudioManager';
import BankManager from '../../../scripts/manager/BankManager';
import BetDenomManager from '../../../scripts/manager/BetDenomManager';
import BetInfoManager from '../../../scripts/manager/BetInfoManager';
import BetLineManager from '../../../scripts/manager/BetLineManager';
import EventQueueManager from '../../../scripts/manager/EventQueueManager';
import GameSystemManager from '../../../scripts/manager/GameSystemManager';
import CreditCoinConvertorManager from '../../../scripts/manager/CreditCoinConvertorManager';
import LocalizeManager from '../../../scripts/manager/LocalizeManager';
import ModuleManager from '../../../scripts/manager/ModuleManager';

const { ccclass, property } = cc._decorator;

/**
 * Boot panel
 */
@ccclass
export default class BootPanelPrefab extends PanelComponent {
    @property({
        type: cc.Sprite,
        tooltip: 'Loading progress',
    })
    progressBar: cc.Sprite = null;

    // @property({
    //     type: cc.Label,
    //     tooltip: 'Loading text',
    // })
    // loadingLabel: cc.Label = null;

    show(option: PanelShowOption): void {
        option.onShowed();
        this._initGame();
    }

    hide(option: PanelHideOption): void {
        option.onHided();
    }

    // Add Bundle Check Point - step 4
    private async _initGame() {
        // Initialize game settings
        // GameSettingModule.initSettingConfig();

        LocalizeManager.getInstance();
        EventQueueManager.getInstance();
        AudioManager.getInstance();
        BetInfoManager.getInstance();
        BetDenomManager.getInstance();
        BetLineManager.getInstance();
        BankManager.getInstance();
        CreditCoinConvertorManager.getInstance();

        // get language file
        // LocalizeManager will enhance better in future
        LocalizeManager.getInstance().downloadLanguageFile();

        // Loading order is important, especially for dependency item
        // Higher level dependency to lower level items. so lower level items must load first.

        // base module panel list
        const panelLoadingList = [
            {
                level: 1,
                modulePanel: PanelConfigs.loadingPanel,
            },
            {
                level: 1,
                modulePanel: PanelConfigs.toastPanel,
            },
            {
                level: 1,
                modulePanel: PanelConfigs.gameSettingPanel,
            },
            {
                level: 1,
                modulePanel: PanelConfigs.insufficientBalanceToastPanel,
            },
            {
                level: 2,
                modulePanel: PanelConfigs.gamePanel,
            },
        ];

        const moduleList = ModuleManager.getInstance().getModuleList();

        let count = 0;
        let totalLength = panelLoadingList.length + moduleList.length;

        // Load module panel
        await AsyncTask(async (resolve) => {
            for (let i = 0, len = panelLoadingList.length; i < len; i++) {
                const load = panelLoadingList[i];

                count += 1;

                this.onLoadProgressChanged(count / totalLength);

                await gg.panelRouter.loadAsync(load.modulePanel);
            }

            resolve();
        });

        // Load module bundle
        await AsyncTask(async (resolve) => {
            for (const module of moduleList) {
                const bundle: cc.AssetManager.Bundle = cc.assetManager.getBundle(module.bundleName);

                await AsyncTask(async (resolve) => {
                    bundle.load(module.bundlePrefabPath, cc.Prefab, (err, prefab: cc.Prefab) => {
                        count += 1;

                        this.onLoadProgressChanged(count / totalLength);

                        resolve();
                    });
                });
            }

            resolve();
        });

        // Open the main panel
        await AsyncTask(async (resolve) => {
            this.onLoadProgressChanged(1.0);

            GameSystemManager.getInstance().setFPS(60);

            await Delay(0.2);

            resolve();
        });

        gg.panelRouter.show({
            panel: PanelConfigs.gamePanel,
            onShowed: () => {
                // After the main panel is opened then hide and clean up related resources of the startup page panel (because it will not be used later)
                gg.panelRouter.hide({
                    panel: PanelConfigs.bootPanel,
                    onHided: () => {
                        gg.panelRouter.destroy({
                            panel: PanelConfigs.bootPanel,
                        });
                    },
                });
            },
        });
    }

    /**
     * Loading progress update
     *
     * @param pb Loading progress [0, 1]
     * @param msg Load description information
     */
    private onLoadProgressChanged(pb: number, msg: string = null) {
        this.progressBar.fillRange = pb;

        // if (msg) {
        // this.loadingLabel.string = msg;
        // }
    }
}
