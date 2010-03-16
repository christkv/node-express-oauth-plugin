var OAuthBadRequestError = exports.OAuthBadRequestError = function(msg) {
  this.statusCode = 400;
  this.message = msg;      
}

var OAuthUnauthorizedError = exports.OAuthUnauthorizedError = function(msg) {
  this.statusCode = 401;
  this.message = msg;
}

var OAuthProviderError = exports.OAuthProviderError = function(msg) {
  this.statusCode = 400;
  this.message = msg;      
}