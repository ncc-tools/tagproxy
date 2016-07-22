/**
 * Created by paulcook on 03/12/2015.
 */
// default config values
fs = require('fs');

fs.readFile('./config/topCode.js', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
//    console.log(data);
    config.topCode = '<script>' + data + '</script>';
});
fs.readFile('./config/bottomCode.js', 'utf8', function (err,data) {
    if (err) {
        return console.log(err);
    }
    config.bottomCode = '<script>' + data + '</script>';
});

var config = {
    name: 'default',
    port: process.env.PROXY_PORT || 8081,
    cacheLimit: 0, // no caching
    cacheTimeout: 0, // no caching
    bps: 2000000, //no throttling
//    cacheLimit: 1024 * 1024 * 100, // 100MB cache limit, will flush entire cache if limit hit
//    cacheTimeout: 60*60, // cache refreshes hourly
//    bps: 2000000, //2Mbps

//    bps: 2000000, //2Mbps
    log: {
        fatal : console.trace,
        error : console.trace,
        debug : console.log,
        warning: console.log
    },
    // inserted after open head tag, no head tag no insertion
    topCode: '<script>'+ fs.readFileSync('./config/hackTop.js' ).toString() + '</script>',
    // inserted before close body tag, no colos
    bottomCode: '',

    blockList: '',
//    injectList: "www.theguardian.com www.eventbrite.co.uk www.coxandcox.co.uk www.johnlewis.com pc-research.herokuapp.com www.lakeland.co.uk www.bbc.co.uk www.dailymail.co.uk east.surreytriratna.org www.bbc.com www.nccgroup.trust"
    injectList: "www.dailymail.co.uk www.butlins.com",
    api: {
        port: process.env.API_PORT || 8000,
        name: 'NCC Tag DB',
        versionPrefix: '1',
        versionNumber: require('../package.json').version    }
};
// export
module.exports = config;
