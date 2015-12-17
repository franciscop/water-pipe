var asyn = require('async');

// module.exports = function(callback, arg, autopipe){
//   
//   var callbacks = [];
//   
//   // Add it as the first parameter to the callback
//   // The first parameter has no data to send back, so we mock it
//   if (callback && typeof callback === 'function') {
//     callbacks.push(asyn.apply(callback, arg, {}));
//   }
//   
//   var response = {
//     pipe: repipe.bind(this, callbacks),
//     end: end.bind(this, callbacks)
//   };
//   
//   // The first one behaves differently so we re-define it
//   function repipe(callbacks, callback, arg, autopipe){
//     if (callback && typeof callback === 'function'){
//       callbacks.push(asyn.apply(callback, arg));
//     }
//     
//     //response.end = response.end.bind(this, callbacks);
//     return response;
//   }
//   
//   function end(callbacks, callback){
//     asyn.waterfall(callbacks, callback);
//   }
//   
//   return response;
// };



function wrap(callback, arg){
  if (callback) {
    return asyn.apply(callback, arg || {});
  }
}

var pipe = function(callback, arg, autopipe){
  
  // Avoid having to call "new pipe()" and make sure we're dealing with an obj
  if (!(this instanceof pipe)) {    // !() http://stackoverflow.com/q/8875878
    
    // First time we should wrap it since there's no initial value
    callback = wrap(callback, arg);
    return new pipe(callback, {}, autopipe);
  }
  
  // Create array if nonexistent and push calback, stackoverflow.com/a/14614169
  //  this.callbacks = (this.callbacks || []).concat(wrap(callback, arg));
  return this.add(callback, arg);
};

pipe.prototype.callbacks = [];

pipe.prototype.add = function(callback, arg){
  if (callback) this.callbacks = this.callbacks.concat(wrap(callback, arg));
  //this.callbacks = this.callbacks;
  //if (callback) this.callbacks.push(wrap(callback, arg));
  //if (callback) Array.prototype.push.apply(this.callbacks, wrap(callback, arg));
  //if (callback) this.callbacks.push(wrap(callback, arg));
  return this;
};

// Make pipe() chainable to pipe()
pipe.prototype.pipe = pipe;

// Allow for ending the pipeline
pipe.prototype.end = function(callback){
  asyn.waterfall(this.callbacks, callback);
};

module.exports = pipe;



