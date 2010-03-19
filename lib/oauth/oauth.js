sys = require('sys');
var oauth = require('oauth/oauth_services'), 
  errors = require('oauth/oauth_error'),
  querystring = require('querystring');
var plugin = null;

exports.OAuth = Plugin.extend({
  extend: {    
     /**
      * Initialize Oauth options.
      *
      * Options:
      *

      *   - request_token_url        'web path for the request token url endpoint, default: /oauth/request_token'
      *   - authorize_url            'web path for the authorize form, default: /oauth/authorize' (get/post)
      *   - access_token_url         'web path for the access token url endpoint, default: /oauth/access_token'
      *   - authenticate_provider    'function to render a authentication form'
      *   - authorize_provider       'function to handle the authorization of the user and application'
      *   - oauth_provider           'db instance providing needed authentication mechanisms'
      *
      * @param  {hash} options
      * @api private
      **/
    init: function (options) {
      // Ensure we have default values and legal options
      options['request_token_url'] = options['request_token_url'] != null ? options['request_token_url'] : '/oauth/request_token';
      options['authorize_url'] = options['authorize_url'] != null ? options['authorize_url'] : '/oauth/authorize';
      options['access_token_url'] = options['access_token_url'] != null ? options['access_token_url'] : '/oauth/access_token';
      // Both authorize handler and oauth provider must be provided
      if(options['authenticate_provider'] == null) throw Error("No Authentication provider provided");
      if(options['authorize_provider'] == null) throw Error("No Authorization provider provided");
      if(options['oauth_provider'] == null) throw Error("No OAuth provider provided");
      // Set up the OAuth provider and data source
      options['oauth_service'] = new oauth.OAuthServices(options['oauth_provider']);
      // Mixin in all the options (setting them)
      for(var name in options) {
        this[name] = options[name];
      }
      // Define reference
      plugin = this;
      
      /**
        OAuth Methods Handle the Request token request
      **/
      post(options['request_token_url'], function() {        
        var self = this;        
        plugin.oauth_service.requestToken(this.method, 'http', this.headers['host'], this.url.href, this.headers, this.params, function(err, result) {    
          if(err) {
            self.halt(err.statusCode, err.message)
          } else {
            self.halt(200, ["oauth_token=" + result["token"], "oauth_token_secret=" + result["token_secret"], "oauth_callback_confirmed=" + result["oauth_callback_confirmed"]].join("&"));            
          }
        });
      });      
      
      /**
        OAuth Methods Handle the Authorization form rendering
      **/
      get(options['authorize_url'], function() {
        // Delegate the form rendering to the function supplied by the application
        plugin.authenticate_provider.call(this);
      });
      
      /**
        OAuth Methods Handle the Authorization form postback
      **/
      post(options['authorize_url'], function() {
        var self = this;
        
        plugin.oauth_service.authenticateUser(this.param('username'), this.param('password'), this.param('oauth_token'), function(err, result) {                       
          if(err) {
            // Delegate to the function of the user
            plugin.authorize_provider.call(self, err, false, {token:self.param('oauth_token')});
          } else {
            if(result.callback != null && result.callback != "oob") {
              // Signal that a redirect is in order after finished process
              result['redirect_url'] = querystring.unescape(result.callback) + "?oauth_token=" + result.token + "&oauth_verifier=" + result.verifier;
            }
            
            // Fetch the needed data
            plugin.oauth_service.fetchAuthorizationInformation(this.param('username'), result.token, function(err, application, user) {
              // Signal callback about finish authorization
              plugin.authorize_provider.call(self, null, true, result, application, user);
            });
          }          
        });
      }); 
      
      /**
        OAuth Methods Handle the Retrieve Access token
      **/
      post(options['access_token_url'], function() {
        var self = this;
        plugin.oauth_service.accessToken(this.method, 'http', this.headers['host'], this.url.href, this.headers, this.params, function(err, result) {
          if(err) {
            self.halt(err.statusCode, err.message);
          } else {          
            self.halt(200, "oauth_token=" + result.access_token + "&oauth_token_secret=" + result.token_secret);
          }
        });
      });  
    }
  }
});

/**
  Global Defines for oauth methods
**/
oauth_get = function(path, options, fn) {  
  // Ensure we map the correct values
  if (options instanceof Function) { fn = options, options = {} }  
  // Let's wrap the function call in our oauth code
  get(path, options, function() { 
    // Ensure context is kept
    var self = this;  
    var self_arguments = arguments;
    // Attempt authorization
    plugin.oauth_service.authorize(self.method, 'http', self.headers['host'], self.url.href, self.headers, self.params, function(err, result) {
      err != null ? self.halt(err.statusCode, err.message) : fn.apply(self, self_arguments);
    });
  });
};

oauth_post = function(path, options, fn) {  
  // Ensure we map the correct values
  if (options instanceof Function) { fn = options, options = {} }  
  // Let's wrap the function call in our oauth code
  post(path, options, function() { 
    // Ensure context is kept
    var self = this;  
    var self_arguments = arguments;
    // Attempt authorization
    plugin.oauth_service.authorize(self.method, 'http', self.headers['host'], self.url.href, self.headers, self.params, function(err, result) {
      err != null ? self.halt(err.statusCode, err.message) : fn.apply(self, self_arguments);
    });
  });
};

oauth_put = function(path, options, fn) {  
  // Ensure we map the correct values
  if (options instanceof Function) { fn = options, options = {} }  
  // Let's wrap the function call in our oauth code
  put(path, options, function() { 
    // Ensure context is kept
    var self = this;  
    var self_arguments = arguments;
    // Attempt authorization
    plugin.oauth_service.authorize(self.method, 'http', self.headers['host'], self.url.href, self.headers, self.params, function(err, result) {
      err != null ? self.halt(err.statusCode, err.message) : fn.apply(self, self_arguments);
    });
  });
};

oauth_del = function(path, options, fn) {  
  // Ensure we map the correct values
  if (options instanceof Function) { fn = options, options = {} }  
  // Let's wrap the function call in our oauth code
  del(path, options, function() { 
    // Ensure context is kept
    var self = this;  
    var self_arguments = arguments;
    // Attempt authorization
    plugin.oauth_service.authorize(self.method, 'http', self.headers['host'], self.url.href, self.headers, self.params, function(err, result) {
      err != null ? self.halt(err.statusCode, err.message) : fn.apply(self, self_arguments);
    });
  });
};
