// Load the kiwi
var kiwi = require('kiwi');

// Initialize the seeds  
kiwi.seed('mongodb-native');
kiwi.seed('simplify');

// Fetch the library records
var mongo = require('mongodb'),
  MD5 = mongo.MD5,
  simplifier = require('simplifier'),
  sys = require('sys');
  
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
}

OAuthDataProvider.prototype.applicationByConsumerKey = function(consumerKey, callback) {
  this.db.collection('oauth_applications', function(err, collection) {
    collection.findOne({'consumer_key':consumerKey}, function(err, user) {
      user != null ? callback(null, user) : callback(new Error("No such user with consumer key: " + consumerKey), null);
    });
  });
}

OAuthDataProvider.prototype.fetchAuthorizationInformation = function(username, token, callback) {
  var self = this;
  
  // 
  // Create Serial flow for simplifier feeding chaining the functions
  //
  var fetchApplicationAndUser = new simplifier.SerialFlow(
    function(callback) {
      self.db.collection('oauth_users_request_tokens', function(err, requestCollection) {
        requestCollection.findOne({'token':token}, function(err, requestDoc) {
          callback(err, requestDoc);
        })
      });
    }, 
    
    function(err, requestDoc, callback) {
      // Use the request to fetch the associated user
      self.db.collection('users', function(err, userCollection) {
        userCollection.findOne({'username':requestDoc.username}, function(err, userDoc) {
          callback(err, requestDoc, userDoc);
        });
      });      
    }
  );
  
  // 
  // Create Serial flow for simplifier feeding chaining the functions
  //
  var fetchAllParts = new simplifier.ParallelFlow(
    // Fetch the application object
    function(callback) {
      // locate consumer key by token
      self.db.collection('oauth_users_request_tokens', function(err, requestCollection) {
        requestCollection.findOne({'token':token}, function(err, requestDoc) {
          // Fetch the application
          self.db.collection('oauth_applications', function(err, applicationCollection) {
            applicationCollection.findOne({'consumer_key':requestDoc.consumer_key}, function(err, oauthApplicationDoc) {
              callback(err, oauthApplicationDoc);
            });
          });
        })
      });
    },    
    // Fetches the application and user document
    fetchApplicationAndUser
  )
  
  //
  //  Execute all the functions and feed results into final method
  //  
  new simplifier.Simplifier().execute(
    // Execute flow
    fetchAllParts,    
    // All results coming back are arrays function1 [err, doc] function2 [err, doc1, doc2]
    function(oauthApplicationDocResult, userDocResult) {          
      callback(null, oauthApplicationDocResult[1], userDocResult[1]);
    }
  );      
}

/**
  Validation methods used to check if the tokens and user are valid
**/
OAuthDataProvider.prototype.validToken = function(accessToken, callback) {
  this.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.findOne({'access_token':accessToken}, function(err, token) {
      token == null ? callback(new Error("No suck token"), null) : callback(null, token);
    });
  });
}

/**
  Fetch a token by token and verifier (can be used to verify if a token exists)
**/
OAuthDataProvider.prototype.tokenByTokenAndVerifier = function(token, verifier, callback) {
  var self = this;
  
  self.db.collection('oauth_users_request_tokens', function(err, collection) {
    collection.findOne({'token':token, 'verifier':verifier}, function(err, token) {
      token != null ? callback(err, token) : callback(new Error("No token containing token: " + token + " and verifier: " + verifier), null);
    })
  });
}

OAuthDataProvider.prototype.validateNotReplay = function(accessToken, timestamp, nonce, callback) {
  callback(null, true);
}

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
}

/**
  Associate an application token request with a system user after the user has authenticated, allows for authorization later
**/
OAuthDataProvider.prototype.associateTokenToUser = function(username, token, callback) {
  var self = this;    
  self.db.collection('users', function(err, collection) {
    collection.findOne({'username':username}, function(err, user) {
      // Locate the token
      self.db.collection('oauth_users_request_tokens', function(err, requestCollection) {
        requestCollection.findOne({'token': token}, function(err, requestTokenDoc) {
          requestTokenDoc['username'] = username;
          requestCollection.save(requestTokenDoc, callback);
        });
      });
    });
  });
}

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
}

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
}

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