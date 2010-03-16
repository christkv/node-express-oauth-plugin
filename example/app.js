require.paths.unshift('lib');
require.paths.unshift('../lib');

// Require the kiwi package manager
var kiwi = require('kiwi'),
  express = kiwi.require('express'),
  sys = require('sys')

// Require the express libary
require('express');
require('express/plugins');

// Initialize the seeds  
kiwi.seed('mongodb-native');

// Fetch the library records
var mongo = require('mongodb');

// Fetch the oauth library
var oauth = require('oauth');

// Our provider
var oauth_example = require('oauth/oauth_data_provider');

// Set up a Db and open connection to the mongodb
var db = new mongo.Db('oauth_example', new mongo.Server("127.0.0.1", 27017, {auto_reconnect: true}, {}));
db.open(function(db) {});

configure(function(){
  use(MethodOverride);
  use(ContentLength);
  use(CommonLogger);  
  use(Cookie);
  use(Session);
  use(Flash);
  
  // *   - request_token_url    'web path for the request token url endpoint, default: /oauth/request_token'
  // *   - authorize_url        'web path for the authorize form, default: /oauth/authorize' (get/post)
  // *   - access_token_url     'web path for the access token url endpoint, default: /oauth/access_token'
  // *   - authorize_handler    'function to handle the authorization of the user'  
  use(oauth.OAuth, {request_token_url:'/oauth/request_token', 
                          authorize_url:'/oauth/authorize',
                          access_token_url:'/oauth/access_token',
                          authorize_handler:function() {},
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