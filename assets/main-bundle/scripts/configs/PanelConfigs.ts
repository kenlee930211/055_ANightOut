import { PanelConfig } from '../../../scripts/framework/lib/router/PanelConfig';
import { BundleConfigs } from './BundleConfigs';

/**
 * Panel layer level (the one with the highest level is displayed on the top)
 */
export enum PanelLayerEnum {
    UILayer = 200,

    PopLayer = 400,
}

/**
 * Game panel configuration
 */

// Add Bundle Check Point - step 3
export const PanelConfigs = {
    // ///////////////////////////////////////////////////////
    // Normal level

    bootPanel: <PanelConfig>{
        prefabPath: `${BundleConfigs.CommonBundle}/prefabs/boot/BootPanelPrefab`,
        layerZIndex: PanelLayerEnum.UILayer,
    },

    gamePanel: <PanelConfig>{
        prefabPath: `${BundleConfigs.GameBundle}/prefabs/game/GamePanelPrefab`,
        layerZIndex: PanelLayerEnum.UILayer,
    },

    gameSettingPanel: <PanelConfig>{
        prefabPath: `${BundleConfigs.GameBundle}/prefabs/game-setting/GameSettingPanelPrefab`,
        layerZIndex: PanelLayerEnum.UILayer,
    },

    // ///////////////////////////////////////////////////////
    // Pop-up level

    /**
     * General loading page
     */
    loadingPanel: <PanelConfig>{
        prefabPath: `${BundleConfigs.CommonBundle}/prefabs/pop-window/LoadingPanelPrefab`,
        layerZIndex: PanelLayerEnum.PopLayer,
    },

    /**
     * General Toast page
     */
    toastPanel: <PanelConfig>{
        prefabPath: `${BundleConfigs.CommonBundle}/prefabs/pop-window/ToastPanelPrefab`,
        layerZIndex: PanelLayerEnum.PopLayer,
    },

    /**
     * Insufficient Balance Toast page
     */
    insufficientBalanceToastPanel: <PanelConfig>{
        prefabPath: `${BundleConfigs.CommonBundle}/prefabs/pop-window/toast-panel/InsufficientBalanceToastPanelPrefab`,
        layerZIndex: PanelLayerEnum.PopLayer,
    },
};
