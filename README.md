# tagproxy
Logging reverse proxy for optimisation and logging tags

# proxying secure requests
http-mitm-proxy uses node-forge for proxying secure requests. Documentation can be found https://github.com/joeferner/node-http-mitm-proxy

After you first run tagproxy you will find options.sslCaDir + '/certs/ca.pem' which can be imported to your browser, phone, etc. On my mac ca.pem is in a hidden directory: 

`tagproxy/.http-mitm-proxy/certs/ca.pem`

To enable secure requests to be proxied you need to configure your clients to accept this certificate. It should be added as a root certificate and device specific instructions for adding a self signed root certificate can be found on google. I copied it from the hidden directory and then emailed it to myself to add on different environments. Adding in OSX is easy as you can double-click in finder to add to OSX keychain.

Note that if you are giving access to people to a shared proxy ( for example the raspberry pi ) you will need to send them the cert to use.