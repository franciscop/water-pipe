// Load the testing module
var chai = require('chai');
var should = chai.should();
var expect = chai.expect;

// Load the class to test
var pipe = require('./index');

// Knows nothing (just keep going)
function JohnSnow(params, initial, callback){
  callback(null, initial);
}

// End the function cleanly
function ender(err, data){}

// Extend the initial with the param
function joiner(param, initial, callback){
  initial[param] = param;
  callback(null, initial);
}



// pipe(5)
//   .sum(3)
//   .minus(2)
//   .divided(2)
//   .end();
// 
// pipe(require, 'text.json')
//   .pipe(function(cur, prev, callback){ callback(null, JSON.stringify(prev)); })
//   .pipe(fs.writeFile, 'bla.txt')
//   .end();



describe('pipe()', function(){

  it('can be initialized empty', function(){
    pipe();
  });
  
  it('can be initialized with a variable', function(){
    pipe({});
  });
});


describe('pipe().end(fn)', function(){

  it('can be called empty', function(){
    pipe().end(function(){});
  });
  
  it('receives a function', function(done){
    pipe({})
      .pipe(function(param, initial, callback){
        expect(param).to.equal('a');
        expect(initial).to.be.empty;
        expect(typeof callback).to.equal('function');
        done(null, {});
      }, 'a').end(function(){ done(); });
  });
  
  it('can be called with a function', function(){
    pipe().end(function(){});
  });
});


describe('pipe(fn).end(fn)', function(){

  it('can pipe and end', function(done){
    pipe(JohnSnow).end(function(err, data){
      expect(err).to.equal(null);
      expect(data).to.be.emtpy;
      done();
    });
  });
});



describe('pipe({}, {}).end(fn)', function(){
  
  it('can pipe many times and end', function(done){
    pipe({ a: 'b' }, { c: 'd' })
      .end(function(err, data){
        expect(data.a).to.equal('b');
        expect(data.c).to.equal('d');
        expect(data).to.be.emtpy;
        done();
      }
    );
  });
  
  
  it('can pipe many times and end', function(done){
    pipe({ a: 'b' })
      .end(function(err, data){
        expect(data.a).to.equal('b');
        expect(data).to.be.emtpy;
        done();
      }
    );
  });
});


describe('pipe(fn).pipe(fn).[...].pipe(fn).end(fn)', function(){
  
  it('can pipe many times and end', function(done){
    pipe({})
      .pipe(JohnSnow)
      .pipe(JohnSnow, 'a')
      .pipe(JohnSnow, 'b')
      .pipe(JohnSnow, 'c')
      .pipe(JohnSnow, 'd')
      .end(function(err, data){
        expect(err).to.equal(null);
        expect(data).to.be.emtpy;
        done();
      }
    );
  });
  
  // Just concatenating
  it('can concatenate strings', function(done){
    
    // Concatenate strings
    function concat(param, prev, callback){
      callback(null, prev + param);
    }
    
    pipe("").pipe(concat, 'A').pipe(concat, 'B').pipe(concat, 'C').end(function(err, str){
        expect(err).to.equal(null);
        expect(str).to.equal('ABC');
        done();
      }
    );
  });
  
  it('can be used for simple operations', function(done){
    
    function sum(param, prev, callback) {
      callback(null, prev + param);
    }
    
    function minus(param, prev, callback) {
      callback(null, prev - param);
    }
    
    // pipe.prototype.minus = function(arg){
    //   return this.push(minus, arg);
    // };
    
    pipe(0).pipe(sum, 1).pipe(sum, 2).pipe(sum, 3).pipe(minus, 1).end(function(err, num){
      expect(err).to.equal(null);
      expect(num).to.equal(5);
      done();
    });
  });
});

