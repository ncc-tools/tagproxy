/**
 * Created by paulcook on 21/04/16.
 */
// capture load start time
window.results=[ new Date() ];
window.labels=[ 'start' ];
window.disableTimestrap = true;
window.perfKeys = [ 'navigationStart','unloadEventStart','unloadEventEnd','redirectStart','redirectEnd','fetchStart','domainLookupStart','domainLookupEnd','connectStart','connectEnd','secureConnectionStart','requestStart','responseStart','responseEnd','domLoading','domInteractive','domContentLoadedEventStart','domContentLoadedEventEnd','domComplete','loadEventStart','loadEventEnd' ]
window.stylesheets = 0;

function forEach ( arr, fn ) {
    if ( arr.length ) {
        for ( var i = 0, len = arr.length; i < len; i++ ) {
            fn( arr[i] );
        }
    }
}


function checkPerformanceAPI (eventName) {
    return function () {
        eventName = eventName || '';
        var elapsed = new Date().getTime() - performance.timing.navigationStart,
            out = { event : eventName , elapsed: elapsed };

        forEach ( window.perfKeys, function ( key ) {
//                out += performance.timing[key];
            // and elapsed time
            if ( performance.timing[key] ) {
                out[key] = performance.timing[key] - performance.timing.navigationStart;
            }
        });
        console.log('checkPerformance',out);
    }
}
var head,body;
// records ticks up to window.loadComplete, used to work out when cpu is busy
function jsCheck ( target , increment ) {
    var timestamp = new Date().getTime(),
        elapsed = timestamp  - window.results[0].getTime(),
//                elapsed = timestamp  - performance.timing.navigationStart,
        second = Math.floor ( elapsed / 1000);

//    head = head || document.getElementsByTagName( 'head' );
//    body = body || document.getElementsByTagName( 'body' );
    // create an array for each second we are tracking
    window.jsChecks[ second ] = window.jsChecks[ second ] || [];

    // log only if it passes - 75% threshold
    // actually this is irrelevant, wht really matters is elapsed
    // also elapsed makes more sense in the context of executing the page rather than navigation starttime
    // todo: logging all the time now as true || specified
    if ( true || ( timestamp-target ) / increment < .25  ) {
        // records
        // extended data for debugging
        /*
        window.jsChecks[ second ].push( { target: target,
            now: timestamp,
            elapsed: elapsed,
            delta: ( timestamp - target) / increment ,
            head: head[0] ? head[0].innerHTML.length : null,
            body: body[0] ? body[0].innerHTML.length : null });
            */
        // just target
       window.jsChecks[ second ].push( {target: target, elapsed: elapsed } );

    } else {
        // should log where it has come back after waiting as this shows that the processor is available, maybe
        // .5 for this and 1 for the other? NOTE IS SET FOR TRUE ABOVE
    }
    // caries on until onload event fires, log 10s at least
    if ( elapsed < 10000 || !performance.timing.loadEventEnd  ) {
        setTimeout ( function () { jsCheck ( timestamp+increment , increment ) } , increment);
    }
}
window.jsChecks = {};

CHECK_FREQ = 50;
// start checking
jsCheck ( new Date().getTime() , CHECK_FREQ );
// bootstrap
window.addEventListener('load', function () {
    checkPerformanceAPI('Window Load')();
//    plotPerf();
    console.log('% available by sec' , freeSecs() );
    console.log('% available by quartile' , freeQuartiles() );
    console.log('bavIndex ( 0-10 )', bavIndex());
} );
// returns the average per quartile
function freeQuartiles( limit) {
    var //loadTime = performance.timing.loadEventStart-results[0].getTime(),
        sMax = Object.keys(jsChecks).pop(),
        loadTime = jsChecks[sMax][ jsChecks[sMax].length -1 ].elapsed,
        s = 0,
        quartiles = { first: 0,second: 0, third: 0, fourth:0 },
        qChecks = Math.round(loadTime/CHECK_FREQ/4),
        timestamp = new Date().getTime(),
        elapsed = timestamp  - window.results[0].getTime();
    // limit overides the auto value
    if ( limit ) {
        sMax = limit-1;
        loadTime = limit* 1000;
        qChecks = loadTime /CHECK_FREQ/4;
    }

//    console.log ( loadTime , elapsed );
    while ( s <= sMax ) {
        // if no responses for second then will not be an array set
        if (jsChecks[s] ) {
            for ( var i = 0; i < jsChecks[s].length; i++ ) {
                //                console.log(jsChecks[s][i]);
                elapsed = jsChecks[s][i].elapsed;
                if ( elapsed < loadTime * .25 ) {
                    quartiles.first++;
                } else if ( elapsed < loadTime * .5 ) {
                    quartiles.second++;
                } else if ( elapsed < loadTime * .75 ) {
                    quartiles.third++;
                } else                                      {
                    quartiles.fourth++;
                }
            }
        }
        s++;
    }
//    console.log( quartiles );
    for ( var q in ( { first:1,second:2,third:3,fourth:4})) {
        quartiles[q] = Math.round(quartiles[q] * 100 / qChecks);
    }
    return quartiles;
}
// ignores the last second, the first second can only have 19 pings in it
function freeSecs() {
    var qChecks = Math.round(1000/CHECK_FREQ),
        offset,
        out = {},
        s, sMax = Object.keys(jsChecks).pop();
    for ( s=0; s<= sMax; s++) {
        if ( s=== 0) {
            // one will be missing at the start
            offset = 0;
        } else if ( s === sMax ) {
            // last second is incomplete?
//            offset = Math.floor( ( 1000 - (performance.timing.loadEventStart-results[0].getTime() ) % 1000 ) / CHECK_FREQ );
            // work out how much of the last second we have
            offset = Math.floor( ( 1000 - ( jsChecks[s][ jsChecks[s].length ].elapsed ) % 1000 ) / CHECK_FREQ );
            // probably need to remove last entry as not accurate
//            offset = 0;
        } else {
            offset = 0;
        }
        if ( jsChecks[s] ) {
            out[s] = ( Math.round( jsChecks[s].length * 100 / (qChecks - offset) ));
        } else {
            // no array so no pings returned
            out[s] = 0;
        }
        // offset is only one first second
        offset=0;
    }
    return out;
}
// % free up until onload event
function bavIndex( limit ) {
    var //loadTime = performance.timing.loadEventStart-results[0].getTime(),
        //qChecks = loadTime /CHECK_FREQ-1, // -1 for first one
        pings = 0, s= 0,  sMax = Object.keys(jsChecks).pop(),
        extra = Math.floor(  ( jsChecks[sMax][ jsChecks[sMax].length -1 ].elapsed ) % 1000  / CHECK_FREQ );
        // have to assume last second is complete so add 1 ?
        qChecks = (sMax)*1000 /CHECK_FREQ + extra;
    // if you specify a limit then ignores the above
    if ( limit ) {
        sMax = limit-1;
        qChecks = (limit)*1000 /CHECK_FREQ;
        extra = 0;
    }
    for ( s=0; s<= sMax; s++) {
        if ( jsChecks[s] ) {
            pings += jsChecks[s].length;
        }
    }
    if (qChecks ) {
        return Math.round( pings * 100 / qChecks ) / 10;
    } else {
        // don't give a response
        return false;
    }
}