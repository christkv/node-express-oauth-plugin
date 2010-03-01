require('oauth/lang/oo');

exports.OAuthBadRequestError = Class({
  init: function(msg) {
    this.className = 'OAuthBadRequestError';
    this.statusCode = 400;
    this.message = msg;    
  }
});

exports.OAuthUnauthorizedError = Class({
  init: function(msg) {
    this.className = 'OAuthUnauthorizedError';
    this.statusCode = 401;
    this.message = msg;
  }
});

exports.OAuthProviderError = Class({
  init: function(msg) {
    this.className = 'OAuthProviderError';
    this.statusCode = 400;
    this.message = msg;
  }
})