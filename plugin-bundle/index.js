// eslint-disable-next-line @typescript-eslint/no-require-imports
let concat = require('concat-files');

concat(
    [
        './plugin-bundle/plugins/dayjs.min.js',
        './plugin-bundle/plugins/newline.js', // create a new line when concat
        './plugin-bundle/plugins/decimal.min.js',
        './plugin-bundle/plugins/newline.js', // create a new line when concat
        './plugin-bundle/plugins/NoSleep.min.js',
        './plugin-bundle/plugins/newline.js', // create a new line when concat
        './plugin-bundle/plugins/state-machine.min.js',
    ],
    './plugin-bundle/output/plugins.min.js',
    (err) => {
        if (err) throw err;
        console.log('done');
    }
);
