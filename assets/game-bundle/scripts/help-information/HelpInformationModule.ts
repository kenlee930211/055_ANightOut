import HelpInformationModel from './HelpInformationModel';

export default class HelpInformationModule {
    static data: HelpInformationModel = null;

    /**
     * Initialize GamePanel Module
     */
    static init() {
        this.data = new HelpInformationModel();
    }
}
