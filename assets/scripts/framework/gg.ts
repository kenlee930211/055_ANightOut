import Analysis from "./lib/analysis/Analysis";
import { AnalysisInterface } from "./lib/analysis/AnalysisInterface";
import EventManager from "./lib/event-manager/EventManager";
import { EventManagerInterface } from "./lib/event-manager/EventManagerInterface";
import CCLogger from "./lib/logger/CCLogger";
import { LoggerInterface } from "./lib/logger/LoggerInterface";
import PanelRouter from "./lib/router/PanelRouter";
import { LocalStorage } from "./lib/storage/LocalStorage";
import { LocalStorageInterface } from "./lib/storage/LocalStorageInterface";

/**
 * Framework interface
 */
export interface FrameworkInterface {
    /**
     * Logger interface
     */
    logger: LoggerInterface;

    /**
     * Event broadcast, monitor, logout manager interface
     */
    eventManager: EventManagerInterface;

    /**
     * Analysis interface
     */
    analysis: AnalysisInterface;

    /**
     * Panel router interface
     */
    panelRouter: PanelRouter;

    /**
     * Local storage interface
     */
    storage: LocalStorageInterface;
}

/**
 * GoGame framework entrance
 */
export const gg: FrameworkInterface = {
    logger: ((): LoggerInterface => {
        return new CCLogger();
        // if (cc.sys.isNative) {
        //     return new NativeLogger();
        // } else {
        //     return new CCLogger();
        // }
    })(),
    eventManager: new EventManager(),
    analysis: new Analysis(),
    storage: new LocalStorage(),
    panelRouter: new PanelRouter(),
};
