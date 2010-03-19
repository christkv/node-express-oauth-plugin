require.paths.unshift('lib');
require.paths.unshift('../lib');
require.paths.unshift('external-lib');

// Require the kiwi package manager
var kiwi = require('kiwi'),
  express = kiwi.require('express'),
  sys = require('sys'),
  simplifier = require('simplifier/simplifier');

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
  kiwi.seed('haml')
  kiwi.seed('sass')  
  
  use(MethodOverride);
  use(ContentLength);
  use(CommonLogger);  
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
      
      
      // This part of the application authorization process is optional and not covered by the 
      // oauth plugin. It deals with the authorization of the application key used to generate
      // the oauth access token
      
      // Fetch the application to show the information about the app being authorized
      // new simplifier.Simplifier().execute(
      //   function(callback) {
      //     db.collection('oauth_applications', function(err, applicationCollection) {
      //       applicationCollection.findOne({'consumer_key':authResults.consumer_key}, function(err, oauthApplicationDoc) {
      //         callback(err, oauthApplicationDoc);
      //       });
      //     });
      //   },
      //   
      //   function(callback) {
      //     db.collection('oauth_users_request_tokens', function(err, requestCollection) {
      //       requestCollection.findOne({'token':authResults.token}, function(err, requestDoc) {
      //         // Use the request to fetch the associated user
      //         db.collection('users', function(err, userCollection) {
      //           userCollection.findOne({'username':requestDoc.username}, function(err, userDoc) {
      //             callback(err, requestDoc, userDoc);
      //           });
      //         });
      //       });
      //     });          
      //   },
      //   
      //   // All results coming back are arrays function1 [err, doc] function2 [err, doc1, doc2]
      //   function(oauthApplicationDocResult, userDocResult) {          
      //     // Render the authorization page
      //     self.render('authorize.haml.html', {
      //       locals: {
      //         flashes: self.flash('info'),
      //         token: authResults.token,
      //         verifier: authResults.verifier,
      //         application:oauthApplicationDocResult[1],
      //         user:userDocResult[1]
      //       }                        
      //     });                                                         
      //   }
      // );      
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

get('/', function() {  
  // 
  //  Create Serial flow for simplifier feeding chaining the functions
  //
  var fetchApplicationAndUser = new simplifier.SerialFlow(
    function(callback) {
      // db.collection('oauth_users_request_tokens', function(err, requestCollection) {
      //   requestCollection.findOne({'token':'7866a24bdaf203f509010000'}, function(err, requestDoc) {
      //     callback(err, requestDoc);
      //   })
      // });
      callback(null, {doc:'requestDoc'});
    }, 
    
    function(err, requestDoc, callback) {
      // Use the request to fetch the associated user
      // db.collection('users', function(err, userCollection) {
      //   userCollection.findOne({'username':'christkv'}, function(err, userDoc) {
      //     callback(err, requestDoc, userDoc);
      //   });
      // });      
      callback(null, {doc:'userDoc'});
    }
  );
  
  //
  //  Define the Parallel flow
  //
  var fetchAllParts = new simplifier.ParallelFlow(
    // Fetch the application object
    function(callback) {
      // db.collection('oauth_applications', function(err, applicationCollection) {
      //   applicationCollection.findOne({'consumer_key':'key'}, function(err, oauthApplicationDoc) {
      //     callback(err, oauthApplicationDoc);
      //   });
      // });
      callback(null, {doc:'oauthApplicationDoc'});
    },    
    // Fetches the application and user document
    fetchApplicationAndUser
  )
  
  //
  //  Execute all the functions and feed results into final method
  //  
  new simplifier.Simplifier().execute(
    // Execute flow
    // fetchAllParts,    
    fetchApplicationAndUser,
    // All results coming back are arrays function1 [err, doc] function2 [err, doc1, doc2]
    function(oauthApplicationDocResult, userDocResult) {          
      sys.puts(sys.inspect(oauthApplicationDocResult));
      sys.puts(sys.inspect(userDocResult));
    }
  );        
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