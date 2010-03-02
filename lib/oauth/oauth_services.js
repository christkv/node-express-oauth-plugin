require('oauth/lang/oo');
sys = require('sys');
querystring = require('querystring');
crypto = require('oauth/crypto/sha1');
errors = require('oauth/oauth_error');

exports.OAuthServices = Class({
  init: function(provider) {    
    this.provider = provider;
    /**
      Ensure the provider has the correct functions
    **/
    ['previousRequestToken', 'tokenByConsumer', 'userByConsumerKey', 'validToken', 'authenticateUser', 'generateRequestToken', 'generateAccessToken', 'cleanRequestTokens', 'validateNotReplay'].forEach(function(method) {
      if(!(Object.prototype.toString.call(provider[method]) === "[object Function]")) throw Error("Data provider must provide the methods ['previousRequestToken', 'tokenByConsumer', 'userByConsumerKey', 'validToken', 'authenticateUser', 'generateRequestToken', 'generateAccessToken', 'cleanRequestTokens', 'validateNotReplay']");
    });
  },
  
  /**
    OAuth Methods
  **/  
  authorize: function(callback, method, protocol, url, path, headers, parameters) {
    var requestParameters = this.parseParameters(headers, parameters);
    if(requestParameters == null) { callback(new errors.OAuthBadRequestError("Missing required parameter")); return };
    // Ensure correct parameters are available
    if(!this.validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_signature', 'oauth_timestamp', 'oauth_nonce'])) { callback(new errors.OAuthBadRequestError("Missing required parameter")); return };    
    var self = this;
    
    // Check if token is valid
    self.provider.validToken(function(token) {
      if(token instanceof Error) {
        callback(new errors.OAuthProviderError('Invalid / expired Token'));        
      } else {                
        if(token.access_token == null || token.token_secret == null) { callback(new errors.OAuthProviderError("provider: validToken must return a object with fields [access_token, token_secret]")); return;}
        self.provider.validateNotReplay(function(result) {
          if(result instanceof Error) {
            callback(new errors.OAuthUnauthorizedError('Invalid / used nonce'));
          } else {
            self.provider.userByConsumerKey(function(user) {
              if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: userByConsumerKey must return a object with fields [token, secret]")); return;}
              // If we have a user for this consumer key let's calculate the signature
              var calculatedSignature = self.calculateSignature(method, protocol, url, path, requestParameters, token.token_secret, user.secret);          
              // Check if the signature is correct and return a access token
              if(calculatedSignature == requestParameters.oauth_signature) {
                callback(true);
              } else {
                callback(new errors.OAuthBadRequestError("Invalid signature"));
              }          
            }, token.consumer_key);            
          }
        }, requestParameters.oauth_token, requestParameters.oauth_timestamp, requestParameters.oauth_nonce);                
      }
    }, requestParameters.oauth_token);
  },
  
  authenticateUser: function(callback, username, password, oauthToken) {
    this.provider.authenticateUser(function(result) {
      if(result instanceof Error) { callback(new errors.OAuthProviderError('internal error')); return; };
      if(result.token == null || result.verifier == null) { callback(new errors.OAuthProviderError("provider: authenticateUser must return a object with fields [token, verifier]")); return;}
      callback(result);
    }, username, password, oauthToken);
  },
  
  requestToken: function(callback, method, protocol, url, path, headers, parameters) { 
    var requestParameters = this.parseParameters(headers, parameters);
    if(requestParameters == null) { callback(new errors.OAuthBadRequestError("Missing required parameter")); return };
    // Ensure correct parameters are available
    if(!this.validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_signature_method', 'oauth_signature', 'oauth_timestamp', 'oauth_nonce', 'oauth_callback'])) { callback(new errors.OAuthBadRequestError("Missing required parameter")); return };    
    var self = this;
    // Fetch the secret and token for the user
    this.provider.userByConsumerKey(function(user) {
      if(user instanceof Error) {
        callback(new errors.OAuthProviderError('Invalid Consumer Key'));        
      } else {       
        if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: userByConsumerKey must return a object with fields [consumer_key, secret]")); return;}
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
                result['oauth_callback_confirmed'] = true;
                callback(result);                
              }
            }, requestParameters.oauth_consumer_key, requestParameters.oauth_callback);
          } else {
            callback(new errors.OAuthUnauthorizedError("Invalid signature"));          
          }
        }, requestParameters['oauth_consumer_key']);
      }
    }, requestParameters['oauth_consumer_key']);
  },
  
  accessToken: function(callback, method, protocol, url, path, headers, parameters) { 
    var requestParameters = this.parseParameters(headers, parameters);
    if(requestParameters == null) { callback(new errors.OAuthBadRequestError("Missing required parameter")); return };
    // Ensure correct parameters are available
    if(!this.validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_signature', 'oauth_timestamp', 'oauth_nonce', 'oauth_verifier'])) { callback(new errors.OAuthBadRequestError("Missing required parameter")); return };
    var self = this;

    // Fetch the secret and token for the user
    this.provider.userByConsumerKey(function(user) {
      if(user instanceof Error) {
        callback(new errors.OAuthProviderError('Invalid Consumer Key'));        
      } else {
        if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: userByConsumerKey must return a object with fields [token, secret]")); return;}
        // Fetch the secret and token for the user
        self.provider.tokenByConsumer(function(tokenObject) {
          if(tokenObject instanceof Error) {
            callback(new errors.OAuthProviderError('Invalid / expired Token'));        
          } else {  
            if(tokenObject.token == null || tokenObject.token_secret == null) { callback(new errors.OAuthProviderError("provider: tokenByConsumer must return a object with fields [token, token_secret]")); return;}
            // Ensure the token is the same as the one passed in from the server
            if(tokenObject.token == requestParameters["oauth_token"]) {
              // Ensure that the key has not been issued before
              self.provider.previousRequestToken(function(result) {
                if(result instanceof Error) {
                  callback(new errors.OAuthUnauthorizedError("Invalid / expired Token"));
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
                    callback(new errors.OAuthUnauthorizedError("Invalid signature"));
                  }
                }
              }, requestParameters['oauth_consumer_key']);                  
            } else {
              callback(new errors.OAuthUnauthorizedError("Invalid / expired Token"));
            }              
          }      
        }, requestParameters['oauth_consumer_key']);        
      }
    }, requestParameters['oauth_consumer_key']);
  },
  
  /**
    Internal Methods used for parsing etc
  **/  
  validateParameters: function(parameters, requiredParameters) {
    var legalParameters = true;
    requiredParameters.forEach(function(requiredParameter) {
      if(parameters[requiredParameter] == null) legalParameters = false;
    });
    return legalParameters;
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