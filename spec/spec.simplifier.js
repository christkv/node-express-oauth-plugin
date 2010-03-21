//
//  Tests for Simplifier dispatcher
//
describe 'Simplifier'
  before_each
  end
  
  /** 
    Serial flow execution
  **/  
  describe 'Serial Flow'
    it 'Should Correctly Execute Simple Serial Flow' 
      // Keep track of running
      var running = true;
      // Define a serial flow
      var serialFlow = new simplifier.SerialFlow(
        function(callback) { callback(null, {doc:'requestDoc'}); }, 
        function(err, requestDoc, callback) { callback(null, {doc:'userDoc'}); }
      );

      //
      //  Execute all the functions and feed results into final method
      //  
      new simplifier.Simplifier().execute(
        // Flow to execute
        serialFlow,
        // All results coming back are arrays function1 [err, doc] function2 [err, doc1, doc2]
        function(err, userDocResult) {  
          err.should.be_null
          userDocResult.doc.should.eql "userDoc"
          // Signal test finished
          running = false;
        }
      ); 
      
      var intervalId = setInterval(function() {
        while(running) {}
        clearInterval(intervalId);
      }, 100);             
      // Trigger mock timer to start the execution
      tick(100);          
    end
  end
  
  /** 
    Parallel flow execution
  **/  
  describe 'Parallel Flow'
    it 'Should Correcly Execute Simple Parallel Flow'
      // Keep track of running
      var running = true;
      // Define a parallel flow
      var parallelFlow = new simplifier.ParallelFlow(
        function(callback) { callback(null, {doc:'requestDoc'}); }, 
        function(err, requestDoc, callback) { callback(null, {doc:'userDoc'}); }
      );
  
      //
      //  Execute all the functions and feed results into final method
      //  
      new simplifier.Simplifier().execute(
        // Flow to execute
        parallelFlow,
        // All results coming back are arrays function1 [err, doc] function2 [err, doc1, doc2]
        function(requestDocResult, userDocResult) { 
          requestDocResult.err.should.be_null
          requestDocResult.results.length.should.eql 1
          requestDocResult.results[0].doc.should.eql "requestDoc"          
                   
          userDocResult.err.should.be_null
          userDocResult.results.length.should.eql 1
          userDocResult.results[0].doc.should.eql "userDoc"
          // Signal test finished
          running = false;
        }
      ); 
    
      var intervalId = setInterval(function() {
        while(running) {}
        clearInterval(intervalId);
      }, 100);             
      // Trigger mock timer to start the execution
      tick(100);          
    end
  end 
end
