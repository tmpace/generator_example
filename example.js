var fs = require('fs');
var readFile = thunkify(fs.readFile); // 6.

run(function* () { // 1.
  try {
    var file = yield readFile('./msg.txt'); // 5.
    console.log(file); // 13.
  } catch(err) {
    console.error(er);
  }
});

// create a function to turn standard
// node-style functions into thunks
function thunkify(nodefn) {
  return function() { // './msg.txt'
    var args = Array.prototype.slice.call(arguments); // ['./msg.txt']
    return function(cb) { // 7.
      args.push(cb); // 10. ['./msg.txt', next]
      nodefn.apply(this, args); // 11.
    };
  };
}

function run(genFn) {
  var gen = genFn(); // 2.
  next(); // 3.

  function next(err, val) {
    if (err) return gen.throw(err);
    var continuable = gen.next(val); // 4.

    if (continuable.done) return;
    var cbFn = continuable.value; // 8.
    cbFn(next); // 9.
  }
}


// Two things make this style possible, 1.) thunks (thunkify) and 2.) generators
// 1. a generator is passed to the run function
// 2. the run function creates the iterator object
// 3. we call the next function (which is definied inside of run)
// 4. we get the value of calling gen.next() .. this goes to the first yield statement in the generator
//    and returns whatever is after the yield (5.) which is the function created when calling 6. (7.)
// so continuable currently looks like so:
// {
//   value: function(cb) {
//     args.push(cb); // args is secured by closure scope
//     nodefn.apply(this, args) // nodeFn same deal
//   },
//   done: false
// }
// 8. the function stored at value is stored in cbFn
// 9. we call cbFn passing the next function as the callback
// 10. we push the next cb into the args Array
// 11. we call the nodefn which looks like this at this point after apply:
// --------------------------------------------
// gen is closure scoped
//
// fs.readFile('./msg.txt', function(err, val) {
//   if (err) return gen.throw(err);
//   var continuable = gen.next(val); // 12.
//
//   if (continuable.done) return; // 14.
//   var cbFn = continuable.value;
//   cbFn(next);
// });
// --------------------------------------------
// 12. we call gen.next after the async action has completed
//     which goes to 13.. jumps back into that generator function
//     we defined way earlier, right after where we left off when we yielded at step 5.
// 13. we console log the value we got back from the async function
// 14. at this point there is nothing left in the generator so the object returned has { done: true }
//     and we return from the function called at step 11.
