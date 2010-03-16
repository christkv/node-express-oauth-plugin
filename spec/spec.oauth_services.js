//
//  Tests for OAuthServices protocol
//
describe 'OAuthServices'
  before_each
  end
  
  /** 
    Request token test
  **/  
  describe 'OAuthServices Request Token'
    it 'Should Correctly Request token' 
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, generateAccessToken: function(oauthToken, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},

        userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); },
        cleanRequestTokens: function(consumerKey, callback) {callback(null, null);},
        generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) { callback(null, {token:'token', token_secret:'token_secret'}); }
      })
        
      oauthServices.requestToken('POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267443688\", oauth_consumer_key=\"key\", oauth_signature=\"8m8arspgaA%2Bw3uHcWDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
        result.token.should.eql "token"
        result.token_secret.should.eql "token_secret"
        result.oauth_callback_confirmed.should.eql true
      });
    end
    
    it 'Should Fail du to no valid parameters' 
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, generateAccessToken: function(oauthToken, callback) {},
        cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
    
        userByConsumerKey: function(consumerKey, callback) { callback(new Error("fail"), null); }
      })
      
      oauthServices.requestToken('POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_signature=\"8m8arspgaA%2Bw3uHcWDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
        err.should.be_an_instance_of oauth.OAuthBadRequestError
        err.statusCode.should.eql 400
        err.message.should.eql "Missing required parameter"
      });      
    end
    
    it 'Should Fail to retrive a user by wrong key'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, generateAccessToken: function(oauthToken, callback) {},
        cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
    
        userByConsumerKey: function(consumerKey, callback) { callback(new Error("fail"), null); }
      })
    
      oauthServices.requestToken('POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267443688\", oauth_consumer_key=\"key\", oauth_signature=\"8m8arspgaA%2Bw3uHcWDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
        err.should.be_an_instance_of oauth.OAuthProviderError
        err.statusCode.should.eql 400
        err.message.should.eql "Invalid Consumer Key"
      });      
    end
    
    it 'Should Fail to retrieve request token due to illegal signature'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, generateAccessToken: function(oauthToken, callback) {},
        generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
    
        cleanRequestTokens: function(consumerKey, callback) { callback(null, null); },
        userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); }
      })
    
      oauthServices.requestToken('POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267443688\", oauth_consumer_key=\"key\", oauth_signature=\"8m8arspgaA%2Bw3uHcaDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
        err.should.be_an_instance_of oauth.OAuthUnauthorizedError
        err.statusCode.should.eql 401
        err.message.should.eql "Invalid signature"
      });      
    end
    
    it 'Should Fail to generate a token due to an internal provider error generating a request'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, generateAccessToken: function(oauthToken, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
    
        userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); },
        cleanRequestTokens: function(consumerKey, callback) {callback(null, null);},
        generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) { callback(new Error('fail'), null); }
      })
      
      oauthServices.requestToken('POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267443688\", oauth_consumer_key=\"key\", oauth_signature=\"8m8arspgaA%2Bw3uHcWDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
        err.should.be_an_instance_of oauth.OAuthProviderError
        err.statusCode.should.eql 400
        err.message.should.eql "internal error"
      });      
    end
  end
  
  /** 
    Authenticate User tests
  **/  
  describe 'OAuthServices Authenticate User'
    it 'Correctly Authenticate User'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, 
        generateAccessToken: function(oauthToken, callback) {}, userByConsumerKey: function(consumerKey, callback) {}, cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
        authenticateUser: function(username, password, oauthToken, callback) { callback(null, {token:'token', verifier:'verifier'}); }
      })
     
      oauthServices.authenticateUser('username', 'password', 'oauthToken', function(err, result) {
        result.token.should.eql 'token'
        result.verifier.should.eql 'verifier'
      });
    end
    
    it 'Should fail due no internal error'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, 
        generateAccessToken: function(oauthToken, callback) {}, userByConsumerKey: function(consumerKey, callback) {}, cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
        authenticateUser: function(username, password, oauthToken, callback) { callback(null, {}); }
      })
   
      oauthServices.authenticateUser('username', 'password', 'oauthToken', function(err, result) {
        err.should.be_an_instance_of oauth.OAuthProviderError
        err.statusCode.should.eql 400
        err.message.should.eql "authenticateUser must return a object with fields [token, verifier]"
      });     
    end
    
    it 'Should fail due to missing parameters passed back'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, 
        generateAccessToken: function(oauthToken, callback) {}, userByConsumerKey: function(consumerKey, callback) {}, cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
        authenticateUser: function(username, password, oauthToken, callback) { callback(new Error('fail'), null); }
      })
   
      oauthServices.authenticateUser('username', 'password', 'oauthToken', function(err, result) {
        err.should.be_an_instance_of oauth.OAuthProviderError
        err.statusCode.should.eql 400
        err.message.should.eql "internal error"
      });     
    end
  end
  
  /** 
    Access token tests
  **/  
  describe 'OAuthServices access token'
    it 'Should correctly create access token'
      var oauthServices = new oauth.OAuthServices({
        tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {},
        cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
        userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); },
        tokenByConsumer: function(consumerKey, callback) { callback(null, {token:'ffe68b4be4b5073918010000', token_secret:'ffe68b4b1f90013918020000'}); },
        previousRequestToken: function(token, callback) { callback(null, true); },
        generateAccessToken: function(oauthToken, callback) { callback(null, {access_token:'access_token', token_secret:'token_secret'}); }
      })
      
      oauthServices.accessToken('POST', 'http', 'localhost:3000', '/oauth/access_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"t8G01S21aZ8KwbF5OG2d93zaSM2KGNmrD5CPkZaFk\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267459851\", oauth_consumer_key=\"key\", oauth_token=\"ffe68b4be4b5073918010000\", oauth_verifier=\"ffe68b4bbec7073918030000\", oauth_signature=\"2v9bIUrnvtur%2FntRUtn6TpLLU2w%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
        result.access_token.should.eql "access_token"
        result.token_secret.should.eql "token_secret"
      });
    end
  end
  
  it 'Should fail to create access token due to illegal consumer key'
    var oauthServices = new oauth.OAuthServices({
      previousRequestToken: function(token, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, generateAccessToken: function(oauthToken, callback) {},
      cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
      userByConsumerKey: function(consumerKey, callback) { callback(new Error("fail"), null); }
    })
  
    oauthServices.accessToken('POST', 'http', 'localhost:3000', '/oauth/access_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"t8G01S21aZ8KwbF5OG2d93zaSM2KGNmrD5CPkZaFk\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267459851\", oauth_consumer_key=\"key\", oauth_token=\"ffe68b4be4b5073918010000\", oauth_verifier=\"ffe68b4bbec7073918030000\", oauth_signature=\"2v9bIUrnvtur%2FntRUtn6TpLLU2w%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
      err.should.be_an_instance_of oauth.OAuthProviderError
      err.statusCode.should.eql 400
      err.message.should.eql "Invalid Consumer Key"
    });
  end
  
  it 'Should fail to retrieve token by consumer id'
    var oauthServices = new oauth.OAuthServices({
      previousRequestToken: function(token, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, generateAccessToken: function(oauthToken, callback) {},
      cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
      userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); },
      tokenByConsumer: function(consumerKey, callback) { callback(new Error('fail'), null); }
    })
  
    oauthServices.accessToken('POST', 'http', 'localhost:3000', '/oauth/access_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"t8G01S21aZ8KwbF5OG2d93zaSM2KGNmrD5CPkZaFk\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267459851\", oauth_consumer_key=\"key\", oauth_token=\"ffe68b4be4b5073918010000\", oauth_verifier=\"ffe68b4bbec7073918030000\", oauth_signature=\"2v9bIUrnvtur%2FntRUtn6TpLLU2w%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
      err.should.be_an_instance_of oauth.OAuthProviderError
      err.statusCode.should.eql 400
      err.message.should.eql "Invalid / expired Token"
    });
  end
  
  it 'Should fail to due to previous token exchange'
    var oauthServices = new oauth.OAuthServices({
      previousRequestToken: function(token, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, generateAccessToken: function(oauthToken, callback) {},
      cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
      userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); },
      tokenByConsumer: function(consumerKey, callback) { callback(null, {token:'ffe68b4be4b5073918010000', token_secret:'ffe68b4b1f90013918020000'}); },
      previousRequestToken: function(token, callback) { callback(new Error('fail'), null); },
    })
  
    oauthServices.accessToken('POST', 'http', 'localhost:3000', '/oauth/access_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"t8G01S21aZ8KwbF5OG2d93zaSM2KGNmrD5CPkZaFk\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267459851\", oauth_consumer_key=\"key\", oauth_token=\"ffe68b4be4b5073918010000\", oauth_verifier=\"ffe68b4bbec7073918030000\", oauth_signature=\"2v9bIUrnvtur%2FntRUtn6TpLLU2w%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
      err.should.be_an_instance_of oauth.OAuthUnauthorizedError
      err.statusCode.should.eql 401
      err.message.should.eql "Invalid / expired Token"
    });  
  end
  
  it 'Should fail due to illegal signature'
    var oauthServices = new oauth.OAuthServices({
      tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {},
      cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, generateAccessToken: function(oauthToken, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
      userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); },
      tokenByConsumer: function(consumerKey, callback) { callback(null, {token:'ffe68b4be4b5073918010000', token_secret:'ffe68b4b1f90013918020000'}); },
      previousRequestToken: function(token, callback) { callback(null, true); }      
    })
  
    oauthServices.accessToken('POST', 'http', 'localhost:3000', '/oauth/access_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"t8G01S21aZ8KwbF5OG2d93zaSM2KGNmrD5CPkZaFk\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267459851\", oauth_consumer_key=\"key\", oauth_token=\"ffe68b4be4b5073918010000\", oauth_verifier=\"ffe68b4bbec7073918030000\", oauth_signature=\"4v9bIUrnvtur%2FntRUtn6TpLLU2w%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
      err.should.be_an_instance_of oauth.OAuthUnauthorizedError
      err.statusCode.should.eql 401
      err.message.should.eql "Invalid signature"
    });    
  end
  
  it 'Should fail during generation of access token'
    var oauthServices = new oauth.OAuthServices({
      tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {},
      cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
  
      userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); },
      tokenByConsumer: function(consumerKey, callback) { callback(null, {token:'ffe68b4be4b5073918010000', token_secret:'ffe68b4b1f90013918020000'}); },
      previousRequestToken: function(token, callback) { callback(null, true); },
      generateAccessToken: function(oauthToken, callback) { callback(null, {}); }
    })
  
    oauthServices.accessToken('POST', 'http', 'localhost:3000', '/oauth/access_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"t8G01S21aZ8KwbF5OG2d93zaSM2KGNmrD5CPkZaFk\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267459851\", oauth_consumer_key=\"key\", oauth_token=\"ffe68b4be4b5073918010000\", oauth_verifier=\"ffe68b4bbec7073918030000\", oauth_signature=\"2v9bIUrnvtur%2FntRUtn6TpLLU2w%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
      err.should.be_an_instance_of oauth.OAuthProviderError
      err.statusCode.should.eql 400
      err.message.should.eql "generateAccessToken must return a object with fields [access_token, token_secret]"
    });
  end
  
  it 'Should fail due to missing parameters'
    var oauthServices = new oauth.OAuthServices({
      tokenByConsumer: function(consumerKey, callback) {}, validToken: function(accessToken, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {},
      cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
      userByConsumerKey: function(consumerKey, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, previousRequestToken: function(token, callback) {}, generateAccessToken: function(oauthToken, callback) {}      
    })
  
    oauthServices.accessToken('POST', 'http', 'localhost:3000', '/oauth/access_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"t8G01S21aZ8KwbF5OG2d93zaSM2KGNmrD5CPkZaFk\", oauth_timestamp=\"1267459851\", oauth_consumer_key=\"key\", oauth_token=\"ffe68b4be4b5073918010000\", oauth_verifier=\"ffe68b4bbec7073918030000\", oauth_signature=\"2v9bIUrnvtur%2FntRUtn6TpLLU2w%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {}, function(err, result) {
      err.should.be_an_instance_of oauth.OAuthBadRequestError
      err.statusCode.should.eql 400
      err.message.should.eql "Missing required parameter"
    });
  end
  
  /** 
    Authorize tests
  **/  
  describe 'OAuthServices access token'
    it 'Should correctly authorize call'    
      var oauthServices = new oauth.OAuthServices({
        tokenByConsumer: function(consumerKey, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {},
        cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {},
        userByConsumerKey: function(consumerKey, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, previousRequestToken: function(token, callback) {}, generateAccessToken: function(oauthToken, callback) {},
        
        validToken: function(accessToken, callback) { callback(null, {access_token:'06ef8c4b6bce0a771f040000', token_secret:'f8ee8c4b0c7f0d771f020000'}); },
        validateNotReplay: function(accessToken, timestamp, nonce, callback) { callback(null, true); },
        userByConsumerKey: function(consumerKey, callback) { callback(null, {consumer_key:'key', secret:'secret'}); }        
      })
  
      oauthServices.authorize('GET', 'http', 'localhost:3000', '/api/geo/list', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"6Egkv9Dt9GeFqdYRZEgj5hpXJxDmQG3sUYq1GCTVuA\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267527430\", oauth_consumer_key=\"key\", oauth_token=\"06ef8c4b6bce0a771f040000\", oauth_signature=\"Li8w6ZcB3A2Cbiqohx%2FJYDK9Kxo%3D\", oauth_version=\"1.0\"", "host": "localhost:3000"}, {}, function(err, result) {
        result.should.eql true
      });
    end
  
    it 'Should fail due to illegal token'    
      var oauthServices = new oauth.OAuthServices({
        tokenByConsumer: function(consumerKey, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, userByConsumerKey: function(consumerKey, callback) {},
        cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {},
        userByConsumerKey: function(consumerKey, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, previousRequestToken: function(token, callback) {}, generateAccessToken: function(oauthToken, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
      
        validToken: function(accessToken, callback) { callback(new Error('fail'), null); }
      })
  
      oauthServices.authorize('GET', 'http', 'localhost:3000', '/api/geo/list', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"6Egkv9Dt9GeFqdYRZEgj5hpXJxDmQG3sUYq1GCTVuA\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267527430\", oauth_consumer_key=\"key\", oauth_token=\"06ef8c4b6bce0a771f040000\", oauth_signature=\"Li8w6ZcB3A2Cbiqohx%2FJYDK9Kxo%3D\", oauth_version=\"1.0\"", "host": "localhost:3000"}, {}, function(err, result) {
        err.should.be_an_instance_of oauth.OAuthProviderError
        err.statusCode.should.eql 400
        err.message.should.eql "Invalid / expired Token"
      });
    end
    
    it 'Should fail due to missing parameters'    
      var oauthServices = new oauth.OAuthServices({
        tokenByConsumer: function(consumerKey, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {}, userByConsumerKey: function(consumerKey, callback) {},
        cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {}, validateNotReplay: function(accessToken, timestamp, nonce, callback) {},
        userByConsumerKey: function(consumerKey, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, previousRequestToken: function(token, callback) {}, generateAccessToken: function(oauthToken, callback) {},
    
        validToken: function(accessToken, callback) { callback(new Error('fail'), null); }
      })
  
      oauthServices.authorize('GET', 'http', 'localhost:3000', '/api/geo/list', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"6Egkv9Dt9GeFqdYRZEgj5hpXJxDmQG3sUYq1GCTVuA\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267527430\", oauth_consumer_key=\"key\", oauth_signature=\"Li8w6ZcB3A2Cbiqohx%2FJYDK9Kxo%3D\", oauth_version=\"1.0\"", "host": "localhost:3000"}, {}, function(err, result) {
        err.should.be_an_instance_of oauth.OAuthBadRequestError
        err.statusCode.should.eql 400
        err.message.should.eql "Missing required parameter"
      });
    end
    
    it 'Should fail due to timestamp and nonce already used'    
      var oauthServices = new oauth.OAuthServices({
        tokenByConsumer: function(consumerKey, callback) {}, authenticateUser: function(username, password, oauthToken, callback) {},
        cleanRequestTokens: function(consumerKey, callback) {}, generateRequestToken: function(oauthConsumerKey, oauthCallback, callback) {},
        userByConsumerKey: function(consumerKey, callback) {}, tokenByConsumer: function(consumerKey, callback) {}, previousRequestToken: function(token, callback) {}, generateAccessToken: function(oauthToken, callback) {},
      
        validToken: function(accessToken, callback) { callback(null, {access_token:'06ef8c4b6bce0a771f040000', token_secret:'f8ee8c4b0c7f0d771f020000'}); },
        validateNotReplay: function(accessToken, timestamp, nonce, callback) { callback(new Error('fail'), null); },
        userByConsumerKey: function(consumerKey, callback) {}            
      })
  
      oauthServices.authorize('GET', 'http', 'localhost:3000', '/api/geo/list', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"6Egkv9Dt9GeFqdYRZEgj5hpXJxDmQG3sUYq1GCTVuA\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267527430\", oauth_consumer_key=\"key\", oauth_token=\"06ef8c4b6bce0a771f040000\", oauth_signature=\"Li8w6ZcB3A2Cbiqohx%2FJYDK9Kxo%3D\", oauth_version=\"1.0\"", "host": "localhost:3000"}, {}, function(err, result) {
        err.should.be_an_instance_of oauth.OAuthUnauthorizedError
        err.statusCode.should.eql 401
        err.message.should.eql "Invalid / used nonce"
      });
    end
  end  
end















