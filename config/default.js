/**
 * Created by paulcook on 03/12/2015.
 */
// default config values
var config = {
    name: 'default',
    port: process.env.PORT || 8081,
    cacheLimit: 1024 * 1024 * 100, // 100MB cache limit, will flush entire cache if limit hit
    cacheTimeout: 60*60, // cache refreshes hourly
    log: {
        fatal : console.trace,
        error : console.trace,
        debug : console.log,
        warning: console.log
    }
};
// export
module.exports = config;
