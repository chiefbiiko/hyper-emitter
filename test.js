var tape = require('tape')
var hyperEmitter = require('./index')
var EventEmitter = require('events').EventEmitter
var PassThrough = require('stream').PassThrough

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
    t.is(hyperObject[key], 187, 'hyperObject.' + key + ' hyper set')
    t.end()
  })
  hyperObject.a = 187
})

tape('emits on (after) property definition', function (t) {
  var hyperObject = hyperEmitter({ a: 1, b: 419 })
  hyperObject.on('didDefineProperty', function (target, key, descriptor) {
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
  var proto = Object.assign({ noop () {} }, Object.getPrototypeOf(hyperObject))
  Object.setPrototypeOf(hyperObject, proto)
})

tape('optionally recursive', function (t) {
  var hyperObject = hyperEmitter({ a: { b: 3 } }, { recursive: true })
  hyperObject.on('didSet', function (target, key, value, receiver) {
    t.is(hyperObject.a.b, 5, 'got noticed')
    t.end()
  })
  hyperObject.a.b = 5
})

tape('some exiting type', function (t) {
  var hyperStream = hyperEmitter(PassThrough())
  hyperStream.on('didSet', function (target, key, value, receiver) {
    t.is(key, 'hyper', 'hyper')
    t.is(value, true, 'true')
    t.end()
  })
  hyperStream.on('data', function (chunk) {
    t.is(chunk.toString(), 'fraud', 'is fraud')
    hyperStream.hyper = true
  })
  hyperStream.write('fraud')
})

tape('catch-all change event', function (t) {
  var hyperObject = hyperEmitter({ a: { b: 3 } }, { recursive: true })
  var i = 0
  hyperObject.on('change', function () {
    t.pass('change listener fired')
    if (++i === 2) t.end()
  })
  hyperObject.a.c = 36
})
