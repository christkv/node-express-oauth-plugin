require.paths.unshift('../../lib');
require.paths.unshift('../../external-libs');

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
var mongo = require('mongodb'),
  MD5 = require('mongodb/crypto/md5');


// Create the connection
new mongo.Db('oauth_example', new mongo.Server("127.0.0.1", 27017, {}, {})).open(function(err, db) {
  // fetch a user
  db.collection('oauth_applications', function(err, collection) {
    collection.findOne({'consumer_key':'key'}, function(err, doc) {
      if(doc == null) {
        collection.save({'consumer_key':'key', 'secret':'secret', 'title':'Wonderbar app', 'description':'A wonderful application that does nothing'}, function(err, docs) {});              
      }
    });    
  });	    
  
  db.collection('users', function(err, collection) {
    collection.findOne({'username':'christkv'}, function(err, doc) {
      if(doc == null) {
        var password = MD5.hex_md5('christkv');
        collection.save({'username':'christkv', 'password':password}, function(err, docs) {});
      }
    });
  });
});