// Fetch the library records
var mongo = require('mongodb');

/**
  All methods must be implemented for the system to work
**/
var OAuthDataProvider = exports.OAuthDataProvider = function(db) {
  this.db = db;  
}

/**
  Locating methods used for looking up authentication information
**/
OAuthDataProvider.prototype.previousRequestToken = function(token, callback) {
  var self = this;
  self.db.collection('oauth_previous_users_request_tokens', function(err, collection) {
    collection.findOne({'token':token}, function(err, token) {
      token != null ? callback(new Error("Previously used token"), null) : callback(null, token);
    });
  });
}

OAuthDataProvider.prototype.tokenByConsumer = function(consumerKey, callback) {
  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.findOne({'consumer_key':consumerKey}, function(err, token) {
      token == null ? callback(new Error("No suck token"), null) : callback(null, token);
    });
  });
},

OAuthDataProvider.prototype.userByConsumerKey = function(consumerKey, callback) {
  this.db.collection('oauth_users', function(err, collection) {
    collection.findOne({'consumer_key':consumerKey}, function(err, user) {
      user != null ? callback(null, user) : callback(new Error("No such user with consumer key: " + consumerKey), null);
    });
  });
},

/**
  Validation methods used to check if the tokens and user are valid
**/
OAuthDataProvider.prototype.validToken = function(accessToken, callback) {
  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.findOne({'access_token':accessToken}, function(err, token) {
      token == null ? callback(new Error("No suck token"), null) : callback(null, token);
    });
  });
},

OAuthDataProvider.prototype.validateNotReplay = function(callback, accessToken, timestamp, nonce) {
  callback(null, true);
},

OAuthDataProvider.prototype.authenticateUser = function(username, password, oauthToken, callback) {
  var self = this;    
  self.db.collection('users', function(err, collection) {
    var encodedPassword = MD5.hex_md5(password);
    collection.findOne({'username':username, 'password':encodedPassword}, function(err, user) {
      if(user != null) {
        // Update the oauthToken document to signal that key is authenticated
        self.db.collection('oauth_users_request_tokens', function(err, collection) {
          collection.findOne({'token':oauthToken}, function(err, tokenEntry) {
            tokenEntry.authenticated = true;
            collection.save(tokenEntry, function(err, doc) {
              callback(null, doc);
            });
          });
        });
      } else {
        callback(new Error("Authentication of user/password failed"), null);
      }
    });
  });
},

/**
  Generation methods used to create new tokens for the oauth interface
**/  
OAuthDataProvider.prototype.generateRequestToken = function(oauthConsumerKey, oauthCallback, callback) {
  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    // Save the entry, Generate a request token and token secret
    collection.save({'consumer_key':oauthConsumerKey , 'token':new mongo.ObjectID().toHexString(), 'token_secret':new mongo.ObjectID().toHexString(), 'callback':oauthCallback, 'verifier':new mongo.ObjectID().toHexString()}, function(err, doc) {
      callback(null, doc);
    });
  });
}, 

OAuthDataProvider.prototype.generateAccessToken = function(oauthToken, callback) {
  var self = this;
  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    // Generate access token
    collection.findOne({'token':oauthToken}, function(err, tokenObject) {
      tokenObject['access_token'] = new mongo.ObjectID().toHexString();
      collection.save(tokenObject, function(err, doc) {
        // Remove the id from the doc (so we can reuse the document)
        doc['_id'] = null;          
        // Save the freshly minted access token to the list of used tokens
        self.db.collection('oauth_previous_users_request_tokens', function(err, collection) {
          collection.save(doc, function(err, doc) {
            callback(null, doc);
          });
        });
      });
    });
  });
},

/**
  Ensures that we avoid multiple entries for tokens
**/
OAuthDataProvider.prototype.cleanRequestTokens = function(consumerKey, callback) {
  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.remove({'consumer_key':consumerKey}, function(err, collection) {
      callback(null, null);
    });
  });
}