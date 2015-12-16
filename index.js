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

function isFunction(fn){
  return fn && typeof fn === "function";
}


var pipe = function(callback, arg, autopipe){
  
  // Avoid having to call "new pipe()"
  if (!(this instanceof pipe)) {    // !() http://stackoverflow.com/q/8875878
    
    // console.log("ARGUMENTS INIT ", arguments);
    // First time we should wrap it really tight since there's no initial value
    callback = wrap(wrap(callback, arg), {});
    return new pipe(callback, arg, autopipe);
  }
    
  // Wrap it only if there's something to wrap
  this.callbacks = this.callbacks || [];
  
  // Make sure to only push the good ones
  this.callbacks.push(callback);
  
  this.pipe = function(callback, arg, autopipe){
    callback = wrap(callback, arg);
    var self = new pipe(callback, arg, autopipe);
    self.callbacks = this.callbacks.concat(self.callbacks);
    return self;
  };
  
  this.end = function(callback){
    if (!callback) throw new Error("end needs a callback");
    asyn.waterfall(this.callbacks.filter(isFunction), callback);
  };
  
  return this;
};

module.exports = pipe;



