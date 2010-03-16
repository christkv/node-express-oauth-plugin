[
  'oauth', 'oauth_error', 'oauth_services', 'crypto/sha1'
].forEach(function(path){
	var module = require('./' + path);
	for (var i in module)
		exports[i] = module[i];
});