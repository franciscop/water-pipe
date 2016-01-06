var asyn = require('async');
var extend = require('extend');

// Wrap it with async
function wrap(userFn, userArgs){
  
  function waterFall(){
    waterArgs = Array.prototype.slice.call(arguments);
    
    //userFn = asyn.apply(userFn, userArgs);
    var trueCall = waterArgs.pop();
    var previous = waterArgs.pop();
    waterArgs = [trueCall, previous].concat(waterArgs);
    
    userFn.apply(null, waterArgs);
  }
  
  userArgs.forEach(function(arg){
    waterFall = asyn.apply(waterFall, arg);
  });
  
  //userFn = asyn.apply(userArgs[0]);
  //userFn = asyn.apply(userFn, trueprev);
  //userFn(keep, next);
  
  return waterFall;
}


function init(data){
  
  var data = Array.prototype.slice.call(data);
  
  if (data.length > 1) {
    // Change the array-like arguments for the first round into a proper object
    data = Array.prototype.slice.call(data).reduce(function(extra, one){
      return extend(one, extra);
    }, data);
  } else {
    data = data[0];
  }
  
  

  return function(callback){
    callback(null, data);
  }
}

// Pipe it!
function pipe(callback){
  
  // Avoid having to call "new pipe()" and make sure we're dealing with an obj
  return !(this instanceof pipe) ?     // !() http://stackoverflow.com/q/8875878
  
    // First time we are defined the initial value (it's in the first pos, on 'callback')
    new pipe(init(arguments)) :
    
    // Add to the callback stack, stackoverflow.com/a/14614169
    this.push(callback, arguments);
};

pipe.prototype.callbacks = [];

// Add a callback to the stack
pipe.prototype.push = function(callback, args){
  
  // Add a callback to the list of callbacks
  if (callback){
    this.callbacks = this.callbacks.concat(wrap(callback, Array.prototype.slice.call(args, 1)));
  }
  
  return this;
};

// Make pipe() chainable to pipe()
pipe.prototype.pipe = pipe;

// Allow for ending the pipeline
pipe.prototype.end = function(callback){
  asyn.waterfall(this.callbacks, callback);
};

// Make it usable
module.exports = pipe;
module.exports.extend = extend;
