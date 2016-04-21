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
    port: process.env.PORT || 8081,
    cacheLimit: 1024 * 1024 * 100, // 100MB cache limit, will flush entire cache if limit hit
    cacheTimeout: 60*60, // cache refreshes hourly
    log: {
        fatal : console.trace,
        error : console.trace,
        debug : console.log,
        warning: console.log
    },
    topCode: '<script>'+ fs.readFileSync('./config/topCode.js' ).toString() + '</script>',
    bottomCode: '<script>'+ fs.readFileSync('./config/bottomCode.js' ).toString() + '</script>',
    blockList: "www.googleadservices.com static.criteo.net www.dwin1.com www.sc.pages04.net 3466190.fls.doubleclick.net lakeland.122.2o7.net www.google-analytics.com bat.bing.com cdn-eu.brcdn.com googleads.g.doubleclick.net widget.criteo.com c1.rfihub.net lakeland-www.baynote.net www.google.com www.google.co.uk bat.r.msn.com 20569815p.rfihub.com rs.gwallet.com p-eu.brsrvr.com cm.g.doubleclick.net 20675065p.rfihub.com 20675099p.rfihub.com p.rfihub.com image2.pubmatic.com pixel.rubiconproject.com ib.adnxs.com dpm.demdex.net a.rfihub.com t4.liverail.com ckm-m.xp1.ru4.com scontent.lrcdn.net ps.eyeota.net adadvisor.net idsync.rlcdn.com sync.search.spotxchange.com e.nexac.com tapestry.tapad.com us-u.openx.net d.agkn.com d.xp1.ru4.com x.bidswitch.net ads.yahoo.com rtd.tubemogul.com aka.spotxcdn.com soma.smaato.net geo-um.btrll.com dsum.casalemedia.com ads.kiosked.com loadus.exelator.com cs.gssprt.jp m.xp1.ru4.com dis.eu.criteo.com www.pages04.net rtb-csync.smartadserver.com ad.360yield.com sync.1rx.io ap.lijit.com match.sharethrough.com eb2.3lift.com www.facebook.com bh.contextweb.com dis.criteo.com trc.taboola.com ums.adtech.de",
//    blockList: '',
    injectList: "www.johnlewis.com pc-research.herokuapp.com www.lakeland.co.uk www.bbc.co.uk www.dailymail.co.uk east.surreytriratna.org www.bbc.com"
};
// export
module.exports = config;
