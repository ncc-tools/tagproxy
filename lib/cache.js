/**
 * Created by paulcook on 19/04/16.
 */
/**
 * Created by paulcook on 19/12/2015.
 */
var NodeCache = require( "node-cache"),
    CONFIG = require( "config"),
    log = CONFIG.log,
    myCache = new NodeCache( {
        stdTTL: CONFIG.cacheTimeout, // 1 hour cache timeout default
        useClones: false,         // get references not copies of cache data
        checkPeriod: 0
    }); // 100 MB
// removes non text characters from strings so they can be used as array keys
function arraySafe ( inKey) {
    if ( typeof inKey === 'string' ) {
        return inKey.replace( /[^a-z0-9\s\-]/gi, ' ' );
    } else {
        return '';
    }
}

function set ( key, value ) {
    var stats = myCache.getStats();
    if ( stats.vsize + stats.ksize > CONFIG.cacheLimit ) {
        myCache.flushAll();
        log.warning ('Flushing cash size' ,stats.vsize + stats.ksize ,'v', CONFIG.api.cacheLimit );
    }
    myCache.set ( arraySafe(key) , value);
    return stats;
}

function get ( key ) {
    return myCache.get ( arraySafe(key) );
}

// can be called as middleware
// clears the cache for all users
// @returns number of cache keys remaining or calls next middleware
function flush ( req,res,next ) {
    myCache.flushAll();
    if ( typeof next === 'function' ) {
        return next();
    } else {
        return true;
    }
}
module.exports = { get : get,
    set: set,
    flush: flush,
    getStats: myCache.getStats };