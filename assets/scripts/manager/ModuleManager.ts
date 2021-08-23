import { PanelLayerEnum } from '../../main-bundle/scripts/configs/PanelConfigs';
import { PanelConfig } from '../framework/lib/router/PanelConfig';
import GameSystemManager from './GameSystemManager';

const { ccclass } = cc._decorator;

export interface ModuleProp {
    level: number;
    version: {};
    moduleCode: string;
    bundleURL: string;
    bundleName: string;
    bundlePrefabPath: string;
    prefabPath: string;
}

export interface ModulePanelProp {
    level: number;
    modulePanel: PanelConfig;
}

@ccclass
export default class ModuleManager {
    private static instance: ModuleManager;

    static getInstance(): ModuleManager {
        if (!ModuleManager.instance) {
            ModuleManager.instance = new ModuleManager();
        }

        return ModuleManager.instance;
    }

    getModuleList() {
        const config = GameSystemManager.getInstance().getConfig();
        const moduleList: ModuleProp[] = [];

        for (const module of config.moduleList) {
            if (module.bundleURL) {
                moduleList.push({
                    level: 3,
                    moduleCode: module.moduleCode,
                    version: module.version ? { version: module.version } : undefined,
                    bundleURL: module.bundleURL,
                    bundleName: module.bundleName,
                    bundlePrefabPath: module.bundlePrefabPath,
                    prefabPath: module.bundlePrefabPath,
                });
            }
        }

        return moduleList;
    }

    getModulePanelList() {
        const config = GameSystemManager.getInstance().getConfig();
        const modulePanelList: ModulePanelProp[] = [];

        for (const module of config.moduleList) {
            if (module.bundleURL) {
                modulePanelList.push({
                    level: 3,
                    modulePanel: <PanelConfig>{
                        bundleName: module.bundleName,
                        bundlePrefabPath: module.bundlePrefabPath,
                        prefabPath: module.bundleURL + '/' + module.bundlePrefabPath,
                        layerZIndex: PanelLayerEnum.UILayer,
                    },
                });
            }
        }

        return modulePanelList;
    }
}
