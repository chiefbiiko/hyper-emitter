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
    t.same(prototype, proto, 'same prototype')
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

tape('watching function calls', function (t) {
  function fraud (x) { return 'fraud ' + x }
  var hyperFraud = hyperEmitter(fraud)
  hyperFraud.on('didApply', function (target, thisArg, args) {
    t.is(args[0], 419, 'got the arg')
    t.end()
  })
  t.is(hyperFraud(419), 'fraud 419', 'returns correctly')
})

tape('watching constructor calls', function (t) {
  function Fraud () { this.motto = 419 }
  var hyperFraud = hyperEmitter(Fraud)
  hyperFraud.on('didConstruct', function (target, args, newTarget) {
    t.same(args[0], { fraud: 419 }, 'peep args')
    t.end()
  })
  var fraud = new hyperFraud({ fraud: 419 })
  t.is(fraud.motto, 419, 'motto is ' + fraud.motto)
})

tape('revocable allowed in non-recursive mode only', function (t) {
  var places = { berlin: { kreuzberg: 36, neukoelln: 44 } }
  t.throws(function () {
    hyperEmitter(places, { recursive: true, revocable: true })
  }, TypeError, 'cannot create a revocable proxy in recursive mode')
  t.end()
})

tape('proxy unusable after revokin', function (t) {
  var target = { a: 1, b: 419 }
  var { proxy, revoke } = hyperEmitter(target, { revocable: true })
  proxy.on('didSet', function (target, key, value, receiver) {
    t.is(proxy[key], 187, 'proxy.' + key + ' hyper set')
  })
  proxy.a = 187
  t.is(target.a, 187, 'got passed thru')
  revoke()
  t.throws(function () { proxy.a }, TypeError)
  t.end()
})
