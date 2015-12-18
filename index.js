var asyn = require('async');
var extend = require('extend');

// Wrap it with async
function wrap(callback, arg){
  return callback ? asyn.apply(callback, arg) : false;
}

function init(arg, data, callback){
  // If there are any arguments, extend it
  callback(null, arg.length ? extend.apply(false, data, arg) : data);
}

// Pipe it!
var pipe = function(callback, arg, autopipe){
  
  // Avoid having to call "new pipe()" and make sure we're dealing with an obj
  return !(this instanceof pipe) ?     // !() http://stackoverflow.com/q/8875878
  
    // First time we are defined the initial value (it's in the first pos, on 'callback')
    new pipe(wrap(init, Array.prototype.slice.call(arguments, 1)), callback, autopipe) :
    
    // Add to the callback stack, stackoverflow.com/a/14614169
    this.push(callback, arg);
};

pipe.prototype.callbacks = [];

// Add a callback to the stack
pipe.prototype.push = function(callback, arg){
  if (callback) this.callbacks = this.callbacks.concat(wrap(callback, arg));
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
