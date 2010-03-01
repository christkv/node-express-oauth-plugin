//
//  Tests for OAuthServices protocol
//
describe 'OAuthServices'
  before_each
  end
  
  describe 'OAuthServices'
    it 'Should Correctly Parse Auth Header' 
      var oauthServices = new oauth.OAuthServices({})
      oauthServices.requestToken(function(result) {
        
      }, 'POST', 'http', 'localhost:3000', '/oauth/request_token', {'authorization':"OAuth oauth_nonce=\"kMM23PxoSOVKKEPRoalAXsCoTWCQJn4TV7UAROhzk\", oauth_callback=\"oob\", oauth_signature_method=\"HMAC-SHA1\", oauth_timestamp=\"1266417659\", oauth_consumer_key=\"key\", oauth_signature=\"ZRqLbARZG%2Bx%2BGvip9tC0fmzc2TU%3D\", oauth_version=\"1.0\""}, {});
    end
  end
end















