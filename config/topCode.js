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
if ( !window.RUM_FPS ) {
    (function keyFramesPerSecond() {
        window.RUM_FPS = window.RUM_FPS || {startTime: new Date().getTime(), total: 0};
        var sec = Math.floor(( new Date().getTime() - RUM_FPS.startTime ) / 1000);
        if (RUM_FPS[sec]) {
            RUM_FPS[sec]++;
        } else {
            RUM_FPS[sec] = 1;
        }
        RUM_FPS.total++;
        // should we stop at some point, is there an overhead doing this?
        window.requestAnimationFrame(keyFramesPerSecond);
    })();
}

/******************************************************************************
 Copyright (c) 2014, Google Inc.
 All rights reserved.

 Redistribution and use in source and binary forms, with or without
 modification, are permitted provided that the following conditions are met:

 * Redistributions of source code must retain the above copyright notice,
 this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright notice,
 this list of conditions and the following disclaimer in the documentation
 and/or other materials provided with the distribution.
 * Neither the name of the <ORGANIZATION> nor the names of its contributors
 may be used to endorse or promote products derived from this software
 without specific prior written permission.

 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
 FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
 DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
 SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
 CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
 OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 ******************************************************************************/

/******************************************************************************
 *******************************************************************************
 Calculates the Speed Index for a page by:
 - Collecting a list of visible rectangles for elements that loaded
 external resources (images, background images, fonts)
 - Gets the time when the external resource for those elements loaded
 through Resource Timing
 - Calculates the likely time that the background painted
 - Runs the various paint rectangles through the SpeedIndex calculation:
 https://sites.google.com/a/webpagetest.org/docs/using-webpagetest/metrics/speed-index

 TODO:
 - Improve the start render estimate
 - Handle overlapping rects (though maybe counting the area as multiple paints
 will work out well)
 - Detect elements with Custom fonts and the time that the respective font
 loaded
 - Better error handling for browsers that don't support resource timing
 *******************************************************************************
 ******************************************************************************/

