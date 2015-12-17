var asyn = require('async');


function wrap(callback, arg){
  return callback ? asyn.apply(callback, arg) : false;
}

var pipe = function(callback, arg, autopipe){
  
  // Avoid having to call "new pipe()" and make sure we're dealing with an obj
  if (!(this instanceof pipe)) {    // !() http://stackoverflow.com/q/8875878
    
    // First time we should wrap it since there's no initial value
    callback = wrap(callback, arg);
    return new pipe(callback, {}, autopipe);
  }
  
  // Create array if nonexistent and push calback, stackoverflow.com/a/14614169
  return this.add(callback, arg);
};

pipe.prototype.callbacks = [];

// Add a callback to the stack
pipe.prototype.add = function(callback, arg){
  if (callback) this.callbacks = this.callbacks.concat(wrap(callback, arg));
  return this;
};

// Make pipe() chainable to pipe()
pipe.prototype.pipe = pipe;

// Allow for ending the pipeline
pipe.prototype.end = function(callback){
  asyn.waterfall(this.callbacks, callback);
};

module.exports = pipe;



