# Water Pipe

A small *async* piping utility for Node.js. It's a wrapper of [**water**​fall](https://github.com/caolan/async#waterfall) inspired by \*nix piping. Its main advantages are:

- Stop the [callback hell](http://callbackhell.com/) keeping it plain
- Handle errors elegantly
- Modularize your code with a common reusable module interface



## Getting started

Install it and add it to your node:

```bash
npm install water-fall --save
```

```js
var pipe = require('water-fall');
```

Then you are ready to use it. See what `op1` and `op2` are [in the inteface](#interface):

```js
pipe(op1, '1')
  .pipe(op2)
  .pipe(op1)
  .end(function(err, data){ console.log(data); });
```

## Definition

```js
// You can pipe as many operations as you want all together
pipe(operation1, [parameter1]).pipe(operation2, [parameter2]).[...].end(finish);

// operation1: the function to execute. It can be null and it'll be skipped
// parameter1 is the one we passed in pipe()
// previousData is the data returned by the previous pipe() (or {})
// callback should be called to keep the flow of operations
function operation1(parameter1, previousData, callback){
  callback(error, nextData);
}

// err is any of the errors in any of the piped functions
// data is the resulting data from piping it all together
function finish(err, data){
  console.log(err, data);
}
```


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

Now imagine that you want to add a couple more of operations. Or that what you retrieve can change rapidly, having to change the nesting order. Sure you can modularize it, but still each part of the code is doing whatever it wants, is nested and all mixed together. I love the simplicity of `|` (pipe) in linux and how `async.waterfall` works, but it still had a couple of problems.


## How water-pipe works

The common interface for linux's pipe is the string, since we're in the terminal and is really simple. However for javascript, where you might have functions and objects that don't serialize correctly, the best common interface I found is the simple object `{}`. You can of course define your own interface for the code, but I recommend following this convention.

### Interface

A pipeable function looks like this:

```js
function checkSomething(parameter, previous, callback){
  
  var next = { next: 'data' };
  callback(null, next);
}
```

The function receives three arguments, `parameter`, `previous` and `callback`:

- `parameter`: it's the current piping parameter: `pipe(checkSomething, 'parameter')`. You can only add a parameter, but it can be an array, object, string or whatever
- `previous`: the data that the previous `pipe()` sent through the callback in the `callback(null, next)`. It depends on what you defined in the previous pipeline, but it's highly recommended that you have an object with namespaces.
- `callback`: the function that must be called to follow the flow. First parameter is an error and second is the data passed to the next function as `previous`.


## Example

So let's repeat the previous example with `pipe()` so you see how it works:

```js
var pipe = require('water-pipe');

module.exports.index = function(req, res, next){
  
  // Note: order does not matter if a function doesn't depend on the previous data
  pipe(subject.byUser, req.user._id)
    .pipe(reputation.byUser, req.user._id)
    .pipe(notification.unreadByUser, req.user._id)
    .end(function (err, data){
      if (err) return next(err);
      res.render('subject/index', data);
    });
};
```

Then in `api/notification.js` or somewhere convenient we have this:

```js
// This is just nice to have
var extend = require('extend');

module.exports.unreadByUser(id, stack, callback){
  notificationModel.find({ user: id, unread: false }, function(err, notifications){
    callback(err, extend(stack, { notification: notification }));
  });
}
```

What do I hear you saying about highly readable and modular code? The other functions can be created in a similar way.


## Error handling

But I actually cheated, I didn't show the code for checking the subject, which is also a strength of pipe(). Let's see how we could require a subject:

```js
function requireSubject(param, stack, callback){
  if (!stack || !stack.subject || stack.subject.length == 0) {
    callback(new Error("Subject not present"));
  }
  callback(null, stack);
}

// Note: order does not matter if a function doesn't depend on the previous data
pipe(model.subject.byUser, req.user._id)
  .pipe(requireSubject)  // That's it for checking if there's a subject
  .pipe(model.reputation.byUser, req.user._id)
  .pipe(model.notification.unreadByUser, req.user._id)
  .end(function (err, data){
    
    // Get the error here if no subject
    if (err) return next(err);
    res.render('subject/index', data);
  });
```

But let's require ALL THE THINGS (used `needs` as `require` is taken and confusing):

```js
function needsArray(param, stack, callback){
  if (!stack || !stack[param] || stack[param].length == 0) {
    callback(new Error([param] + " not present"));
  }
  callback(null, stack);
}

// Then just... pip it as you please
pipe(model.subject.byUser, req.user._id)
  .pipe(needsArray, 'subject')
  .pipe(model.reputation.byUser, req.user._id)
  .pipe(model.notification.unreadByUser, req.user._id)
  .pipe(needsArray, 'notification')
  .end(/* ... */)
```

As you can see a pipeable function is really flexible, it can fetch data, check data, parse data or many others.



## Trivial example

This is a small example that wouldn't be worth the trouble in the real world, but I wanted to show it just so you see how it works. Just sum numbers. First define the operation that follows **[a specific interface](#interface)**:

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

Then define a function to receive the error and last part:

```js
function handler(err, total){
  if (err) return console.log(err);
  alert("Total: " + total);
}
```

Finally use it:

```js
pipe(sum, 2)
  .pipe(sum, 3)
  .pipe(sum, 5)
  .end(handler);
```