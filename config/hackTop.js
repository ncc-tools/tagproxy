// recalc jankindex after 10s
RUM_DELAY = 10000;
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

function loadTime(el) {
    var requests = window.performance.getEntriesByType("resource"),
        endTime,
        i = 0;
    while ( i < requests.length && requests[i].name !== el.src ) {
        i += 1;
    }
    if ( requests[i] && requests[i].name === el.src ) {
        return requests[i].responseEnd;
    }
}
//        window.addEventListener('load', function () { console.log ( 'FPS' , Math.round ( RUM_FPS.total / (new Date().getTime() - RUM_FPS.startTime ) * 1000 ) ) } );
// works out how many pixels of an element in view, only looks vertically and not horizontally
function inView(el) {
    var rect = el.getBoundingClientRect(),
        viewHeight = window.innerHeight,
        offset = 0;
    // how is the viewport overlapping the object
    if ( rect.top < 0 ) {
        offset += rect.top;
    } else if ( rect.bottom > viewHeight ) {
        offset += viewHeight - rect.bottom
    }
    //max 100%
    if ( offset + rect.height < 0 ) {
        offset = rect.height*-1;
    }
    // return number of pixels visible
    return (rect.height + offset) * rect.width ;
}
// gets elements that could be visible
function getElements() {
    var els = document.getElementsByTagName('*'),
        out = [];
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var style = window.getComputedStyle(el);
        // check for Images
        if (el.tagName === 'IMG' || el.tagName === 'IFRAME') {
            out.push(el);
        } else if (style['background-image']  && (style['background-image']+'').substring( 0,3 ) === 'url' ) {
            //console.log('background-image',(style['background-image']+'').substring( 5 ,style['background-image'].length - 2 ) );
            // add a dummy src to el.
            el.src = ( style['background-image']+'').substring( 5, style['background-image'].length - 2 );
            out.push(el);
        }
    }
    return out;
}
// gets navTimes for visible elements, includes sync scripts if blockers set
function getNavTimes( blockers ) {
    var requests,
        out = {},
        i =0;
    if ( typeof window.performance.getEntriesByType === 'function' ) {
        requests = window.performance.getEntriesByType("resource");
        if ( requests.length === 150 ) {
            console.log ( '150 timed resources found - limit hit?');
        }
        while ( i < requests.length ) {
            if (requests[i].initiatorType === 'img' || requests[i].initiatorType === 'iframe' || requests[i].initiatorType === 'css' || // images can appear as
                ( blockers && requests[i].initiatorType === 'link') ||
                ( blockers && requests[i].initiatorType === 'script')) {
                out[requests[i].name] = requests[i];
            }
//           console.log('name', requests[i].name , !!out[requests[i].name] , requests[i].initiatorType, requests[i] );
            i += 1;
        }
    } else {
        // look for safari work around
        out = window.RESOURCES;
    }
    return out;
}
function isAsync ( src ) {
    var els = document.getElementsByTagName('script'),
        async;
    for (var i = 0; i < els.length; i++) {
        if ( els[i].src === src ) {
            async = els[i].async || els[i].defer;
        }
    }
    return !!async;
}
// this is just a helper function for debugging
function getNavTime ( src_like ) {
    var out = [], i=0;
    requests = window.performance.getEntriesByType("resource");
    while (i < requests.length) {
        if (requests[i].name.indexOf(src_like) > -1) {
            out.push ( requests[i]);
        }
        i += 1;
    }
    return out;
}


