var tape = require('tape')
var hyperEmitter = require('./index')
var EventEmitter = require('events').EventEmitter

tape('hyperEmitter mixes in EventEmitter.prototype', function (t) {
  var hyperObject = hyperEmitter({ a: 1, b: 419 })
  t.ok(Object.keys(EventEmitter.prototype).every(function (key) {
    return key in hyperObject
  }), 'hyperObject got all EventEmitter prototype methods mixed in')
  t.end()
})

tape('emits on (after) simple property mutation', function (t) {
  var hyperObject = hyperEmitter({ a: 1, b: 419 })
  hyperObject.on('didSet', function (target, key, value, receiver) {
    if (key.startsWith('_')) return
    t.is(hyperObject[key], 187, 'hyperObject.' + key + ' hyper set')
    t.end()
  })
  hyperObject.a = 187
})

tape('emits on (after) property definition', function (t) {
  var hyperObject = hyperEmitter({ a: 1, b: 419 })
  hyperObject.on('didDefineProperty', function (target, key, descriptor) {
    if (key.startsWith('_')) return
    t.is(hyperObject[key], descriptor.value, 'defined correctly')
    t.end()
  })
  hyperObject.a = 187
})

tape('emits on (after) property deletion', function (t) {
  var hyperObject = hyperEmitter({ a: 1, b: 419 }, { only: [ 'a' ] })
  hyperObject.on('didDeleteProperty', function (target, key) {
    t.notOk(hyperObject[key], 'deleted')
    t.end()
  })
  delete hyperObject.a
})

tape('emits on (after) prototype mutation', function (t) {
  var hyperObject = hyperEmitter({ a: 1, b: 419 })
  hyperObject.on('didSetPrototypeOf', function (target, prototype) {
    t.same(Object.getPrototypeOf(hyperObject), prototype, 'same')
    t.end()
  })
  var prototype =
    Object.assign({ noop: function () {} }, Object.getPrototypeOf(hyperObject))
  Object.setPrototypeOf(hyperObject, prototype)
})

tape('does not notice nested property mutations', function (t) {
  var hyperObject = hyperEmitter({ a: { b: 3 } })
  hyperObject.on('didSet', function (target, key, value, receiver) {
    if (key.startsWith('_')) return
    t.fail('should be unreachable')
  })
  hyperObject.a.b = 5
  t.is(hyperObject.a.b, 5, 'beware: nested property mutated silently')
  t.end()
})

tape('some exiting type', function (t) {
  var hyperStream = hyperEmitter(require('stream').PassThrough())
  hyperStream.on('didSet', function (target, key, value, receiver) {
    if (key.startsWith('_')) return
    t.is(key, 'hyper', 'hyper')
    t.is(value, true, 'true')
    t.end()
  })
  hyperStream.hyper = true
})
