import { gg } from '../../scripts/framework/gg';
import AssetLoader from '../../scripts/framework/lib/asset/AssetLoader';
import { AsyncTask, RegisterDeviceFullScreen } from '../../scripts/HelperTools';
import GameSystemManager from '../../scripts/manager/GameSystemManager';
import ModuleManager from '../../scripts/manager/ModuleManager';
import GameServer from '../../scripts/server/GameServer';
import { BundleConfigs } from './configs/BundleConfigs';
import { PanelConfigs } from './configs/PanelConfigs';

const { ccclass, property } = cc._decorator;

@ccclass
export default class MainSceneCtrl extends cc.Component {
    @property(cc.Node)
    rootLayerNode: cc.Node = null;

    onLoad() {
        RegisterDeviceFullScreen();

        // Initialize the log manager
        gg.logger.init({
            enableLog: false, // CC_DEBUG
        });

        // Initialize the panel router
        gg.panelRouter.init(this.rootLayerNode, true);
    }

    async start() {
        // const login = await GameServer.getInstance().doLogin();

        // console.log(login);

        // if (login.error) {
        //     return;
        // }

        // const getStartupSetting = AsyncTask(async (resolve) => {
        //     const startupSetting = await GameServer.getInstance().getStartupSetting();

        //     console.log(startupSetting);

        //     resolve();
        // });

        const getGameConfig = AsyncTask(async (resolve) => {
            // simulate API call
            // GameConfig subject to change when final/real API is provide. ¯\_(ツ)_/¯
            const dummyGameConfig = {
                betDenom: {
                    coins: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 5, 10, 15, 20,30,40,50,60,70,80,90,100,110,120],
                    defaultIndex: 0,
                },
                betLine: {
                    lines: [1, 2, 3, 4, 5, 6, 7, 8, 9,10,11,12,13,14,15,16,17,18,19,20],
                    defaultIndex: 19,
                },
                currency: 'MYR',
                playerBalance: 100,
                defaultConvertionType: 'credit',
                convertionMultiplier: 100,
                operatorCode: 'Mega888',
                backURL: 'http://www.google.com',
                logoutURL: 'http://www.w3schools.com',
                menuConfig: {
                    menuName: 'Mega888',
                    buttons: [
                        {
                            name: 'btnBack',
                            active: true,
                        },
                        {
                            name: 'btnHelp',
                            active: true,
                        },
                        {
                            name: 'btnAudio',
                            active: true,
                        },
                        {
                            name: 'btnShake',
                            active: false,
                        },
                        {
                            name: 'btnLogout',
                            active: true,
                        },
                    ],
                },
                moduleList: [
                    {
                        moduleCode: 'menu',
                        version: '', // can leave empty when using modules-config.json
                        // bundleURL: 'http://127.0.0.7:8088/build/web-mobile/assets/mega888-menu',
                        bundleURL: 'https://gt3-game.github.io/super-template-modules-hosting/bundles/mega888-menu',
                        bundleName: 'mega888-menu',
                        bundlePrefabPath: 'prefabs/MenuPrefab',
                    },
                    {
                        moduleCode: 'jackpotprogression',
                        version: '',
                        bundleURL: 'https://gt3-game.github.io/super-template-modules-hosting/bundles/jackpot-progression',
                        bundleName: 'jackpot-progression',
                        bundlePrefabPath: 'prefabs/JackpotProgressionPrefab',
                    },
                    {
                        moduleCode: 'jackpotwin',
                        version: '',
                        bundleURL: 'https://gt3-game.github.io/super-template-modules-hosting/bundles/jackpot-win',
                        bundleName: 'jackpot-win',
                        bundlePrefabPath: 'prefabs/JackpotPanelPrefab',
                    },
                    // {
                    //     moduleCode: 'dollarball',
                    //     version: '',
                    //     bundleURL: 'https://gt3-game.github.io/super-template-modules-hosting/bundles/dollar-ball',
                    //     bundleName: 'dollar-ball',
                    //     bundlePrefabPath: 'prefabs/DollarBallPanelPrefab',
                    // },
                ],
            };

            // Get modules-config.json
            const localHostModulesConfigURL = 'http://127.0.0.7:8088/build/modules-config.json';
            const hostingModulesConfigURL = 'https://gt3-game.github.io/super-template-modules-hosting/modules-config.json';

            await AsyncTask(async (resolve) => {
                cc.assetManager.loadRemote(hostingModulesConfigURL, (err, jsonAsset: cc.JsonAsset) => {
                    const modulesConfig = jsonAsset.json;

                    for (const bundleName in modulesConfig) {
                        if ({}.hasOwnProperty.call(modulesConfig, bundleName)) {
                            for (const module of dummyGameConfig.moduleList) {
                                if (bundleName === module.bundleName) {
                                    const bundleConfig = modulesConfig[bundleName];

                                    module.version = bundleConfig.version;

                                    break;
                                }
                            }
                        }
                    }

                    resolve();
                });
            });

            GameSystemManager.getInstance().setConfig(dummyGameConfig);
            GameSystemManager.getInstance().setFPS(30);
            GameSystemManager.getInstance().setDownloadConcurrency();

            resolve();
        });

        // Await Promise
        // await Promise.all([getStartupSetting, getGameConfig]);
        await Promise.all([getGameConfig]);

        // Add Bundle Check Point - step 2
        // Load Bundle
        const moduleList = ModuleManager.getInstance().getModuleList();

        // Base bundles
        let bundleList = [
            {
                level: 1,
                version: undefined,
                bundleURL: BundleConfigs.GameBundle,
            },
            {
                level: 2,
                version: undefined,
                bundleURL: BundleConfigs.CommonBundle,
            },
        ];

        bundleList = bundleList.concat(moduleList);

        await AsyncTask(async (resolve) => {
            for (let i = 0, len = bundleList.length; i < len; i++) {
                const load = bundleList[i];

                await AssetLoader.loadBundle(load.bundleURL, load.version);
            }

            resolve();
        });

        // Load boot page
        await gg.panelRouter.loadAsync(PanelConfigs.bootPanel);

        // Open the boot page
        gg.panelRouter.show({
            panel: PanelConfigs.bootPanel,
        });
    }
}
