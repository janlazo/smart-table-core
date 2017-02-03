(function () {
'use strict';

/**
 * slice() reference.
 */

var slice = Array.prototype.slice;

/**
 * Expose `co`.
 */

var index = co['default'] = co.co = co;

/**
 * Wrap the given generator `fn` into a
 * function that returns a promise.
 * This is a separate function so that
 * every `co()` call doesn't create a new,
 * unnecessary closure.
 *
 * @param {GeneratorFunction} fn
 * @return {Function}
 * @api public
 */

co.wrap = function (fn) {
  createPromise.__generatorFunction__ = fn;
  return createPromise;
  function createPromise() {
    return co.call(this, fn.apply(this, arguments));
  }
};

/**
 * Execute the generator function or a generator
 * and return a promise.
 *
 * @param {Function} fn
 * @return {Promise}
 * @api public
 */

function co(gen) {
  var ctx = this;
  var args = slice.call(arguments, 1);

  // we wrap everything in a promise to avoid promise chaining,
  // which leads to memory leak errors.
  // see https://github.com/tj/co/issues/180
  return new Promise(function(resolve, reject) {
    if (typeof gen === 'function') gen = gen.apply(ctx, args);
    if (!gen || typeof gen.next !== 'function') return resolve(gen);

    onFulfilled();

    /**
     * @param {Mixed} res
     * @return {Promise}
     * @api private
     */

    function onFulfilled(res) {
      var ret;
      try {
        ret = gen.next(res);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * @param {Error} err
     * @return {Promise}
     * @api private
     */

    function onRejected(err) {
      var ret;
      try {
        ret = gen.throw(err);
      } catch (e) {
        return reject(e);
      }
      next(ret);
    }

    /**
     * Get the next value in the generator,
     * return a promise.
     *
     * @param {Object} ret
     * @return {Promise}
     * @api private
     */

    function next(ret) {
      if (ret.done) return resolve(ret.value);
      var value = toPromise.call(ctx, ret.value);
      if (value && isPromise(value)) return value.then(onFulfilled, onRejected);
      return onRejected(new TypeError('You may only yield a function, promise, generator, array, or object, '
        + 'but the following object was passed: "' + String(ret.value) + '"'));
    }
  });
}

/**
 * Convert a `yield`ed value into a promise.
 *
 * @param {Mixed} obj
 * @return {Promise}
 * @api private
 */

function toPromise(obj) {
  if (!obj) return obj;
  if (isPromise(obj)) return obj;
  if (isGeneratorFunction(obj) || isGenerator(obj)) return co.call(this, obj);
  if ('function' == typeof obj) return thunkToPromise.call(this, obj);
  if (Array.isArray(obj)) return arrayToPromise.call(this, obj);
  if (isObject(obj)) return objectToPromise.call(this, obj);
  return obj;
}

/**
 * Convert a thunk to a promise.
 *
 * @param {Function}
 * @return {Promise}
 * @api private
 */

function thunkToPromise(fn) {
  var ctx = this;
  return new Promise(function (resolve, reject) {
    fn.call(ctx, function (err, res) {
      if (err) return reject(err);
      if (arguments.length > 2) res = slice.call(arguments, 1);
      resolve(res);
    });
  });
}

/**
 * Convert an array of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Array} obj
 * @return {Promise}
 * @api private
 */

function arrayToPromise(obj) {
  return Promise.all(obj.map(toPromise, this));
}

/**
 * Convert an object of "yieldables" to a promise.
 * Uses `Promise.all()` internally.
 *
 * @param {Object} obj
 * @return {Promise}
 * @api private
 */

function objectToPromise(obj){
  var results = new obj.constructor();
  var keys = Object.keys(obj);
  var promises = [];
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    var promise = toPromise.call(this, obj[key]);
    if (promise && isPromise(promise)) defer(promise, key);
    else results[key] = obj[key];
  }
  return Promise.all(promises).then(function () {
    return results;
  });

  function defer(promise, key) {
    // predefine the key in the result
    results[key] = undefined;
    promises.push(promise.then(function (res) {
      results[key] = res;
    }));
  }
}

/**
 * Check if `obj` is a promise.
 *
 * @param {Object} obj
 * @return {Boolean}
 * @api private
 */

function isPromise(obj) {
  return 'function' == typeof obj.then;
}

/**
 * Check if `obj` is a generator.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */

function isGenerator(obj) {
  return 'function' == typeof obj.next && 'function' == typeof obj.throw;
}

/**
 * Check if `obj` is a generator function.
 *
 * @param {Mixed} obj
 * @return {Boolean}
 * @api private
 */
function isGeneratorFunction(obj) {
  var constructor = obj.constructor;
  if (!constructor) return false;
  if ('GeneratorFunction' === constructor.name || 'GeneratorFunction' === constructor.displayName) return true;
  return isGenerator(constructor.prototype);
}

/**
 * Check for plain object.
 *
 * @param {Mixed} val
 * @return {Boolean}
 * @api private
 */

function isObject(val) {
  return Object == val.constructor;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var keys = createCommonjsModule(function (module, exports) {
exports = module.exports = typeof Object.keys === 'function'
  ? Object.keys : shim;

exports.shim = shim;
function shim (obj) {
  var keys = [];
  for (var key in obj) keys.push(key);
  return keys;
}
});

var is_arguments = createCommonjsModule(function (module, exports) {
var supportsArgumentsClass = (function(){
  return Object.prototype.toString.call(arguments)
})() == '[object Arguments]';

exports = module.exports = supportsArgumentsClass ? supported : unsupported;

exports.supported = supported;
function supported(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

exports.unsupported = unsupported;
function unsupported(object){
  return object &&
    typeof object == 'object' &&
    typeof object.length == 'number' &&
    Object.prototype.hasOwnProperty.call(object, 'callee') &&
    !Object.prototype.propertyIsEnumerable.call(object, 'callee') ||
    false;
}
});

var index$1 = createCommonjsModule(function (module) {
var pSlice = Array.prototype.slice;
var objectKeys = keys;
var isArguments = is_arguments;

var deepEqual = module.exports = function (actual, expected, opts) {
  if (!opts) opts = {};
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!actual || !expected || typeof actual != 'object' && typeof expected != 'object') {
    return opts.strict ? actual === expected : actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected, opts);
  }
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isBuffer (x) {
  if (!x || typeof x !== 'object' || typeof x.length !== 'number') return false;
  if (typeof x.copy !== 'function' || typeof x.slice !== 'function') {
    return false;
  }
  if (x.length > 0 && typeof x[0] !== 'number') return false;
  return true;
}

function objEquiv(a, b, opts) {
  var i, key;
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b, opts);
  }
  if (isBuffer(a)) {
    if (!isBuffer(b)) {
      return false;
    }
    if (a.length !== b.length) return false;
    for (i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b);
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key], opts)) return false;
  }
  return typeof a === typeof b;
}
});

