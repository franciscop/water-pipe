# Water Pipe

A small *async* piping utility for Node.js. It's a wrapper of [**water**​fall](https://github.com/caolan/async#waterfall) inspired by \*nix **pipe**. Its main advantages are:

- Stop the [callback hell](http://callbackhell.com/) keeping it plain
- Handle errors elegantly
- Modularize your code with a reusable interface



## Getting started

Install it to your node project:

```bash
npm install water-fall --save
```

Include it and you are ready to use it:

```js
var pipe = require('water-fall');

pipe(op1, '1').pipe(op2).pipe(op1, 'b').end(function(err, data){
  console.log(data);
});
```



## Definition

The common interface for unix pipe `|` is the string, but in javascript functions and objects cannot be stringify easily so the common interface is a simple object `{}` with namespaces. You can of course define your own interface for the code, but I recommend following the convention:

```js
pipe(operation1, [parameter1])
  .pipe(operation2, [parameter2])
  // ...
  .end(finish);
```

The function `pipe()` accepts two arguments:

- `operation`: the current operation to perform
- `parameter`: the parameter that will be passed. It can only be one, but it might be a string, array, object or anything else
- (not yet) `autopipe`: a boolean that makes the first function pipeable from any common operation. It passes the `parameter` as arguments to the function with javascript's `apply()`


Each operation looks like this:

```js
function operation(parameter, previous, callback){
  // ... logic
  callback(error, nextData);
}
```

Where the operation receives three arguments, `parameter`, `previous` and `callback`:

- `parameter`: it's the current piping parameter: `pipe(checkSomething, 'parameter')`. You can only add a parameter, but it can be an array, object, string or whatever
- `previous`: the data that the previous `pipe()` sent through the callback in the `callback(null, next)`. It depends on what you defined in the previous pipeline, but it's highly recommended that you have an object with namespaces.
- `callback`: the function that **must be called** to follow the flow.
  - `error`: An error if there was anything wrong or null if everything was okay
  - `nextData`: The data that will be passed to the next function as `previous`.


The finishing function looks like this:

```js
function finish(err, data){
  console.log(err, data);
}
```

It all finished with `end()`, the functions are actually called and the error (if any) or the data are sent. This is needed so water-pipe knows when to get it all together. It has two arguments:

- err: is any of the errors in any of the piped functions
- data: is the resulting data from piping it all together


## Why?

Because the Node flow for larger projects is quite messy. For instance, let's say that you have to retrieve all of the subjects that your current logged in user has, her reputation in the website and her new notifications. That's not pretty however you want to see it:

```js
module.exports.index = function(req, res, next){
  if (!req.user) next(new Error("No user logged in"));
  subject.find({ user: req.user._id }, function(err, subjects){
    if (err) next(err);
    if (!subjects) next(new Error("No subjects"));
    
    reputation.find({ user: req.user._id }, function(err, reputation){
      if (err) next(err);
      // ... do some reputation magic
      
      notification.find({ user: req.user._id, read: false }, function(err, notifications){
        res.render('subject/index', {
          subjects: subjects,
          users: user,
          reputation: reputation,
          notifications: notifications
        });
      });
    });
  });
};
```

Even with async it has few other problems. Imagine that you want to add a couple more of operations. Or that what you retrieve can change rapidly, having to change the nesting order. Sure you can modularize it, but still each part of the code is doing whatever it wants, is nested and all mixed together.



## Example

So let's do the previous example with `pipe()` so you see how it works:

```js
var pipe = require('water-pipe');

// Load all of the models (check the library auto-load, it's useful and I helped a bit)
var model = require('auto-load')('model');

module.exports.index = function(req, res, next){
  
  // Note: order does not matter if a function doesn't depend on the previous data
  pipe(model.subject.byUser, req.user._id)
    .pipe(model.reputation.byUser, req.user._id)
    .pipe(model.notification.unreadByUser, req.user._id)
    .end(function (err, data){
      if (err) return next(err);
      res.render('subject/index', data);
    });
};
```

Then in `model/notification.js` or somewhere convenient we have this:

```js
// This is nice to have
var extend = require('extend');

module.exports.unreadByUser(id, stack, callback){
  db.find({ user: id, unread: false }, function(err, notifications){
    callback(err, extend(stack, { notification: notification }));
  });
}
```

What do I hear you saying about highly readable and modular code? The other functions can be created in a similar way.


## Error handling

But I actually cheated, I didn't show the code for checking the subject, which is also a strength of pipe(). Let's see how we could require a subject:

```js
function needsSubject(param, stack, callback){
  if (!stack || !stack.subject) {
    return callback(new Error("Subject not present"));
  }
  callback(null, stack);
}

// Note: order does not matter if a function doesn't depend on the previous data
pipe(model.subject.byUser, req.user._id)
  .pipe(needsSubject)  // That's it for checking if there's a subject
  .pipe(model.reputation.byUser, req.user._id)
  .pipe(model.notification.unreadByUser, req.user._id)
  .end(function (err, data){
    
    // Get the error here if no subject
    if (err) return next(err);
    res.render('subject/index', data);
  });
```

But let's require ALL THE THINGS:

```js
// Make sure we have the namespace and it's not empty
function needs(param, stack, callback){
  if (!stack || !stack[param]) {
    return callback(new Error(param + " not present"));
  }
  callback(null, stack);
}

// Then just... pip it as you please
pipe(model.subject.byUser, req.user._id)
  .pipe(needs, 'subject')
  .pipe(model.reputation.byUser, req.user._id)
  .pipe(model.notification.unreadByUser, req.user._id)
  .pipe(needs, 'notification')
  .end(/* ... */)
```

As you can see a pipeable function is really flexible, it can fetch, check, save, parse, send, write data or any other thing that you can normally do with some data.



## Trivial example

This is a small example that wouldn't be worth the trouble in the real world, but I wanted to show it just so you see how it works. Just sum numbers. First define the operation that follows the common interface:

```js
function sum(param, prev, callback){
  
  // Make sure we're dealing with previous data
  if (typeof prev !== 'number') prev = 0;
  if (typeof param !== 'number') param = 0;
  
  // Main operation
  var next = prev + param;
  
  // Important to call our callback (and pass error if needed)
  var error = null;
  callback(error, next);
}
```

Then use it with a finishing function in `end()`:

```js
pipe(sum, 2)
  .pipe(sum, 3)
  .pipe(sum, 5)
  .end(function(err, total){
    if (err) return console.log(err);
    alert("Total: " + total);
  });
```