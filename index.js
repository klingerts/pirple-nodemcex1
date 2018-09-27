/* 
 * Primary file for the API
 * Original code typed by me (KS), but actually created by following 
 * Node Master Class course
 * 
*/
// Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var fs = require('fs');
var config = require('./config');

// Create a http server
var httpServer = http.createServer(function(req, res) {unifiedServer(req,res)});

// Create a https server
var httpsServerOptions = {
    key: fs.readFileSync('./https/key.pem'),
    cert: fs.readFileSync('./https/cert.pem'),
};
var httpsServer = https.createServer(httpsServerOptions, function(req, res) {unifiedServer(req,res)});

// Start http server
httpServer.listen(config.httpPort, function() {
    console.log('The HTTP server is listening on port ' + config.httpPort + ' in config.envName ' + config.envName);
});

// Start http server
httpsServer.listen(config.httpsPort, function() {
    console.log('The HTTPS server is listening on port ' + config.httpsPort + ' in config.envName ' + config.envName);
});

// All the server logic for both th http and https server
var unifiedServer = function (req, res) {
    // Get url and parse it, use query string module also
    var parsedUrl = url.parse(req.url, true);

    // Get the path 
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g,''); // remove slashes

    // Get the query string as an object
    var queryStringObject = parsedUrl.query;

    // Get HTTP method
    var method = req.method.toLowerCase();

    // Get the headers as an object
    var headers = req.headers;

    // Get the payload, if there is any
    var decoder = new StringDecoder('utf-8');
    var buffer = '';

    // data event only gets called if there is a payload
    req.on('data', function(data) {
        buffer += decoder.write(data);
    });

    // end event always get called
    req.on('end', function() {
        buffer += decoder.end();

        // Choose the handler this request should go to. If one is not found choose notFound hanlder
        var chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        //Construct the data object to send to the handler
        var data = {
            trimmedPath: trimmedPath,
            queryStringObject: queryStringObject,
            method: method,
            headers: headers,
            payload: buffer
        };

        chosenHandler(data, function(statusCode, payload) {
            // Use statuscode returned by handler, or use default 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            // Use payload returned, or use empty object
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert payload to string
            var payloadString = JSON.stringify(payload);

            // Return the response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the requests
            console.log('Response: ', statusCode, payloadString);

        });
    });
};

// Define handlers
var handlers = {};

handlers.notFound = function(data, callback) {
    callback(404);
};

handlers.ping = function (data, callback) {
    callback(200);
};

// Define a request router
var router = {
    'ping': handlers.ping
};