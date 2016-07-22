var CONFIG = require('config'),
    restify = require('restify');

/**
 * Expose authRequired
 */
exports = module.exports =  { versioning: versioning };

/**
 * Stub middleware for API versionning
 */
function versioning(req, res, next) {
    // checks correct API version
    var currentVersionPrefix = '/' + (CONFIG.api.urlVersion || '1');
    if (req.url.slice(1, currentVersionPrefix.length) <= ( CONFIG.api.urlVersion || 1 ) ) {
        // we allow old version numbers through
        if ( req.url.slice(0, currentVersionPrefix.length) === currentVersionPrefix ) {
            req.url = req.url.substring( currentVersionPrefix.length );
            if ( req.url === '' ) {
                req.url = '/';
            }
        }
        return next();
    } else {
        next(new restify.ResourceNotFoundError(req.url + '. valid api version number required, current version is ' + currentVersionPrefix));
    }
}