//
//  Tests for OAuthServices protocol
//
describe 'OAuthServices'
  before_each
  end
  
  describe 'OAuthServices Request Token'
    it 'Should Correctly Request token' 
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(callback, token) {}, tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, authenticateUser: function(callback, username, password, oauthToken) {}, generateAccessToken: function(callback, oauthToken) {},

        userByConsumerKey: function(callback, consumerKey) { callback({consumer_key:'key', secret:'secret'}); },
        cleanRequestTokens: function(callback, consumerKey) {callback();},
        generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) { callback({token:'token', token_secret:'token_secret'}); }
      })
        
      oauthServices.requestToken(function(result) {
        result.token.should.eql "token"
        result.token_secret.should.eql "token_secret"
        result.oauth_callback_confirmed.should.eql true
      }, 'POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267443688\", oauth_consumer_key=\"key\", oauth_signature=\"8m8arspgaA%2Bw3uHcWDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {});
    end
    
    it 'Should Fail du to no valid parameters' 
    var oauthServices = new oauth.OAuthServices({
      previousRequestToken: function(callback, token) {}, tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, authenticateUser: function(callback, username, password, oauthToken) {}, generateAccessToken: function(callback, oauthToken) {},
      cleanRequestTokens: function(callback, consumerKey) {}, generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) {},

      userByConsumerKey: function(callback, consumerKey) { callback(new Error("fail")); }
    })
  
    oauthServices.requestToken(function(result) {
      result.className.should.eql "OAuthBadRequestError"
      result.statusCode.should.eql 400
      result.message.should.eql "Missing required parameter"
    }, 'POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_signature=\"8m8arspgaA%2Bw3uHcWDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {});      
    end
    
    it 'Should Fail to retrive a user by wrong key'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(callback, token) {}, tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, authenticateUser: function(callback, username, password, oauthToken) {}, generateAccessToken: function(callback, oauthToken) {},
        cleanRequestTokens: function(callback, consumerKey) {}, generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) {},

        userByConsumerKey: function(callback, consumerKey) { callback(new Error("fail")); }
      })
    
      oauthServices.requestToken(function(result) {
        result.className.should.eql "OAuthProviderError"
        result.statusCode.should.eql 400
        result.message.should.eql "fail"
      }, 'POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267443688\", oauth_consumer_key=\"key\", oauth_signature=\"8m8arspgaA%2Bw3uHcWDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {});      
    end
    
    it 'Should Fail to retrieve request token due to illegal signature'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(callback, token) {}, tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, authenticateUser: function(callback, username, password, oauthToken) {}, generateAccessToken: function(callback, oauthToken) {},
        generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) {},

        cleanRequestTokens: function(callback, consumerKey) { callback(); },
        userByConsumerKey: function(callback, consumerKey) { callback({consumer_key:'key', secret:'secret'}); }
      })

      oauthServices.requestToken(function(result) {
        result.className.should.eql "OAuthUnauthorizedError"
        result.statusCode.should.eql 401
        result.message.should.eql "signature does not match"
      }, 'POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267443688\", oauth_consumer_key=\"key\", oauth_signature=\"8m8arspgaA%2Bw3uHcaDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {});      
    end
    
    it 'Should Fail to generate a token due to an internal provider error generating a request'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(callback, token) {}, tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, authenticateUser: function(callback, username, password, oauthToken) {}, generateAccessToken: function(callback, oauthToken) {},

        userByConsumerKey: function(callback, consumerKey) { callback({consumer_key:'key', secret:'secret'}); },
        cleanRequestTokens: function(callback, consumerKey) {callback();},
        generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) { callback(new Error('fail')); }
      })
      
      oauthServices.requestToken(function(result) {
        result.className.should.eql "OAuthProviderError"
        result.statusCode.should.eql 400
        result.message.should.eql "internal error"
      }, 'POST', 'http', 'localhost:3000', '/oauth/request_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"pPFsYO5Ohv2AZyOzs6g55T86kbzt3eaqlV31pJJd0\", oauth_callback=\"http%3A%2F%2Flocalhost%3A9000%2Fcallback\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267443688\", oauth_consumer_key=\"key\", oauth_signature=\"8m8arspgaA%2Bw3uHcWDv1RxtVBro%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {});      
    end
  end
  
  describe 'OAuthServices Authenticate User'
    it 'Correctly Authenticate User'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(callback, token) {}, tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, 
        generateAccessToken: function(callback, oauthToken) {}, userByConsumerKey: function(callback, consumerKey) {}, cleanRequestTokens: function(callback, consumerKey) {}, generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) {},

        authenticateUser: function(callback, username, password, oauthToken) { callback({token:'token', verifier:'verifier'}); }
      })
     
      oauthServices.authenticateUser(function(result) {
        result.token.should.eql 'token'
        result.verifier.should.eql 'verifier'
      }, 'username', 'password', 'oauthToken');     
    end
    
    it 'Should fail due no internal error'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(callback, token) {}, tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, 
        generateAccessToken: function(callback, oauthToken) {}, userByConsumerKey: function(callback, consumerKey) {}, cleanRequestTokens: function(callback, consumerKey) {}, generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) {},

        authenticateUser: function(callback, username, password, oauthToken) { callback({}); }
      })
   
      oauthServices.authenticateUser(function(result) {
        result.className.should.eql "OAuthProviderError"
        result.statusCode.should.eql 400
        result.message.should.eql "provider: authenticateUser must return a object with fields [token, verifier]"
      }, 'username', 'password', 'oauthToken');     
    end
    
    it 'Should fail due to missing parameters passed back'
      var oauthServices = new oauth.OAuthServices({
        previousRequestToken: function(callback, token) {}, tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, 
        generateAccessToken: function(callback, oauthToken) {}, userByConsumerKey: function(callback, consumerKey) {}, cleanRequestTokens: function(callback, consumerKey) {}, generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) {},

        authenticateUser: function(callback, username, password, oauthToken) { callback(new Error('fail')); }
      })
 
      oauthServices.authenticateUser(function(result) {
        result.className.should.eql "OAuthProviderError"
        result.statusCode.should.eql 400
        result.message.should.eql "internal error"
      }, 'username', 'password', 'oauthToken');     
    end
  end
  
  describe 'OAuthServices access token'
    it 'Should correctly authenticate user callback (from form)'
      var oauthServices = new oauth.OAuthServices({
        tokenByConsumer: function(callback, consumerKey) {}, validToken: function(callback, accessToken) {}, authenticateUser: function(callback, username, password, oauthToken) {},
        cleanRequestTokens: function(callback, consumerKey) {}, generateRequestToken: function(callback, oauthConsumerKey, oauthCallback) {}, userByConsumerKey: function(callback, consumerKey) {},

        userByConsumerKey: function(callback, consumerKey) { callback({consumer_key:'key', secret:'secret'}); },
        tokenByConsumer: function(callback, consumerKey) { callback({token:'ffe68b4be4b5073918010000', token_secret:'ffe68b4b1f90013918020000'}); },
        previousRequestToken: function(callback, token) { callback(true); },
        generateAccessToken: function(callback, oauthToken) { callback({access_token:'access_token', token_secret:'token_secret'}); }
      })
      
      oauthServices.accessToken(function(result) {
        result.access_token.should.eql "access_token"
        result.token_secret.should.eql "token_secret"
      }, 'POST', 'http', 'localhost:3000', '/oauth/access_token', {"accept": "*/*", "connection": "close", "user-agent": "OAuth gem v0.3.6", "authorization": "OAuth oauth_nonce=\"t8G01S21aZ8KwbF5OG2d93zaSM2KGNmrD5CPkZaFk\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1267459851\", oauth_consumer_key=\"key\", oauth_token=\"ffe68b4be4b5073918010000\", oauth_verifier=\"ffe68b4bbec7073918030000\", oauth_signature=\"2v9bIUrnvtur%2FntRUtn6TpLLU2w%3D\", oauth_version=\"1.0\"", "content-length": "0", "host": "localhost:3000"}, {});
    end
  end
end















