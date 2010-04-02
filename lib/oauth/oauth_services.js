var sys = require('sys');
var querystring = require('querystring');
var crypto = require('oauth/crypto/sha1');
var errors = require('oauth/oauth_error');

var OAuthServices = exports.OAuthServices = function(provider) {
  this.provider = provider;
  /**
    Ensure the provider has the correct functions
  **/
  ['previousRequestToken', 'tokenByConsumer', 'applicationByConsumerKey', 'validToken', 'authenticateUser', 'generateRequestToken', 'generateAccessToken', 'cleanRequestTokens', 'validateNotReplay', 'associateTokenToUser', 'tokenByTokenAndVerifier'].forEach(function(method) {
    if(!(Object.prototype.toString.call(provider[method]) === "[object Function]")) throw Error("Data provider must provide the methods ['previousRequestToken', 'tokenByConsumer', 'applicationByConsumerKey', 'validToken', 'authenticateUser', 'generateRequestToken', 'generateAccessToken', 'cleanRequestTokens', 'validateNotReplay', 'associateTokenToUser', 'tokenByTokenAndVerifier']");
  });  
}

/**
  OAuth Methods
**/  
OAuthServices.prototype.authorize = function(method, protocol, url, path, headers, parameters, callback) {
  var requestParameters = this.parseParameters(headers, parameters);
  if(requestParameters == null) { callback(new errors.OAuthBadRequestError("Missing required parameter"), null); return };
  // Ensure correct parameters are available
  if(!this.validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_signature', 'oauth_timestamp', 'oauth_nonce'])) { callback(new errors.OAuthBadRequestError("Missing required parameter"), null); return };    
  var self = this;
  
  // Check if token is valid
  self.provider.validToken(requestParameters.oauth_token, function(err, token) {
    if(err) {
      callback(new errors.OAuthProviderError('Invalid / expired Token'), null);        
    } else {                
      if(token.access_token == null || token.token_secret == null) { callback(new errors.OAuthProviderError("provider: validToken must return a object with fields [access_token, token_secret]"), null); return;}
      self.provider.validateNotReplay(requestParameters.oauth_token, requestParameters.oauth_timestamp, requestParameters.oauth_nonce, function(err, result) {
        if(err) {
          callback(new errors.OAuthUnauthorizedError('Invalid / used nonce'), null);
        } else {
          self.provider.applicationByConsumerKey(token.consumer_key, function(err, user) {
            if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: applicationByConsumerKey must return a object with fields [token, secret]"), null); return;}
            // If we have a user for this consumer key let's calculate the signature
            var calculatedSignature = self.calculateSignature(method, protocol, url, path, requestParameters, token.token_secret, user.secret);
            // Check if the signature is correct and return a access token
            if(calculatedSignature == requestParameters.oauth_signature) {
              callback(null, true);
            } else {
              callback(new errors.OAuthBadRequestError("Invalid signature"), null);
            }          
          });
        }
      });
    }
  });
}

OAuthServices.prototype.authenticateUser = function(username, password, oauthToken, callback) {
  var self = this;
  
  this.provider.authenticateUser(username, password, oauthToken, function(err, result) {
    if(err) { callback(new errors.OAuthProviderError('internal error'), null); return; };
    if(result.token == null || result.verifier == null) { callback(new errors.OAuthProviderError("authenticateUser must return a object with fields [token, verifier]"), null); return;}
    // Save the association between the key and the user (to make available for later retrival)
    self.provider.associateTokenToUser(username, result.token, function(err, doc) {
      callback(err, result);      
    });
  });
}

OAuthServices.prototype.requestToken = function(method, protocol, url, path, headers, parameters, callback) { 
  var requestParameters = this.parseParameters(headers, parameters);
  if(requestParameters == null) { callback(new errors.OAuthBadRequestError("Missing required parameter"), null); return };
  // Ensure correct parameters are available
  if(!this.validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_signature_method', 'oauth_signature', 'oauth_timestamp', 'oauth_nonce', 'oauth_callback'])) { callback(new errors.OAuthBadRequestError("Missing required parameter"), null); return };    
  var self = this;
  // Fetch the secret and token for the user
  this.provider.applicationByConsumerKey(requestParameters['oauth_consumer_key'], function(err, user) {
    if(err) {
      callback(new errors.OAuthProviderError('Invalid Consumer Key'), null);        
    } else {       
      if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: applicationByConsumerKey must return a object with fields [consumer_key, secret]")); return;}
      // Ensure we don't have any hanging consumer keys
      self.provider.cleanRequestTokens(requestParameters['oauth_consumer_key'], function(err, result) {
        // If we have a user for this consumer key let's calculate the signature
        var calculatedSignature = self.calculateSignature(method, protocol, url, path, requestParameters, user.token, user.secret);
        // Check if the signature is correct and return a request token
        if(calculatedSignature == requestParameters.oauth_signature) {
          self.provider.generateRequestToken(requestParameters.oauth_consumer_key, requestParameters.oauth_callback, function(err, result) {
            if(err) {
              callback(new errors.OAuthProviderError("internal error"), null);
            } else {
              if(result.token == null || result.token_secret == null) { callback(new errors.OAuthProviderError("provider: generateRequestToken must return a object with fields [token, token_secret]"), null); return;}
              result['oauth_callback_confirmed'] = true;
              callback(null, result);                
            }
          });
        } else {
          callback(new errors.OAuthUnauthorizedError("Invalid signature"), null);          
        }
      });
    }
  });
}

OAuthServices.prototype.accessToken = function(method, protocol, url, path, headers, parameters, callback) { 
  var requestParameters = this.parseParameters(headers, parameters);
  if(requestParameters == null) { callback(new errors.OAuthBadRequestError("Missing required parameter"), null); return };
  // Ensure correct parameters are available
  if(!this.validateParameters(requestParameters, ['oauth_consumer_key', 'oauth_token', 'oauth_signature_method', 'oauth_signature', 'oauth_timestamp', 'oauth_nonce', 'oauth_verifier'])) { callback(new errors.OAuthBadRequestError("Missing required parameter")); return };
  var self = this;

  // Fetch the secret and token for the user
  this.provider.applicationByConsumerKey(requestParameters['oauth_consumer_key'], function(err, user) {
    if(err) {
      callback(new errors.OAuthProviderError('Invalid Consumer Key'), null);        
    } else {
      if(user.consumer_key == null || user.secret == null) { callback(new errors.OAuthProviderError("provider: applicationByConsumerKey must return a object with fields [token, secret]"), null); return;}
      // Fetch the secret and token for the user
      self.provider.tokenByConsumer(requestParameters['oauth_consumer_key'], function(err, tokenObject) {
        if(err) {
          callback(new errors.OAuthProviderError('Invalid / expired Token'), null);        
        } else {  
          if(tokenObject.token == null || tokenObject.token_secret == null) { callback(new errors.OAuthProviderError("provider: tokenByConsumer must return a object with fields [token, token_secret]"), null); return;}
          // Ensure the token is the same as the one passed in from the server
          if(tokenObject.token == requestParameters["oauth_token"]) {
            // Ensure that the key has not been issued before
            self.provider.previousRequestToken(requestParameters['oauth_consumer_key'], function(err, result) {
              if(err) {
                callback(new errors.OAuthUnauthorizedError("Invalid / expired Token"), null);
              } else {
                // If we have a user for this consumer key let's calculate the signature
                var calculatedSignature = self.calculateSignature(method, protocol, url, path, requestParameters, tokenObject.token_secret, user.secret);
                // Check if the signature is correct and return a access token
                if(calculatedSignature == requestParameters.oauth_signature) {
                  self.provider.generateAccessToken(requestParameters['oauth_token'], function(err, result) {
                    if(result.access_token == null || result.token_secret == null) { callback(new errors.OAuthProviderError("generateAccessToken must return a object with fields [access_token, token_secret]"), null); return; }
                    callback(null, result);
                  });
                } else {
                  callback(new errors.OAuthUnauthorizedError("Invalid signature"), null);
                }
              }
            });                  
          } else {
            callback(new errors.OAuthUnauthorizedError("Invalid / expired Token"), null);
          }              
        }      
      });
    }
  });
}

/**
  Verify if a token exists using the verifier number and the oauth_otken
**/
OAuthServices.prototype.verifyToken = function(token, verifier, callback) {
  this.provider.tokenByTokenAndVerifier(token, verifier, function(err, token) {
    if(token.token == null || token.verifier == null) { callback(new errors.OAuthProviderError("provider: tokenByTokenAndVerifier must return a token object with fields [token, verifier]"), null); return;}
    callback(err, token);
  });
}

/**
  Fetch an associated application object and user object
**/
OAuthServices.prototype.fetchAuthorizationInformation = function(username, token, callback) {
  this.provider.fetchAuthorizationInformation(username, token, function(err, application, user) {
    if(application.title == null || application.description == null || user.token == null || user.username == null) { callback(new errors.OAuthProviderError("provider: applicationByConsumerKey must return a application object with fields [title, description] and a user object with fields [username, token]"), null); return;}
    // Return the value to calling plugin
    callback(err, application, user);
  });
}

/**
  Internal Methods used for parsing etc
**/  
OAuthServices.prototype.validateParameters = function(parameters, requiredParameters) {
  var legalParameters = true;
  requiredParameters.forEach(function(requiredParameter) {
    if(parameters[requiredParameter] == null) legalParameters = false;
  });
  return legalParameters;
}

OAuthServices.prototype.calculateSignature = function(method, protocol, url, path, parameters, token, secret) {
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

OAuthServices.prototype.parseParameters = function(headers, parameters) {
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