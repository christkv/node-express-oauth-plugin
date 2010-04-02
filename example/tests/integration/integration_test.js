require.paths.unshift('../../../lib');

var kiwi = require('kiwi'),
  express = kiwi.require('express'),
  http = require('http'), 
  urlParser = require('url'),
  sys = require('sys'),
  oauth = require('oauth'),
  querystring = require('querystring'),
  crypto = require('oauth/crypto/sha1'), 
  test = require("mjsunit");

// Require the express libary
require('express');
require('express/plugins');

// Contains all the results
var testResults = [];

function test_correct_no_callback() {
  // Set up for integration test
  var site = "http://localhost:3000";
  var key = "key";
  var secret = "secret";
  var callback = "oob";

  // Fetch the request token
  var url = urlParser.parse("http://localhost:3000/oauth/request_token");
  // Get the reauest token params
  var requestTokenParams = { oauth_nonce: new Date().getTime().toString()
    , oauth_callback: 'oob'
    , oauth_signature_method: 'HMAC-SHA1'
    , oauth_timestamp: new Date().getTime().toString()
    , oauth_consumer_key: key
    , oauth_version: '1.0'
  };

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
      // Retrieve verifier token string from the html
      var verifierValue = body.match(/name=\"verifier\" value=\"[a-z|0-9]+\"/)[0].split(/=/)[2].replace(/\"/g, "");
      var tokenValue = results['oauth_token'];    
      // Let's execute a post to the url with the values and thus finish the authorization process
      post(authorizePage, {'oauth_token': tokenValue, 'verifier': verifierValue}, {}, function(body) {
        // Unpack the token and the new secret token
        var tokenValue = body.match(/name=\"oauth_token\" value=\"[a-z|0-9]+\"/)[0].split(/=/)[2].replace(/\"/g, "");
        var verifierValue = body.match(/name=\"oauth_verifier\" value=\"[a-z|0-9]+\"/)[0].split(/=/)[2].replace(/\"/g, "");

        // Build request parameters
        var accessTokenParams = { oauth_nonce: new Date().getTime().toString()
          , oauth_signature_method: 'HMAC-SHA1'
          , oauth_timestamp: new Date().getTime().toString()
          , oauth_consumer_key: key
          , oauth_version: '1.0'
          , oauth_token: tokenValue
          , oauth_verifier: verifierValue
        };
        // Build signature
        var accessSignature = generateSignature('POST', 'http', 'localhost:3000', '/oauth/access_token', accessTokenParams, results["oauth_token_secret"], secret);
        // Build auth header
        var accessAuthHeader = 'OAuth oauth_nonce="' + accessTokenParams['oauth_nonce'] + 
              '", oauth_signature_method="HMAC-SHA1", oauth_timestamp="' + accessTokenParams['oauth_timestamp'] + '", oauth_consumer_key="' + key + 
              '", oauth_signature="' + accessSignature + '", oauth_version="1.0", oauth_verifier="' + accessTokenParams['oauth_verifier'] + '", oauth_token="' + accessTokenParams['oauth_token'] + '\"';

        // Time to fetch the access token
        fetchGetUrl('POST', 'http://localhost:3000/oauth/access_token', {"host":url.host, "authorization": accessAuthHeader}, function(body) {
          // Split out all the data
          var params = body.split(/\&/);
          params.forEach(function(param) {
            var parts = param.split(/\=/);
            results[parts[0]] = parts[1]
          })
          
          // Test if we have expected values
          test.assertTrue(results['oauth_token'] != null);
          test.assertTrue(results['oauth_token_secret'] != null);
          test.assertTrue(results['oauth_callback_confirmed'] != null);
          
          // Perform an oauth call using the data
          var callTokenParams = { oauth_nonce: new Date().getTime().toString()
            , oauth_signature_method: 'HMAC-SHA1'
            , oauth_timestamp: new Date().getTime().toString()
            , oauth_consumer_key: key
            , oauth_version: '1.0'
            , oauth_token: results['oauth_token']
          };
          // Build signature
          var callSignature = generateSignature('GET', 'http', 'localhost:3000', '/api/geo/list.xml', callTokenParams, results["oauth_token_secret"], secret);
          // Build auth header
          var callAuthHeader = 'OAuth oauth_nonce="' + callTokenParams['oauth_nonce'] + 
                '", oauth_signature_method="HMAC-SHA1", oauth_timestamp="' + callTokenParams['oauth_timestamp'] + '", oauth_consumer_key="' + key + 
                '", oauth_signature="' + callSignature + '", oauth_version="1.0", oauth_token="' + callTokenParams['oauth_token'] + '\"';

          // Time to fetch the access token
          fetchGetUrl('GET', 'http://localhost:3000/api/geo/list.xml', {"host":url.host, "authorization": callAuthHeader}, function(body) {
            test.assertEquals("Done 2", body);
            testResults.push(test_correct_no_callback);
          });
        });
      });
    });
  });  
}

function test_illegal_call() {
  testResults.push(test_illegal_call);  
}

/***********************************************************************************************************
 *
 *  Utility methods used for the tests
 *
***********************************************************************************************************/
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

  request.addListener('response', function (response) {
    var body = '';
    response.setBodyEncoding("utf8");
    response.addListener("data", function (chunk) { body = body + chunk; });
    response.addListener("end", function() { callback(body); });
  });
  
  request.close();            
};

/***********************************************************************************************************
 *
 *  Execution of all tests
 *
***********************************************************************************************************/

// Execute methods
var tests = [test_correct_no_callback, test_illegal_call];
var executionCounter = 0;

// Finish running tests once all are done
var intervalId = setInterval(function() {
  if(executionCounter == 0 || executionCounter == testResults.length) {
    if(executionCounter < tests.length) {
      tests[executionCounter]();
      executionCounter = executionCounter + 1;
    }
  }
  
  if(testResults.length == tests.length) {
    clearInterval(intervalId);
  }
}, 100);

