const assertions = {
  ok(val, message = 'should be truthy') {
    const assertionResult = {
      pass: Boolean(val),
      expected: 'truthy',
      actual: val,
      operator: 'ok',
      message
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  deepEqual(actual, expected, message = 'should be equivalent') {
    const assertionResult = {
      pass: index$1(actual, expected),
      actual,
      expected,
      message,
      operator: 'deepEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  equal(actual, expected, message = 'should be equal') {
    const assertionResult = {
      pass: actual === expected,
      actual,
      expected,
      message,
      operator: 'equal'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notOk(val, message = 'should not be truthy') {
    const assertionResult = {
      pass: !Boolean(val),
      expected: 'falsy',
      actual: val,
      operator: 'notOk',
      message
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notDeepEqual(actual, expected, message = 'should not be equivalent') {
    const assertionResult = {
      pass: !index$1(actual, expected),
      actual,
      expected,
      message,
      operator: 'notDeepEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  notEqual(actual, expected, message = 'should not be equal') {
    const assertionResult = {
      pass: actual !== expected,
      actual,
      expected,
      message,
      operator: 'notEqual'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  throws(func, expected, message) {
    let caught, pass, actual;
    if (typeof expected === 'string') {
      [expected, message] = [message, expected];
    }
    try {
      func();
    } catch (error) {
      caught = {error};
    }
    pass = caught !== undefined;
    actual = caught && caught.error;
    if (expected instanceof RegExp) {
      pass = expected.test(actual) || expected.test(actual && actual.message);
      expected = String(expected);
    } else if (typeof expected === 'function' && caught) {
      pass = actual instanceof expected;
      actual = actual.constructor;
    }
    const assertionResult = {
      pass,
      expected,
      actual,
      operator: 'throws',
      message: message || 'should throw'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  doesNotThrow(func, expected, message) {
    let caught;
    if (typeof expected === 'string') {
      [expected, message] = [message, expected];
    }
    try {
      func();
    } catch (error) {
      caught = {error};
    }
    const assertionResult = {
      pass: caught === undefined,
      expected: 'no thrown error',
      actual: caught && caught.error,
      operator: 'doesNotThrow',
      message: message || 'should not throw'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  },
  fail(reason = 'fail called') {
    const assertionResult = {
      pass: false,
      actual: 'fail called',
      expected: 'fail not called',
      message: reason,
      operator: 'fail'
    };
    this.test.addAssertion(assertionResult);
    return assertionResult;
  }
};

function assertion (test) {
  return Object.create(assertions, {test: {value: test}});
}

const Test = {
  run: function () {
    const assert = assertion(this);
    const now = Date.now();
    return index(this.coroutine(assert))
      .then(() => {
        return {assertions: this.assertions, executionTime: Date.now() - now};
      });
  },
  addAssertion(){
    const newAssertions = [...arguments].map(a => Object.assign({description: this.description}, a));
    this.assertions.push(...newAssertions);
    return this;
  }
};

function test ({description, coroutine, only = false}) {
  return Object.create(Test, {
    description: {value: description},
    coroutine: {value: coroutine},
    assertions: {value: []},
    only: {value: only},
    length: {
      get(){
        return this.assertions.length
      }
    }
  });
}

function tapOut ({pass, message, index}) {
  const status = pass === true ? 'ok' : 'not ok';
  console.log([status, index, message].join(' '));
}

function canExit () {
  return typeof process !== 'undefined' && typeof process.exit === 'function';
}

function tap () {
  return function * () {
    let index = 1;
    let lastId = 0;
    let success = 0;
    let failure = 0;

    const starTime = Date.now();
    console.log('TAP version 13');
    try {
      while (true) {
        const assertion = yield;
        if (assertion.pass === true) {
          success++;
        } else {
          failure++;
        }
        assertion.index = index;
        if (assertion.id !== lastId) {
          console.log(`# ${assertion.description} - ${assertion.executionTime}ms`);
          lastId = assertion.id;
        }
        tapOut(assertion);
        if (assertion.pass !== true) {
          console.log(`  ---
  operator: ${assertion.operator}
  expected: ${JSON.stringify(assertion.expected)}
  actual: ${JSON.stringify(assertion.actual)}
  ...`);
        }
        index++;
      }
    } catch (e) {
      console.log('Bail out! unhandled exception');
      console.log(e);
      if (canExit()) {
        process.exit(1);
      }
    }
    finally {
      const execution = Date.now() - starTime;
      if (index > 1) {
        console.log(`
1..${index - 1}
# duration ${execution}ms
# success ${success}
# failure ${failure}`);
      }
      if (failure && canExit()) {
        process.exit(1);
      }
    }
  };
}

const Plan = {
  test(description, coroutine, opts = {}){
    const testItems = (!coroutine && description.tests) ? [...description] : [{description, coroutine}];
    this.tests.push(...testItems.map(t=>test(Object.assign(t, opts))));
    return this;
  },

  only(description, coroutine){
    return this.test(description, coroutine, {only: true});
  },

  run(sink = tap()){
    const sinkIterator = sink();
    sinkIterator.next();
    const hasOnly = this.tests.some(t=>t.only);
    const runnable = hasOnly ? this.tests.filter(t=>t.only) : this.tests;
    return index(function * () {
      let id = 1;
      try {
        const results = runnable.map(t=>t.run());
        for (let r of results) {
          const {assertions, executionTime} = yield r;
          for (let assert of assertions) {
            sinkIterator.next(Object.assign(assert, {id, executionTime}));
          }
          id++;
        }
      }
      catch (e) {
        sinkIterator.throw(e);
      } finally {
        sinkIterator.return();
      }
    }.bind(this))
  },

  * [Symbol.iterator](){
    for (let t of this.tests) {
      yield t;
    }
  }
};

function plan$1 () {
  return Object.create(Plan, {
    tests: {value: []},
    length: {
      get(){
        return this.tests.length
      }
    }
  });
}

const TOGGLE_SORT = 'TOGGLE_SORT';
const DISPLAY_CHANGED = 'DISPLAY_CHANGED';
const PAGE_CHANGED = 'CHANGE_PAGE';
const EXEC_CHANGED = 'EXEC_STARTED';
const FILTER_CHANGED = 'FILTER_CHANGED';
const SUMMARY_CHANGED = 'SUMMARY_CHANGED';
const SEARCH_CHANGED = 'SEARCH_CHANGED';
const EXEC_ERROR = 'EXEC_ERROR';

function emitter () {

  const listenersLists = {};

  return {
    on(event, ...listeners){
      listenersLists[event] = (listenersLists[event] || []).concat(listeners);
      return this;
    },
    dispatch(event, ...args){
      const listeners = listenersLists[event] || [];
      for (let listener of listeners) {
        listener(...args);
      }
      return this;
    },
    off(event, ...listeners){
      if (!event) {
        Object.keys(listenersLists).forEach(ev => this.off(ev));
      } else {
        const list = listenersLists[event] || [];
        listenersLists[event] = listeners.length ? list.filter(listener => !listeners.includes(listener)) : [];
      }
      return this;
    }
  }
}

function proxyListener (eventMap) {
  return function ({emitter}) {

    const proxy = {};
    let eventListeners = {};

    for (let ev of Object.keys(eventMap)) {
      const method = eventMap[ev];
      eventListeners[ev] = [];
      proxy[method] = function (...listeners) {
        eventListeners[ev] = eventListeners[ev].concat(listeners);
        emitter.on(ev, ...listeners);
        return this;
      };
    }

    return Object.assign(proxy, {
      off(ev){
        if (!ev) {
          Object.keys(eventListeners).forEach(eventName => this.off(eventName));
        }

        if (eventListeners[ev]) {
          emitter.off(ev, ...eventListeners[ev]);
        }

        return this;
      }
    });
  }
}

var events = plan$1()
  .test('register a listener to an event', function * (t) {
    let counter = 0;
    const listener = (increment) => {
      counter += increment;
    };
    const em = emitter();
    em.on('foo', listener);
    em.dispatch('foo', 3);
    t.equal(counter, 3);
  })
  .test('multiple listeners registered at once', function * (t) {
    let counter = 0;
    const firstListener = inc => {
      counter += inc;
    };
    const secondListener = inc => {
      counter += inc * 2;
    };
    const em = emitter();
    em.on('foo', firstListener, secondListener);
    em.dispatch('foo', 3);
    t.equal(counter, 9);
  })
  .test('multiple listeners registered separately', function * (t) {
    let counter = 0;
    const firstListener = inc => {
      counter += inc;
    };
    const secondListener = inc => {
      counter += inc * 2;
    };
    const em = emitter();
    em.on('foo', firstListener)
      .on('foo', secondListener);
    em.dispatch('foo', 3);
    t.equal(counter, 9);
  })
  .test('unregister specific listener', function * (t) {
    let counter = 0;
    const firstListener = inc => {
      counter += inc;
    };
    const secondListener = inc => {
      counter += inc * 2;
    };
    const em = emitter();
    em.on('foo', firstListener, secondListener);
    em.off('foo', secondListener);
    em.dispatch('foo', 3);
    t.equal(counter, 3);
  })
  .test('unregister all listeners of a given type', function * (t) {
    let counter = 0;
    const firstListener = inc => {
      counter += inc;
    };
    const secondListener = inc => {
      counter += inc * 2;
    };
    const thirdListener = inc => {
      counter -= inc;
    };
    const em = emitter();
    em.on('foo', firstListener, secondListener);
    em.on('bar', thirdListener);
    em.off('foo');
    em.dispatch('foo', 3);
    t.equal(counter, 0);
    em.dispatch('bar', 200);
    t.equal(counter, -200);
  })
  .test('unregister all listeners', function * (t) {
    let counter = 0;
    const firstListener = inc => {
      counter += inc;
    };
    const secondListener = inc => {
      counter -= inc;
    };
    const em = emitter();
    em.on('foo', firstListener);
    em.on('bar', secondListener);
    em.off();
    em.dispatch('foo', 3);
    t.equal(counter, 0);
    em.dispatch('bar', 200);
    t.equal(counter, 0);
  })
  .test('proxy: map event listeners to methods', function * (t) {
    let counter = 0;
    const em = emitter();
    const firstListener = inc => {
      counter += inc;
    };
    const secondListener = inc => {
      counter += inc * 2;
    };
    const lstner = proxyListener({foo: 'onFoo', bar: 'onBar'})({emitter: em});
    lstner.onFoo(firstListener);
    lstner.onBar(secondListener);
    em.dispatch('foo', 2);
    em.dispatch('bar', 6);
    t.equal(counter, 14);
  })
  .test('proxy: unregister event listeners on a specific event', function * (t) {
    let counter = 0;
    const em = emitter();
    const firstListener = inc => {
      counter += inc;
    };
    const secondListener = inc => {
      counter += inc * 2;
    };
    const lstner = proxyListener({foo: 'onFoo'})({emitter: em});
    lstner.onFoo(firstListener);
    lstner.onFoo(secondListener);
    em.dispatch('foo', 2);
    t.equal(counter, 6);
    lstner.off('foo');
    em.dispatch('foo', 2);
    t.equal(counter, 6);
  })
  .test('proxy: unregister all event listeners', function * (t) {
    let counter = 0;
    const em = emitter();
    const firstListener = inc => {
      counter += inc;
    };
    const secondListener = inc => {
      counter += inc * 2;
    };
    const lstner = proxyListener({foo: 'onFoo', bar: 'onBar'})({emitter: em});
    lstner.onFoo(firstListener);
    lstner.onBar(secondListener);
    em.dispatch('foo', 2);
    em.dispatch('bar', 6);
    t.equal(counter, 14);
    lstner.off();
    em.dispatch('foo', 2);
    em.dispatch('bar', 6);
    t.equal(counter, 14);
  });

function pointer (path) {

  const parts = path.split('.');

  function partial (obj = {}, parts = []) {
    const p = parts.shift();
    const current = obj[p];
    return (current === undefined || parts.length === 0) ?
      current : partial(current, parts);
  }

  function set (target, newTree) {
    let current = target;
    const [leaf, ...intermediate] = parts.reverse();
    for (let key of intermediate.reverse()) {
      if (current[key] === undefined) {
        current[key] = {};
        current = current[key];
      }
    }
    current[leaf] = Object.assign(current[leaf] || {}, newTree);
    return target;
  }

  return {
    get(target){
      return partial(target, [...parts])
    },
    set
  }
}

var search$1 = function (searchConf = {}) {
  const {value, scope = []} = searchConf;
  const searchPointers = scope.map(field => pointer(field).get);
  if (!scope.length || !value) {
    return array => array;
  } else {
    return array => array.filter(item => searchPointers.some(p => String(p(item)).includes(String(value))))
  }
};

var search = plan$1()
  .test('full text search on all values (flat object)', function * (t) {
    const collection = [
      {a: 'woo', b: 'foot'},
      {a: 'foo', b: 'w'},
      {a: 'foo', b: 'b'},
    ];
    const output = search$1({value: 'w', scope: ['a', 'b']})(collection);
    t.deepEqual(output, [
      {a: 'woo', b: 'foot'},
      {a: 'foo', b: 'w'}
    ]);
  })
  .test('full text search on all values (nested object)', function * (t) {
    const collection = [
      {a: 'woo', b: {c: 'foot'}},
      {a: 'foo', b: {c: 'w'}},
      {a: 'foo', b: {c: 'b'}},
    ];
    const output = search$1({value: 'w', scope: ['a', 'b.c']})(collection);
    t.deepEqual(output, [
      {"a": "woo", "b": {"c": "foot"}},
      {"a": "foo", "b": {"c": "w"}}
    ]);
  })
  .test('full text search: do nothing when no scope is provided', function * (t) {
    const collection = [
      {a: 'woo', b: 'foot'},
      {a: 'foo', b: 'w'},
      {a: 'foo', b: 'b'},
    ];
    const output = search$1({value: 'w'})(collection);
    t.deepEqual(output, collection);
  })
  .test('full text search: do nothing when no value is provided', function * (t) {
    const collection = [
      {a: 'woo', b: 'foot'},
      {a: 'foo', b: 'w'},
      {a: 'foo', b: 'b'},
    ];
    const output = search$1({value: '', scope:['a']})(collection);
    t.deepEqual(output, collection);
  });

function sliceFactory ({page = 1, size} = {}) {
  return function sliceFunction (array = []) {
    const actualSize = size || array.length;
    const offset = (page - 1) * actualSize;
    return array.slice(offset, offset + actualSize);
  };
}

var slice$1 = plan$1()
  .test('slice: get a page with specified size', function * (t) {
    const input = [1, 2, 3, 4, 5, 6, 7];
    const output = sliceFactory({page: 1, size: 5})(input);
    t.deepEqual(output, [1, 2, 3, 4, 5]);
  })
  .test('slice: get a partial page if size is too big', function * (t) {
    const input = [1, 2, 3, 4, 5, 6, 7];
    const output = sliceFactory({page: 2, size: 5})(input);
    t.deepEqual(output, [6, 7]);
  })
  .test('slice: get all the asset if no param is provided', function * (t) {
    const input = [1, 2, 3, 4, 5, 6, 7];
    const output = sliceFactory()(input);
    t.deepEqual(output, input);
  });

function swap (f) {
  return (a, b) => f(b, a);
}

function compose (first, ...fns) {
  return (...args) => fns.reduce((previous, current) => current(previous), first(...args));
}

function curry (fn, arityLeft) {
  const arity = arityLeft || fn.length;
  return (...args) => {
    if (arity === args.length) {
      return fn(...args);
    } else {
      const func = (...moreArgs) => fn(...args, ...moreArgs);
      return curry(func, arity - args.length);
    }
  };
}

function apply (fn) {
  return (...args) => fn(...args);
}

function tap$1 (fn) {
  return arg => {
    fn(arg);
    return arg;
  }
}

function sortByProperty (prop) {
  const propGetter = pointer(prop).get;
  return (a, b) => {
    const aVal = propGetter(a);
    const bVal = propGetter(b);

    if (aVal === bVal) {
      return 0;
    }

    if (bVal === undefined) {
      return -1;
    }

    if (aVal === undefined) {
      return 1;
    }

    return aVal < bVal ? -1 : 1;
  }
}

function sortFactory ({pointer: pointer$$1, direction} = {}) {
  if (!pointer$$1 || direction === 'none') {
    return array => [...array];
  }

  const orderFunc = sortByProperty(pointer$$1);
  const compareFunc = direction === 'desc' ? swap(orderFunc) : orderFunc;

  return (array) => [...array].sort(compareFunc);
}

function typeExpression (type) {
  switch (type) {
    case 'boolean':
      return Boolean;
    case 'number':
      return Number;
    case 'date':
      return (val) => new Date(val);
    default:
      return compose(String, (val) => val.toLowerCase());
  }
}

const operators = {
  includes(value){
    return (input) => input.includes(value);
  },
  is(value){
    return (input) => Object.is(value, input);
  },
  isNot(value){
    return (input) => !Object.is(value, input);
  },
  lt(value){
    return (input) => input < value;
  },
  gt(value){
    return (input) => input > value;
  },
  lte(value){
    return (input) => input <= value;
  },
  gte(value){
    return (input) => input >= value;
  },
  equals(value){
    return (input) => value == input;
  },
  notEquals(value){
    return (input) => value != input;
  }
};

const every = fns => (...args) => fns.every(fn => fn(...args));

function predicate ({value = '', operator = 'includes', type = 'string'}) {
  const typeIt = typeExpression(type);
  const operateOnTyped = compose(typeIt, operators[operator]);
  const predicateFunc = operateOnTyped(value);
  return compose(typeIt, predicateFunc);
}

//avoid useless filter lookup (improve perf)
function normalizeClauses (conf) {
  const output = {};
  const validPath = Object.keys(conf).filter(path => Array.isArray(conf[path]));
  validPath.forEach(path => {
    const validClauses = conf[path].filter(c => c.value !== '');
    if (validClauses.length) {
      output[path] = validClauses;
    }
  });
  return output;
}

function filter (filter) {
  const normalizedClauses = normalizeClauses(filter);
  const funcList = Object.keys(normalizedClauses).map(path => {
    const getter = pointer(path).get;
    const clauses = normalizedClauses[path].map(predicate);
    return compose(getter, every(clauses));
  });
  const filterPredicate = every(funcList);

  return (array) => array.filter(filterPredicate);
}

function curriedPointer (path) {
  const {get, set} = pointer(path);
  return {get, set: curry(set)};
}

var table$1 = function ({
  sortFactory,
  tableState,
  data,
  filterFactory,
  searchFactory
}) {
  const table = emitter();
  const sortPointer = curriedPointer('sort');
  const slicePointer = curriedPointer('slice');
  const filterPointer = curriedPointer('filter');
  const searchPointer = curriedPointer('search');

  const safeAssign = curry((base, extension) => Object.assign({}, base, extension));
  const dispatch = curry(table.dispatch.bind(table), 2);

  const createSummary = (filtered) => {
    dispatch(SUMMARY_CHANGED, {
      page: tableState.slice.page,
      size: tableState.slice.size,
      filteredCount: filtered.length
    });
  };

  const exec = ({processingDelay = 20} = {}) => {
    table.dispatch(EXEC_CHANGED, {working: true});
    setTimeout(function () {
      try {
        const filterFunc = filterFactory(filterPointer.get(tableState));
        const searchFunc = searchFactory(searchPointer.get(tableState));
        const sortFunc = sortFactory(sortPointer.get(tableState));
        const sliceFunc = sliceFactory(slicePointer.get(tableState));
        const execFunc = compose(filterFunc, searchFunc, tap$1(createSummary), sortFunc, sliceFunc);
        const displayed = execFunc(data);
        table.dispatch(DISPLAY_CHANGED, displayed.map(d => {
          return {index: data.indexOf(d), value: d};
        }));
      } catch (e) {
        table.dispatch(EXEC_ERROR, e);
      } finally {
        table.dispatch(EXEC_CHANGED, {working: false});
      }
    }, processingDelay);
  };

  const tableOperation = (pter, ev) => apply(compose(
    safeAssign(pter.get(tableState)),
    tap$1(dispatch(ev)),
    pter.set(tableState),
    () => table.exec()
  ));

  const api = {
    sort: tableOperation(sortPointer, TOGGLE_SORT),
    slice: tableOperation(slicePointer, PAGE_CHANGED),
    filter: tableOperation(filterPointer, FILTER_CHANGED),
    search: tableOperation(searchPointer, SEARCH_CHANGED),
    exec,
    eval(state = tableState){
      return Promise.resolve()
        .then(function () {
          const sortFunc = sortFactory(sortPointer.get(state));
          const searchFunc = searchFactory(searchPointer.get(state));
          const filterFunc = filterFactory(filterPointer.get(state));
          const sliceFunc = sliceFactory(slicePointer.get(state));
          const execFunc = compose(filterFunc, searchFunc, sortFunc, sliceFunc);
          return execFunc(data).map(d => {
            return {index: data.indexOf(d), value: d}
          });
        });
    },
    onDisplayChange(fn){
      table.on(DISPLAY_CHANGED, fn);
    }
  };

  return Object.assign(table, api);
};

var tableFactory = function ({
  sortFactory: sortFactory$$1 = sortFactory,
  filterFactory = filter,
  searchFactory = search$1,
  tableState = {sort: {}, slice: {page: 1}, filter: {}, search: {}},
  data = []
}, ...tableDirectives) {
  return tableDirectives.reduce((accumulator, newdir) => {
    return Object.assign(accumulator, newdir({
      sortFactory: sortFactory$$1,
      filterFactory,
      searchFactory,
      tableState,
      data
    }));
  }, table$1({sortFactory: sortFactory$$1, filterFactory, tableState, data, searchFactory}));
};

var table = plan$1()
  .test('compose table factory', function * (t) {
    const data = [];
    const tableState = {};
    const tableInstance = tableFactory({data, tableState}, function ({data:d, tableState:ts}) {
      return {
        getData(){
          return d;
        },
        getTableState(){
          return ts;
        }
      };
    });

    t.ok(tableInstance.getData !== undefined && tableInstance.getTableState !== undefined, 'table instance should have extended behaviour');
    t.ok(tableInstance.exec !== undefined, 'table instance should have regular behaviour');
    t.equal(tableInstance.getData(), data, 'all factories should have the same data reference');
    t.equal(tableInstance.getTableState(), tableState, 'all factories should have the same table state reference');
  });

const filterListener = proxyListener({[FILTER_CHANGED]: 'onFilterChange'});

var filter$1 = function ({table, pointer, operator = 'includes', type = 'string'}) {
  return Object.assign({
      filter(input){
        const filterConf = {
          [pointer]: [
            {
              value: input,
              operator,
              type
            }
          ]

        };
        return table.filter(filterConf);
      }
    },
    filterListener({emitter: table}));
};

function fakeTable () {
  const table = emitter();
  table.filter = input => input;
  return table;
}

var filterDirective = plan$1()
  .test('filter directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = fakeTable();
    const fd = filter$1({table, pointer: 'foo'});
    fd.onFilterChange(() => counter++);
    table.dispatch(FILTER_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('filter directive should call table filter method passing the appropriate argument', function * (t) {
    const table = fakeTable();
    const fd = filter$1({table, pointer: 'foo.bar', operator: 'is', type: 'number'});
    const arg = fd.filter(42);
    t.deepEqual(arg, {'foo.bar': [{value: 42, operator: 'is', type: 'number'}]});
  });

const searchListener = proxyListener({[SEARCH_CHANGED]: 'onSearchChange'});

var search$2 = function ({table}) {
  return Object.assign(
    searchListener({emitter: table}),
    {
      search(input){
        return table.search({value: input});
      }
    });
};

function fakeTable$1 () {
  const table = emitter();
  table.search = input => input;
  return table;
}

var searchDirective = plan$1()
  .test('search directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = fakeTable$1();
    const dir = search$2({table});
    dir.onSearchChange(() => counter++);
    table.dispatch(SEARCH_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('search directive should call table search method passing the appropriate argument', function * (t) {
    const table = fakeTable$1();
    const dir = search$2({table});
    const arg = dir.search(42);
    t.deepEqual(arg, {value: 42});
  });

const sliceListener = proxyListener({[PAGE_CHANGED]: 'onPageChange'});

var slice$2 = function ({table, size, page = 1}) {

  let currentPage = page;
  let currentSize = size;

  const directive = Object.assign({
    selectPage(p){
      return table.slice({page: p, size: currentSize});
    },
    selectNextPage(){
      return this.selectPage(currentPage + 1);
    },
    selectPreviousPage(){
      return this.selectPage(currentPage - 1);
    },
    changePageSize(size){
      return table.slice({page: 1, size});
    }
  }, sliceListener({emitter: table}));

  directive.onPageChange(({page:p, size:s}) => {
    currentPage = p;
    currentSize = s;
  });


  return directive;
};

function fakeTable$2 () {
  const table = emitter();
  table.slice = input => input;
  return table;
}

var sliceDirective = plan$1()
  .test('slice directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = fakeTable$2();
    const dir = slice$2({table});
    dir.onPageChange(() => counter++);
    table.dispatch(PAGE_CHANGED, {size: 25, page: 1});
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('slice directive should call table slice method with the given page', function * (t) {
    const table = fakeTable$2();
    const dir = slice$2({table, size: 25, page: 4});
    const arg = dir.selectPage(2);
    t.deepEqual(arg, {page: 2, size: 25});
  })
  .test('slice directive should call table slice method with the next page arguments', function * (t) {
    const table = fakeTable$2();
    const dir = slice$2({table, size: 21, page: 4});
    const {page, size} = dir.selectNextPage();
    t.equal(page, 5, 'should be the next page');
    t.equal(size, 21, 'should keep the current page size');
  })
  .test('slice directive should call table slice method with the previous page arguments', function * (t) {
    const table = fakeTable$2();
    const dir = slice$2({table, size: 26, page: 9});
    const {page, size} = dir.selectPreviousPage();
    t.equal(page, 8, 'should be the previous page');
    t.equal(size, 26, 'should keep the current page size');
  })
  .test('slice directive should call table slice method with the page size, returning to page one', function * (t) {
    const table = fakeTable$2();
    const dir = slice$2({table, size: 100, page: 3});
    const {page, size} = dir.changePageSize(42);
    t.equal(page, 1, 'should have returned to the first page');
    t.equal(size, 42, 'should have change the page size');
  });

const sortListeners = proxyListener({[TOGGLE_SORT]: 'onSortToggle'});
const directions = ['asc', 'desc'];

var sort = function ({pointer, table, cycle = false}) {

  const cycleDirections = cycle === true ? ['none'].concat(directions) : [...directions].reverse();

  let hit = 0;

  const directive = Object.assign({
    toggle(){
      hit++;
      const direction = cycleDirections[hit % cycleDirections.length];
      return table.sort({pointer, direction});
    }

  }, sortListeners({emitter: table}));

  directive.onSortToggle(({pointer:p}) => {
    if (pointer !== p) {
      hit = 0;
    }
  });

  return directive;
};

function fakeTable$3 () {
  const table = emitter();
  table.sort = input => input;
  return table;
}

var sortDirective = plan$1()
  .test('sort directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = fakeTable$3();
    const dir = sort({table, pointer: 'foo.bar'});
    dir.onSortToggle(() => counter++);
    table.dispatch(TOGGLE_SORT, {});
    t.equal(counter, 1, 'should have updated the counter');
  })
  .test('sort directive dual state mode: sequentially change sort direction', function * (t) {
    const table = fakeTable$3();
    const dir = sort({table, pointer: 'foo.bar'});
    const arg = dir.toggle();
    t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
    const secondArg = dir.toggle();
    t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'desc'});
    const thirdArg = dir.toggle();
    t.deepEqual(thirdArg, {pointer: 'foo.bar', direction: 'asc'});
  })
  .test('sort directive cycle mode: sequentially change sort direction', function * (t) {
    const table = fakeTable$3();
    const dir = sort({table, pointer: 'foo.bar', cycle: true});
    const arg = dir.toggle();
    t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
    const secondArg = dir.toggle();
    t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'desc'});
    const thirdArg = dir.toggle();
    t.deepEqual(thirdArg, {pointer: 'foo.bar', direction: 'none'});
    const fourthArg = dir.toggle();
    t.deepEqual(fourthArg, {pointer: 'foo.bar', direction: 'asc'});
  })
  .test('a directive should reset when it is not concerned by the toggle', function * (t) {
    const table = fakeTable$3();
    const dir = sort({table, pointer: 'foo.bar'});
    const arg = dir.toggle();
    t.deepEqual(arg, {pointer: 'foo.bar', direction: 'asc'});
    table.dispatch(TOGGLE_SORT, {pointer: 'woot.woot'});
    const secondArg = dir.toggle();
    t.deepEqual(secondArg, {pointer: 'foo.bar', direction: 'asc'});
  })
;

const executionListener = proxyListener({[SUMMARY_CHANGED]: 'onSummaryChange'});

var summary = function ({table}) {
  return executionListener({emitter: table});
};

var summaryDirective = plan$1()
  .test('summary directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = emitter();
    const s = summary({table});
    s.onSummaryChange(() => counter++);
    table.dispatch(SUMMARY_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  });

const executionListener$1 = proxyListener({[EXEC_CHANGED]: 'onExecutionChange'});

var workingIndicator = function ({table}) {
  return executionListener$1({emitter: table});
};

var wokringIndicatorDirective = plan$1()
  .test('summary directive should be able to register listener', function * (t) {
    let counter = 0;
    const table = emitter();
    const s = workingIndicator({table});
    s.onExecutionChange(() => counter++);
    table.dispatch(EXEC_CHANGED);
    t.equal(counter, 1, 'should have updated the counter');
  });

function wait (time) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      resolve('finished');
    }, time);
  });
}

var tableDirective = plan$1()
  .test('table directive: should be able to register listener on display change', function * (t) {
    let displayed = null;
    const table = tableFactory({});
    table.onDisplayChange((args) => displayed = args);
    table.dispatch(DISPLAY_CHANGED, 'foo');
    t.equal(displayed, 'foo');
  })
  .test('table directive: sort should dispatch the mutating sort state', function * (t) {
    let sortState = null;
    const table = tableFactory({});
    table.on(TOGGLE_SORT, arg => sortState = arg);
    const newState = {direction: 'asc', pointer: 'foo.bar'};
    table.sort(newState);
    t.deepEqual(sortState, newState);
  })
  .test('table directive: sort should trigger an execution with the new state', function * (t) {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.sort({direction: 'asc', pointer: 'foo.bar'});
    t.deepEqual(newState, {slice: {page: 1}, filter: {}, search: {}, sort: {direction: 'asc', pointer: 'foo.bar'}});
  })
  .test('table directive: slice should dispatch the mutating slice state', function * (t) {
    let sliceState = null;
    const table = tableFactory({});
    table.on(PAGE_CHANGED, arg => sliceState = arg);
    const newState = {page: 7, size: 25};
    table.slice(newState);
    t.deepEqual(sliceState, newState);
  })
  .test('table directive: slice should trigger an execution with the new state', function * (t) {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.slice({page: 4, size: 12});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 4, "size": 12}, "filter": {}, "search": {}});
  })
  .test('table directive: filter should dispatch the mutating filter state', function * (t) {
    let filterState = null;
    const table = tableFactory({});
    table.on(FILTER_CHANGED, arg => filterState = arg);
    const newState = {foo: [{value: 'bar'}]};
    table.filter(newState);
    t.deepEqual(filterState, newState);
  })
  .test('table directive: filter should trigger an execution with the new state', function * (t) {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.filter({foo: [{value: 'bar'}]});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 1}, "filter": {"foo": [{"value": "bar"}]}, "search": {}}
    );
  })
  .test('table directive: search should dispatch the mutating search state', function * (t) {
    let searchState = null;
    const table = tableFactory({});
    table.on(SEARCH_CHANGED, arg => searchState = arg);
    const newState = {value: 'foo'};
    table.search(newState);
    t.deepEqual(searchState, newState);
  })
  .test('table directive: search should trigger an execution with the new state', function * (t) {
    const table = tableFactory({}, function ({tableState}) {
      return {
        exec(){
          return tableState;
        }
      };
    });
    const newState = table.search({value: 'bar'});
    t.deepEqual(newState, {"sort": {}, "slice": {"page": 1}, "filter": {}, "search": {"value": "bar"}});
  })
  .test('table directive: eval should return the displayed collection based on table state by default', function * (t) {
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });
    const output = yield table.eval();
    t.deepEqual(output, [
      {"index": 2, "value": {"id": 3, "name": "bip"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}}
    ]);

    //table state has mutated !
    tableState.slice = {page: 2, size: 2};
    const outputBis = yield table.eval();
    t.deepEqual(outputBis, [{"index": 0, "value": {"id": 1, "name": "foo"}}]);
  })
  .test('table directive: eval should be able to take any state as input', function * (t) {
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });
    const output = yield table.eval({sort: {}, slice: {}, filter: {}, search: {}});
    t.deepEqual(output, [
      {"index": 0, "value": {"id": 1, "name": "foo"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}},
      {"index": 2, "value": {"id": 3, "name": "bip"}}
    ]);
  })
  .test('table directive: eval should not dispatch any event', function * (t) {
    let counter = 0;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const incrementCounter = () => counter++;
    const table = tableFactory({
      tableState
    });
    table.on(DISPLAY_CHANGED, incrementCounter);
    table.on(TOGGLE_SORT, incrementCounter);
    table.on(PAGE_CHANGED, incrementCounter);
    table.on(FILTER_CHANGED, incrementCounter);
    table.on(SEARCH_CHANGED, incrementCounter);
    table.on(SUMMARY_CHANGED, incrementCounter);
    table.on(EXEC_CHANGED, incrementCounter);
    yield table.eval();
    t.equal(counter, 0, 'counter should not have been updated');
    t.deepEqual(tableState, {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    }, 'table state should not have changed');
  })
  .test('exec should first set the working state to true then false', function * (t) {
    let workingState;
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ]
    });
    table.on(EXEC_CHANGED, function ({working}) {
      workingState = working;
    });
    table.exec();
    t.equal(workingState, true);
    yield wait(25);
    t.equal(workingState, false);
  })
  .test('exec should dispatch the display changed event with the new displayed value', function * (t) {
    let displayed;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {},
      slice: {page: 1, size: 2}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });

    table.onDisplayChange(val => displayed = val);
    table.exec();
    yield wait(25);
    t.deepEqual(displayed, [
      {"index": 2, "value": {"id": 3, "name": "bip"}},
      {"index": 1, "value": {"id": 2, "name": "blah"}}
    ]);
  })
  .test('exec should dispatch the summary changed event with the new value', function * (t) {
    let summary;
    const tableState = {
      sort: {pointer: 'id', direction: 'desc'},
      search: {},
      filter: {name: [{value: 'b'}]},
      slice: {page: 1, size: 1}
    };
    const table = tableFactory({
      data: [
        {id: 1, name: 'foo'},
        {id: 2, name: 'blah'},
        {id: 3, name: 'bip'}
      ],
      tableState
    });

    table.on(SUMMARY_CHANGED, val => summary = val);
    table.exec();
    yield wait(25);
    t.deepEqual(summary, {"page": 1, "size": 1, "filteredCount": 2}
    );
  });

plan$1()
  .test(events)
  .test(slice$1)
  .test(search)
  .test(table)
  .test(filterDirective)
  .test(searchDirective)
  .test(sliceDirective)
  .test(sortDirective)
  .test(summaryDirective)
  .test(wokringIndicatorDirective)
  .test(tableDirective)
  .run();

}());
//# sourceMappingURL=index.js.map