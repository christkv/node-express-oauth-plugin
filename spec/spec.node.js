require.paths.unshift("./spec/lib", "./lib");
process.mixin(GLOBAL, require("sys"))

sys = require("sys")
oauth = require("oauth/oauth_services");

require("jspec")

var posix = require('posix')

quit = process.exit
print = puts

readFile = function(path) {
  var promise = posix.cat(path, "utf8")
  var result = ''
  promise.addErrback(function(){ throw "failed to read file `" + path + "'" })
  promise.addCallback(function(contents){
    result = contents
  })
  promise.wait()
  return result
}

if (process.ARGV[2])
  JSpec.exec('spec/spec.' + process.ARGV[2] + '.js')  
else
  JSpec
    .exec('spec/spec.oauth_services.js')
JSpec.run({ reporter: JSpec.reporters.Terminal, failuresOnly: true })
JSpec.report()

