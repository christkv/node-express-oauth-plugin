var sys = require('sys');

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
    if(f instanceof SerialFlow || f instanceof ParallelFlow) {
      f.execute(function(results) {
        self.finalFunction.apply(self, results);
      })
    // } else {    
    //   sys.puts("=============================== -Execute function");      
    //   f(function() {
    //     self.totalNumberOfCallbacks = self.totalNumberOfCallbacks + 1;
    //     self.results[f] = Array.prototype.slice.call(arguments);     
    // 
    //     if(self.totalNumberOfCallbacks >= self.functions.length) {
    //       // Order the results by the calling order of the functions
    //       var finalResults = [];
    //       self.functions.forEach(function(f) {
    //         finalResults.push(self.results[f]);
    //       })
    //       // Call the final function passing back all the collected results in the right order 
    //       self.finalFunction.apply(self, finalResults);
    //     }
    //   });      
    }      
  });
}

/**
  Specify a set of functions to be executed in series
**/
var SerialFlow = exports.SerialFlow = function(functions) {
  this.functions = Array.prototype.slice.call(arguments, 0);
}

SerialFlow.prototype.execute = function(callback) {  
  this.serialExecute([], this.functions.splice(0, 1)[0], callback);
}

SerialFlow.prototype.serialExecute = function(values, f, callback) {
  var self = this;
  
  // If this is a parallel flow
  if(f instanceof ParallelFlow) {
    f.execute(function() {
      if(self.functions.length > 0) {
        var nextFunction = self.functions.splice(0, 1)[0];
        var results = Array.prototype.slice.call(arguments)[0];
        self.serialExecute(results, nextFunction, callback);           
      } else {
        callback(Array.prototype.slice.call(arguments));        
      }
    });
  } else {
    // Add a callback to handle the results
    values.push(function() {
      if(self.functions.length > 0) {
        var nextFunction = self.functions.splice(0, 1)[0];
        var results = Array.prototype.slice.call(arguments);
        self.serialExecute(results, nextFunction, callback);           
      } else {
        callback(Array.prototype.slice.call(arguments));
      }
    });
    // Execute the code
    f.apply(self, values);    
  }  
}

/**
  Specify a set of functions to be executed in parallel
**/
var ParallelFlow = exports.ParallelFlow = function(functions) {
  this.functions = Array.prototype.slice.call(arguments, 0);
  this.numberOfCallsPerformed = 0;
  this.results = [];
  this.indexes = {};
}

ParallelFlow.prototype.execute = function(callback) {
  var self = this;
    
  for(var i = 0; i < this.functions.length; i++) {
    if(this.functions[i] instanceof SerialFlow) {
      this.functions[i].execute(function() {
        self.results[i] = Array.prototype.slice.call(arguments)[0];
        self.numberOfCallsPerformed = self.numberOfCallsPerformed + 1;        
        if(self.numberOfCallsPerformed >= self.functions.length) {
          callback(self.results);
        }
      })
    } else {
      this.functions[i](function() {
        self.results[i] = Array.prototype.slice.call(arguments);
        self.numberOfCallsPerformed = self.numberOfCallsPerformed + 1;
        if(self.numberOfCallsPerformed >= self.functions.length) {
          callback(self.results);
        }
      });      
    }
  }
}


