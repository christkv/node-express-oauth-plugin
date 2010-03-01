require('oauth/lang/oo');
sys = require('sys');
querystring = require('querystring');
crypto = require('oauth/crypto/sha1');
errors = require('oauth/oauth_error');

exports.OAuthServices = Class({
  init: function(provider) {    
    this.provider = provider;
  },
  
  authorize: function(callback, method, protocol, url, path, headers, parameters) {
    var requestParameters = this.parseParameters(headers, parameters);
    if(requestParameters == null) { callback(new errors.OAuthBadRequestError("No valid authentication parameters")); return };
    var self = this;
    
    // Check if token is valid
    self.provider.validToken(function(token) {
      if(token instanceof Error) {
        callback(new errors.OAuthProviderError(token.message));        
      } else {
        self.provider.userByConsumerKey(function(user) {
          if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: userByConsumerKey must return a object with fields [token, secret]")); return;}
          // If we have a user for this consumer key let's calculate the signature
          var calculatedSignature = self.calculateSignature(method, protocol, url, path, requestParameters, token.token_secret, user.secret);          
          // Check if the signature is correct and return a access token
          if(calculatedSignature == requestParameters.oauth_signature) {
            callback(true);
          } else {
            callback(new errors.OAuthBadRequestError("signature does not match"));
          }          
        }, token.consumer_key);
      }
    }, requestParameters.oauth_token);
  },
  
  authenticateUser: function(callback, username, password, oauthToken) {
    this.provider.authenticateUser(function(result) {
      if(result.token == null || result.verifier == null) { callback(new errors.OAuthProviderError("provider: authenticateUser must return a object with fields [token, verifier]")); return;}
      callback(result);
    }, username, password, oauthToken);
  },
  
  requestToken: function(callback, method, protocol, url, path, headers, parameters) { 
    var requestParameters = this.parseParameters(headers, parameters);
    if(requestParameters == null) { callback(new errors.OAuthBadRequestError("No valid authentication parameters")); return };
    var self = this;
    // Fetch the secret and token for the user
    this.provider.userByConsumerKey(function(user) {
      if(user instanceof Error) {
        callback(new errors.OAuthProviderError(user.message));        
      } else {       
        if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: userByConsumerKey must return a object with fields [token, secret]")); return;}
        // Ensure we don't have any hanging consumer keys
        self.provider.cleanRequestTokens(function() {
          // If we have a user for this consumer key let's calculate the signature
          var calculatedSignature = self.calculateSignature(method, protocol, url, path, requestParameters, user.token, user.secret);
          // Check if the signature is correct and return a request token
          if(calculatedSignature == requestParameters.oauth_signature) {
            self.provider.generateRequestToken(function(result) {
              if(result instanceof Error) {
                callback(new errors.OAuthProviderError("internal error"));
              } else {
                if(result.token == null || result.token_secret == null) { callback(new errors.OAuthProviderError("provider: generateRequestToken must return a object with fields [token, token_secret]")); return;}
                callback(result);                
              }
            }, requestParameters.oauth_consumer_key, requestParameters.oauth_callback);
          } else {
            callback(new errors.OAuthUnauthorizedError("signature does not match"));          
          }
        }, requestParameters['oauth_consumer_key']);
      }
    }, requestParameters['oauth_consumer_key']);
  },
  
  accessToken: function(callback, method, protocol, url, path, headers, parameters) { 
    var requestParameters = this.parseParameters(headers, parameters);
    if(requestParameters == null) { callback(new errors.OAuthBadRequestError("No valid authentication parameters")); return };
    var self = this;

    // Fetch the secret and token for the user
    this.provider.userByConsumerKey(function(user) {
      if(user instanceof Error) {
        callback(new errors.OAuthProviderError(user.message));        
      } else {
        if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: userByConsumerKey must return a object with fields [token, secret]")); return;}
        // Fetch the secret and token for the user
        self.provider.tokenByConsumer(function(tokenObject) {
          if(tokenObject instanceof Error) {
            callback(new errors.OAuthProviderError(tokenObject.message));        
          } else {  
            if(tokenObject.token == null || tokenObject.token_secret == null) { callback(new errors.OAuthProviderError("provider: tokenByConsumer must return a object with fields [token, token_secret]")); return;}
            // Ensure the token is the same as the one passed in from the server
            if(tokenObject.token == requestParameters["oauth_token"]) {
              // Ensure that the key has not been issued before
              self.provider.previousRequestToken(function(result) {
                if(result instanceof Error) {
                  callback(new errors.OAuthUnauthorizedError("request token already exchanged"));
                } else {
                  // If we have a user for this consumer key let's calculate the signature
                  var calculatedSignature = self.calculateSignature(method, protocol, url, path, requestParameters, tokenObject.token_secret, user.secret);
                  // Check if the signature is correct and return a access token
                  if(calculatedSignature == requestParameters.oauth_signature) {
                    self.provider.generateAccessToken(function(result) {
                      if(result.access_token == null || result.token_secret == null) { callback(new errors.OAuthProviderError("provider: generateAccessToken must return a object with fields [access_token, token_secret]")); return; }
                      callback(result);
                    }, requestParameters['oauth_token']);
                  } else {
                    callback(new errors.OAuthUnauthorizedError("signature does not match"));
                  }
                }
              }, requestParameters['oauth_consumer_key']);                  
            } else {
              callback(new errors.OAuthUnauthorizedError("token provided does not match stored token"));
            }              
          }      
        }, requestParameters['oauth_consumer_key']);        
      }
    }, requestParameters['oauth_consumer_key']);
  },
  
  calculateSignature: function(method, protocol, url, path, parameters, token, secret) {
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
  },
  
  parseParameters: function(headers, parameters) {
    // Check if this is sent by headers or parameters
    if(parameters['oauth_consumer_key'] != null) {
      return parameters;
    } else if(headers['authorization'] != null && headers['authorization'].indexOf('OAuth') != -1) {
      var authorizationString = headers['authorization'].substring('OAuth '.length, headers['authorization'].length);
      // Trim the strings and split the values
      return authorizationString.split(",").reduce(function(initialValue, string) {
        var variables = string.trim().replace(/\"/g, "").split("=");
        initialValue[variables[0]] = variables[1];
        return initialValue;
      }, {});
    }    
  }
});