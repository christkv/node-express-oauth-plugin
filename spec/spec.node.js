require.paths.unshift("./spec/lib");
require.paths.unshift("./lib");
var sys = require('sys');
for (var key in sys)
	GLOBAL[key] = sys[key];

// Require the kiwi package manager
var kiwi = require('kiwi'),
  express = kiwi.require('express'),
  sys = require('sys')

// Require the express libary
require('express');
require('express/plugins');

// Fetch oauth library
oauth = require('oauth');

// Require jspec for running tests
require("jspec")

var posix = require('fs')

quit = process.exit
print = puts

readFile = function(path) {
  return posix.readFileSync(path);
}

if (process.ARGV[2])
  JSpec.exec('spec/spec.' + process.ARGV[2] + '.js')  
else
  JSpec
    .exec('spec/spec.oauth_services.js')
JSpec.run({ reporter: JSpec.reporters.Terminal, failuresOnly: true })
JSpec.report()