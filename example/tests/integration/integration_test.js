require.paths.unshift('../../../lib');

var kiwi = require('kiwi'),
  express = kiwi.require('express'),
  http = require('http'), 
  urlParser = require('url'),
  sys = require('sys'),
  oauth = require('oauth'),
  querystring = require('querystring'),
  crypto = require('oauth/crypto/sha1');

// Require the express libary
require('express');
require('express/plugins');

// Set up for integration test
var site = "http://localhost:3000";
var key = "key";
var secret = "secret";
var callback = "http://localhost:9000/callback";

// use(oauth.OAuth, {request_token_url:'/oauth/request_token', 
//                         authorize_url:'/oauth/authorize',
//                         access_token_url:'/oauth/access_token',
//                         authenticate_provider:authenticateProvider,
//                         authorize_provider:authorizeProvider,
//                         oauth_provider:new oauth_example.OAuthDataProvider(db)});  

var generateSignature = function(method, protocol, url, path, parameters, token, secret) {
  // Create secret key for encryption
  var key = secret + "&" + (token != null ? token : '');
  // Create array of names and sort it
  var values = [];
  for(var name in parameters) { if(name != 'oauth_signature') values.push(name); };
  values = values.sort();
  // Let's build the actual string for the signature
  var concatString = method + "&" + querystring.escape(protocol + "://" + url + path) + "&" + querystring.escape(values.map(function(value) {
    return value + "=" + parameters[value];
  }, '').join("&"));
  // Calculated signature
  return querystring.escape(crypto.SHA1.b64_hmac_sha1(key, concatString) + "=");    
}

var fetchGetUrl = function(method, urlString, headers, callback) {
  var url = urlParser.parse(urlString);  
  var client = http.createClient(url.port, url.hostname);
  var request = client.request(method, url.pathname, headers);
  
  request.addListener('response', function (response) {
    sys.puts("============================= 1");
    var body = '';
    response.setBodyEncoding("utf8");
    response.addListener("data", function (chunk) { body = body + chunk; });
    response.addListener("end", function() { callback(body); });
  });
  
  request.close();          
};

var post = function(urlString, params, headers, callback) {
  // Write the request data
  var paramValues = [];
  for(var name in params) {
    paramValues.push(name + '=' + params[name]);
  }

  // Set up the data
  var url = urlParser.parse(urlString);  
  var client = http.createClient(url.port, url.hostname);
  var request = client.request('POST', url.pathname + "?" + paramValues.join("&"), headers);

  // Generate request data
  // sys.puts(paramValues.join("&"));
  // request.write(querystring.escape(paramValues.join("&")), 'ascii');  
  
  request.addListener('response', function (response) {
    var body = '';
    response.setBodyEncoding("utf8");
    response.addListener("data", function (chunk) { body = body + chunk; });
    response.addListener("end", function() { callback(body); });
  });
  
  request.close();            
};

// Fetch the request token
var url = urlParser.parse("http://localhost:3000/oauth/request_token");
// Get the reauest token params
var requestTokenParams = { oauth_nonce: 'GMvuq48pklaIY1alfYpBOe5aapcKjDfyTRnAtLzjJP4'
  , oauth_callback: 'http%3A%2F%2Flocalhost%3A9000%2Fcallback'
  , oauth_signature_method: 'HMAC-SHA1'
  , oauth_timestamp: '1269517066'
  , oauth_consumer_key: 'key'
  , oauth_version: '1.0'
};

sys.puts("----------------------------------------");
sys.puts('POST');
sys.puts('http');
sys.puts('localhost:3000');
sys.puts('/oauth/request_token');
sys.puts(sys.inspect(requestTokenParams));
sys.puts(null);
sys.puts(secret);
sys.puts("----------------------------------------");

// For the Request Token call
var requestSignature = generateSignature('POST', 'http', 'localhost:3000', '/oauth/request_token', requestTokenParams, undefined, secret);
var authHeader = 'OAuth oauth_nonce="' + requestTokenParams['oauth_nonce'] + 
      '", oauth_callback="' + requestTokenParams['oauth_callback'] + '", oauth_signature_method="HMAC-SHA1", oauth_timestamp="' + requestTokenParams['oauth_timestamp'] + '", oauth_consumer_key="' + key + '", oauth_signature="' + requestSignature + '", oauth_version="1.0"';

// Create the http request token
fetchGetUrl('POST', "http://localhost:3000/oauth/request_token", {"host":url.host, "authorization": authHeader}, function(body) {
  // Unroll the parameters
  var results = {};
  var params = body.split(/\&/);
  params.forEach(function(param) {
    var parts = param.split(/\=/);
    results[parts[0]] = parts[1]
  })
  // Let's get the page
  var authorizePage = "http://localhost:3000/oauth/authorize?oauth_token=" + results['oauth_token'];
  // Post the authorization
  post(authorizePage, {'username':'christkv', 'password':'christkv', 'oauth_token':results['oauth_token']}, {}, function(body) {
    sys.puts(sys.inspect(body));
  });

  sys.puts(sys.inspect(results));
});

// Create the http request token method and execute
// var request = client.request("POST", url.pathname, {"host":url.host, "authorization": authHeader});
// request.addListener("response", function(response) {
//   var body = '';
//   response.setBodyEncoding("utf8");
//   response.addListener("data", function(chunk) { body = body + chunk; });
//   response.addListener("end", function() {
//     // Unroll the parameters
//     var results = {};
//     var params = body.split(/\&/);
//     params.forEach(function(param) {
//       var parts = param.split(/\=/);
//       results[parts[0]] = parts[1]
//     })
//     
//     // Let's get the page
//     var authorizePage = "http://localhost:3000/oauth/authorize?oauth_token=" + results['oauth_token'];
//     // Fetch the url
//     
//     
//     sys.puts(sys.inspect(results));
//   })  
// });

// request.close();

var intervalId = setInterval(function() {
  // if(totalParsed == users.length) { 
  //   clearInterval(intervalId);
  //   db.close();
  // }
}, 100);