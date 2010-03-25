require.paths.unshift('lib');
require.paths.unshift('../lib');

// Require the kiwi package manager
var kiwi = require('kiwi'),
  express = kiwi.require('express'),
  sys = require('sys'),
  querystring = require('querystring');
  
// Require the express libary
require('express');
require('express/plugins');

// Initialize the seeds  
kiwi.seed('mongodb-native');
kiwi.seed('simplify');

// Fetch the oauth library
var oauth = require('oauth');
var simplifier = require('simplifier');

// Our provider
var mongo = require('mongodb');
var oauth_example = require('oauth/oauth_data_provider');

// Set up a Db and open connection to the mongodb
var db = new mongo.Db('oauth_example', new mongo.Server("127.0.0.1", 27017, {auto_reconnect: true}, {}));
db.open(function(err, db) {});

configure(function(){
  kiwi.seed('haml')
  kiwi.seed('sass')  
  
  use(MethodOverride);
  use(ContentLength);
  use(Logger);
  use(Cookie);
  use(Session);
  use(Flash);
      
  /**
    Handle the rendering of the form for the user to authenticate the oauth session
  **/
  var authenticateProvider = function() {    
    this.render('authenticate.haml.html', {
      locals: {
        flashes: this.flash('info'),
        token: this.param('oauth_token')
      }  
    });
  };

  /**
    Handle the post back from the oauth authentication session (here you can build additional leves such as
    handling authorization for the application)
  **/
  var authorizeProvider = function(err, authorized, authResults, application, user) {  
    var self = this;
      
    if(err) {
      // If there's an authorization error redirect to initial login page
      this.render('authenticate.haml.html', {
        locals: {
          flashes: ['No such user or wrong password'],
          token: authResults.token
        }  
      });
    } else {      
      // the services layer provides authorization support as well
      self.render('authorize.haml.html', {
        locals: {
          flashes: self.flash('info'),
          token: authResults.token,
          verifier: authResults.verifier,
          application:application,
          user:user
        }                        
      });                                                         
    }
  };
  
  // *   - request_token_url        'web path for the request token url endpoint, default: /oauth/request_token'
  // *   - authorize_url            'web path for the authorize form, default: /oauth/authorize' (get/post)
  // *   - access_token_url         'web path for the access token url endpoint, default: /oauth/access_token'
  // *   - authenticate_provider    'function to render a authentication form'
  // *   - authorize_provider       'function to handle the authorization of the user and application'
  // *   - oauth_provider           'db instance providing needed authentication mechanisms'
  use(oauth.OAuth, {request_token_url:'/oauth/request_token', 
                          authorize_url:'/oauth/authorize',
                          access_token_url:'/oauth/access_token',
                          authenticate_provider:authenticateProvider,
                          authorize_provider:authorizeProvider,
                          oauth_provider:new oauth_example.OAuthDataProvider(db)});  
  set('root', __dirname);
});

/**
  Awesome methods
**/
oauth_get('/api/geo/list:format?', function(format) {
  sys.puts("=================== format: " + format);
  // sys.puts(sys.inspect(this));
  this.halt(200, "Done 2");
});

/**
  Static file providers
**/
get('/public/*', function(file){
  this.sendfile(__dirname + '/public/' + file)
})

get('/*.css', function(file){
  this.render(file + '.sass.css', { layout: false })
})

run()