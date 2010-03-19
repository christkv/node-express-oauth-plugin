var sys = require('sys');

/**
  Executor
**/
var executorFunction = function(self, f) {
  if(f instanceof ParallelFlow) {
    // Execute the parallel flow
    f.execute(function() {
      sys.puts("finished executing");
    });
    sys.puts("=============================== ParallelFlow");
  } else if(f instanceof SerialFlow) {
    sys.puts("=============================== SerialFlow");      
  } else {    
    f(function() {
    });    
    sys.puts("=============================== Execute function");      
  }      
}

/**
  Simplifier code
**/
var Simplifier = exports.Simplifier = function(context) {
  this.context = context;
}

Simplifier.prototype.execute = function() {
  this.functions = Array.prototype.slice.call(arguments, 0);
  this.results = {};
  this.finalFunction = this.functions.pop();
  this.totalNumberOfCallbacks = 0
  var self = this.context != null ? this.context : this;
  // Execute the function
  this.functions.forEach(function(f) { 
    if(f instanceof SerialFlow) {
      sys.puts("=============================== -SerialFlow");      
      f.execute(function() {
        sys.puts("++++++++++++++++++++++++++ executed serial flow");
      })
    } else {    
      sys.puts("=============================== -Execute function");      
      f(function() {
        self.totalNumberOfCallbacks = self.totalNumberOfCallbacks + 1;
        self.results[f] = Array.prototype.slice.call(arguments);     

        if(self.totalNumberOfCallbacks >= self.functions.length) {
          // Order the results by the calling order of the functions
          var finalResults = [];
          self.functions.forEach(function(f) {
            finalResults.push(self.results[f]);
          })
          // Call the final function passing back all the collected results in the right order 
          self.finalFunction.apply(self, finalResults);
        }
      });      
    }      
  });
}

/**
  Specify a set of functions to be executed in series
**/
var SerialFlow = exports.SerialFlow = function(functions) {
  this.functions = Array.prototype.slice.call(arguments, 0);
  this.totalNumberOfCallbacks = 0
  this.results = {};
}

SerialFlow.prototype.execute = function(callback) {  
  var self = this;
  this.functions.forEach(function(f) {
    if(f instanceof ParallelFlow) {
      // Execute the parallel flow
      f.execute(function() {
        sys.puts("finished executing parallel");
      });
      sys.puts("=============================== ParallelFlow");
    } else if(f instanceof SerialFlow) {
      sys.puts("=============================== SerialFlow");      
      f.execute(function() {
        sys.puts("finished executing serial");        
      });
    } else {    
      sys.puts("=============================== Execute function");      
      sys.puts(f.toString());
      f(function() {
        self.totalNumberOfCallbacks = self.totalNumberOfCallbacks + 1;
        self.results[f] = Array.prototype.slice.call(arguments);     

        if(self.totalNumberOfCallbacks >= self.functions.length) {
          // Order the results by the calling order of the functions
          var finalResults = [];
          self.functions.forEach(function(f) {
            finalResults.push(self.results[f]);
          })
          // Call the final function passing back all the collected results in the right order 
          // self.finalFunction.apply(self, finalResults);
          callback.apply(self, finalResults);
        }        
      });    
    }      
  });
}

/**
  Specify a set of functions to be executed in parallel
**/
var ParallelFlow = exports.ParallelFlow = function(functions) {
  this.functions = Array.prototype.slice.call(arguments, 0);
}

ParallelFlow.prototype.execute = function(callback) {  
}