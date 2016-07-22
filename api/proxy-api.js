// TBD , just copied from tag proxy
var CONFIG = require('config'),
    middleware = require('./middleware.js'),
    log = CONFIG.api.log,
    api = {},
    _started = false;
// call back curry
function callback (msg,next,ignoreError) {
    return function(err) {
        if (msg) log.debug(msg);
        if ( typeof err === 'function' ) {
            next = err;
            err = false;
        }
        if (!ignoreError && err) throw new Error('Error: ' + ( (typeof err === 'object') ? JSON.stringify(err) : err) );
        if (next) return next();
    };
}

function bootstrap(next) {
    /**
     * Dependencies
     */
    var restify = require('restify'),
        routes = require('./routes');

    /**
     * Server set up
     */
    api = restify.createServer({
        name: CONFIG.api.name,
        version: CONFIG.api.versionNumber
    });

    api.on('uncaughtException', function (req, res, err, cb) {
        log('uncaught error',err,cb);
        if (typeof cb === 'function') cb();
    });
    /**
     * Middlewares
     */
    api.use(restify.bodyParser({ mapParams: false }));
    api.use(restify.queryParser({ mapParams: false }));

    // deal with the version in the URI
    // before the request is actually dispatched
    api.pre(middleware.versioning);


    // register our routes
    routes(api);
    api.listen(CONFIG.api.port,
        function (err) {
            if (err) {
                console.log ('error starting on port ' + CONFIG.api.port, err)
            } else {
                console.log(CONFIG.name + ' api server started on port ' + CONFIG.api.port);
                if ( typeof next === 'function' ) {
                    next();
                }
            }
        } )
}
// starts server if not already started
function startAPIServer (next) {
    if ( !_started ) {
            _started = true;
            bootstrap(next);
    } else {
        if ( typeof next === 'function') {
            next();
        }
    }
}

if  ( module.parent ) {
    console.log( 'Starting in module mode, use api-server.start to start server')
    exports.start =startAPIServer;
} else {
    exports.start= callback( 'start API stubbed' , false, false );
    exports.stop = callback( 'stop API stubbed'  , false, false );
    startAPIServer();
}