function stripHash ( in_src ) {
    var test = new RegExp( /([^\#]*)/ ).exec ( in_src );
    return test ? test[0] : '';
}

// assumes blocking scripts and css are all in head and content is in body
// should maybe check the load order here? could have last
function getRenderStart () {
    var renderStart = window.performance.timing.responseStart - window.performance.timing.navigationStart,
        requestEnd,
        headElements = document.getElementsByTagName('head')[0].children,
        requests = getNavTimes( true ),
        lastCssIndex = 0,el;
    // 1st past just find position of last css, ignore blocking scripts after css as scripts could be appended with async=false and skew the renderstart (labJS does this)
    for (var i = 0; i < headElements.length; i++) {
        el = headElements[i];
        if ( el.tagName === 'LINK' && el.rel === 'stylesheet' && el.href ) {
            lastCssIndex = i;
            //           console.log ( 'lastCss', lastCssIndex, el.href );
        }
    }
    for (i = 0;i <  lastCssIndex; i++) {
        el = headElements[i];
        if (requests[stripHash( el.src || el.href )] && ( el.tagName === 'SCRIPT' && el.src && !isAsync( el.src ) || el.tagName === 'LINK' && el.rel === 'stylesheet' && el.href)) {
            requestEnd = requests[stripHash( el.src || el.href )].responseEnd;
            if (requestEnd && ( renderStart === undefined || requestEnd > renderStart )) {
                renderStart = requestEnd;
//                console.log ( 'renderStart', el.src || el.href, renderStart, isAsync( el.src ) , el.tagName, el.tagName === 'SCRIPT' && el.src && !isAsync( el.src ) );
            } else {
//                console.log ( 'ignored' , el.href , requestEnd);
            }
        }
    }
    return renderStart;
}
// should wait for 10 seconds after onLoad to allow for stuff executing slowly
// page blocked for 1s = 1000 jank index
function jankIndex() {
    // ignore first and last second
    // each second = 60-frames
    function _sorter (a,b) {
        function _sortVal ( val ) {
            if ( typeof val === 'string') {
                // we only have 100 values and string cols are longer
                if (val.length>3) {
                    // put totals at end
                    return 9999;
                } else { // return number
                    return val*1;
                }
            } else {
                return val;
            }
        }
        return _sortVal(a) - _sortVal(b);
    }
    var index = 0,
        keys,
        RUM_FPS = window.RUM_FPS || []; // incase FPS not captured by tag
    keys = Object.keys(RUM_FPS).sort(_sorter);
    // last two will be starttime and total and then we ignore the last second as possibly incomplete
    for ( i=keys[0]*1+1 ; i < keys[keys.length-4] ;i++ ) {
        // no frames = 0
        RUM_FPS[i] = RUM_FPS[i] || 0;
        if (  RUM_FPS[i] < 60 ) {
            // so 0 frames in 1 second = jankIndex of 1000
            index += ( 60 - RUM_FPS[i] ) * 1000/60;
        }
    }
    return index;
}
// we will need to calc render start as nothing shows before that regardless of when it is loaded, then we assume elements are added as they are loaded
// then once onload is done add in the screen real estate that is not images? IE display size - cum viewable image pixels
function visualIndex() {
    // the resources list does not have the hash on it so need to strip or will not match

    var els = getElements(), resources = getNavTimes(),
        i, cumPixels = 0, pixels, pixOffset, delta = {},
        renderStart = getRenderStart() , visIndex = 0, loadTimes, timeIndex = 0, complete=0,  visualComplete = renderStart,
        screenSize = window.innerHeight * window.innerWidth, log = new Image(),
        navStart = window.performance.timing.navigationStart , src,
        janky=jankIndex();
    for (i = 0; i < els.length; i++) {
        pixels = inView ( els [ i ] );
        src = stripHash ( els[i].src );
//        console.log ( src , pixels );
        if ( pixels ) {
            cumPixels += pixels;
//            console.log ( 'cumPixels' , cumPixels , src, resources[ src ] , els[i] );
            if ( resources [ src ]) {
                delta[ resources [ src ].responseEnd ] = pixels; // pixels added
                if (resources [ src ].responseEnd > visualComplete) {
                    visualComplete =  Math.ceil(resources[ src ].responseEnd);
//                    console.log ( 'visComplete' , visualComplete , src , resources[ src ] );
                } else {
//                    console.log('ignored',src, resources [ src ].responseEnd, visualComplete)
                }
            } else {
                console.log('CANNOT FIND RESOURCE TIMING' , src , 'in', resources);
            }
        }
    }
    pixOffset = screenSize - cumPixels;
    // if there is a lot of overlapping then could have a negative offset which will make no sense
    if ( pixOffset < 0) {
        pixOffset = 0;
        screenSize = cumPixels;
    }
    loadTimes = Object.keys ( delta ).sort();
    for ( var now = 0; now < visualComplete; now++ ) {
        if ( now < renderStart ) {
            // incremenet to render start
            visIndex++;
        } else {
            // initialise
            if ( complete === 0 && pixOffset ) {
                complete = pixOffset / screenSize;
            }
            // find all the relevant things that have loaded
            while ( loadTimes[ timeIndex ] < now && loadTimes[ timeIndex ] ) { // second condition is to prevent an infinite loop
                complete += delta [ loadTimes[ timeIndex ] ] / screenSize;
//                        console.log ( complete , loadTimes[ timeIndex ] , delta [ loadTimes[ timeIndex ] ]);
                timeIndex++;
            }
        }
        visIndex += 1 - complete;
    }
    // log data using an image so can be picked up and compared to WPT
//            log.src =  'blank.png?renderStart='+ Math.round(renderStart) + 'visualComplete=' + Math.round(visualComplete)
//                    + 'visualIndex=' + Math.round(visIndex) + '&jankIndex='+janky;
    log.width = 1;
    log.height = 1;
    // add in JankIndex, should be recalculated at unload
    window.RUM_BABA = {  renderStart: Math.round(renderStart), visualComplete: Math.round(visualComplete), speedIndex: Math.round(visIndex),
        jankIndex: janky, renderIndex: Math.round(visIndex+ janky ),
        domLoadStart : Math.round(performance.timing.domContentLoadedEventStart - navStart),
        loadEventStart : Math.round(performance.timing.loadEventStart - navStart) };

    return window.RUM_BABA;
}

// wait for 10s after load for jankyness resolution
window.addEventListener('load', function () {
    // calculate visual index before they scroll
    // COULD ATTACH TO UI event if the click / scroll before unload
    visualIndex();
    window.setTimeout( function () {
        RUM_BABA.jankIndex = jankIndex();
        RUM_BABA.renderIndex = RUM_BABA.jankIndex + RUM_BABA.speedIndex;
        console.log( 'RUM_BABA' , window.RUM_BABA );
    } , RUM_DELAY);
});