var RUMSpeedIndex = function(win) {
//    win = win || window;
    win = window;;
    var doc = win.document;

    /****************************************************************************
     Support Routines
     ****************************************************************************/
    // Get the rect for the visible portion of the provided DOM element
    var GetElementViewportRect = function(el) {
        var intersect = false;
        if (el.getBoundingClientRect) {
            var elRect = el.getBoundingClientRect();
            intersect = {'top': Math.max(elRect.top, 0),
                'left': Math.max(elRect.left, 0),
                'bottom': Math.min(elRect.bottom, (win.innerHeight || doc.documentElement.clientHeight)),
                'right': Math.min(elRect.right, (win.innerWidth || doc.documentElement.clientWidth))};
            if (intersect.bottom <= intersect.top ||
                intersect.right <= intersect.left) {
                intersect = false;
            } else {
                intersect.area = (intersect.bottom - intersect.top) * (intersect.right - intersect.left);
            }
        }
        return intersect;
    };

    // Check a given element to see if it is visible
    var CheckElement = function(el, url) {
        if (url) {
            var rect = GetElementViewportRect(el);
            if (rect) {
                rects.push({'url': url,
                    'area': rect.area,
                    'rect': rect});
            }
        }
    };

    // Get the visible rectangles for elements that we care about
    var GetRects = function() {
        // Walk all of the elements in the DOM (try to only do this once)
        var elements = doc.getElementsByTagName('*');
        var re = /url\((http.*)\)/ig;
        for (var i = 0; i < elements.length; i++) {
            var el = elements[i];
            var style = win.getComputedStyle(el);

            // check for Images
            if (el.tagName == 'IMG') {
                CheckElement(el, el.src);
            }
            // Check for background images
            if (style['background-image']) {
                re.lastIndex = 0;
                var matches = re.exec(style['background-image']);
                if (matches && matches.length > 1)
                    CheckElement(el, matches[1]);
            }
            // recursively walk any iFrames
            // this blows up on guardian for starters
            // should it not be CheckElement or just the iframe itself
            /*
             if (el.tagName == 'IFRAME') {
             try {
             var rect = GetElementViewportRect(el);
             if (rect) {
             var tm = RUMSpeedIndex(el.contentWindow);
             if (tm) {
             rects.push({'tm': tm,
             'area': rect.area,
             'rect': rect});
             }
             }
             } catch(e) {
             }
             }
             */
        }
    };

    // Get the time at which each external resource loaded
    var GetRectTimings = function() {
        var timings = {};
        var requests = win.performance.getEntriesByType("resource");
        for (var i = 0; i < requests.length; i++)
            timings[requests[i].name] = requests[i].responseEnd;
        for (var j = 0; j < rects.length; j++) {
            if (!('tm' in rects[j]))
                rects[j].tm = timings[rects[j].url] !== undefined ? timings[rects[j].url] : 0;
        }
    };
    // assumes blocking scripts and css are all in head and content is in body
    // should maybe check the load order here? could have last
    function getRenderStart () {
        renderStart = window.performance.timing.responseStart - window.performance.timing.navigationStart
        var headURLs = {};
        var headElements = document.getElementsByTagName('head')[0].children;
        for (var i = 0; i < headElements.length; i++) {
            var el = headElements[i];
            if (el.tagName == 'SCRIPT' && el.src && !el.async) {
                headURLs[el.src] = true;
            } else if (el.tagName == 'LINK' && el.rel == 'stylesheet' && el.href) {
                headURLs[el.href] = true;
            }
        }
        var requests = window.performance.getEntriesByType("resource");
        var doneCritical = false;
        for (var j = 0; j < requests.length; j++) {
//            console.log( doneCritical, headURLs[requests[j].name],requests[j].initiatorType  , requests[j].responseEnd);
            if (!doneCritical &&
                headURLs[requests[j].name] &&
                (requests[j].initiatorType == 'script' || requests[j].initiatorType == 'link')) {
                var requestEnd = requests[j].responseEnd;
                if (renderStart === undefined || requestEnd > renderStart)
                    renderStart = requestEnd;
            } else {
                // disabled, this assumes that assets are loaded in order they are in the page which is not the case
                //doneCritical = true;
            }
        }
        return renderStart;
    }

    // Get the first paint time.
    var GetFirstPaint = function() {
        // If the browser supports a first paint event, just use what the browser reports
        if ('msFirstPaint' in win.performance.timing)
            firstPaint = win.performance.timing.msFirstPaint - navStart;
        if ('chrome' in win && 'loadTimes' in win.chrome) {
            var chromeTimes = win.chrome.loadTimes();
            if ('firstPaintTime' in chromeTimes && chromeTimes.firstPaintTime > 0) {
                var startTime = chromeTimes.startLoadTime;
                if ('requestTime' in chromeTimes)
                    startTime = chromeTimes.requestTime;
                if (chromeTimes.firstPaintTime >= startTime)
                    firstPaint = (chromeTimes.firstPaintTime - startTime) * 1000.0;
            }
        }
        // For browsers that don't support first-paint or where we get insane values,
        // use the time of the last non-async script or css from the head.
        if (firstPaint === undefined || firstPaint < 0 || firstPaint > 120000) {
            firstPaint = getRenderStart();
        }
        firstPaint = Math.max(firstPaint, 0);
    };

    // Sort and group all of the paint rects by time and use them to
    // calculate the visual progress
    var CalculateVisualProgress = function() {
        var paints = {'0':0};
        var total = 0;
        for (var i = 0; i < rects.length; i++) {
            var tm = firstPaint;
            if ('tm' in rects[i] && rects[i].tm > firstPaint)
                tm = rects[i].tm;
            if (paints[tm] === undefined)
                paints[tm] = 0;
            paints[tm] += rects[i].area;
            total += rects[i].area;
        }
        // Add a paint area for the page background (count 10% of the pixels not
        // covered by existing paint rects.
        var pixels = Math.max(doc.documentElement.clientWidth, win.innerWidth || 0) *
            Math.max(doc.documentElement.clientHeight, win.innerHeight || 0);
        if (pixels > 0 ) {
            pixels = Math.max(pixels - total, 0) * pageBackgroundWeight;
            if (paints[firstPaint] === undefined)
                paints[firstPaint] = 0;
            paints[firstPaint] += pixels;
            total += pixels;
        }
        // Calculate the visual progress
        if (total) {
            for (var time in paints) {
                if (paints.hasOwnProperty(time)) {
                    progress.push({'tm': time, 'area': paints[time]});
                }
            }
            progress.sort(function(a,b){return a.tm - b.tm;});
            var accumulated = 0;
            for (var j = 0; j < progress.length; j++) {
                accumulated += progress[j].area;
                progress[j].progress = accumulated / total;
                visualComplete = progress[j].tm;
            }
        }
    };

    // Given the visual progress information, Calculate the speed index.
    var CalculateSpeedIndex = function() {
        if (progress.length) {
            SpeedIndex = 0;
            var lastTime = 0;
            var lastProgress = 0;
            for (var i = 0; i < progress.length; i++) {
                var elapsed = progress[i].tm - lastTime;
                if (elapsed > 0 && lastProgress < 1)
                    SpeedIndex += (1 - lastProgress) * elapsed;
                lastTime = progress[i].tm;
                lastProgress = progress[i].progress;
            }
        } else {
            SpeedIndex = firstPaint;
        }
    };

    /****************************************************************************
     Main flow
     ****************************************************************************/
    var rects = [],
        progress = [],
        firstPaint,
        renderStart,
        SpeedIndex,
        pageBackgroundWeight = 0.1,
        visualComplete = 0;
    try {
        var navStart = win.performance.timing.navigationStart,
            out;
        GetRects();
        GetRectTimings();
        getRenderStart();
        GetFirstPaint();
        CalculateVisualProgress();
        CalculateSpeedIndex();
    } catch(e) {
    }
    var dbg = '';
    /*     dbg += "Paint Rects\n";
     for (var i = 0; i < rects.length; i++)
     dbg += '(' + rects[i].area + ') ' + rects[i].tm + ' - ' + rects[i].url + "\n";
     dbg += "Visual Progress\n";
     for (var i = 0; i < progress.length; i++)
     dbg += '(' + progress[i].area + ') ' + progress[i].tm + ' - ' + progress[i].progress + "\n";
     dbg += 'First Paint: ' + firstPaint + "\n";*/
    out = { firstPaint : Math.round(firstPaint),
        renderStart: Math.round(renderStart),
        visualComplete: Math.round(visualComplete),
        speedIndex : Math.round(SpeedIndex),
        domLoadStart : Math.round(win.performance.timing.domContentLoadedEventStart - navStart),
        loadEventStart : Math.round(win.performance.timing.loadEventStart - navStart)};
    if ( window.RUM_FPS ) { // add in FPS
        out.fps = Math.round ( RUM_FPS.total / (new Date().getTime() - RUM_FPS.startTime  ) * 1000);
        dbg += 'Frames Per Second: ' +  out.fps + "\n";
    }
    dbg += 'Visual Index: ' + out.speedIndex + "\n";
    dbg += 'Render Start: ' + out.renderStart + "\n";
    dbg += 'Visual Complete: ' + out.visualComplete + "\n";
    dbg += 'DOM Loaded: ' + out.domLoadStart + "\n";
    dbg += 'On Load: ' +  out.loadEventStart + "\n";
    console.log(dbg, RUM_FPS);

    return out;
};
if ( !window.performance.timing || !window.performance.timing.loadEventStart ) {
    window.addEventListener('load', RUMSpeedIndex);
} else {
    // we are too late for onload so fire after nominal 10 seconds
    console.log ( 'Onload fired, waiting 5s');
    window.setTimeout ( RUMSpeedIndex , 5000);
}