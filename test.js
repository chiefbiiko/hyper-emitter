var tape = require('tape')
var hyperEmitter = require('./index')
var EventEmitter = require('events').EventEmitter

tape('hyperEmitter mixes in EventEmitter.prototype', function (t) {
  var hyperObject = hyperEmitter({ a: 1, b: 419 })
  t.ok(Object.keys(EventEmitter.prototype).every(function (property) {
    return property in hyperObject
  }), 'hyperObject got all EventEmitter prototype methods mixed in')
  t.end()
})
