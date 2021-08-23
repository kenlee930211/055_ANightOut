// Install nosleep.js libary before using this component
// - npm i nosleep.js (https://github.com/richtr/NoSleep.js)

/**
 * NoSleepComponent is singleton class. Use getInstance() to call class function.
 */
export default class NoSleepComponent {
    noSleep: NoSleep;

    private static instance: NoSleepComponent;

    static getInstance(): NoSleepComponent {
        if (!NoSleepComponent.instance) {
            NoSleepComponent.instance = new NoSleepComponent();

            NoSleepComponent.instance.noSleep = new NoSleep();

            // Enable wake lock.
            // (must be wrapped in a user input event handler e.g. a mouse or touch handler)
            document.addEventListener(
                'click',
                function enableNoSleep() {
                    document.removeEventListener('click', enableNoSleep, false);

                    NoSleepComponent.instance.noSleep.enable();
                },
                false
            );
        }

        return NoSleepComponent.instance;
    }

    async enable() {
        this.noSleep.enable();
    }

    async disable() {
        this.noSleep.disable();
    }
}
