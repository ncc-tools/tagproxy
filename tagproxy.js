/**
 * Created by paulcook on 19/04/16.
 */
var Proxy = require('http-mitm-proxy' ),
    cache = require('./lib/cache' ),
    CONFIG = require('config');
var proxy = Proxy();

proxy.onError(function(ctx, err, errorKind) {
    // ctx may be null
    var url = (ctx && ctx.clientToProxyRequest) ? ctx.clientToProxyRequest.url : '';
    console.error(errorKind + ' on ' + url + ':', err);
});

proxy.use(Proxy.gunzip);

proxy.onRequest(function(ctx, callback) {
    if (  (CONFIG.blockList||'').indexOf ( ctx.clientToProxyRequest.headers.host ) > -1 ) {
        console.log( 'BLOCK: http://' + ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url );
        ctx.proxyToClientResponse.end('');
    } else {
        var chunks = [], cached = cache.get ( ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url);
        console.log( 'REQUEST: http://' + ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url );
        if ( cached ) {
            // not chunked
            // todo: put a header to indicate its mitm cached
            // we're not chunking we're just returning it all in one go
            ctx.proxyToClientResponse._header = cached.header.replace('transfer-encoding: chunked', 'content-length: ' + cached.body.length);
            // might need to reset the cache here so it doesn't randomly timeout
            // no callback as we don't want to make a request out
            console.log ( 'cache hit' , cached.body.length);
            // add a delay to all cached responses
            setTimeout( function () {
                    ctx.proxyToClientResponse.end( cached.body );
                }
                , 1);// disabled by setting to 1, this is in ms
        } else {
            //  ctx.proxyToClientResponse.end("Blocked");
            // no callback() so proxy request is not sent to the server
            ctx.onResponseData( function ( ctx, chunk, callback ) {
                chunks.push( chunk );
                //      ctx.proxyToClientResponse.write("CHUNKY");
                return callback( null, null ); // don't write chunks to client response
            } );
            ctx.onResponseEnd( function ( ctx, callback ) {
                var body = Buffer.concat( chunks );
                // add a header to show tagProxy is running
//                ctx.proxyToClientResponse._header.replace('\n\n', 'x-tagproxy: ' + new Date() + '\n\n' + ctx.proxyToClientResponse._header);
                // don't cache not modified as we need a clear cache
                if ( ctx.serverToProxyResponse.statusCode >= 200 && ctx.serverToProxyResponse.statusCode < 304 ) {
                    // modify the response to inject my code into the head
                    if(ctx.serverToProxyResponse.headers['content-type'] && ctx.serverToProxyResponse.headers['content-type'].indexOf('text/html') === 0) {
                        if ( (CONFIG.injectList || '') .indexOf( ctx.clientToProxyRequest.headers.host ) > -1 ) {
                            if ( CONFIG.topCode ) {
                                body = body.toString().replace( '<head>', '<head>' + CONFIG.topCode );
                            }
                            if ( CONFIG.bottomCode ) {
                                body = body.toString().replace( '</body>', CONFIG.bottomCode + '</body>' );
                            }
                        }
                    }
                    console.log( 'cache set', ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url, body.length, cache.set( ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url,
                        { header : ctx.proxyToClientResponse._header,
                            body : body } ) );
                    //       ctx.proxyToClientResponse.write("MITM");
                }
                ctx.proxyToClientResponse.write( body );

                return callback();
            } );
            // make proxy request
            callback();
        }
    }/*
    else {
        console.log ( 'passthrough', ctx.clientToProxyRequest.headers.host + ctx.clientToProxyRequest.url);
        // make proxy request
        callback();
    }*/
});



proxy.listen({ port: CONFIG.port });
console.log('listening on ' + CONFIG.port);
