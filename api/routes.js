/**
 * Created by paulcook on 13/07/2016.
 */
/**
 * Routes
 *
 * Routes dispatch requests to Controllers via Middleware
 */

// import controllers and middleware

var restify = require('restify'),
    CONFIG = require('config'),
    controllers = require ('./controllers' ),
    defaultConfig,
    fs = require ( 'fs' );


fs.readFile('DATA', 'utf8', function(err, contents) {
    console.log(contents);
});


module.exports = function registerRoutes(api) {
    // caching all the collections requires lots of steps so using spread ... operator

    // Test
    api.get('/ping', controllers.sendOk);
    api.post('/ping', controllers.pong);
    api.get('/config' , function ( req, res, next ) {
        res.send( 200,CONFIG);
        // this should reset the config
        delete require.cache[require.resolve('config')];
    } )
};




