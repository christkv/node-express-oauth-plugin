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
     *   - request_token_url    'web path for the request token url endpoint, default: /oauth/request_token'
     *   - authorize_url        'web path for the authorize form, default: /oauth/authorize' (get/post)
     *   - access_token_url     'web path for the access token url endpoint, default: /oauth/access_token'
     *   - authorize_handler    'function to handle the authorization of the user'
     *   - oauth_provider       'db instance providing needed authentication mechanisms'
     *   - protected_urls       'array of protected urls'
     *
     * @param  {hash} options
     * @api private
     */
    init: function (options) {
      // Ensure we have default values and legal options
      options['request_token_url'] = options['request_token_url'] != null ? options['request_token_url'] : '/oauth/request_token';
      options['authorize_url'] = options['authorize_url'] != null ? options['authorize_url'] : '/oauth/authorize';
      options['access_token_url'] = options['access_token_url'] != null ? options['access_token_url'] : '/oauth/access_token';
      // Both authorize handler and oauth provider must be provided
      if(options['authorize_handler'] == null) throw Error("No Authorization handler provided");
      if(options['oauth_provider'] == null) throw Error("No OAuth provider provided");
      // Set up the OAuth provider and data source
      options['oauth_service'] = new oauth.OAuthServices(options['oauth_provider']);
      // Mixin in all the options (setting them)
      process.mixin(this, options);
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
      // Show the form for the authorization request
      get(options['authorize_url'], function() {
        this.render('authorize.haml.html', {
          locals: {
            flashes: this.flash('info'),
            token: this.param('oauth_token')
          }  
        })        
      });
      
      /**
        OAuth Methods Handle the Authorization form postback
      **/
      post(options['authorize_url'], function() {
        var self = this;
        plugin.oauth_service.authenticateUser(this.param('username'), this.param('password'), this.param('oauth_token'), function(err, result) {   
          if(err) {
            self.halt(err.statusCode, err.message);
          } else {
            if(result.callback != null && result.callback != "oob") {
              self.redirect(querystring.unescape(result.callback) + "?oauth_token=" + result.token + "&oauth_verifier=" + result.verifier);
            } else {
              self.render('authorize_complete.haml.html', {
                locals: {
                  flashes: self.flash('info'),
                  token: result.token,
                  verifier: result.verifier
                }            
              });
            }            
          }          
        });
      }); 
      
      /**
        OAuth Methods Handle the Retrieve Access token
      **/
      post(options['access_token_url'], function() {
        sys.puts("================================================================================= 1");
        
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
